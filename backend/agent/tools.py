"""
CampusCycle AI — Strands agent tool implementations.
Each @tool function is registered with the Strands agent and called
during agent reasoning to gather facts or trigger side effects.
"""
from __future__ import annotations

import json
import logging
import base64
from typing import Optional, List
import os 

import boto3
try:
    from strands import tool
except ImportError:
    def tool(func):
        return func

try:
    from ..config.settings import get_settings
except (ImportError, ValueError):
    try:
        from backend.config.settings import get_settings
    except (ImportError, ValueError):
        from config.settings import get_settings
from .schemas import (
    VisionResult,
    CircularRules,
    DemandMatch,
    ItemCategory,
    VisibleCondition,
    RecommendedPath,
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Clients (initialised lazily or at cold-start)
bedrock_runtime = boto3.client("bedrock-runtime", region_name=settings.aws_region)
s3 = boto3.client("s3", region_name=settings.aws_region)
dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)


# ── Helper ─────────────────────────────────────────────────────────────────────

def _fetch_image_bytes(s3_uri: str) -> bytes:
    """Download an image from S3 given an s3://bucket/key URI, or read local file."""
    if s3_uri.startswith("s3://"):
        cleaned = s3_uri.removeprefix("s3://")
        bucket, _, key = cleaned.partition("/")
        try:
            response = s3.get_object(Bucket=bucket, Key=key)
            return response["Body"].read()
        except Exception as exc:
            logger.warning("Could not fetch image from S3 (%s): %s", s3_uri, exc)
            return b""
    elif s3_uri.startswith("file://") or "/" in s3_uri or "\\" in s3_uri:
        local_path = s3_uri.removeprefix("file://")
        import os
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()
    return b""


# ── Tool 1: analyze_item_image ─────────────────────────────────────────────────

