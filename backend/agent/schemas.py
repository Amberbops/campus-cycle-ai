"""
CampusCycle AI — Pydantic schemas for agent input/output.
All agent tools share these contracts.
"""
from __future__ import annotations
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class ItemCategory(str, Enum):
    electronics = "electronics"
    furniture = "furniture"
    clothing = "clothing"
    books = "books"
    kitchen = "kitchen"
    misc = "misc"


class VisibleCondition(str, Enum):
    new_like = "new-like"
    usable = "usable"
    repairable_looking = "repairable-looking"
    damaged = "damaged"
    unknown = "unknown"


class RecommendedPath(str, Enum):
    reuse = "reuse"
    repair = "repair"
    donate = "donate"
    recycle = "recycle"
    manual_review = "manual_review"


class NextAction(str, Enum):
    list_item = "list"
    match = "match"
    inspect = "inspect"
    recycle = "recycle"
    contact_moderator = "contact_moderator"


# ── Tool I/O models ────────────────────────────────────────────────────────────

class AnalyzeItemInput(BaseModel):
    image_s3_uri: str = Field(..., description="s3://bucket/key path of uploaded item image")
    user_description: Optional[str] = Field(None, description="Optional user-provided item description")
    campus_id: Optional[str] = Field("campus-default", description="Campus/hostel context")


class VisionResult(BaseModel):
    item_name: str
    category: ItemCategory
    condition: VisibleCondition
    confidence: float = Field(..., ge=0.0, le=1.0)
    safety_flags: List[str] = Field(default_factory=list)
    action_summary: Optional[str] = Field(None, description="Actionable guidance on what to do with this item on campus")
    reason: Optional[str] = Field(None, description="Specific explanation of condition and material")


class CircularRules(BaseModel):
    allowed_paths: List[RecommendedPath]
    restricted_categories: List[str] = Field(default_factory=list)
    wording_guidance: str = ""


class DemandMatch(BaseModel):
    request_id: str
    requester_alias: str
    hostel: str
    block: Optional[str] = None
    category: ItemCategory
    keywords: List[str]
    created_at: str
    score: float = 0.0


# ── Final agent output ─────────────────────────────────────────────────────────

class AgentRecommendation(BaseModel):
    """Structured JSON the agent MUST return — validated before sending to UI."""
    item_name: str
    category: ItemCategory
    condition: VisibleCondition
    recommended_path: RecommendedPath
    confidence: float = Field(..., ge=0.0, le=1.0)
    safety_flags: List[str] = Field(default_factory=list)
    action_summary: Optional[str] = Field(None, description="Direct summary of what to do with the object on campus")
    reason: str = Field(..., description="Short evidence-based explanation (1-2 sentences)")
    next_action: NextAction
    match_ids: List[str] = Field(default_factory=list)
