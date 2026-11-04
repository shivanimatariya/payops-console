"""ApexStudio-generated FastAPI application."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import ai, auth, entities, events, files, integrations, payments
from .config import CORS_ORIGINS
from .database import connection as db

APP_NAME = 'PayOps Console'

app = FastAPI(title=APP_NAME)

# Set only when ApexStudio runs this backend for Live Preview: every request must then carry
# the key, so nothing but the studio's proxy can talk to it. Unset (an exported app): no check.
_RUNTIME_KEY = os.environ.get('APEX_RUNTIME_KEY', '')
if _RUNTIME_KEY:
    import hmac as _hmac
    from fastapi import Request
    from fastapi.responses import JSONResponse

    @app.middleware('http')
    async def _require_runtime_key(request: Request, call_next):
        if not _hmac.compare_digest(request.headers.get('x-apex-runtime-key', ''), _RUNTIME_KEY):
            return JSONResponse({'detail': 'Forbidden'}, status_code=403)
        return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

db.init_db()

for _r in (auth.router, entities.router, files.router, events.router, ai.router,
           integrations.router, payments.router):
    app.include_router(_r)


@app.get('/health')
def health():
    return {'status': 'ok', 'app': APP_NAME}