@tool
def analyze_item_image(
    image_s3_uri: str,
    user_description: str = "",
) -> str:
    """
    Analyse a campus item image using Amazon Bedrock multimodal model.
    Returns a JSON string with item_type, category, visible_condition,
    confidence (0-1), and safety_flags.

    Args:
        image_s3_uri: S3 URI of the uploaded item image (s3://bucket/key).
        user_description: Optional user-provided description of the item.

    Returns:
        JSON string matching the VisionResult schema.
    """
    logger.info("analyze_item_image called: %s", image_s3_uri)

    image_bytes = _fetch_image_bytes(image_s3_uri)
    b64_image = base64.standard_b64encode(image_bytes).decode()

    description_clause = (
        f"User says: '{user_description}'." if user_description else ""
    )

    prompt_text = f"""\
You are CampusCycle, an intelligent campus circular-economy scout.
{description_clause}

Analyze the item and respond with ONLY this JSON (no markdown fences):
{{
  "item_name": "<concise item name>",
  "category": "<electronics|furniture|clothing|books|kitchen|misc>",
  "condition": "<new-like|usable|repairable-looking|damaged|unknown>",
  "confidence": 0.95,
  "safety_flags": [],
  "action_summary": "<actionable, specific 1-2 sentence instruction on what the student or campus should do with this item>",
  "reason": "<1 clear sentence explaining why, referencing the item's material and physical condition>"
}}

Rules:
- confidence must be a number between 0.0 and 1.0.
- Organic/biodegradable/food waste (e.g. banana peel, apple core, food scraps) -> category: "kitchen", condition: "damaged", action_summary: "Deposit into the campus organic/wet waste bin or hostel compost tumbler for vermicomposting."
- Reusable items (e.g. working cables, books, study chairs) -> condition: "usable", action_summary: "List on CampusCycle peer-to-peer exchange or drop at hostel reuse shelf."
- Repairable items (e.g. fan with loose screw, chair with loose leg) -> condition: "repairable-looking", action_summary: "Take to campus MakerSpace/repair workshop for inspection and maintenance."
- Hazardous/chemical/biohazard items -> add "potential_hazard" to safety_flags, action_summary: "Do not reuse or dispose in standard bins; contact Campus Safety / Lab Facility Manager for hazardous disposal."
- Tailor action_summary and reason specifically to this exact object. Never return generic boilerplate.
"""

    result_text = None
    bedrock_err_msg = ""
    # 1. Try Bedrock Multimodal Invocation (Converse API or InvokeModel)
    if image_bytes:
        try:
            # Modern Bedrock Converse API with image
            resp = bedrock_runtime.converse(
                modelId=settings.bedrock_model_id,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": {
                                    "format": "jpeg",
                                    "source": {"bytes": image_bytes},
                                    }
                            },
                            {"text": prompt_text},
                        ],
                    }
                ],
                inferenceConfig={
                    "maxTokens": settings.agent_max_tokens,
                    "temperature": settings.agent_temperature,
                },
            )
            result_text = resp["output"]["message"]["content"][0]["text"].strip()
        except Exception as conv_err:
            bedrock_err_msg = str(conv_err)
            logger.info("Converse API attempt: %s; trying invoke_model", conv_err)
            try:
                body = {
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "image": {
                                        "format": "jpeg",
                                        "source": {"bytes": b64_image},
                                    }
                                },
                                {"text": prompt_text},
                            ],
                        }
                    ],
                    "inferenceConfig": {
                        "maxTokens": settings.agent_max_tokens,
                        "temperature": settings.agent_temperature,
                    },
                }
                response = bedrock_runtime.invoke_model(
                    modelId=settings.bedrock_model_id,
                    body=json.dumps(body),
                    contentType="application/json",
                    accept="application/json",
                )
            except Exception as inv_err:
                bedrock_err_msg = str(inv_err)
                logger.info("Bedrock invocation note (%s). Checking Gemini multimodal backup.", inv_err)

    # 2. Try Google Gemini Flash Multimodal Vision Backup
    last_gemini_error = ""
    gemini_key = ""
    if not result_text:
        from pathlib import Path
        from dotenv import load_dotenv
        for p in [Path.cwd(), Path(__file__).resolve().parent.parent, Path(__file__).resolve().parent.parent.parent]:
            if (p / ".env").is_file():
                load_dotenv(p / ".env", override=True)
                break
        load_dotenv(override=True)
        gemini_key = os.getenv("GEMINI_API_KEY", "") or settings.gemini_api_key

        if gemini_key:
            try:
                import httpx
                import time
                primary_model = os.getenv("GEMINI_MODEL_ID", settings.gemini_model_id or "gemini-2.5-flash")
                candidates = list(dict.fromkeys([
                    primary_model,
                    "gemini-2.5-flash",
                    "gemini-flash-latest",
                    "gemini-2.5-flash-lite",
                    "gemini-2.5-pro",
                    "gemini-pro-latest",
                ]))

                # Validate image before passing to Gemini
                valid_image = False
                mime_type = "image/jpeg"
                if image_bytes and len(image_bytes) > 50:
                    try:
                        from PIL import Image
                        import io
                        pil_img = Image.open(io.BytesIO(image_bytes))
                        fmt = (pil_img.format or "JPEG").lower()
                        if fmt == "png":
                            mime_type = "image/png"
                        elif fmt == "webp":
                            mime_type = "image/webp"
                        else:
                            mime_type = "image/jpeg"
                        valid_image = True
                    except Exception as img_err:
                        logger.info("Image header check: %s", img_err)
                        valid_image = False

                parts = [{"text": prompt_text}]
                if b64_image and valid_image:
                    parts.insert(0, {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_image,
                        }
                    })
                gemini_payload = {
                    "contents": [{"parts": parts}],
                    "generationConfig": {
                        "response_mime_type": "application/json",
                        "temperature": 0.1,
                    },
                    "safetySettings": [
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                    ],
                }

                for mod in candidates:
                    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent?key={gemini_key}"
                    for attempt in range(1, 3):
                        gemini_resp = httpx.post(gemini_url, json=gemini_payload, timeout=20.0)
                        if gemini_resp.status_code == 200:
                            gemini_data = gemini_resp.json()
                            cands = gemini_data.get("candidates", [])
                            if cands and "content" in cands[0] and "parts" in cands[0]["content"]:
                                result_text = cands[0]["content"]["parts"][0]["text"].strip()
                                logger.info("Google Gemini (%s) successfully analyzed item.", mod)
                                break
                            else:
                                reason = cands[0].get("finishReason", "SAFETY") if cands else "UNKNOWN"
                                logger.warning("Gemini candidate blocked or empty (%s). Flagging for moderation.", reason)
                                result_text = json.dumps({
                                    "item_name": user_description[:50] or "Moderation Item",
                                    "category": "misc",
                                    "condition": "unknown",
                                    "confidence": 0.30,
                                    "safety_flags": ["content_moderation_flagged", "potential_hazard"],
                                })
                                break
                        elif gemini_resp.status_code == 503:
                            logger.warning("Gemini model %s 503 high demand; retrying...", mod)
                            time.sleep(1.5)
                        else:
                            last_gemini_error = f"Status {gemini_resp.status_code}: {gemini_resp.text[:150]}"
                            logger.warning("Gemini model %s returned: %s", mod, last_gemini_error)
                            break
                    if result_text:
                        break
            except Exception as gemini_err:
                last_gemini_error = str(gemini_err)
                logger.warning("Gemini multimodal call note: %s", gemini_err)

    if not result_text:
        diag = f"Bedrock error: {bedrock_err_msg or 'No image provided'}. Gemini (key_present={bool(gemini_key)}, error={last_gemini_error or 'none'})."
        raise RuntimeError(f"No multimodal vision model available. {diag}")

    # Clean markdown fences if model returned markdown
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(result_text)
    except Exception:
        parsed = {
            "item_name": user_description[:50] or "Campus Item",
            "category": "misc",
            "condition": "unknown",
            "confidence": 0.5,
            "safety_flags": [],
        }

    # Normalize enums and fields to guarantee adherence to VisionResult schema
    valid_categories = {c.value for c in ItemCategory}
    valid_conditions = {c.value for c in VisibleCondition}

    cat = str(parsed.get("category", "misc")).lower()
    parsed["category"] = cat if cat in valid_categories else "misc"

    cond = str(parsed.get("condition", "unknown")).lower()
    parsed["condition"] = cond if cond in valid_conditions else "unknown"

    try:
        parsed["confidence"] = float(parsed.get("confidence", 0.75))
    except (TypeError, ValueError):
        parsed["confidence"] = 0.75

    if not isinstance(parsed.get("safety_flags"), list):
        parsed["safety_flags"] = []

    act_sum = parsed.get("action_summary")
    parsed["action_summary"] = act_sum.strip() if isinstance(act_sum, str) and act_sum.strip() else None

    rsn = parsed.get("reason")
    parsed["reason"] = rsn.strip() if isinstance(rsn, str) and rsn.strip() else None

    VisionResult(**parsed)
    return json.dumps(parsed)


