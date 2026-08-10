import os
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import db
from security import hash_password, verify_password
from seed import INVESTMENTS

import routes_auth
import routes_core
import routes_planning
import routes_market
import routes_extra

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartinvest")

app = FastAPI(title="Smart Investment Recommendation System")


@app.get("/api/")
async def root():
    return {"message": "Smart Investment Recommendation System API", "status": "ok"}


app.include_router(routes_auth.router)
app.include_router(routes_core.router)
app.include_router(routes_planning.router)
app.include_router(routes_market.router)
app.include_router(routes_extra.router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@smartinvest.com")
    password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "name": "System Admin",
            "email": email,
            "password_hash": hash_password(password),
            "role": "admin",
            "onboarded": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})


async def seed_investments():
    count = await db.investments.count_documents({})
    if count == 0:
        docs = []
        for inv in INVESTMENTS:
            d = dict(inv)
            d["id"] = str(uuid.uuid4())
            docs.append(d)
        await db.investments.insert_many(docs)
        logger.info("Seeded %d investments", len(docs))


def write_test_credentials():
    try:
        path = Path("/app/memory/test_credentials.md")
        path.parent.mkdir(parents=True, exist_ok=True)
        content = f"""# Test Credentials

## Admin
- Email: {os.environ.get('ADMIN_EMAIL')}
- Password: {os.environ.get('ADMIN_PASSWORD')}
- Role: admin

## Test User
Register a new user via POST /api/auth/register, or use:
- Email: demo@smartinvest.com
- Password: Demo@12345
(create via register if not present)

## Auth endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

Auth: JWT returned in response body ("token") AND set as httpOnly cookie.
Frontend sends `Authorization: Bearer <token>`.
"""
        path.write_text(content)
    except Exception as e:
        logger.warning("Could not write test_credentials: %s", e)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.financial_goals.create_index("user_id")
    await db.recommendations.create_index("user_id")
    await db.user_holdings.create_index("user_id")
    await seed_admin()
    await seed_investments()
    write_test_credentials()
    logger.info("Startup complete")


@app.on_event("shutdown")
async def shutdown():
    from db import client
    client.close()
