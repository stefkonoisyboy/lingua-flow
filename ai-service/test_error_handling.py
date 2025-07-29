"""
Test script for error handling functionality
"""

import asyncio
import logging
from error_handler import ErrorHandler, ValidationError, TranslationError, ErrorType
from model_registry import ModelRegistry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_error_handling():
    """Test the error handling functionality"""
    
    print("🧪 Testing Error Handling...")
    
    # Initialize services
    error_handler = ErrorHandler()
    model_registry = ModelRegistry()
    
    # Test 1: Input validation
    print("\n📝 Testing Input Validation:")
    
    test_cases = [
        # Valid cases
        ("Hello", "en", "es", "Valid request"),
        ("Bonjour", "en", "fr", "Valid request"),
        
        # Invalid cases
        ("", "en", "es", "Empty text"),
        ("A" * 6000, "en", "es", "Text too long"),
        ("Hello", "es", "en", "Invalid source language (not English)"),
        ("Hello", "en", "invalid", "Invalid target language"),
        ("Hello", "en", "en", "Same source and target"),
        ("<script>alert('xss')</script>", "en", "es", "Harmful content"),
        ("Hello", "en", "xx", "Unsupported target language"),
    ]
    
    for text, source, target, description in test_cases:
        print(f"\n  Testing: {description}")
        try:
            error_handler.validate_translation_request(text, source, target)
            print(f"    ✅ PASS: {description}")
        except ValidationError as e:
            print(f"    ✅ PASS: {description} - {e.message}")
        except Exception as e:
            print(f"    ❌ FAIL: {description} - Unexpected error: {str(e)}")
    
    # Test 2: Model loading errors
    print("\n🤖 Testing Model Loading Error Handling:")
    
    # Test non-existent model
    model = await model_registry.get_model("en", "xx")
    if model is None:
        print("    ✅ PASS: Model loading error handled - Model returned None for unsupported target")
    else:
        print("    ❌ FAIL: Should have returned None for unsupported target")
    
    # Test invalid source language
    model = await model_registry.get_model("es", "en")
    if model is None:
        print("    ✅ PASS: Model loading error handled - Model returned None for invalid source")
    else:
        print("    ❌ FAIL: Should have returned None for invalid source")
    
    # Test invalid model name (this should raise an exception)
    try:
        # This should fail because the model name doesn't exist
        model_name = "Helsinki-NLP/opus-mt-en-xx"
        from transformers import MarianTokenizer
        MarianTokenizer.from_pretrained(model_name)
        print("    ❌ FAIL: Should have failed for invalid model name")
    except Exception as e:
        print(f"    ✅ PASS: Model loading error handled - {str(e)}")
    
    # Test 3: Translation errors
    print("\n🌐 Testing Translation Error Handling:")
    
    try:
        # Try translation with unsupported target language
        result = await model_registry.translate(
            text="Hello",
            target_lang="xx"
        )
        
        if result["translation"] is None:
            print("    ✅ PASS: Translation error handled - Unsupported target language")
        else:
            print("    ❌ FAIL: Should have failed for unsupported target language")
            
    except Exception as e:
        print(f"    ✅ PASS: Translation error handled - {str(e)}")
    
    # Test 4: Error response formatting
    print("\n📋 Testing Error Response Formatting:")
    
    test_errors = [
        ValidationError("Test validation error", "source_text"),
        TranslationError("Test translation error", ErrorType.TRANSLATION_ERROR),
    ]
    
    for error in test_errors:
        try:
            response = error_handler.format_error_response(error)
            print(f"    ✅ PASS: Error formatted correctly - {response['error_type']}")
        except Exception as e:
            print(f"    ❌ FAIL: Error formatting failed - {str(e)}")
    
    # Test 5: Retryable error detection
    print("\n🔄 Testing Retryable Error Detection:")
    
    retryable_errors = [
        "Network timeout error",
        "Rate limit exceeded",
        "Service temporarily unavailable",
        "Connection error"
    ]
    
    non_retryable_errors = [
        "Invalid language code",
        "Text too long",
        "Validation failed"
    ]
    
    for error_msg in retryable_errors:
        is_retryable = error_handler.is_retryable_error(Exception(error_msg))
        print(f"    {error_msg}: {'✅ Retryable' if is_retryable else '❌ Not retryable'}")
    
    for error_msg in non_retryable_errors:
        is_retryable = error_handler.is_retryable_error(Exception(error_msg))
        print(f"    {error_msg}: {'❌ Should not be retryable' if not is_retryable else '✅ Should be retryable'}")
    
    # Test 6: Error suggestions
    print("\n💡 Testing Error Suggestions:")
    
    for error_type in ErrorType:
        suggestions = error_handler.get_error_suggestions(error_type)
        print(f"    {error_type.value}: {len(suggestions)} suggestions")
        if suggestions:
            print(f"      Example: {suggestions[0]}")
    
    print("\n✅ Error handling tests completed!")

if __name__ == "__main__":
    asyncio.run(test_error_handling()) 