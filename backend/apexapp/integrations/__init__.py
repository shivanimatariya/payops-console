"""Outbound integration registry (capabilities 15, 16).

Secrets are read from environment variables and never exposed to the frontend.
Add a service by giving it a base_url and the env var holding its secret, e.g.

    INTEGRATIONS = {
        "hubspot": {"base_url": "https://api.hubapi.com", "secret_env": "HUBSPOT_TOKEN"},
    }

The frontend then calls it by name via POST /api/integrations/hubspot.
"""
import os

INTEGRATIONS = {}


def config(name: str):
    return INTEGRATIONS.get(name)


def secret(cfg: dict):
    return os.environ.get(cfg.get("secret_env", "")) if cfg else None
