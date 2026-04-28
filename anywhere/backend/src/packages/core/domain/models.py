from dataclasses import dataclass, field
from typing import Any, Dict, Optional
from datetime import datetime, timezone

@dataclass
class User:
    id: Optional[int]  # Optional because it's DB-generated (autoincrement)
    google_id: str
    email: str
    name: str
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

@dataclass
class Tag:
    id: str
    category: str
    name_translations: Dict[str, str]  # e.g., {"en": "Pothole", "es": "Bache"}
    is_active: bool = True

    def get_localized_name(self, lang: str = "es") -> str:
        """Returns the translated tag name, falling back to Spanish if missing."""
        return self.name_translations.get(lang, self.name_translations.get("es", "Unknown"))

@dataclass
class SubmissionItem:
    id: str
    submission_id: str
    tag_id: str
    item_type: str  # "image", "text", "price_data"
    content_payload: Dict[str, Any]  # Flexible payload for file paths or OCR JSON

@dataclass
class Submission:
    id: str
    user_id: str
    latitude: float
    longitude: float
    device_timestamp: datetime
    status: str = "pending"
    server_timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    items: list[SubmissionItem] = field(default_factory=list)
