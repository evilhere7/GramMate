"""
GramMate Backend - FastAPI Application
Main entry point for all services
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Optional
from datetime import datetime, timedelta
import uuid

# Database
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    ARRAY,
    ForeignKey,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Pydantic models
from pydantic import BaseModel, EmailStr, Field

# Security
from passlib.context import CryptContext
from jose import JWTError, jwt

# Third-party integrations
import stripe
try:
    from plaid import ApiClient
    from plaid.api.plaid_api import PlaidApi
    from plaid.model.client_name import ClientName
    from plaid.model.country_code import CountryCode
    from plaid.model.language import Language
except Exception:
    ApiClient = None
    PlaidApi = None
    ClientName = None
    CountryCode = None
    Language = None
    logging.getLogger(__name__).warning(
        "Plaid SDK not available; Plaid features disabled in this environment")

# Config
import os
from dotenv import load_dotenv

load_dotenv()

# ====== LOGGING ======
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ====== CONFIG ======
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/grammate")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "sk_test_dummy")
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID", "dummy")
PLAID_SECRET = os.getenv("PLAID_SECRET", "dummy")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")

stripe.api_key = STRIPE_API_KEY

# ====== DATABASE ======
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ====== MODELS ======


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    email_verified = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    country_code = Column(String(2), nullable=True)
    is_creator = Column(Boolean, default=False)
    # 0=unverified, 1=email, 2=KYC, 3=brand
    creator_verified_tier = Column(Integer, default=0)
    is_banned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    category = Column(String(50), nullable=True)
    hashtags = Column(ARRAY(String), nullable=True)
    # processing, published, flagged, removed
    status = Column(String(20), default="processing")
    is_monetized = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow)


class Engagement(Base):
    __tablename__ = "engagements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    # view, like, comment, share
    engagement_type = Column(String(20), nullable=False)
    watch_duration_seconds = Column(Integer, nullable=True)
    is_watch_complete = Column(Boolean, default=False)
    reward_earned_cents = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String,
        ForeignKey("users.id"),
        unique=True,
        nullable=False)
    balance_cents = Column(Integer, default=0)
    currency = Column(String(3), default="USD")
    pending_payout_cents = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow)


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    # earn, withdraw, refund, chargeback
    transaction_type = Column(String(20), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default="USD")
    # pending, completed, failed, disputed
    status = Column(String(20), default="pending")
    payment_method = Column(String(50), nullable=True)
    external_reference_id = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    payout_period_start = Column(DateTime, nullable=False)
    payout_period_end = Column(DateTime, nullable=False)
    total_views = Column(Integer, default=0)
    viewer_contribution_cents = Column(Integer, default=0)
    ad_revenue_cents = Column(Integer, default=0)
    brand_deal_revenue_cents = Column(Integer, default=0)
    subscription_revenue_cents = Column(Integer, default=0)
    total_payout_cents = Column(Integer, default=0)
    # pending, processing, completed, failed
    status = Column(String(20), default="pending")
    payout_method = Column(String(50), nullable=True)
    external_payout_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

# ====== PYDANTIC SCHEMAS ======


class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: str = Field(..., min_length=3, max_length=50)
    country_code: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    is_creator: bool
    creator_verified_tier: int
    created_at: datetime


class VideoUpload(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    hashtags: Optional[list[str]] = None
    monetization_enabled: bool = True


class VideoResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    description: Optional[str]
    video_url: str
    thumbnail_url: Optional[str]
    duration_seconds: Optional[int]
    category: Optional[str]
    status: str
    view_count: int
    like_count: int
    comment_count: int
    engagement_rate: float
    created_at: datetime


class EngagementRequest(BaseModel):
    watch_duration_seconds: Optional[int] = None
    completed: bool = False


class WalletResponse(BaseModel):
    balance_cents: int
    currency: str
    pending_payout_cents: int
    created_at: datetime


class WithdrawalRequest(BaseModel):
    amount_cents: int = Field(..., gt=100)
    method: str  # stripe_ach or blockchain
    recipient_id: str


# ====== UTILITY FUNCTIONS ======
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    # bcrypt has a 72-byte input limit — truncate to avoid errors in some envs
    if isinstance(password, str):
        pw = password.encode("utf-8")[:72].decode("utf-8", "ignore")
    else:
        pw = password
    return pwd_context.hash(pw)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(plain_password, str):
        pw = plain_password.encode("utf-8")[:72].decode("utf-8", "ignore")
    else:
        pw = plain_password
    return pwd_context.verify(pw, hashed_password)


def create_access_token(
        data: dict,
        expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Extract user from JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def calculate_engagement_reward(
        watch_duration_sec: int,
        video_duration_sec: int,
        country_code: str,
        is_verified: bool) -> int:
    """
    Calculate reward in cents for a view
    Returns reward amount in cents
    """
    # Base reward
    watch_rate = (
        watch_duration_sec /
        video_duration_sec) if video_duration_sec > 0 else 0

    if watch_rate < 0.5:
        base_reward = 0.005  # $0.005
    else:
        base_reward = 0.015  # $0.015

    # Country multiplier
    country_multipliers = {
        "US": 1.2, "CA": 1.1, "GB": 1.1, "AU": 1.1,
        "IN": 0.5, "BR": 0.7, "MX": 0.6
    }
    country_mult = country_multipliers.get(country_code, 0.8)

    # Verification bonus
    verify_mult = 1.2 if is_verified else 1.0

    total_reward = base_reward * country_mult * verify_mult
    return int(total_reward * 100)  # Convert to cents

# ====== STARTUP/SHUTDOWN ======


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting GramMate API...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    yield
    # Shutdown
    logger.info("Shutting down GramMate API...")

app = FastAPI(
    title="GramMate API",
    description="Creator Economy Platform with Transparent Monetization",
    version="1.0.0",
    lifespan=lifespan
)

# ====== MIDDLEWARE ======
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== ADVANCED FEATURES ROUTERS ======
try:
    from .advanced_features import (
        router as analytics_router,
        payouts_router,
        fraud_router,
        moderation_router,
    )

    app.include_router(analytics_router)
    app.include_router(payouts_router)
    app.include_router(fraud_router)
    app.include_router(moderation_router)
except Exception as e:
    logger.warning(f"Advanced features not mounted: {e}")

# ====== HEALTH CHECK ======


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "grammate-api"
    }

# ====== AUTH ENDPOINTS ======


@app.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """Create new user account"""
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    existing = db.query(User).filter(
        User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username taken")

    # Create user
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        country_code=user_data.country_code
    )
    db.add(user)

    # Create wallet
    wallet = Wallet(id=str(uuid.uuid4()), user_id=user_id)
    db.add(wallet)

    db.commit()
    db.refresh(user)

    # Generate token
    access_token = create_access_token(data={"sub": user_id})

    logger.info(f"User signed up: {user_data.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id
    }


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.id})
    logger.info(f"User logged in: {user_data.email}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id
    }


@app.post("/auth/verify-email")
async def verify_email(current_user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Mark email as verified (simplified - no verification code needed for MVP)"""
    current_user.email_verified = True
    current_user.creator_verified_tier = max(
        1, current_user.creator_verified_tier)
    db.commit()

    logger.info(f"Email verified: {current_user.email}")
    return {"success": True, "message": "Email verified"}

