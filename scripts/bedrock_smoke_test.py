"""
CampusCycle AI — Amazon Bedrock smoke test.
Verifies that the configured Bedrock model is reachable and returns a response.
Run this before starting Day 1 development to confirm credentials and model access.

Usage:
    cd backend
    python ../scripts/bedrock_smoke_test.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

import boto3

REGION = os.getenv("AWS_REGION", "ap-south-1")
MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-pro-v1:0")


def run_smoke_test():
    print(f"\n🔥 Bedrock Smoke Test")
    print(f"   Region : {REGION}")
    print(f"   Model  : {MODEL_ID}")
    print()

    client = boto3.client("bedrock-runtime", region_name=REGION)

    payload = {
        "messages": [
            {
                "role": "user",
                "content": [{"text": "Reply with exactly: CAMPUSCYCLE_OK"}],
            }
        ],
        "inferenceConfig": {"maxTokens": 20, "temperature": 0.0},
    }

    print("   Sending test prompt to Bedrock...")
    try:
        # Try modern Bedrock Converse API first (standard for Nova, Claude, etc.)
        try:
            resp = client.converse(
                modelId=MODEL_ID,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": "Reply with exactly: CAMPUSCYCLE_OK"}],
                    }
                ],
                inferenceConfig={"maxTokens": 20, "temperature": 0.0},
            )
            output_text = resp["output"]["message"]["content"][0]["text"]
        except (AttributeError, Exception) as conv_err:
            # Fallback to invoke_model
            response = client.invoke_model(
                modelId=MODEL_ID,
                body=json.dumps(payload),
                contentType="application/json",
                accept="application/json",
            )
            result = json.loads(response["body"].read())
            output_text = result["output"]["message"]["content"][0]["text"]

        print(f"   Model replied: '{output_text.strip()}'")

        if "CAMPUSCYCLE_OK" in output_text:
            print("\n✅ Bedrock smoke test PASSED. Model is reachable and responding.")
            return True
        else:
            print("\n⚠️  Model responded but with unexpected content — check model ID.")
            return False

    except client.exceptions.ValidationException as e:
        print(f"\n❌ Validation error: {e}")
        if "Operation not allowed" in str(e):
            print("\nℹ️  Notice: 'Operation not allowed' on new AWS accounts means:")
            print("   1. AWS account verification is still completing (typically takes up to 2 hours).")
            print("   2. Or the model access requires a moment to propagate in us-east-1.")
            print("   Check AWS Console -> Bedrock -> Playgrounds to verify once it clears!")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Bedrock call failed: {e}")
        print("   → Verify AWS credentials, region, and Bedrock model access.")
        sys.exit(1)


if __name__ == "__main__":
    run_smoke_test()
