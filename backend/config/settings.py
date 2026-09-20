"""
CampusCycle AI — centralised settings.
All runtime configuration lives here; values are read from environment
variables (or .env in local dev via python-dotenv).
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Find and load .env regardless of where python is executed from
for p in [Path.cwd(), Path(__file__).resolve().parent.parent, Path(__file__).resolve().parent.parent.parent]:
    env_candidate = p / ".env"
    if env_candidate.is_file():
        load_dotenv(env_candidate, override=True)
        break
load_dotenv(override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # AWS
    aws_region: str = "us-east-1"
    aws_account_id: str = ""

    # S3
    s3_bucket_name: str = "campuscycle-items-dev"

    # DynamoDB
    dynamo_users_table: str = "CampusCycle_Users"
    dynamo_items_table: str = "CampusCycle_Items"
    dynamo_demand_table: str = "CampusCycle_DemandRequests"
    dynamo_matches_table: str = "CampusCycle_Matches"
    dynamo_tasks_table: str = "CampusCycle_Tasks"
    dynamo_impact_table: str = "CampusCycle_ImpactEvents"
    dynamo_audit_table: str = "CampusCycle_AuditEvents"
    dynamo_config_table: str = "CampusCycle_Config"

    # Bedrock
    bedrock_model_id: str = "amazon.nova-pro-v1:0"
    bedrock_text_model_id: str = "amazon.nova-pro-v1:0"

    # Multimodal Fallback Provider (Google Gemini)
    gemini_api_key: str = ""
    gemini_model_id: str = "gemini-2.5-flash"

    # Agent
    agent_confidence_threshold: float = 0.55
    agent_max_tokens: int = 1024
    agent_temperature: float = 0.2

    # App
    environment: str = "development"
    log_level: str = "DEBUG"


@lru_cache
def get_settings() -> Settings:
    return Settings()
