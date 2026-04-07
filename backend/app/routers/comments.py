from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models.models import User, Content, Comment
from app.schemas.schemas import CommentCreate, CommentOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/content", tags=["comments"])


@router.post("/{content_id}/comments", response_model=CommentOut, status_code=201)
async def add_comment(
    content_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Content).where(Content.id == content_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Content not found")

    comment = Comment(content_id=content_id, author_id=current_user.id, text=payload.text)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    out = CommentOut.model_validate(comment)
    out.author_username = current_user.username
    return out


@router.get("/{content_id}/comments", response_model=List[CommentOut])
async def get_comments(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Comment).where(Comment.content_id == content_id)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    out = []
    for c in comments:
        item = CommentOut.model_validate(c)
        if c.author:
            item.author_username = c.author.username
        out.append(item)
    return out
