from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, SubscriptionStatus


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: UserRole = UserRole.subscriber


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    is_active: bool
    is_blocked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ContentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    body: Optional[str] = None
    content_url: Optional[str] = None
    is_premium: bool = False


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    body: Optional[str] = None
    content_url: Optional[str] = None
    is_premium: Optional[bool] = None


class ContentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    body: Optional[str]
    content_url: Optional[str]
    is_premium: bool
    creator_id: int
    created_at: datetime
    updated_at: datetime
    creator_username: Optional[str] = None

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    id: int
    subscriber_id: int
    creator_id: int
    status: SubscriptionStatus
    start_date: Optional[datetime]
    expiry_date: Optional[datetime]
    stripe_transaction_id: Optional[str]
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    text: str


class CommentOut(BaseModel):
    id: int
    content_id: int
    author_id: int
    text: str
    created_at: datetime
    author_username: Optional[str] = None

    class Config:
        from_attributes = True


class CreatorDashboard(BaseModel):
    total_subscribers: int
    total_revenue: float
    content_count: int
    recent_subscriptions: List[SubscriptionOut]


class SubscriberDashboard(BaseModel):
    active_subscriptions: List[SubscriptionOut]
    accessible_content: List[ContentOut]
    billing_history: List[SubscriptionOut]


class AdminSummary(BaseModel):
    total_users: int
    total_creators: int
    total_subscribers: int
    active_subscriptions: int
    total_revenue: float
    content_count: int
    new_users_this_week: int
    new_users_this_month: int


class RevenueData(BaseModel):
    date: str
    revenue: float


class UserGrowthData(BaseModel):
    date: str
    users: int


class SubscriptionDistribution(BaseModel):
    status: str
    count: int
