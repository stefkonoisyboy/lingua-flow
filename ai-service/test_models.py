"""
Test script for dynamic model loading
"""

import asyncio
import logging
from model_registry import ModelRegistry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_model_registry():
    """Test the model registry functionality"""
    
    print("🧪 Testing Dynamic Model Loading...")
    
    # Initialize model registry
    registry = ModelRegistry()
    
    # Test 1: Check available models
    print("\n📋 Available Language Pairs:")
    available_pairs = registry.get_available_language_pairs()
    print(f"Total available pairs: {len(available_pairs)}")
    
    # Show some examples
    example_pairs = available_pairs[:10]
    for pair in example_pairs:
        print(f"  - {pair}")
    
    # Test 2: Check specific language pairs
    test_pairs = [
        ("en", "es"),  # Should work directly
        ("es", "en"),  # Should work directly
        ("fr", "de"),  # Should work directly
        ("en", "fr"),  # Should work directly
        ("zh", "ja"),  # Should use pivot through English
        ("ar", "ko"),  # Should use pivot through English
    ]
    
    print("\n🔍 Testing Language Pair Availability:")
    for source, target in test_pairs:
        is_available = registry.is_model_available(source, target)
        translation_path = registry.find_translation_path(source, target)
        
        print(f"  {source}-{target}:")
        print(f"    Direct available: {is_available}")
        print(f"    Translation path: {translation_path}")
    
    # Test 3: Load a specific model
    print("\n⚡ Testing Model Loading:")
    try:
        model = await registry.get_model("en", "es")
        if model:
            print("  ✅ Successfully loaded en-es model")
        else:
            print("  ❌ Failed to load en-es model")
    except Exception as e:
        print(f"  ❌ Error loading model: {str(e)}")
    
    # Test 4: Test translation with fallback
    print("\n🌐 Testing Translation with Fallback:")
    test_text = "Hello, how are you?"
    
    test_cases = [
        ("en", "es", "English to Spanish"),
        ("en", "fr", "English to French"),
        ("es", "en", "Spanish to English"),
        ("fr", "de", "French to German"),
    ]
    
    for source, target, description in test_cases:
        print(f"\n  Testing {description} ({source} → {target}):")
        try:
            result = await registry.translate_with_fallback(
                text=test_text,
                source_lang=source,
                target_lang=target
            )
            
            if result["translation"]:
                print(f"    ✅ Translation: {result['translation']}")
                print(f"    📊 Confidence: {result['confidence']}")
                print(f"    🔧 Method: {result['method']}")
                print(f"    🤖 Model: {result['model_used']}")
            else:
                print(f"    ❌ Translation failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"    ❌ Error: {str(e)}")
    
    # Test 5: Get model info
    print("\n📊 Model Registry Info:")
    info = registry.get_model_info()
    print(f"  Loaded models: {info['loaded_models']}")
    print(f"  Total loaded: {info['total_loaded']}")
    print(f"  Available pairs: {info['available_pairs']}")
    
    # Cleanup
    await registry.cleanup()
    print("\n🧹 Cleanup completed")

if __name__ == "__main__":
    asyncio.run(test_model_registry()) 