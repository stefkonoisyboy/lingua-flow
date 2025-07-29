"""
Error handling utilities for AI translation service
"""

import logging
from typing import Dict, Any, Optional, List
from enum import Enum
import traceback

logger = logging.getLogger(__name__)

class ErrorType(Enum):
    """Types of errors that can occur"""
    VALIDATION_ERROR = "validation_error"
    MODEL_LOAD_ERROR = "model_load_error"
    TRANSLATION_ERROR = "translation_error"
    CACHE_ERROR = "cache_error"
    OPENAI_ERROR = "openai_error"
    NETWORK_ERROR = "network_error"
    UNKNOWN_ERROR = "unknown_error"

class TranslationError(Exception):
    """Base exception for translation errors"""
    def __init__(self, message: str, error_type: ErrorType, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_type = error_type
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(TranslationError):
    """Error for invalid input data"""
    def __init__(self, message: str, field: str = None):
        super().__init__(message, ErrorType.VALIDATION_ERROR, {"field": field})

class ModelLoadError(TranslationError):
    """Error for model loading failures"""
    def __init__(self, message: str, model_name: str = None):
        super().__init__(message, ErrorType.MODEL_LOAD_ERROR, {"model_name": model_name})

class TranslationServiceError(TranslationError):
    """Error for translation service failures"""
    def __init__(self, message: str, source_lang: str = None, target_lang: str = None):
        super().__init__(message, ErrorType.TRANSLATION_ERROR, {
            "source_lang": source_lang,
            "target_lang": target_lang
        })

class ErrorHandler:
    """Handles errors and provides user-friendly messages"""
    
    def __init__(self):
        # Language code validation
        self.valid_language_codes = {
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar',
            'hi', 'tr', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'hu', 'cs', 'ro',
            'bg', 'sk', 'sl', 'et', 'lv', 'lt', 'mt'
        }
        
        # Text length limits
        self.max_text_length = 5000
        self.min_text_length = 1
    
    def validate_language_code(self, lang_code: str, field_name: str) -> None:
        """Validate language code format and availability"""
        if not lang_code:
            raise ValidationError(f"{field_name} cannot be empty", field_name)
        
        if not isinstance(lang_code, str):
            raise ValidationError(f"{field_name} must be a string", field_name)
        
        # Check format (2-3 letter code)
        if not (2 <= len(lang_code) <= 3):
            raise ValidationError(f"{field_name} must be 2-3 characters long", field_name)
        
        # Check if it's a valid language code
        if lang_code not in self.valid_language_codes:
            raise ValidationError(f"Unsupported language code: {lang_code}", field_name)
    
    def validate_text(self, text: str) -> None:
        """Validate input text"""
        if not text:
            raise ValidationError("Source text cannot be empty", "source_text")
        
        if not isinstance(text, str):
            raise ValidationError("Source text must be a string", "source_text")
        
        if len(text.strip()) < self.min_text_length:
            raise ValidationError("Source text is too short", "source_text")
        
        if len(text) > self.max_text_length:
            raise ValidationError(f"Source text too long (max {self.max_text_length} characters)", "source_text")
        
        # Check for potentially harmful content
        harmful_patterns = [
            'script', 'javascript', 'eval', 'exec', 'system',
            'rm -rf', 'del', 'format', 'shutdown'
        ]
        
        text_lower = text.lower()
        for pattern in harmful_patterns:
            if pattern in text_lower:
                raise ValidationError(f"Text contains potentially harmful content: {pattern}", "source_text")
    
    def validate_translation_request(self, source_text: str, source_lang: str, target_lang: str, context: str = "") -> None:
        """Validate translation request parameters"""
        # Validate source text
        self.validate_text(source_text)
        
        # Validate source language (must be English)
        if source_lang != "en":
            raise ValidationError(
                f"Source language must be 'en' (English), got '{source_lang}'",
                "source_language"
            )
        
        # Validate target language
        self.validate_language_code(target_lang, "target_language")
        
        # Check if target language is supported
        supported_languages = ["es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar"]
        if target_lang not in supported_languages:
            raise ValidationError(
                f"Target language '{target_lang}' is not supported. Supported languages: {', '.join(supported_languages)}",
                "target_language"
            )
        
        # Validate context length
        if len(context) > 1000:
            raise ValidationError(
                "Context too long (max 1000 characters)",
                "context"
            )
    
    def handle_model_load_error(self, model_name: str, error: Exception) -> ModelLoadError:
        """Handle model loading errors"""
        error_msg = f"Failed to load model: {model_name}"
        
        if "HTTP" in str(error):
            error_msg += " - Network error, check internet connection"
        elif "CUDA" in str(error):
            error_msg += " - GPU memory error, try CPU mode"
        elif "transformers" in str(error):
            error_msg += " - Model not found or corrupted"
        else:
            error_msg += f" - {str(error)}"
        
        logger.error(f"Model load error: {error_msg}")
        return ModelLoadError(error_msg, model_name)
    
    def handle_translation_error(self, source_lang: str, target_lang: str, error: Exception) -> TranslationServiceError:
        """Handle translation errors"""
        error_msg = f"Translation failed for {source_lang}-{target_lang}"
        
        if "CUDA" in str(error):
            error_msg += " - GPU memory error"
        elif "token" in str(error).lower():
            error_msg += " - Text too long for model"
        elif "network" in str(error).lower():
            error_msg += " - Network error"
        else:
            error_msg += f" - {str(error)}"
        
        logger.error(f"Translation error: {error_msg}")
        return TranslationServiceError(error_msg, source_lang, target_lang)
    
    def handle_openai_error(self, error: Exception) -> TranslationError:
        """Handle OpenAI API errors"""
        error_msg = "OpenAI translation failed"
        
        if "rate limit" in str(error).lower():
            error_msg += " - Rate limit exceeded"
        elif "quota" in str(error).lower():
            error_msg += " - API quota exceeded"
        elif "authentication" in str(error).lower():
            error_msg += " - Invalid API key"
        elif "model" in str(error).lower():
            error_msg += " - Model not available"
        else:
            error_msg += f" - {str(error)}"
        
        logger.error(f"OpenAI error: {error_msg}")
        return TranslationError(error_msg, ErrorType.OPENAI_ERROR)
    
    def handle_cache_error(self, error: Exception) -> TranslationError:
        """Handle cache errors"""
        error_msg = "Cache operation failed"
        
        if "connection" in str(error).lower():
            error_msg += " - Cache connection error"
        elif "memory" in str(error).lower():
            error_msg += " - Cache memory error"
        else:
            error_msg += f" - {str(error)}"
        
        logger.warning(f"Cache error: {error_msg}")
        return TranslationError(error_msg, ErrorType.CACHE_ERROR)
    
    def format_error_response(self, error: Exception) -> Dict[str, Any]:
        """Format error for API response"""
        if isinstance(error, TranslationError):
            return {
                "error": error.message,
                "error_type": error.error_type.value,
                "details": error.details
            }
        else:
            # Log unexpected errors
            logger.error(f"Unexpected error: {str(error)}")
            logger.error(traceback.format_exc())
            
            return {
                "error": "An unexpected error occurred",
                "error_type": ErrorType.UNKNOWN_ERROR.value,
                "details": {}
            }
    
    def is_retryable_error(self, error: Exception) -> bool:
        """Check if error is retryable"""
        if isinstance(error, ValidationError):
            return False  # Validation errors are not retryable
        
        error_str = str(error).lower()
        
        # Retryable errors
        retryable_patterns = [
            "network", "timeout", "connection", "rate limit",
            "temporary", "service unavailable", "unavailable"
        ]
        
        return any(pattern in error_str for pattern in retryable_patterns)
    
    def get_error_suggestions(self, error_type: ErrorType) -> List[str]:
        """Get helpful suggestions for common errors"""
        suggestions = {
            ErrorType.VALIDATION_ERROR: [
                "Check that language codes are valid (e.g., 'en', 'es', 'fr')",
                "Ensure source text is not empty and under 5000 characters",
                "Verify source and target languages are different"
            ],
            ErrorType.MODEL_LOAD_ERROR: [
                "Check internet connection",
                "Try again in a few minutes",
                "Contact support if problem persists"
            ],
            ErrorType.TRANSLATION_ERROR: [
                "Try shorter text",
                "Check if language pair is supported",
                "Try again in a few minutes"
            ],
            ErrorType.OPENAI_ERROR: [
                "Check OpenAI API key configuration",
                "Verify API quota and billing",
                "Try again later if rate limited"
            ],
            ErrorType.CACHE_ERROR: [
                "Service will continue without caching",
                "Try again in a few minutes"
            ]
        }
        
        return suggestions.get(error_type, ["Try again later"]) 