from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
from cache import get_cached_suggestion, cache_suggestion
from config import OPENAI_API_KEY, USE_OPENAI
from model_registry import ModelRegistry
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Translation Service", version="1.0.0")

# Initialize model registry
model_registry = ModelRegistry()

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

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    logger.info("Starting AI Translation Service...")
    
    # Preload popular models in background
    asyncio.create_task(model_registry.preload_popular_models())
    
    logger.info("AI Translation Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Translation Service...")
    await model_registry.cleanup()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_info = model_registry.get_model_info()
    return {
        "status": "healthy",
        "models_loaded": model_info["total_loaded"],
        "available_pairs": len(model_info["available_pairs"])
    }

@app.get("/models")
async def get_models():
    """Get available models information"""
    return model_registry.get_model_info()

@app.post("/translate", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """Translate text using dynamic model selection"""
    
    # Validate input
    if not request.source_text.strip():
        raise HTTPException(status_code=400, detail="Source text cannot be empty")
    
    if len(request.source_text) > 5000:
        raise HTTPException(status_code=400, detail="Source text too long (max 5000 characters)")
    
    # Check cache first
    cached_result = get_cached_suggestion(
        request.source_text,
        request.context or "",
        request.source_language,
        request.target_language,
        "marian"  # We'll use MarianMT as primary
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
    
    try:
        # Try translation with fallback
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
                openai_result = await translate_with_openai(
                    request.source_text,
                    request.source_language,
                    request.target_language,
                    request.context or ""
                )
                
                # Cache the OpenAI result
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
                
                return TranslationResponse(
                    suggested_text=openai_result["translation"],
                    confidence_score=openai_result["confidence"],
                    model_used="openai-gpt-3.5-turbo",
                    method="openai",
                    cached=False
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Translation not available for {request.source_language}-{request.target_language}"
                )
        
        # Cache the successful result
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
        
        return TranslationResponse(
            suggested_text=result["translation"],
            confidence_score=result["confidence"],
            model_used=result["model_used"],
            method=result["method"],
            cached=False
        )
        
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

async def translate_with_openai(text: str, source_lang: str, target_lang: str, context: str = "") -> dict:
    """Translate using OpenAI API"""
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
        logger.error(f"OpenAI translation failed: {str(e)}")
        raise Exception(f"OpenAI translation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
