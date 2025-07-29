from cachetools import LRUCache
from hashlib import sha256

cache = LRUCache(maxsize=1000)

def make_cache_key(
    source_text: str,
    context: str,
    source_lang: str,
    target_lang: str,
    model: str
) -> str:
    raw_key = f"{source_lang}|{target_lang}|{source_text}|{context}|{model}"
    return sha256(raw_key.encode()).hexdigest()

def get_cached_suggestion(source_text, context, source_lang, target_lang, model):
    key = make_cache_key(source_text, context, source_lang, target_lang, model)
    return cache.get(key)

def cache_suggestion(source_text, context, source_lang, target_lang, model, suggestion):
    key = make_cache_key(source_text, context, source_lang, target_lang, model)
    cache[key] = suggestion
