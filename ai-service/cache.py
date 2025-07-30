"""
Enhanced caching system with TTL, statistics, and monitoring
"""

import time
import threading
from typing import Dict, Optional, Any
from dataclasses import dataclass
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    translation: str
    confidence: float
    model_used: str
    method: str
    created_at: float
    accessed_at: float
    access_count: int = 0

class EnhancedCache:
    """Enhanced caching system with TTL and statistics"""
    
    def __init__(self, maxsize: int = 1000, ttl: int = 3600):
        """
        Initialize enhanced cache
        
        Args:
            maxsize: Maximum number of cache entries
            ttl: Time to live in seconds (default: 1 hour)
        """
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl)
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "total_requests": 0,
            "cache_size": 0,
            "memory_usage_mb": 0
        }
        self.lock = threading.RLock()
        
        # Cache configuration
        self.maxsize = maxsize
        self.ttl = ttl
        
        logger.info(f"Enhanced cache initialized: maxsize={maxsize}, ttl={ttl}s")
    
    def _make_cache_key(
        self,
        source_text: str,
        context: str,
        source_lang: str,
        target_lang: str,
        model: str
    ) -> str:
        """Generate cache key from translation parameters"""
        import hashlib
        
        # Create a unique key based on all parameters
        key_data = f"{source_lang}|{target_lang}|{source_text}|{context}|{model}"
        return hashlib.sha256(key_data.encode()).hexdigest()
    
    def get(
        self,
        source_text: str,
        context: str,
        source_lang: str,
        target_lang: str,
        model: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached translation
        
        Returns:
            Cache entry dict or None if not found
        """
        with self.lock:
            key = self._make_cache_key(source_text, context, source_lang, target_lang, model)
            
            try:
                entry = self.cache.get(key)
                if entry:
                    # Update access statistics
                    entry.accessed_at = time.time()
                    entry.access_count += 1
                    self.stats["hits"] += 1
                    
                    logger.debug(f"Cache hit for key: {key[:16]}...")
                    
                    return {
                        "translation": entry.translation,
                        "confidence": entry.confidence,
                        "model_used": entry.model_used,
                        "method": entry.method,
                        "cached": True,
                        "cache_age": time.time() - entry.created_at
                    }
                else:
                    self.stats["misses"] += 1
                    logger.debug(f"Cache miss for key: {key[:16]}...")
                    return None
                    
            except Exception as e:
                logger.error(f"Cache get error: {str(e)}")
                return None
            finally:
                self.stats["total_requests"] += 1
                self._update_stats()
    
    def set(
        self,
        source_text: str,
        context: str,
        source_lang: str,
        target_lang: str,
        model: str,
        translation: str,
        confidence: float,
        model_used: str,
        method: str
    ) -> bool:
        """
        Cache a translation result
        
        Returns:
            True if successfully cached, False otherwise
        """
        with self.lock:
            try:
                key = self._make_cache_key(source_text, context, source_lang, target_lang, model)
                
                entry = CacheEntry(
                    translation=translation,
                    confidence=confidence,
                    model_used=model_used,
                    method=method,
                    created_at=time.time(),
                    accessed_at=time.time(),
                    access_count=1
                )
                
                self.cache[key] = entry
                logger.debug(f"Cached translation for key: {key[:16]}...")
                return True
                
            except Exception as e:
                logger.error(f"Cache set error: {str(e)}")
                return False
    
    def _update_stats(self):
        """Update cache statistics"""
        try:
            self.stats["cache_size"] = len(self.cache)
            
            # Estimate memory usage (rough calculation)
            total_memory = 0
            for entry in self.cache.values():
                # Rough estimate: 100 bytes per entry + string lengths
                total_memory += 100 + len(entry.translation) + len(entry.model_used) + len(entry.method)
            
            self.stats["memory_usage_mb"] = total_memory / (1024 * 1024)
            
        except Exception as e:
            logger.error(f"Error updating cache stats: {str(e)}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            stats = self.stats.copy()
            
            # Calculate hit rate
            total_requests = stats["total_requests"]
            if total_requests > 0:
                stats["hit_rate"] = stats["hits"] / total_requests
            else:
                stats["hit_rate"] = 0.0
            
            # Add cache configuration
            stats["maxsize"] = self.maxsize
            stats["ttl_seconds"] = self.ttl
            stats["ttl_hours"] = self.ttl / 3600
            
            return stats
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
            self.stats["hits"] = 0
            self.stats["misses"] = 0
            self.stats["evictions"] = 0
            self.stats["total_requests"] = 0
            self.stats["cache_size"] = 0
            self.stats["memory_usage_mb"] = 0
            logger.info("Cache cleared")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Get detailed cache information"""
        with self.lock:
            # Get top accessed entries
            entries = list(self.cache.values())
            entries.sort(key=lambda x: x.access_count, reverse=True)
            
            top_entries = []
            for entry in entries[:5]:  # Top 5
                top_entries.append({
                    "translation_preview": entry.translation[:50] + "..." if len(entry.translation) > 50 else entry.translation,
                    "model_used": entry.model_used,
                    "access_count": entry.access_count,
                    "age_hours": (time.time() - entry.created_at) / 3600
                })
            
            return {
                "stats": self.get_stats(),
                "top_entries": top_entries,
                "total_entries": len(self.cache)
            }

# Global cache instance
cache = EnhancedCache(maxsize=1000, ttl=3600)  # 1 hour TTL

# Backward compatibility functions
def make_cache_key(
    source_text: str,
    context: str,
    source_lang: str,
    target_lang: str,
    model: str
) -> str:
    """Legacy function for backward compatibility"""
    return cache._make_cache_key(source_text, context, source_lang, target_lang, model)

def get_cached_suggestion(
    source_text: str,
    context: str,
    source_lang: str,
    target_lang: str,
    model: str
) -> Optional[Dict[str, Any]]:
    """Legacy function for backward compatibility"""
    return cache.get(source_text, context, source_lang, target_lang, model)

def cache_suggestion(
    source_text: str,
    context: str,
    source_lang: str,
    target_lang: str,
    model: str,
    suggestion: Dict[str, Any]
) -> bool:
    """Legacy function for backward compatibility"""
    return cache.set(
        source_text, context, source_lang, target_lang, model,
        suggestion["translation"],
        suggestion["confidence"],
        suggestion["model_used"],
        suggestion["method"]
    )
