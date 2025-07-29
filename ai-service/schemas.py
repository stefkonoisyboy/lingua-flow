from pydantic import BaseModel
from typing import List, Optional

class TranslationRequest(BaseModel):
    source_language: str
    target_language: str
    source_text: str
    context: Optional[str] = ""
    memory_matches: Optional[List[str]] = []

class TranslationResponse(BaseModel):
    suggestion: str
    confidence: float
    source: str  # e.g., "openai", "local-model", "cache"
