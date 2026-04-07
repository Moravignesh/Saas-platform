from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from app.database import get_db
from app.models.models import User, Content, Subscription, SubscriptionStatus
from app.schemas.schemas import CreatorDashboard, SubscriberDashboard, ContentOut, SubscriptionOut
from app.services.auth import get_current_user, require_creator

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/creator", response_model=CreatorDashboard)
async def creator_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creator),
):
    total_subscribers = (await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.creator_id == current_user.id,
            Subscription.status == SubscriptionStatus.active
        )
    )).scalar() or 0

    total_revenue = (await db.execute(
        select(func.sum(Subscription.amount)).where(
            Subscription.creator_id == current_user.id,
            Subscription.status == SubscriptionStatus.active
        )
    )).scalar() or 0.0

    content_count = (await db.execute(
        select(func.count(Content.id)).where(Content.creator_id == current_user.id)
    )).scalar() or 0

    recent = await db.execute(
        select(Subscription).where(Subscription.creator_id == current_user.id)
        .order_by(Subscription.created_at.desc()).limit(5)
    )
    recent_subs = recent.scalars().all()

    return CreatorDashboard(
        total_subscribers=total_subscribers,
        total_revenue=total_revenue,
        content_count=content_count,
        recent_subscriptions=[SubscriptionOut.model_validate(s) for s in recent_subs],
    )


@router.get("/user", response_model=SubscriberDashboard)
async def subscriber_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active_subs_result = await db.execute(
        select(Subscription).where(
            Subscription.subscriber_id == current_user.id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.expiry_date > datetime.utcnow()
        )
    )
    active_subs = active_subs_result.scalars().all()
    active_creator_ids = {s.creator_id for s in active_subs}

    content_result = await db.execute(
        select(Content).options(selectinload(Content.creator))
    )
    all_content = content_result.scalars().all()
    accessible = [c for c in all_content if not c.is_premium or c.creator_id in active_creator_ids]

    billing_result = await db.execute(
        select(Subscription).where(Subscription.subscriber_id == current_user.id)
        .order_by(Subscription.created_at.desc())
    )
    billing = billing_result.scalars().all()

    def c_to_out(c):
        d = ContentOut.model_validate(c)
        if c.creator:
            d.creator_username = c.creator.username
        return d

    return SubscriberDashboard(
        active_subscriptions=[SubscriptionOut.model_validate(s) for s in active_subs],
        accessible_content=[c_to_out(c) for c in accessible],
        billing_history=[SubscriptionOut.model_validate(s) for s in billing],
    )
