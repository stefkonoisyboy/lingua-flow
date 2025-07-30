"""
Model Registry for hybrid translation (local models + HuggingFace API)
"""

import asyncio
import requests
import logging
from typing import Dict, Optional, List
from transformers import MarianMTModel, MarianTokenizer, pipeline
import torch
import os
from config import HUGGINGFACE_TOKEN

logger = logging.getLogger(__name__)

class ModelRegistry:
    """Manages local models and HuggingFace API for translations"""
    
    def __init__(self):
        self.loaded_models: Dict[str, any] = {}
        self.loading_locks: Dict[str, asyncio.Lock] = {}
        
        # HuggingFace API token
        self.hf_token = HUGGINGFACE_TOKEN
        if not self.hf_token:
            logger.warning("HUGGINGFACE_TOKEN not found in environment variables")
        
        # Only German and Italian use local models
        self.local_models = {
            "en-de": "Helsinki-NLP/opus-mt-en-de",
            "en-it": "Helsinki-NLP/opus-mt-en-it",
        }
        
        # API-based models (8 languages)
        self.api_models = {
            "en-es": "Helsinki-NLP/opus-mt-en-es",
            "en-fr": "Helsinki-NLP/opus-mt-en-fr",
            "en-pt": "Helsinki-NLP/opus-mt-tc-big-en-pt",
            "en-ru": "Helsinki-NLP/opus-mt-en-ru",
            "en-zh": "Helsinki-NLP/opus-mt-en-zh",
            "en-ja": "Helsinki-NLP/opus-mt-en-jap",
            "en-ko": "Helsinki-NLP/opus-mt-tc-big-en-ko",
            "en-ar": "Helsinki-NLP/opus-mt-en-ar",
        }
        
        # All supported target languages
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
        return model_key in self.local_models or model_key in self.api_models
    
    def get_available_language_pairs(self) -> List[str]:
        """Get list of available language pairs"""
        return list(self.local_models.keys()) + list(self.api_models.keys())
    
    def get_supported_target_languages(self) -> List[str]:
        """Get list of supported target languages"""
        return self.supported_languages.copy()
    
    def validate_language_pair(self, source_lang: str, target_lang: str) -> bool:
        """Validate if the language pair is supported"""
        if source_lang != "en":
            return False
        
        return target_lang in self.supported_languages
    
    def is_local_model(self, source_lang: str, target_lang: str) -> bool:
        """Check if this language pair uses local models"""
        model_key = self.get_model_key(source_lang, target_lang)
        return model_key in self.local_models
    
    def is_api_model(self, source_lang: str, target_lang: str) -> bool:
        """Check if this language pair uses API models"""
        model_key = self.get_model_key(source_lang, target_lang)
        return model_key in self.api_models
    
    async def get_model(self, source_lang: str, target_lang: str) -> Optional[any]:
        """
        Get or load a local model for the specified language pair
        Returns the model pipeline or None if not available
        """
        # Only local models need to be loaded
        if not self.is_local_model(source_lang, target_lang):
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
                model_name = self.local_models[model_key]
                logger.info(f"Loading local model: {model_name}")
                
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
                
                logger.info(f"Successfully loaded local model: {model_name}")
                return pipeline_model
                
            except Exception as e:
                logger.error(f"Failed to load local model {model_name}: {str(e)}")
                return None
    
    async def translate_with_api(self, text: str, target_lang: str) -> Dict[str, any]:
        """Translate using HuggingFace API"""
        if not self.hf_token:
            return {
                "translation": None,
                "model_used": None,
                "confidence": 0.0,
                "method": "failed",
                "error": "HuggingFace API token not configured"
            }
        
        model_key = self.get_model_key("en", target_lang)
        model_name = self.api_models.get(model_key)
        
        if not model_name:
            return {
                "translation": None,
                "model_used": None,
                "confidence": 0.0,
                "method": "failed",
                "error": f"API model not available for en-{target_lang}"
            }
        
        try:
            logger.info(f"Translating via API: {model_name}")
            
            response = requests.post(
                f"https://api-inference.huggingface.co/models/{model_name}",
                headers={"Authorization": f"Bearer {self.hf_token}"},
                json={"inputs": text},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    translation = result[0].get("translation_text", "")
                    return {
                        "translation": translation,
                        "model_used": f"api-{model_name}",
                        "confidence": 0.85,  # API confidence
                        "method": "api"
                    }
                else:
                    return {
                        "translation": None,
                        "model_used": f"api-{model_name}",
                        "confidence": 0.0,
                        "method": "failed",
                        "error": "Invalid API response format"
                    }
            else:
                return {
                    "translation": None,
                    "model_used": f"api-{model_name}",
                    "confidence": 0.0,
                    "method": "failed",
                    "error": f"API request failed: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"API translation failed: {str(e)}")
            return {
                "translation": None,
                "model_used": f"api-{model_name}",
                "confidence": 0.0,
                "method": "failed",
                "error": str(e)
            }
    
    async def translate(
        self, 
        text: str, 
        target_lang: str,
        context: str = ""
    ) -> Dict[str, any]:
        """
        Translate English text to target language using hybrid approach
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
        
        # Try local model first (German and Italian)
        if self.is_local_model(source_lang, target_lang):
            model = await self.get_model(source_lang, target_lang)
            if model:
                try:
                    result = model(text)
                    return {
                        "translation": result[0]["translation_text"],
                        "model_used": f"local-en-{target_lang}",
                        "confidence": 0.9,  # High confidence for local translation
                        "method": "local"
                    }
                except Exception as e:
                    logger.error(f"Local translation failed: {str(e)}")
                    return {
                        "translation": None,
                        "model_used": f"local-en-{target_lang}",
                        "confidence": 0.0,
                        "method": "failed",
                        "error": str(e)
                    }
            else:
                return {
                    "translation": None,
                    "model_used": None,
                    "confidence": 0.0,
                    "method": "failed",
                    "error": f"Local model not available for {source_lang}-{target_lang}"
                }
        
        # Try API for other languages
        elif self.is_api_model(source_lang, target_lang):
            return await self.translate_with_api(text, target_lang)
        
        # No translation method available
        else:
            return {
                "translation": None,
                "model_used": None,
                "confidence": 0.0,
                "method": "failed",
                "error": f"No translation method available for {source_lang}-{target_lang}"
            }
    
    def get_model_info(self) -> Dict[str, any]:
        """Get information about models"""
        return {
            "loaded_models": list(self.loaded_models.keys()),
            "local_models": len(self.local_models),
            "api_models": len(self.api_models),
            "total_loaded": len(self.loaded_models),
            "available_pairs": self.get_available_language_pairs(),
            "supported_target_languages": self.get_supported_target_languages(),
            "local_languages": list(self.local_models.keys()),
            "api_languages": list(self.api_models.keys())
        }
    
    async def preload_popular_models(self) -> None:
        """Preload local models in background (only German and Italian)"""
        logger.info("Preloading local models (German and Italian)...")
        
        tasks = []
        for target in ["de", "it"]:
            task = asyncio.create_task(self.get_model("en", target))
            tasks.append(task)
        
        # Wait for all models to load
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = sum(1 for r in results if r is not None)
        logger.info(f"Preloaded {successful}/2 local models")
    
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