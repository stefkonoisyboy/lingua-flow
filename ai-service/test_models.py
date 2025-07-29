"""
Test script for model registry functionality
"""

import asyncio
import logging
from model_registry import ModelRegistry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_model_registry():
    """Test the model registry functionality"""
    
    print("🧪 Testing Model Registry...")
    
    # Initialize model registry
    model_registry = ModelRegistry()
    
    # Test 1: Available language pairs
    print("\n📋 Testing Available Language Pairs:")
    available_pairs = model_registry.get_available_language_pairs()
    print(f"    Available pairs: {len(available_pairs)}")
    for pair in available_pairs:
        print(f"      {pair}")
    
    # Test 2: Supported target languages
    print("\n🎯 Testing Supported Target Languages:")
    supported_languages = model_registry.get_supported_target_languages()
    print(f"    Supported target languages: {supported_languages}")
    
    # Test 3: Language pair validation
    print("\n✅ Testing Language Pair Validation:")
    
    test_cases = [
        ("en", "es", True, "Valid English to Spanish"),
        ("en", "fr", True, "Valid English to French"),
        ("en", "de", True, "Valid English to German"),
        ("es", "en", False, "Invalid Spanish to English"),
        ("fr", "de", False, "Invalid French to German"),
        ("en", "xx", False, "Invalid target language"),
    ]
    
    for source, target, expected, description in test_cases:
        is_valid = model_registry.validate_language_pair(source, target)
        status = "✅ PASS" if is_valid == expected else "❌ FAIL"
        print(f"    {status}: {description} - {source}->{target}")
    
    # Test 4: Model availability
    print("\n🤖 Testing Model Availability:")
    
    for source, target, expected, description in test_cases:
        is_available = model_registry.is_model_available(source, target)
        status = "✅ PASS" if is_available == expected else "❌ FAIL"
        print(f"    {status}: {description} - {source}->{target}")
    
    # Test 5: Model loading
    print("\n📦 Testing Model Loading:")
    
    # Test loading a valid model
    try:
        model = await model_registry.get_model("en", "es")
        if model is not None:
            print("    ✅ PASS: Successfully loaded en-es model")
        else:
            print("    ❌ FAIL: Failed to load en-es model")
    except Exception as e:
        print(f"    ❌ FAIL: Error loading en-es model - {str(e)}")
    
    # Test loading an invalid model
    try:
        model = await model_registry.get_model("es", "en")
        if model is None:
            print("    ✅ PASS: Correctly rejected es-en model")
        else:
            print("    ❌ FAIL: Should have rejected es-en model")
    except Exception as e:
        print(f"    ✅ PASS: Correctly rejected es-en model - {str(e)}")
    
    # Test 6: Translation
    print("\n🌐 Testing Translation:")
    
    # Test valid translation
    try:
        result = await model_registry.translate(
            text="Hello, how are you?",
            target_lang="es"
        )
        
        if result["translation"] is not None:
            print(f"    ✅ PASS: Translation successful - '{result['translation']}'")
            print(f"        Method: {result['method']}")
            print(f"        Confidence: {result['confidence']}")
        else:
            print("    ❌ FAIL: Translation failed")
            
    except Exception as e:
        print(f"    ❌ FAIL: Translation error - {str(e)}")
    
    # Test invalid translation
    try:
        result = await model_registry.translate(
            text="Hello",
            target_lang="xx"
        )
        
        if result["translation"] is None:
            print("    ✅ PASS: Correctly rejected invalid target language")
        else:
            print("    ❌ FAIL: Should have rejected invalid target language")
            
    except Exception as e:
        print(f"    ✅ PASS: Correctly rejected invalid target language - {str(e)}")
    
    # Test 7: Model info
    print("\n📊 Testing Model Info:")
    info = model_registry.get_model_info()
    print(f"    Loaded models: {info['total_loaded']}")
    print(f"    Available models: {info['available_models']}")
    print(f"    Supported target languages: {info['supported_target_languages']}")
    
    print("\n✅ Model registry tests completed!")

if __name__ == "__main__":
    asyncio.run(test_model_registry()) 