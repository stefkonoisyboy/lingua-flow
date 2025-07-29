from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
from cache import get_cached_suggestion, cache_suggestion
from config import OPENAI_API_KEY, USE_OPENAI
from model_registry import ModelRegistry
from error_handler import ErrorHandler, ValidationError, TranslationError, ErrorType
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Translation Service", version="1.0.0")

# Initialize services
model_registry = ModelRegistry()
error_handler = ErrorHandler()

class TranslationRequest(BaseModel):
    source_text: str
    source_language: str
    target_language: str
    context: Optional[str] = ""

class TranslationResponse(BaseModel):
    suggested_text: str
    confidence_score: float
    model_used: str
    method: str
    cached: bool = False

class ErrorResponse(BaseModel):
    error: str
    error_type: str
    details: dict
    suggestions: list

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    logger.info("Starting AI Translation Service...")
    
    try:
        # Preload popular models in background
        asyncio.create_task(model_registry.preload_popular_models())
        logger.info("AI Translation Service started successfully")
    except Exception as e:
        logger.error(f"Failed to start service: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Translation Service...")
    try:
        await model_registry.cleanup()
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        model_info = model_registry.get_model_info()
        return {
            "status": "healthy",
            "models_loaded": model_info["total_loaded"],
            "available_pairs": len(model_info["available_pairs"])
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get("/models")
async def get_models():
    """Get available models information"""
    try:
        return model_registry.get_model_info()
    except Exception as e:
        logger.error(f"Failed to get model info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model information")

@app.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """Translate text using dynamic model selection with comprehensive error handling"""
    
    try:
        # Validate input
        error_handler.validate_translation_request(
            request.source_text,
            request.source_language,
            request.target_language,
            request.context or ""
        )
        
        # Check cache first
        try:
            cached_result = get_cached_suggestion(
                request.source_text,
                request.context or "",
                request.source_language,
                request.target_language,
                "marian"
            )
            
            if cached_result:
                logger.info("Translation found in cache")
                return TranslationResponse(
                    suggested_text=cached_result["translation"],
                    confidence_score=cached_result["confidence"],
                    model_used=cached_result["model_used"],
                    method=cached_result["method"],
                    cached=True
                )
        except Exception as e:
            # Cache errors are non-fatal, log and continue
            logger.warning(f"Cache error (non-fatal): {str(e)}")
        
        # Try translation with fallback
        try:
            result = await model_registry.translate_with_fallback(
                text=request.source_text,
                source_lang=request.source_language,
                target_lang=request.target_language,
                context=request.context or ""
            )
            
            if result["translation"] is None:
                # If local models fail, try OpenAI as fallback
                if USE_OPENAI and OPENAI_API_KEY:
                    logger.info("Falling back to OpenAI")
                    try:
                        openai_result = await translate_with_openai(
                            request.source_text,
                            request.source_language,
                            request.target_language,
                            request.context or ""
                        )
                        
                        # Cache the OpenAI result
                        try:
                            cache_suggestion(
                                request.source_text,
                                request.context or "",
                                request.source_language,
                                request.target_language,
                                "openai",
                                {
                                    "translation": openai_result["translation"],
                                    "confidence": openai_result["confidence"],
                                    "model_used": "openai-gpt-3.5-turbo",
                                    "method": "openai"
                                }
                            )
                        except Exception as cache_error:
                            logger.warning(f"Failed to cache OpenAI result: {str(cache_error)}")
                        
                        return TranslationResponse(
                            suggested_text=openai_result["translation"],
                            confidence_score=openai_result["confidence"],
                            model_used="openai-gpt-3.5-turbo",
                            method="openai",
                            cached=False
                        )
                    except Exception as openai_error:
                        # Handle OpenAI errors
                        error = error_handler.handle_openai_error(openai_error)
                        raise error
                else:
                    # No fallback available
                    error_msg = f"Translation not available for {request.source_language}-{request.target_language}"
                    raise TranslationError(error_msg, ErrorType.TRANSLATION_ERROR)
            
            # Cache the successful result
            try:
                cache_suggestion(
                    request.source_text,
                    request.context or "",
                    request.source_language,
                    request.target_language,
                    "marian",
                    {
                        "translation": result["translation"],
                        "confidence": result["confidence"],
                        "model_used": result["model_used"],
                        "method": result["method"]
                    }
                )
            except Exception as cache_error:
                logger.warning(f"Failed to cache result: {str(cache_error)}")
            
            return TranslationResponse(
                suggested_text=result["translation"],
                confidence_score=result["confidence"],
                model_used=result["model_used"],
                method=result["method"],
                cached=False
            )
            
        except Exception as e:
            # Handle translation errors
            if isinstance(e, TranslationError):
                raise
            else:
                error = error_handler.handle_translation_error(
                    request.source_language,
                    request.target_language,
                    e
                )
                raise error
                
    except ValidationError as e:
        # Handle validation errors
        error_response = error_handler.format_error_response(e)
        error_response["suggestions"] = error_handler.get_error_suggestions(e.error_type)
        raise HTTPException(status_code=400, detail=error_response)
        
    except TranslationError as e:
        # Handle translation errors
        error_response = error_handler.format_error_response(e)
        error_response["suggestions"] = error_handler.get_error_suggestions(e.error_type)
        
        # Use appropriate HTTP status code
        status_code = 500
        if e.error_type == ErrorType.VALIDATION_ERROR:
            status_code = 400
        elif e.error_type == ErrorType.MODEL_LOAD_ERROR:
            status_code = 503  # Service unavailable
        
        raise HTTPException(status_code=status_code, detail=error_response)
        
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error: {str(e)}")
        error_response = error_handler.format_error_response(e)
        error_response["suggestions"] = error_handler.get_error_suggestions(ErrorType.UNKNOWN_ERROR)
        raise HTTPException(status_code=500, detail=error_response)

async def translate_with_openai(text: str, source_lang: str, target_lang: str, context: str = "") -> dict:
    """Translate using OpenAI API with error handling"""
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Build prompt with context
        prompt = f"Translate the following text from {source_lang} to {target_lang}"
        if context:
            prompt += f". Context: {context}"
        prompt += f".\n\nText: {text}\n\nTranslation:"
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional translator. Provide accurate and natural translations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        translation = response.choices[0].message.content.strip()
        
        return {
            "translation": translation,
            "confidence": 0.8,  # OpenAI confidence
            "model_used": "openai-gpt-3.5-turbo"
        }
        
    except Exception as e:
        # Re-raise as TranslationError for proper handling
        raise TranslationError(f"OpenAI translation failed: {str(e)}", ErrorType.OPENAI_ERROR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
