"""Generic server-side proxy for configured integrations (capabilities 15, 16)."""
import json
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ... import integrations, rbac

router = APIRouter(prefix="/api/integrations")


def _form_fields(value, prefix=""):
    """Nested data as form fields, Stripe style: {"a": {"b": 1}, "c": [2]} -> {"a[b]": "1", "c[0]": "2"}."""
    out = {}
    items = value.items() if isinstance(value, dict) else enumerate(value)
    for k, v in items:
        key = "%s[%s]" % (prefix, k) if prefix else str(k)
        if isinstance(v, (dict, list)):
            out.update(_form_fields(v, key))
        elif v is not None:
            out[key] = ("true" if v else "false") if isinstance(v, bool) else str(v)
    return out


def _mcp_answer(r):
    """An MCP reply: plain JSON, or the first `data:` line of an event stream."""
    try:
        return r.json()
    except ValueError:
        for line in r.text.splitlines():
            if line.startswith("data:"):
                try:
                    return json.loads(line[5:].strip())
                except ValueError:
                    pass
    return {}


def _call_mcp(name, cfg, body):
    """Run a tool on an MCP server: initialize -> notifications/initialized -> tools/call
    (or tools/list). Answers like the studio's connector gateway: {status, data, source, server, tool}."""
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
    token = os.environ.get(cfg.get("secret_env", ""), "")
    if token and cfg.get("auth") == "bearer":
        headers["Authorization"] = "Bearer " + token
    elif token and cfg.get("auth") == "header":
        headers["X-Api-Key"] = token
    try:
        headers.update(json.loads(os.environ.get(cfg.get("headers_env", ""), "") or "{}"))
    except ValueError:
        pass
    tool = body.path.strip().strip("/")
    if tool in ("tools/list", "list_tools", "tools", "list"):
        request = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
    else:
        request = {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {
            "name": tool, "arguments": body.json_body if isinstance(body.json_body, dict) else {}}}
    try:
        with httpx.Client(timeout=30, follow_redirects=True) as client:
            init = client.post(cfg["url"], headers=headers, json={
                "jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
                    "protocolVersion": "2024-11-05", "capabilities": {},
                    "clientInfo": {"name": "apexapp", "version": "1.0"}}})
            if init.status_code != 200:
                raise HTTPException(status_code=502, detail="MCP server '%s' initialization failed (HTTP %s)."
                                    % (name, init.status_code))
            if init.headers.get("mcp-session-id"):
                headers["Mcp-Session-Id"] = init.headers["mcp-session-id"]
            client.post(cfg["url"], headers=headers, json={"jsonrpc": "2.0", "method": "notifications/initialized"})
            r = client.post(cfg["url"], headers=headers, json=request)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="MCP server '%s' unreachable: %s" % (name, exc))
    answer = _mcp_answer(r)
    if isinstance(answer, dict) and "error" in answer:
        err = answer["error"]
        raise HTTPException(status_code=502, detail="MCP server '%s' returned an error: %s"
                            % (name, err.get("message", err) if isinstance(err, dict) else err))
    result = answer.get("result", answer) if isinstance(answer, dict) else answer
    if isinstance(result, dict) and isinstance(result.get("content"), list):
        texts = [c.get("text", "") for c in result["content"] if isinstance(c, dict) and c.get("type") == "text"]
        if texts:
            result["text"] = "\n".join(texts)
        if result.get("isError"):
            raise HTTPException(status_code=400, detail="MCP server '%s' tool '%s' failed: %s"
                                % (name, tool, result.get("text", "")))
    return {"status": r.status_code, "data": result, "source": "mcp", "server": name, "tool": tool}


class ProxyRequest(BaseModel):
    path: str = ""
    method: str = "GET"
    params: dict | None = None
    json_body: dict | None = None


@router.get("")
def list_integrations(user=Depends(rbac.current_user)):
    return {"integrations": list(integrations.INTEGRATIONS.keys())}


@router.get("/public/maps-key")
def public_maps_key():
    """
    Unauthenticated: returns ONLY the Google Maps JS key (if configured). This key is
    designed to be used client-side (restricted by HTTP referrer in Google Cloud
    Console), unlike every other integration secret which stays server-side only.
    """
    return {"key": os.environ.get("GOOGLE_MAPS_API_KEY", "")}


@router.post("/{name}")
def call(name: str, body: ProxyRequest, user=Depends(rbac.current_user)):
    cfg = integrations.config(name)
    if not cfg:
        raise HTTPException(status_code=404, detail="Unknown integration: " + name)
    if cfg.get("type") == "mcp":
        return _call_mcp(name, cfg, body)
    headers = dict(cfg.get("extra_headers") or {})
    params = dict(body.params or {})
    basic = None
    sec = integrations.secret(cfg)
    auth = cfg.get("auth", "bearer")
    if sec and auth == "query":
        params[cfg.get("param", "api_key")] = sec
    elif sec and auth in ("bearer", "header"):
        headers[cfg.get("header", "Authorization")] = cfg.get("prefix", "Bearer ") + sec
    elif sec and auth == "basic":
        basic = (os.environ.get(cfg.get("username_env", ""), ""), sec)
    url = cfg["base_url"].rstrip("/") + "/" + body.path.lstrip("/")
    try:
        # Some APIs (Stripe, Twilio) take form-encoded bodies: send json_body as form fields.
        as_form = cfg.get("body") == "form" and isinstance(body.json_body, dict)
        r = httpx.request(body.method, url, params=params, auth=basic, headers=headers, timeout=30,
                          json=None if as_form else body.json_body,
                          data=_form_fields(body.json_body) if as_form else None)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Integration call failed: " + str(exc))
    ctype = r.headers.get("content-type", "")
    if ctype.startswith("application/json"):
        return r.json()
    return {"status": r.status_code, "text": r.text}
