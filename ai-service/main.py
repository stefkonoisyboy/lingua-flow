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
from cache import cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
model_registry = ModelRegistry()
error_handler = ErrorHandler()

app = FastAPI(
    title="AI Translation Service",
    description="Translation service using MarianMT models with enhanced caching",
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
    cache_age: Optional[float] = None

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
    """Health check endpoint with cache info and model status"""
    cache_stats = cache.get_stats()
    model_info = model_registry.get_model_info()
    
    return {
        "status": "healthy",
        "service": "ai-translation-hybrid",
        "models_loaded": len(model_registry.loaded_models),
        "local_models": model_info["local_models"],
        "api_models": model_info["api_models"],
        "hf_token_configured": bool(model_registry.hf_token),
        "cache": {
            "size": cache_stats["cache_size"],
            "hit_rate": cache_stats["hit_rate"],
            "memory_mb": cache_stats["memory_usage_mb"]
        }
    }

@app.get("/models")
async def get_models():
    """Get information about available models"""
    return model_registry.get_model_info()

@app.get("/models/local")
async def get_local_models():
    """Get information about local models only"""
    model_info = model_registry.get_model_info()
    return {
        "local_models": model_info["local_languages"],
        "loaded_models": model_info["loaded_models"],
        "total_loaded": model_info["total_loaded"]
    }

@app.get("/models/api")
async def get_api_models():
    """Get information about API models only"""
    model_info = model_registry.get_model_info()
    return {
        "api_models": model_info["api_languages"],
        "hf_token_configured": bool(model_registry.hf_token)
    }

@app.get("/cache/stats")
async def get_cache_stats():
    """Get detailed cache statistics"""
    return cache.get_stats()

@app.get("/cache/info")
async def get_cache_info():
    """Get detailed cache information including top entries"""
    return cache.get_cache_info()

@app.post("/cache/clear")
async def clear_cache():
    """Clear all cache entries"""
    cache.clear()
    return {"message": "Cache cleared successfully"}

@app.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """Translate English text to target language with comprehensive error handling and enhanced caching"""
    
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
            cached_result = cache.get(
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
                    cached=True,
                    cache_age=cached_result.get("cache_age")
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
                cache.set(
        request.source_text,
                    request.context or "",
                    "en",  # Always English
        request.target_language,
                    "marian",
                    result["translation"],
                    result["confidence"],
                    result["model_used"],
                    result["method"]
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