# ====== USER ENDPOINTS ======


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/profile/update")
async def update_profile(
    display_name: Optional[str] = None,
    bio: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if display_name:
        current_user.display_name = display_name
    if bio:
        current_user.bio = bio

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {"success": True, "user": current_user}

# ====== VIDEO ENDPOINTS ======


@app.post("/videos/upload", response_model=dict)
async def upload_video(
    video_data: VideoUpload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload new video"""
    if not current_user.is_creator:
        current_user.is_creator = True
        db.commit()

    video_id = str(uuid.uuid4())
    video = Video(
        id=video_id,
        creator_id=current_user.id,
        title=video_data.title,
        description=video_data.description,
        category=video_data.category,
        hashtags=video_data.hashtags,
        video_url=f"s3://grammate-videos/{video_id}.mp4",
        is_monetized=video_data.monetization_enabled,
        status="processing"
    )
    db.add(video)
    db.commit()

    logger.info(f"Video uploading: {video_id} by {current_user.id}")
    return {
        "video_id": video_id,
        "status": "processing",
        "message": "Video queued for transcoding"
    }


@app.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, db: Session = Depends(get_db)):
    """Get video details"""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    engagement_rate = (
        (video.like_count +
         video.comment_count +
         video.share_count) /
        video.view_count if video.view_count > 0 else 0)

    return {
        **video.__dict__,
        "engagement_rate": engagement_rate
    }


@app.get("/feed")
async def get_feed(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized feed (MVP: chronological + trending)"""
    # Simple chronological feed for MVP (no ML yet)
    videos = (
        db.query(Video)
        .filter(Video.status == "published", Video.is_monetized)
        .order_by(Video.published_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    video_list = []
    for video in videos:
        engagement_rate = (
            (video.like_count +
             video.comment_count +
             video.share_count) /
            video.view_count if video.view_count > 0 else 0)
        video_list.append({
            "id": video.id,
            "title": video.title,
            "video_url": video.video_url,
            "thumbnail_url": video.thumbnail_url,
            "view_count": video.view_count,
            "like_count": video.like_count,
            "engagement_rate": engagement_rate,
            "creator_id": video.creator_id
        })

    return {
        "videos": video_list,
        "offset": offset + limit,
        "has_more": len(videos) == limit
    }

# ====== ENGAGEMENT ENDPOINTS ======


@app.post("/engagements/{video_id}/view")
async def track_view(
    video_id: str,
    watch_data: EngagementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track video view and calculate reward"""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Create engagement record
    engagement_id = str(uuid.uuid4())
    reward_cents = calculate_engagement_reward(
        watch_data.watch_duration_seconds or video.duration_seconds or 120,
        video.duration_seconds or 120,
        current_user.country_code or "US",
        current_user.email_verified
    )

    engagement = Engagement(
        id=engagement_id,
        video_id=video_id,
        user_id=current_user.id,
        engagement_type="view",
        watch_duration_seconds=watch_data.watch_duration_seconds,
        is_watch_complete=watch_data.completed,
        reward_earned_cents=reward_cents
    )
    db.add(engagement)

    # Increment view count
    video.view_count += 1

    # Add reward to user wallet
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    wallet.balance_cents += reward_cents

    # Log transaction
    transaction = WalletTransaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        transaction_type="earn",
        amount_cents=reward_cents,
        status="completed"
    )
    db.add(transaction)
    db.commit()

    logger.info(f"View tracked: {video_id} by {current_user.id}, earned {reward_cents}¢")

    return {
        "reward_earned_cents": reward_cents,
        "engagement_id": engagement_id
    }


@app.post("/engagements/{video_id}/like")
async def like_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a video and earn reward"""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Check if already liked
    existing = db.query(Engagement).filter(
        Engagement.video_id == video_id,
        Engagement.user_id == current_user.id,
        Engagement.engagement_type == "like"
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already liked")

    # Add like
    reward_cents = 100  # $0.01 for like

    engagement = Engagement(
        id=str(uuid.uuid4()),
        video_id=video_id,
        user_id=current_user.id,
        engagement_type="like",
        reward_earned_cents=reward_cents
    )
    db.add(engagement)

    video.like_count += 1

    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    wallet.balance_cents += reward_cents

    transaction = WalletTransaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        transaction_type="earn",
        amount_cents=reward_cents,
        status="completed"
    )
    db.add(transaction)
    db.commit()

    return {
        "success": True,
        "reward_earned_cents": reward_cents,
        "total_likes": video.like_count
    }

# ====== WALLET ENDPOINTS ======


@app.get("/wallet", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user wallet balance"""
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    return wallet


@app.post("/wallet/withdraw")
async def withdraw(
    withdrawal: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Withdraw earnings"""
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()

    if wallet.balance_cents < withdrawal.amount_cents:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    if not current_user.email_verified:
        raise HTTPException(status_code=400, detail="Email must be verified")

    # Create withdrawal transaction
    transaction_id = str(uuid.uuid4())

    # In production: call Stripe API here
    # For MVP: just mark as pending

    transaction = WalletTransaction(
        id=transaction_id,
        user_id=current_user.id,
        transaction_type="withdraw",
        amount_cents=withdrawal.amount_cents,
        payment_method=withdrawal.method,
        status="pending"
    )
    db.add(transaction)

    # Deduct from balance
    wallet.balance_cents -= withdrawal.amount_cents
    db.commit()

    logger.info(
        f"Withdrawal initiated: {transaction_id} for {
            withdrawal.amount_cents}¢")

    return {
        "transaction_id": transaction_id,
        "status": "pending",
        "amount_cents": withdrawal.amount_cents,
        "expected_arrival": (datetime.utcnow() + timedelta(days=2)).isoformat()
    }


@app.get("/wallet/transactions")
async def get_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history"""
    transactions = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.user_id == current_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "transactions": [
            {
                "id": t.id,
                "type": t.transaction_type,
                "amount_cents": t.amount_cents,
                "status": t.status,
                "created_at": t.created_at
            }
            for t in transactions
        ],
        "count": len(transactions)
    }

# ====== CREATOR ENDPOINTS ======


@app.get("/creators/{creator_id}")
async def get_creator_profile(creator_id: str, db: Session = Depends(get_db)):
    """Get creator profile with stats"""
    creator = db.query(User).filter(
        User.id == creator_id,
        User.is_creator).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    videos = db.query(Video).filter(Video.creator_id == creator_id).all()

    total_views = sum(v.view_count for v in videos)
    total_likes = sum(v.like_count for v in videos)

    engagement_rate = (
        (total_likes / total_views) if total_views > 0 else 0
    )

    return {
        "id": creator.id,
        "username": creator.username,
        "display_name": creator.display_name,
        "avatar_url": creator.avatar_url,
        "bio": creator.bio,
        "is_verified": creator.creator_verified_tier > 0,
        "verified_tier": creator.creator_verified_tier,
        "total_videos": len(videos),
        "total_views": total_views,
        "engagement_rate": engagement_rate
    }


@app.get("/creators/{creator_id}/videos")
async def get_creator_videos(
    creator_id: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get creator's videos"""
    videos = (
        db.query(Video)
        .filter(Video.creator_id == creator_id, Video.status == "published")
        .order_by(Video.published_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "videos": [
            {
                "id": v.id,
                "title": v.title,
                "video_url": v.video_url,
                "view_count": v.view_count,
                "published_at": v.published_at
            }
            for v in videos
        ]
    }

# ====== MAIN ======
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
