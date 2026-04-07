from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.models import User, Content, Subscription, UserRole, SubscriptionStatus
from app.schemas.schemas import (
    UserOut, ContentOut, SubscriptionOut, AdminSummary,
    RevenueData, UserGrowthData, SubscriptionDistribution
)
from app.services.auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics/summary", response_model=AdminSummary)
async def admin_summary(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_creators = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.creator))).scalar() or 0
    total_subs_count = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.subscriber))).scalar() or 0
    active_subs = (await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.status == SubscriptionStatus.active,
            Subscription.expiry_date > datetime.utcnow()
        )
    )).scalar() or 0
    total_revenue = (await db.execute(
        select(func.sum(Subscription.amount)).where(Subscription.status == SubscriptionStatus.active)
    )).scalar() or 0.0
    content_count = (await db.execute(select(func.count(Content.id)))).scalar() or 0
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)
    new_week = (await db.execute(select(func.count(User.id)).where(User.created_at >= week_ago))).scalar() or 0
    new_month = (await db.execute(select(func.count(User.id)).where(User.created_at >= month_ago))).scalar() or 0

    return AdminSummary(
        total_users=total_users,
        total_creators=total_creators,
        total_subscribers=total_subs_count,
        active_subscriptions=active_subs,
        total_revenue=total_revenue,
        content_count=content_count,
        new_users_this_week=new_week,
        new_users_this_month=new_month,
    )


@router.get("/analytics/revenue", response_model=List[RevenueData])
async def admin_revenue(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(
        select(Subscription).where(Subscription.status == SubscriptionStatus.active)
        .order_by(Subscription.created_at)
    )
    subs = result.scalars().all()
    revenue_map: dict = {}
    for s in subs:
        date_str = s.created_at.strftime("%Y-%m-%d")
        revenue_map[date_str] = revenue_map.get(date_str, 0) + s.amount
    out = []
    for i in range(29, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        out.append(RevenueData(date=d, revenue=revenue_map.get(d, 0)))
    return out


@router.get("/analytics/users", response_model=List[UserGrowthData])
async def admin_users_growth(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(User).order_by(User.created_at))
    users = result.scalars().all()
    growth_map: dict = {}
    for u in users:
        date_str = u.created_at.strftime("%Y-%m-%d")
        growth_map[date_str] = growth_map.get(date_str, 0) + 1
    out = []
    for i in range(29, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        out.append(UserGrowthData(date=d, users=growth_map.get(d, 0)))
    return out


@router.get("/analytics/subscriptions", response_model=List[SubscriptionDistribution])
async def admin_subscription_dist(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Subscription))
    subs = result.scalars().all()
    dist: dict = {}
    for s in subs:
        dist[s.status.value] = dist.get(s.status.value, 0) + 1
    return [SubscriptionDistribution(status=k, count=v) for k, v in dist.items()]


@router.get("/users", response_model=List[UserOut])
async def admin_get_users(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}/block")
async def admin_block_user(user_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    user.is_blocked = not user.is_blocked
    await db.commit()
    return {"message": f"User {'blocked' if user.is_blocked else 'unblocked'}", "is_blocked": user.is_blocked}


@router.delete("/users/{user_id}", status_code=204)
async def admin_delete_user(user_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.delete(user)
    await db.commit()


@router.get("/content", response_model=List[ContentOut])
async def admin_get_content(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Content).options(selectinload(Content.creator)).order_by(Content.created_at.desc()))
    contents = result.scalars().all()
    out = []
    for c in contents:
        item = ContentOut.model_validate(c)
        if c.creator:
            item.creator_username = c.creator.username
        out.append(item)
    return out


@router.delete("/content/{content_id}", status_code=204)
async def admin_delete_content(content_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Content).where(Content.id == content_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    await db.delete(c)
    await db.commit()


@router.get("/subscriptions", response_model=List[SubscriptionOut])
async def admin_get_subscriptions(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Subscription).order_by(Subscription.created_at.desc()))
    return result.scalars().all()
