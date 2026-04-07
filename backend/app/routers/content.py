from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.models import User, Content, Subscription, SubscriptionStatus
from app.schemas.schemas import ContentCreate, ContentUpdate, ContentOut
from app.services.auth import get_current_user, require_creator

router = APIRouter(prefix="/content", tags=["content"])


def content_to_out(c: Content) -> ContentOut:
    d = ContentOut.model_validate(c)
    if c.creator:
        d.creator_username = c.creator.username
    return d


@router.post("", response_model=ContentOut, status_code=201)
async def create_content(
    payload: ContentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creator),
):
    c = Content(**payload.model_dump(), creator_id=current_user.id)
    db.add(c)
    await db.commit()
    await db.refresh(c)
    result = await db.execute(select(Content).where(Content.id == c.id).options(selectinload(Content.creator)))
    return content_to_out(result.scalar_one())


@router.get("", response_model=List[ContentOut])
async def list_content(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Content).options(selectinload(Content.creator)))
    contents = result.scalars().all()

    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.subscriber_id == current_user.id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.expiry_date > datetime.utcnow()
        )
    )
    active_creator_ids = {s.creator_id for s in sub_result.scalars().all()}

    out = []
    for c in contents:
        item = content_to_out(c)
        if c.is_premium and current_user.id != c.creator_id and current_user.role.value != "admin":
            if c.creator_id not in active_creator_ids:
                item.body = None
                item.content_url = None
        out.append(item)
    return out


@router.get("/{content_id}", response_model=ContentOut)
async def get_content(content_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Content).where(Content.id == content_id).options(selectinload(Content.creator))
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")

    if c.is_premium and current_user.id != c.creator_id and current_user.role.value != "admin":
        sub = await db.execute(
            select(Subscription).where(
                Subscription.subscriber_id == current_user.id,
                Subscription.creator_id == c.creator_id,
                Subscription.status == SubscriptionStatus.active,
                Subscription.expiry_date > datetime.utcnow()
            )
        )
        if not sub.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Subscribe to access premium content")

    return content_to_out(c)


@router.put("/{content_id}", response_model=ContentOut)
async def update_content(
    content_id: int,
    payload: ContentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_creator),
):
    result = await db.execute(select(Content).where(Content.id == content_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.creator_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not your content")

    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    c.updated_at = datetime.utcnow()
    await db.commit()

    result = await db.execute(select(Content).where(Content.id == content_id).options(selectinload(Content.creator)))
    return content_to_out(result.scalar_one())


@router.delete("/{content_id}", status_code=204)
async def delete_content(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Content).where(Content.id == content_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")
    if c.creator_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(c)
    await db.commit()
