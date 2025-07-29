"""
FastAPI application for AI translation service
"""

import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio

from model_registry import ModelRegistry
from error_handler import ErrorHandler, ValidationError, TranslationError, ErrorType
from cache import get_cached_suggestion, cache_suggestion

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
model_registry = ModelRegistry()
error_handler = ErrorHandler()

app = FastAPI(
    title="AI Translation Service",
    description="Translation service using MarianMT models",
    version="1.0.0"
)

class TranslationRequest(BaseModel):
    source_text: str
    target_language: str
    context: Optional[str] = ""

class TranslationResponse(BaseModel):
    suggested_text: Optional[str]
    confidence_score: float
    model_used: Optional[str]
    method: str
    cached: bool = False

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting AI Translation Service...")
    
    # Preload popular models
    await model_registry.preload_popular_models()
    
    logger.info("AI Translation Service started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Translation Service...")
    await model_registry.cleanup()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-translation",
        "models_loaded": len(model_registry.loaded_models)
    }

@app.get("/models")
async def get_models():
    """Get information about available models"""
    return model_registry.get_model_info()

@app.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """Translate English text to target language with comprehensive error handling"""
    
    try:
        # Validate input
        error_handler.validate_translation_request(
            request.source_text,
            "en",  # Always English
            request.target_language,
            request.context or ""
        )
        
        # Check cache first
        try:
            cached_result = get_cached_suggestion(
                request.source_text,
                request.context or "",
                "en",  # Always English
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
        
        # Try translation
        try:
            result = await model_registry.translate(
                text=request.source_text,
                target_lang=request.target_language,
                context=request.context or ""
            )
            
            # Cache the successful result
            try:
                cache_suggestion(
                    request.source_text,
                    request.context or "",
                    "en",  # Always English
                    request.target_language,
                    result["model_used"],
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
                    "en",  # Always English
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
