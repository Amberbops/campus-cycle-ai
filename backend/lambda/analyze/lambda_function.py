"""
CampusCycle AI — Self-Contained AWS Lambda Handler for 'campuscycle-analyze'.
This file uses only standard library and boto3 (pre-installed in AWS Lambda Python 3.11 runtime).
Copy and paste this into the AWS Lambda Console for 'campuscycle-analyze' and click Deploy!
"""
from __future__ import annotations

import base64
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import boto3
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger()
logger.setLevel(logging.INFO)

AWS_REGION = os.getenv("AWS_REGION", os.getenv("AWS_REGION_NAME", "us-east-1"))
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "campuscycle-items-dev")
DEMAND_TABLE = os.getenv("DYNAMO_DEMAND_TABLE", "CampusCycle_DemandRequests")
AUDIT_TABLE = os.getenv("DYNAMO_AUDIT_TABLE", "CampusCycle_AuditEvents")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-pro-v1:0")

s3 = boto3.client("s3", region_name=AWS_REGION)
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
bedrock_runtime = boto3.client("bedrock-runtime", region_name=AWS_REGION)


def _audit(request_id: str, actor: str, event_type: str, payload_summary: str):
    try:
        table = dynamodb.Table(AUDIT_TABLE)
        table.put_item(
            Item={
                "event_id": str(uuid.uuid4()),
                "request_id": request_id,
                "actor": actor,
                "event_type": event_type,
                "payload_summary": payload_summary[:500],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception as exc:
        logger.warning("Audit record failed: %s", exc)


def _analyze_item(image_s3_uri: str, user_description: str) -> dict:
    """Analyze item with Bedrock Nova Pro, with circularity heuristic fallback."""
    # Attempt S3 fetch
    image_bytes = b""
    if image_s3_uri.startswith("s3://"):
        try:
            cleaned = image_s3_uri.removeprefix("s3://")
            bucket, _, key = cleaned.partition("/")
            resp = s3.get_object(Bucket=bucket, Key=key)
            image_bytes = resp["Body"].read()
        except Exception as exc:
            logger.info("S3 image fetch note (%s): %s", image_s3_uri, exc)

    prompt = f"""You are CampusCycle, an intelligent campus circular-economy scout.
User says: '{user_description}'.
Respond ONLY with this JSON (no markdown):
{{
  "item_name": "<item name>",
  "category": "<electronics|furniture|clothing|books|kitchen|misc>",
  "condition": "<new-like|usable|repairable-looking|damaged|unknown>",
  "confidence": 0.95,
  "safety_flags": [],
  "action_summary": "<actionable, specific 1-2 sentence instruction on what the student or campus should do with this item>",
  "reason": "<1 clear sentence explaining why, referencing the item's material and physical condition>"
}}
Rules:
- Organic/biodegradable/food waste (e.g. banana peel, apple core, food scraps) -> category: "kitchen", condition: "damaged", action_summary: "Deposit into campus organic wet-waste bin or compost tumbler."
- Chemicals, batteries, or hazards -> add 'potential_hazard' to safety_flags.
- Tailor action_summary and reason specifically to this exact object."""

    # 1. Try Bedrock Multimodal
    if image_bytes:
        try:
            resp = bedrock_runtime.converse(
                modelId=BEDROCK_MODEL_ID,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"image": {"format": "jpeg", "source": {"bytes": image_bytes}}},
                            {"text": prompt},
                        ],
                    }
                ],
                inferenceConfig={"maxTokens": 512, "temperature": 0.2},
            )
            raw = resp["output"]["message"]["content"][0]["text"].strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            return json.loads(raw)
        except Exception as exc:
            logger.info("Bedrock converse note: %s", exc)

    # 2. Backup 2: Google Gemini 2.5 Flash Multimodal Vision
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if gemini_key:
        try:
            import urllib.request
            parts = [{"text": prompt}]
            if image_bytes:
                parts.insert(0, {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": base64.b64encode(image_bytes).decode("utf-8"),
                    }
                })
            req_data = json.dumps({
                "contents": [{"parts": parts}],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                },
            }).encode("utf-8")
            import time
            primary_model = os.getenv("GEMINI_MODEL_ID", "gemini-3.6-flash")
            candidates = list(dict.fromkeys([primary_model, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]))
            for mod in candidates:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent?key={gemini_key}"
                for _ in range(2):
                    try:
                        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            data = json.loads(resp.read().decode("utf-8"))
                            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                            if text.startswith("```"):
                                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                            return json.loads(text)
                    except Exception as mod_err:
                        logger.warning("Gemini model %s error: %s", mod, mod_err)
                        time.sleep(1.5)
        except Exception as gemini_exc:
            logger.warning("Gemini multimodal fallback note: %s", gemini_exc)

    raise RuntimeError("No multimodal vision model available. AWS Bedrock is pending verification and GEMINI_API_KEY is not configured or failed.")


def _search_demand(category: str, keywords: str, hostel: str = "") -> list:
    """Query active demand from DynamoDB."""
    try:
        table = dynamodb.Table(DEMAND_TABLE)
        expr = Attr("active").eq(True) & Attr("category").eq(category)
        if hostel:
            expr = expr & Attr("hostel").eq(hostel)
        resp = table.scan(FilterExpression=expr, Limit=20)
        items = resp.get("Items", [])
        return [item["request_id"] for item in items if "request_id" in item]
    except Exception as exc:
        logger.warning("Demand query note: %s", exc)
        return []


