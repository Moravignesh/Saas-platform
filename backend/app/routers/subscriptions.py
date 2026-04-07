from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timedelta
import stripe
from app.database import get_db
from app.models.models import User, Subscription, SubscriptionStatus
from app.schemas.schemas import SubscriptionOut
from app.services.auth import get_current_user
from app.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY
router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/create-session")
async def create_checkout_session(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == creator_id))
    creator = result.scalar_one_or_none()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    # Check already active
    existing = await db.execute(
        select(Subscription).where(
            Subscription.subscriber_id == current_user.id,
            Subscription.creator_id == creator_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.expiry_date > datetime.utcnow()
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already subscribed")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": f"Subscription to {creator.username}"},
                    "unit_amount": 999,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{settings.FRONTEND_URL}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/subscription/cancel",
            metadata={
                "subscriber_id": str(current_user.id),
                "creator_id": str(creator_id)
            },
        )

        # Save pending subscription with session_id
        sub = Subscription(
            subscriber_id=current_user.id,
            creator_id=creator_id,
            status=SubscriptionStatus.pending,
            stripe_session_id=session.id,
            amount=9.99,
        )
        db.add(sub)
        await db.commit()
        return {"url": session.url, "session_id": session.id}

    except Exception as e:
        print(f"Stripe error: {e}")
        # Demo mode fallback
        sub = Subscription(
            subscriber_id=current_user.id,
            creator_id=creator_id,
            status=SubscriptionStatus.active,
            stripe_session_id="demo_session",
            stripe_transaction_id="demo_txn",
            start_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=30),
            amount=9.99,
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
        return {"url": None, "session_id": "demo", "message": "Demo subscription activated"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_session_id == session["id"]
            )
        )
        sub = result.scalar_one_or_none()
        if sub:
            sub.status = SubscriptionStatus.active
            sub.stripe_transaction_id = session.get("payment_intent")
            sub.start_date = datetime.utcnow()
            sub.expiry_date = datetime.utcnow() + timedelta(days=30)
            await db.commit()

    return {"status": "ok"}


@router.post("/verify-session")
async def verify_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Called after Stripe redirects back — activates subscription immediately"""

    # Step 1: Find by session_id in DB
    result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_session_id == session_id,
            Subscription.subscriber_id == current_user.id,
        )
    )
    sub = result.scalar_one_or_none()

    if sub:
        if sub.status != SubscriptionStatus.active:
            sub.status = SubscriptionStatus.active
            sub.start_date = datetime.utcnow()
            sub.expiry_date = datetime.utcnow() + timedelta(days=30)
            sub.stripe_transaction_id = session_id
            await db.commit()
        return {"status": "activated"}

    # Step 2: Try Stripe API to get session details
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            metadata = session.get("metadata", {})
            creator_id = int(metadata.get("creator_id", 0))
            if creator_id:
                # Check existing sub for this creator
                existing_result = await db.execute(
                    select(Subscription).where(
                        Subscription.subscriber_id == current_user.id,
                        Subscription.creator_id == creator_id,
                    )
                )
                existing_sub = existing_result.scalar_one_or_none()

                if existing_sub:
                    existing_sub.status = SubscriptionStatus.active
                    existing_sub.start_date = datetime.utcnow()
                    existing_sub.expiry_date = datetime.utcnow() + timedelta(days=30)
                    existing_sub.stripe_transaction_id = (
                        session.get("payment_intent") or session_id
                    )
                    await db.commit()
                    return {"status": "activated"}
                else:
                    new_sub = Subscription(
                        subscriber_id=current_user.id,
                        creator_id=creator_id,
                        status=SubscriptionStatus.active,
                        stripe_session_id=session_id,
                        stripe_transaction_id=(
                            session.get("payment_intent") or session_id
                        ),
                        start_date=datetime.utcnow(),
                        expiry_date=datetime.utcnow() + timedelta(days=30),
                        amount=9.99,
                    )
                    db.add(new_sub)
                    await db.commit()
                    return {"status": "activated"}
    except Exception as e:
        print(f"Stripe verify error: {e}")

    return {"status": "not_found"}


@router.get("/status", response_model=List[SubscriptionOut])
async def subscription_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Subscription).where(Subscription.subscriber_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/activate-demo")
async def activate_demo_subscription(
    creator_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(Subscription).where(
            Subscription.subscriber_id == current_user.id,
            Subscription.creator_id == creator_id,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        sub.status = SubscriptionStatus.active
        sub.start_date = datetime.utcnow()
        sub.expiry_date = datetime.utcnow() + timedelta(days=30)
        sub.stripe_transaction_id = "demo_txn_" + str(current_user.id)
    else:
        sub = Subscription(
            subscriber_id=current_user.id,
            creator_id=creator_id,
            status=SubscriptionStatus.active,
            stripe_session_id="demo",
            stripe_transaction_id="demo_txn_" + str(current_user.id),
            start_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=30),
            amount=9.99,
        )
        db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub