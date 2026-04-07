from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    creator = "creator"
    subscriber = "subscriber"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"
    pending = "pending"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.subscriber)
    is_active = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    content = relationship("Content", back_populates="creator", foreign_keys="Content.creator_id")
    subscriptions = relationship("Subscription", back_populates="subscriber", foreign_keys="Subscription.subscriber_id")
    comments = relationship("Comment", back_populates="author")


class Content(Base):
    __tablename__ = "content"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    body = Column(Text)
    content_url = Column(String)
    is_premium = Column(Boolean, default=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="content", foreign_keys=[creator_id])
    comments = relationship("Comment", back_populates="content", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey("users.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.pending)
    start_date = Column(DateTime)
    expiry_date = Column(DateTime)
    stripe_transaction_id = Column(String)
    stripe_session_id = Column(String)
    amount = Column(Float, default=9.99)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscriber = relationship("User", back_populates="subscriptions", foreign_keys=[subscriber_id])
    creator = relationship("User", foreign_keys=[creator_id])


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("content.id", ondelete="CASCADE"))
    author_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    content = relationship("Content", back_populates="comments")
    author = relationship("User", back_populates="comments")