# ── Tool 2: get_circular_rules ─────────────────────────────────────────────────

@tool
def get_circular_rules(
    category: str,
    campus_id: str = "campus-default",
) -> str:
    """
    Retrieve campus-specific circularity rules for an item category.
    Returns allowed paths, restricted categories, and wording guidance.

    Args:
        category: Item category string (electronics, furniture, clothing, etc.).
        campus_id: Campus identifier (defaults to campus-default).

    Returns:
        JSON string matching CircularRules schema.
    """
    logger.info("get_circular_rules: category=%s campus=%s", category, campus_id)

    table = dynamodb.Table(settings.dynamo_config_table)
    resp = table.get_item(Key={"config_id": f"rules#{campus_id}#{category}"})
    item = resp.get("Item")

    if item:
        rules = CircularRules(
            allowed_paths=[RecommendedPath(p) for p in item.get("allowed_paths", [])],
            restricted_categories=item.get("restricted_categories", []),
            wording_guidance=item.get("wording_guidance", ""),
        )
    else:
        # Safe defaults when no explicit rule exists
        defaults: dict[str, list] = {
            "electronics": ["reuse", "repair", "recycle", "manual_review"],
            "furniture": ["reuse", "repair", "donate", "recycle"],
            "clothing": ["reuse", "donate", "recycle"],
            "books": ["reuse", "donate"],
            "kitchen": ["reuse", "donate", "recycle", "manual_review"],
            "misc": ["reuse", "repair", "donate", "recycle", "manual_review"],
        }
        allowed = defaults.get(category, ["manual_review"])
        rules = CircularRules(
            allowed_paths=[RecommendedPath(p) for p in allowed],
            wording_guidance="Default campus rules applied.",
        )

    return rules.model_dump_json()


# ── Tool 3: search_local_demand ────────────────────────────────────────────────

@tool
def search_local_demand(
    category: str,
    keywords: str = "",
    hostel: str = "",
    limit: int = 3,
) -> str:
    """
    Search campus DemandRequests table for students who need this type of item.
    Returns top matching demand records as a JSON list.

    Args:
        category: Item category to match against (electronics, furniture, etc.).
        keywords: Space-separated keyword hints (e.g. 'hdmi cable').
        hostel: Hostel/block filter; leave empty to search all campus.
        limit: Maximum number of matches to return (default 3).

    Returns:
        JSON array of DemandMatch objects.
    """
    logger.info("search_local_demand: category=%s keywords=%s", category, keywords)

    items = []
    try:
        table = dynamodb.Table(settings.dynamo_demand_table)
        filter_expr = boto3.dynamodb.conditions.Attr("active").eq(True) & \
                      boto3.dynamodb.conditions.Attr("category").eq(category)
        if hostel:
            filter_expr = filter_expr & boto3.dynamodb.conditions.Attr("hostel").eq(hostel)

        resp = table.scan(
            FilterExpression=filter_expr,
            Limit=50,  # scan up to 50, rank, then return top N
        )
        items = resp.get("Items", [])
    except Exception as ddb_err:
        logger.warning("search_local_demand DynamoDB query note (%s); returning empty matches", ddb_err)

    keyword_list = [k.lower() for k in keywords.split() if k]

    def _score(item: dict) -> float:
        item_keywords = [k.lower() for k in item.get("keywords", [])]
        if not keyword_list:
            return 1.0
        hits = sum(1 for kw in keyword_list if any(kw in ik for ik in item_keywords))
        return hits / len(keyword_list)

    ranked = sorted(items, key=_score, reverse=True)[:limit]

    matches = [
        DemandMatch(
            request_id=r["request_id"],
            requester_alias=r.get("requester_alias", "Anonymous"),
            hostel=r.get("hostel", "unknown"),
            block=r.get("block"),
            category=ItemCategory(r["category"]),
            keywords=r.get("keywords", []),
            created_at=r.get("created_at", ""),
            score=_score(r),
        )
        for r in ranked
    ]
    return json.dumps([m.model_dump() for m in matches])


