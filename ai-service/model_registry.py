"""
Model Registry for dynamic model loading and selection
"""

import asyncio
from typing import Dict, Optional, List, Tuple
from transformers import MarianMTModel, MarianTokenizer, pipeline
import torch
import logging

logger = logging.getLogger(__name__)

class ModelRegistry:
    """Manages loading and selection of translation models"""
    
    def __init__(self):
        self.loaded_models: Dict[str, any] = {}
        self.loading_locks: Dict[str, asyncio.Lock] = {}
        
        # Popular MarianMT models with their language pairs
        self.available_models = {
            # English to other languages
            "en-es": "Helsinki-NLP/opus-mt-en-es",
            "en-fr": "Helsinki-NLP/opus-mt-en-fr", 
            "en-de": "Helsinki-NLP/opus-mt-en-de",
            "en-it": "Helsinki-NLP/opus-mt-en-it",
            "en-pt": "Helsinki-NLP/opus-mt-en-pt",
            "en-ru": "Helsinki-NLP/opus-mt-en-ru",
            "en-zh": "Helsinki-NLP/opus-mt-en-zh",
            "en-ja": "Helsinki-NLP/opus-mt-en-ja",
            "en-ar": "Helsinki-NLP/opus-mt-en-ar",
            "en-ko": "Helsinki-NLP/opus-mt-en-ko",
            "en-hi": "Helsinki-NLP/opus-mt-en-hi",
            "en-tr": "Helsinki-NLP/opus-mt-en-tr",
            "en-nl": "Helsinki-NLP/opus-mt-en-nl",
            "en-pl": "Helsinki-NLP/opus-mt-en-pl",
            "en-sv": "Helsinki-NLP/opus-mt-en-sv",
            "en-da": "Helsinki-NLP/opus-mt-en-da",
            "en-no": "Helsinki-NLP/opus-mt-en-no",
            "en-fi": "Helsinki-NLP/opus-mt-en-fi",
            "en-hu": "Helsinki-NLP/opus-mt-en-hu",
            "en-cs": "Helsinki-NLP/opus-mt-en-cs",
            "en-ro": "Helsinki-NLP/opus-mt-en-ro",
            "en-bg": "Helsinki-NLP/opus-mt-en-bg",
            "en-sk": "Helsinki-NLP/opus-mt-en-sk",
            "en-sl": "Helsinki-NLP/opus-mt-en-sl",
            "en-et": "Helsinki-NLP/opus-mt-en-et",
            "en-lv": "Helsinki-NLP/opus-mt-en-lv",
            "en-lt": "Helsinki-NLP/opus-mt-en-lt",
            "en-mt": "Helsinki-NLP/opus-mt-en-mt",
            
            # Other languages to English
            "es-en": "Helsinki-NLP/opus-mt-es-en",
            "fr-en": "Helsinki-NLP/opus-mt-fr-en",
            "de-en": "Helsinki-NLP/opus-mt-de-en",
            "it-en": "Helsinki-NLP/opus-mt-it-en",
            "pt-en": "Helsinki-NLP/opus-mt-pt-en",
            "ru-en": "Helsinki-NLP/opus-mt-ru-en",
            "zh-en": "Helsinki-NLP/opus-mt-zh-en",
            "ja-en": "Helsinki-NLP/opus-mt-ja-en",
            "ar-en": "Helsinki-NLP/opus-mt-ar-en",
            "ko-en": "Helsinki-NLP/opus-mt-ko-en",
            "hi-en": "Helsinki-NLP/opus-mt-hi-en",
            "tr-en": "Helsinki-NLP/opus-mt-tr-en",
            "nl-en": "Helsinki-NLP/opus-mt-nl-en",
            "pl-en": "Helsinki-NLP/opus-mt-pl-en",
            "sv-en": "Helsinki-NLP/opus-mt-sv-en",
            "da-en": "Helsinki-NLP/opus-mt-da-en",
            "no-en": "Helsinki-NLP/opus-mt-no-en",
            "fi-en": "Helsinki-NLP/opus-mt-fi-en",
            "hu-en": "Helsinki-NLP/opus-mt-hu-en",
            "cs-en": "Helsinki-NLP/opus-mt-cs-en",
            "ro-en": "Helsinki-NLP/opus-mt-ro-en",
            "bg-en": "Helsinki-NLP/opus-mt-bg-en",
            "sk-en": "Helsinki-NLP/opus-mt-sk-en",
            "sl-en": "Helsinki-NLP/opus-mt-sl-en",
            "et-en": "Helsinki-NLP/opus-mt-et-en",
            "lv-en": "Helsinki-NLP/opus-mt-lv-en",
            "lt-en": "Helsinki-NLP/opus-mt-lt-en",
            "mt-en": "Helsinki-NLP/opus-mt-mt-en",
            
            # Some direct pairs (non-English)
            "fr-de": "Helsinki-NLP/opus-mt-fr-de",
            "de-fr": "Helsinki-NLP/opus-mt-de-fr",
            "es-fr": "Helsinki-NLP/opus-mt-es-fr",
            "fr-es": "Helsinki-NLP/opus-mt-fr-es",
            "de-es": "Helsinki-NLP/opus-mt-de-es",
            "es-de": "Helsinki-NLP/opus-mt-es-de",
            "it-fr": "Helsinki-NLP/opus-mt-it-fr",
            "fr-it": "Helsinki-NLP/opus-mt-fr-it",
            "pt-es": "Helsinki-NLP/opus-mt-pt-es",
            "es-pt": "Helsinki-NLP/opus-mt-es-pt",
        }
        
        # Fallback strategy: use English as pivot
        self.fallback_strategy = {
            "pivot_language": "en",
            "max_pivot_steps": 2  # Maximum number of pivot translations
        }
    
    def get_model_key(self, source_lang: str, target_lang: str) -> str:
        """Generate model key for language pair"""
        return f"{source_lang}-{target_lang}"
    
    def is_model_available(self, source_lang: str, target_lang: str) -> bool:
        """Check if a direct model is available for the language pair"""
        model_key = self.get_model_key(source_lang, target_lang)
        return model_key in self.available_models
    
    def get_available_language_pairs(self) -> List[str]:
        """Get list of available language pairs"""
        return list(self.available_models.keys())
    
    def find_translation_path(self, source_lang: str, target_lang: str) -> List[Tuple[str, str]]:
        """
        Find the best translation path between languages
        Returns list of (source, target) pairs for the translation path
        """
        # Direct translation
        if self.is_model_available(source_lang, target_lang):
            return [(source_lang, target_lang)]
        
        # Try pivot through English
        if source_lang != "en" and target_lang != "en":
            if (self.is_model_available(source_lang, "en") and 
                self.is_model_available("en", target_lang)):
                return [(source_lang, "en"), ("en", target_lang)]
        
        # Try other common pivot languages
        pivot_languages = ["fr", "de", "es"]
        for pivot in pivot_languages:
            if (pivot != source_lang and pivot != target_lang and
                self.is_model_available(source_lang, pivot) and 
                self.is_model_available(pivot, target_lang)):
                return [(source_lang, pivot), (pivot, target_lang)]
        
        # No path found
        return []
    
    async def get_model(self, source_lang: str, target_lang: str) -> Optional[any]:
        """
        Get or load a model for the specified language pair
        Returns the model pipeline or None if not available
        """
        model_key = self.get_model_key(source_lang, target_lang)
        
        # Check if model is already loaded
        if model_key in self.loaded_models:
            return self.loaded_models[model_key]
        
        # Check if model is available
        if not self.is_model_available(source_lang, target_lang):
            logger.warning(f"No direct model available for {source_lang}-{target_lang}")
            return None
        
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
    
    async def translate_with_fallback(
        self, 
        text: str, 
        source_lang: str, 
        target_lang: str,
        context: str = ""
    ) -> Dict[str, any]:
        """
        Translate text with fallback strategy
        Returns translation result with metadata
        """
        # Try direct translation first
        direct_model = await self.get_model(source_lang, target_lang)
        if direct_model:
            try:
                result = direct_model(text)
                return {
                    "translation": result[0]["translation_text"],
                    "model_used": f"direct-{source_lang}-{target_lang}",
                    "confidence": 0.9,  # High confidence for direct translation
                    "method": "direct"
                }
            except Exception as e:
                logger.error(f"Direct translation failed: {str(e)}")
        
        # Try pivot translation
        translation_path = self.find_translation_path(source_lang, target_lang)
        if translation_path:
            try:
                current_text = text
                models_used = []
                
                for step_source, step_target in translation_path:
                    step_model = await self.get_model(step_source, step_target)
                    if not step_model:
                        raise Exception(f"Model not available for {step_source}-{step_target}")
                    
                    result = step_model(current_text)
                    current_text = result[0]["translation_text"]
                    models_used.append(f"{step_source}-{step_target}")
                
                return {
                    "translation": current_text,
                    "model_used": " -> ".join(models_used),
                    "confidence": 0.7,  # Lower confidence for pivot translation
                    "method": "pivot",
                    "steps": len(translation_path)
                }
                
            except Exception as e:
                logger.error(f"Pivot translation failed: {str(e)}")
        
        # No translation possible
        return {
            "translation": None,
            "model_used": None,
            "confidence": 0.0,
            "method": "failed",
            "error": f"No translation path available for {source_lang}-{target_lang}"
        }
    
    def get_model_info(self) -> Dict[str, any]:
        """Get information about loaded models"""
        return {
            "loaded_models": list(self.loaded_models.keys()),
            "available_models": len(self.available_models),
            "total_loaded": len(self.loaded_models),
            "available_pairs": self.get_available_language_pairs()
        }
    
    async def preload_popular_models(self) -> None:
        """Preload popular models in background"""
        popular_pairs = [
            "en-es", "en-fr", "en-de", "en-it", "en-pt",
            "es-en", "fr-en", "de-en", "it-en", "pt-en"
        ]
        
        logger.info("Preloading popular models...")
        tasks = []
        
        for pair in popular_pairs:
            source, target = pair.split("-")
            task = asyncio.create_task(self.get_model(source, target))
            tasks.append(task)
        
        # Wait for all models to load
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = sum(1 for r in results if r is not None)
        logger.info(f"Preloaded {successful}/{len(popular_pairs)} popular models")
    
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