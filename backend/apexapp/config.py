"""Settings read from the environment (see .env.example)."""
import os

_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))

SECRET = os.environ.get("APEX_SECRET", "dev-secret-change-me")
DB_PATH = os.environ.get("APEX_DB", os.path.join(_BACKEND_DIR, "data.db"))
UPLOAD_DIR = os.environ.get("APEX_UPLOAD_DIR", os.path.join(_BACKEND_DIR, "uploads"))
CORS_ORIGINS = os.environ.get("APEX_CORS", "*").split(",")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")
