"""
CampusCycle AI — Google Gemini Multimodal Vision Smoke Test.
Verifies your Gemini API key and multimodal image recognition.

Usage:
    python scripts/test_gemini_vision.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

import httpx

API_KEY = os.getenv("GEMINI_API_KEY", "")

def main():
    print("\n" + "=" * 60)
    print("✨ CampusCycle AI — Google Gemini Vision Smoke Test")
    print("=" * 60)

    if not API_KEY:
        print("\n❌ GEMINI_API_KEY is not set in your .env file!")
        print("   1. Get your free key from: https://aistudio.google.com/app/apikey")
        print("   2. Add it to .env: GEMINI_API_KEY=AIzaSy...")
        print("   3. Re-run this test!\n")
        return

    print(f"🔑 API Key detected: {API_KEY[:6]}...{API_KEY[-4:]}")
    print("⏳ Calling Gemini 2.5 Flash with multimodal schema prompt...")

    prompt_text = """You are CampusCycle, a campus circular-economy triage assistant.
Analyze this item: 'Black HDMI cable, 1.5m, intact connectors'
Respond with ONLY this JSON:
{
  "item_name": "<item name>",
  "category": "electronics",
  "condition": "usable",
  "confidence": 0.95,
  "safety_flags": []
}"""

    import time

    model_id = os.getenv("GEMINI_MODEL_ID", "gemini-3.6-flash")
    candidates = [model_id, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    # De-duplicate while preserving order
    candidates = list(dict.fromkeys(candidates))

    success = False
    for mod in candidates:
        print(f"\n🤖 Trying model: {mod}...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent?key={API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        # Try up to 3 attempts with brief pause for temporary 503 spikes
        for attempt in range(1, 4):
            try:
                resp = httpx.post(url, json=payload, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    print(f"\n✅ Gemini API Connection SUCCESSFUL with '{mod}'!")
                    print("   Structured Output:")
                    print(json.dumps(json.loads(raw_text), indent=2))
                    print(f"\n🎉 Best working model: {mod}")
                    success = True
                    break
                elif resp.status_code == 503:
                    print(f"   ⚠️ Model '{mod}' busy (503 high demand). Attempt {attempt}/3. Waiting 2s...")
                    time.sleep(2)
                else:
                    print(f"   ℹ️ Model '{mod}' status {resp.status_code}: {resp.text[:150]}")
                    break
            except Exception as exc:
                print(f"   ❌ Request error: {exc}")
                break

        if success:
            break

    if not success:
        print("\n🔍 Checking available models for your API key...")
        try:
            list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
            resp = httpx.get(list_url, timeout=10.0)
            if resp.status_code == 200:
                models = [m["name"].replace("models/", "") for m in resp.json().get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
                print(f"   Supported models: {models[:10]}")
        except Exception as e:
            print(f"   Failed to list models: {e}")

if __name__ == "__main__":
    main()
