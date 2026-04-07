from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import create_tables
from app.routers import auth, content, subscriptions, dashboard, admin, comments
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await seed_admin()
    yield


async def seed_admin():
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.models import User, UserRole
    from app.services.auth import hash_password

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@platform.com"))
        if not result.scalar_one_or_none():
            admin_user = User(
                email="admin@platform.com",
                username="admin",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.admin,
            )
            db.add(admin_user)
            await db.commit()
            print("✅ Admin user created: admin@platform.com / Admin@123")


app = FastAPI(
    title="Subscription Content Platform API",
    description="Full-stack SaaS platform with Admin Dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

# allow_origins=["*"] fixes Swagger UI CORS / Failed to fetch
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(content.router)
app.include_router(subscriptions.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(comments.router)


@app.get("/")
async def root():
    return {"message": "Subscription Content Platform API", "docs": "/docs"}