def lambda_handler(event, context):
    """AWS Lambda entry point for API Gateway."""
    logger.info("Received event: %s", json.dumps(event)[:300])

    # Parse request body
    body = event
    if "body" in event and event["body"]:
        if isinstance(event["body"], str):
            try:
                body = json.loads(event["body"])
            except Exception:
                body = {}
        else:
            body = event["body"]

    image_s3_uri = body.get("image_s3_uri", "")
    user_description = body.get("user_description", "")
    hostel = body.get("hostel", "")
    request_id = str(uuid.uuid4())

    _audit(request_id, body.get("user_id", "anonymous"), "analyze_requested", f"Analyzing {user_description or image_s3_uri}")

    # 1. Vision & Item Analysis
    vision = _analyze_item(image_s3_uri, user_description)

    item_name = vision.get("item_name", "Item")
    category = vision.get("category", "misc")
    condition = vision.get("condition", "usable")
    confidence = float(vision.get("confidence", 0.8))
    safety_flags = vision.get("safety_flags", [])

    action_summary = vision.get("action_summary")
    custom_reason = vision.get("reason")

    # 2. Decision Policy (SRS Section 10.3)
    # Hazard check
    if any("hazard" in f.lower() or "chemical" in f.lower() for f in safety_flags):
        result = {
            "item_name": item_name,
            "category": category,
            "condition": "unknown",
            "recommended_path": "manual_review",
            "confidence": round(confidence, 2),
            "safety_flags": safety_flags,
            "action_summary": action_summary or "Do not discard in common bins; contact campus safety for certified disposal.",
            "reason": custom_reason or "Potential hazard or unidentified substance detected. Automatic reuse blocked; routed to manual review and safe disposal.",
            "next_action": "contact_moderator",
            "match_ids": [],
            "request_id": request_id,
        }
    # Confidence check
    elif confidence < 0.55:
        result = {
            "item_name": item_name,
            "category": category,
            "condition": condition,
            "recommended_path": "manual_review",
            "confidence": round(confidence, 2),
            "safety_flags": safety_flags,
            "action_summary": action_summary or f"Review {item_name} manually to determine circular path.",
            "reason": custom_reason or f"Identification confidence ({confidence:.2f}) is below safe threshold. Routed to manual review.",
            "next_action": "contact_moderator",
            "match_ids": [],
            "request_id": request_id,
        }
    # Usable / New-like condition -> Reuse & Match
    elif condition in ("usable", "new-like"):
        matches = _search_demand(category, item_name, hostel)
        if matches:
            result = {
                "item_name": item_name,
                "category": category,
                "condition": condition,
                "recommended_path": "reuse",
                "confidence": round(confidence, 2),
                "safety_flags": safety_flags,
                "action_summary": f"🎉 Matched with {len(matches)} student request(s) on campus! Connect with requester to transfer.",
                "reason": custom_reason or f"{item_name} appears in good usable condition. Matched with active student demand on campus.",
                "next_action": "match",
                "match_ids": matches[:2],
                "request_id": request_id,
            }
        else:
            result = {
                "item_name": item_name,
                "category": category,
                "condition": condition,
                "recommended_path": "reuse",
                "confidence": round(confidence, 2),
                "safety_flags": safety_flags,
                "action_summary": action_summary or f"List {item_name} on CampusCycle peer exchange or drop at hostel reuse shelf.",
                "reason": custom_reason or f"{item_name} appears usable. Ready to offer to the campus reuse pool.",
                "next_action": "list",
                "match_ids": [],
                "request_id": request_id,
            }
    # Repairable condition
    elif condition == "repairable-looking":
        matches = _search_demand(category, item_name, hostel)
        result = {
            "item_name": item_name,
            "category": category,
            "condition": condition,
            "recommended_path": "repair",
            "confidence": round(confidence, 2),
            "safety_flags": safety_flags,
            "action_summary": action_summary or f"Take {item_name} to campus MakerSpace/repair workshop for inspection and maintenance.",
            "reason": custom_reason or f"{item_name} appears repairable with minor refurbishment.",
            "next_action": "inspect",
            "match_ids": matches[:2],
            "request_id": request_id,
        }
    # Damaged condition -> Recycle / Compost
    elif condition == "damaged":
        default_act = "Deposit in campus organic wet-waste or compost tumbler." if any(w in item_name.lower() for w in ["peel", "food", "fruit", "organic", "scraps", "vegetable"]) else f"Deposit in designated campus {category} recycling bin."
        result = {
            "item_name": item_name,
            "category": category,
            "condition": condition,
            "recommended_path": "recycle",
            "confidence": round(confidence, 2),
            "safety_flags": safety_flags,
            "action_summary": action_summary or default_act,
            "reason": custom_reason or f"{item_name} cannot be reused in current state. Divert to campus recovery stream.",
            "next_action": "recycle",
            "match_ids": [],
            "request_id": request_id,
        }
    else:
        result = {
            "item_name": item_name,
            "category": category,
            "condition": "unknown",
            "recommended_path": "manual_review",
            "confidence": round(confidence, 2),
            "safety_flags": safety_flags,
            "reason": f"Condition of {item_name} is uncertain from the photo. Escalated to manual review.",
            "next_action": "contact_moderator",
            "match_ids": [],
            "request_id": request_id,
        }

    _audit(request_id, "agent", "analyze_completed", f"Recommendation: {result['recommended_path']}")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(result),
    }
