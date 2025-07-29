"""
Model Registry for English-to-other-language translations
"""

import asyncio
from typing import Dict, Optional, List
from transformers import MarianMTModel, MarianTokenizer, pipeline
import torch
import logging

logger = logging.getLogger(__name__)

class ModelRegistry:
    """Manages loading and selection of English-to-other-language translation models"""
    
    def __init__(self):
        self.loaded_models: Dict[str, any] = {}
        self.loading_locks: Dict[str, asyncio.Lock] = {}
        
        # English to supported languages only
        self.available_models = {
            "en-es": "Helsinki-NLP/opus-mt-en-es",
            "en-fr": "Helsinki-NLP/opus-mt-en-fr", 
            "en-de": "Helsinki-NLP/opus-mt-en-de",
            "en-it": "Helsinki-NLP/opus-mt-en-it",
            "en-pt": "Helsinki-NLP/opus-mt-tc-big-en-pt",
            "en-ru": "Helsinki-NLP/opus-mt-en-ru",
            "en-zh": "Helsinki-NLP/opus-mt-en-zh",
            "en-ja": "Helsinki-NLP/opus-mt-en-jap",
            "en-ko": "Helsinki-NLP/opus-mt-tc-big-en-ko",
            "en-ar": "Helsinki-NLP/opus-mt-en-ar",
        }
        
        # Supported target languages
        self.supported_languages = [
            "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar"
        ]
    
    def get_model_key(self, source_lang: str, target_lang: str) -> str:
        """Generate model key for language pair"""
        return f"{source_lang}-{target_lang}"
    
    def is_model_available(self, source_lang: str, target_lang: str) -> bool:
        """Check if a model is available for the language pair"""
        # Only support English to other languages
        if source_lang != "en":
            return False
        
        model_key = self.get_model_key(source_lang, target_lang)
        return model_key in self.available_models
    
    def get_available_language_pairs(self) -> List[str]:
        """Get list of available language pairs"""
        return list(self.available_models.keys())
    
    def get_supported_target_languages(self) -> List[str]:
        """Get list of supported target languages"""
        return self.supported_languages.copy()
    
    def validate_language_pair(self, source_lang: str, target_lang: str) -> bool:
        """Validate if the language pair is supported"""
        if source_lang != "en":
            return False
        
        return target_lang in self.supported_languages
    
    async def get_model(self, source_lang: str, target_lang: str) -> Optional[any]:
        """
        Get or load a model for the specified language pair
        Returns the model pipeline or None if not available
        """
        # Validate language pair
        if not self.validate_language_pair(source_lang, target_lang):
            logger.warning(f"Unsupported language pair: {source_lang}-{target_lang}")
            return None
        
        model_key = self.get_model_key(source_lang, target_lang)
        
        # Check if model is already loaded
        if model_key in self.loaded_models:
            return self.loaded_models[model_key]
        
        # Create lock for this model if it doesn't exist
        if model_key not in self.loading_locks:
            self.loading_locks[model_key] = asyncio.Lock()
        
        # Prevent duplicate loading
        async with self.loading_locks[model_key]:
            # Double-check after acquiring lock
            if model_key in self.loaded_models:
                return self.loaded_models[model_key]
            
            # Load the model
            try:
                model_name = self.available_models[model_key]
                logger.info(f"Loading model: {model_name}")
                
                # Load model and tokenizer
                model = MarianMTModel.from_pretrained(model_name)
                tokenizer = MarianTokenizer.from_pretrained(model_name)
                
                # Create pipeline
                pipeline_model = pipeline(
                    "translation",
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1
                )
                
                # Store loaded model
                self.loaded_models[model_key] = pipeline_model
                
                logger.info(f"Successfully loaded model: {model_name}")
                return pipeline_model
                
            except Exception as e:
                logger.error(f"Failed to load model {model_name}: {str(e)}")
                return None
    
    async def translate(
        self, 
        text: str, 
        target_lang: str,
        context: str = ""
    ) -> Dict[str, any]:
        """
        Translate English text to target language
        Returns translation result with metadata
        """
        source_lang = "en"  # Always English
        
        # Validate target language
        if not self.validate_language_pair(source_lang, target_lang):
            return {
                "translation": None,
                "model_used": None,
                "confidence": 0.0,
                "method": "failed",
                "error": f"Unsupported target language: {target_lang}"
            }
        
        # Get model
        model = await self.get_model(source_lang, target_lang)
        if not model:
            return {
                "translation": None,
                "model_used": None,
                "confidence": 0.0,
                "method": "failed",
                "error": f"Model not available for {source_lang}-{target_lang}"
            }
        
        # Perform translation
        try:
            result = model(text)
            return {
                "translation": result[0]["translation_text"],
                "model_used": f"en-{target_lang}",
                "confidence": 0.9,  # High confidence for direct translation
                "method": "direct"
            }
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            return {
                "translation": None,
                "model_used": f"en-{target_lang}",
                "confidence": 0.0,
                "method": "failed",
                "error": str(e)
            }
    
    def get_model_info(self) -> Dict[str, any]:
        """Get information about loaded models"""
        return {
            "loaded_models": list(self.loaded_models.keys()),
            "available_models": len(self.available_models),
            "total_loaded": len(self.loaded_models),
            "available_pairs": self.get_available_language_pairs(),
            "supported_target_languages": self.get_supported_target_languages()
        }
    
    async def preload_popular_models(self) -> None:
        """Preload popular models in background"""
        popular_targets = ["es", "fr", "de", "it", "pt"]
        
        logger.info("Preloading popular models...")
        tasks = []
        
        for target in popular_targets:
            task = asyncio.create_task(self.get_model("en", target))
            tasks.append(task)
        
        # Wait for all models to load
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = sum(1 for r in results if r is not None)
        logger.info(f"Preloaded {successful}/{len(popular_targets)} popular models")
    
    async def cleanup(self) -> None:
        """Clean up loaded models"""
        for model_key, model in self.loaded_models.items():
            try:
                del model
                logger.info(f"Cleaned up model: {model_key}")
            except Exception as e:
                logger.error(f"Failed to cleanup model {model_key}: {str(e)}")
        
        self.loaded_models.clear()
        self.loading_locks.clear() 