# ── Tool 4: create_item_listing ───────────────────────────────────────────────

@tool
def create_item_listing(
    item_name: str,
    category: str,
    condition: str,
    image_s3_uri: str,
    owner_id: str,
    hostel: str,
    chosen_path: str,
    recommendation_json: str = "{}",
) -> str:
    """
    Create a confirmed item listing in DynamoDB after user acceptance.
    Side-effect tool — only called after user confirmation.

    Args:
        item_name: Human-readable item name.
        category: Item category string.
        condition: Visible condition label.
        image_s3_uri: S3 URI of item image.
        owner_id: User ID of the item owner.
        hostel: Hostel/block location.
        chosen_path: Circularity path chosen by user.
        recommendation_json: Full AgentRecommendation JSON for audit.

    Returns:
        JSON with listing_id and status.
    """
    import ulid
    from datetime import datetime, timezone

    listing_id = str(ulid.new())
    now = datetime.now(timezone.utc).isoformat()

    table = dynamodb.Table(settings.dynamo_items_table)
    table.put_item(
        Item={
            "item_id": listing_id,
            "item_name": item_name,
            "category": category,
            "condition": condition,
            "image_uri": image_s3_uri,
            "owner_id": owner_id,
            "hostel": hostel,
            "status": "available",
            "chosen_path": chosen_path,
            "recommendation": recommendation_json,
            "created_at": now,
        }
    )
    logger.info("Item listing created: %s", listing_id)
    return json.dumps({"listing_id": listing_id, "status": "created"})


# ── Tool 5: create_recycle_task ───────────────────────────────────────────────

@tool
def create_recycle_task(
    item_name: str,
    item_id: str,
    location: str,
    reason: str,
) -> str:
    """
    Create a recycle/disposal task for items routed away from reuse.

    Args:
        item_name: Human-readable item name.
        item_id: Reference item ID (or temp ID if no listing created yet).
        location: Hostel/block where item currently is.
        reason: Why the item was routed to recycle.

    Returns:
        JSON with task_id and status.
    """
    import ulid
    from datetime import datetime, timezone

    task_id = str(ulid.new())
    now = datetime.now(timezone.utc).isoformat()

    table = dynamodb.Table(settings.dynamo_tasks_table)
    table.put_item(
        Item={
            "task_id": task_id,
            "item_id": item_id,
            "item_name": item_name,
            "task_type": "recycle",
            "location": location,
            "reason": reason,
            "status": "pending",
            "assigned_to": None,
            "created_at": now,
        }
    )
    logger.info("Recycle task created: %s", task_id)
    return json.dumps({"task_id": task_id, "status": "created"})


# ── Tool 6: record_impact_event ───────────────────────────────────────────────

@tool
def record_impact_event(
    item_id: str,
    decision: str,
    category: str,
    weight_estimate_kg: float = 0.0,
) -> str:
    """
    Record a non-financial impact event (estimated item diversion from waste).
    Clearly labelled as an estimate.

    Args:
        item_id: Listing or temp item ID.
        decision: Final decision (reuse, repair, donate, recycle, manual_review).
        category: Item category.
        weight_estimate_kg: Optional weight estimate in kg (clearly an estimate).

    Returns:
        JSON with impact_event_id.
    """
    import ulid
    from datetime import datetime, timezone

    impact_id = str(ulid.new())
    now = datetime.now(timezone.utc).isoformat()

    diverted = decision in ("reuse", "repair", "donate")

    table = dynamodb.Table(settings.dynamo_impact_table)
    table.put_item(
        Item={
            "impact_id": impact_id,
            "item_id": item_id,
            "decision": decision,
            "category": category,
            "diverted_from_disposal": diverted,
            "estimated_weight_kg": str(weight_estimate_kg),  # stored as string for Decimal compat
            "is_estimate": True,
            "created_at": now,
        }
    )
    logger.info("Impact event recorded: %s diverted=%s", impact_id, diverted)
    return json.dumps({"impact_event_id": impact_id, "diverted": diverted})
