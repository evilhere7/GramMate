"""
GramMate Backend Services
Production-grade service layer for business logic
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

# ============================================================
# Video Service
# ============================================================

class VideoService:
    """Handles all video-related operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_video(self, user_id: str, title: str, description: str, category: str, tags: List[str]) -> dict:
        """Create new video record."""
        try:
            from app.models import Video
            
            video = Video(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title,
                description=description,
                category=category,
                tags=tags or [],
                status='draft',
                is_monetized=False,
                created_at=datetime.utcnow()
            )
            
            self.db.add(video)
            self.db.commit()
            self.db.refresh(video)
            
            logger.info(f"Created video {video.id} for user {user_id}")
            
            return {
                "id": video.id,
                "status": "draft",
                "title": title,
                "created_at": video.created_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to create video: {str(e)}")
            self.db.rollback()
            raise

    def get_video_by_id(self, video_id: str, viewer_id: Optional[str] = None) -> Optional[dict]:
        """Get video with engagement status for viewer."""
        try:
            from app.models import Video, Like, Save
            from app.cache.redis import cache
            
            # Try cache first
            cache_key = f"video:{video_id}"
            cached = cache.get(cache_key)
            if cached:
                return cached
            
            # Database query with relationships
            video = self.db.query(Video).filter(
                Video.id == video_id,
                Video.status != 'deleted'
            ).first()
            
            if not video:
                return None
            
            video_data = {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "thumbnail_url": video.thumbnail_url,
                "video_url": video.video_url,
                "duration_seconds": video.duration_seconds,
                "view_count": video.view_count,
                "like_count": video.like_count,
                "comment_count": video.comment_count,
                "save_count": video.save_count,
                "earnings": float(video.earnings) if video.earnings else 0.0,
                "category": video.category,
                "tags": video.tags or [],
                "status": video.status,
                "is_monetized": video.is_monetized,
                "creator": {
                    "id": video.creator.id,
                    "display_name": video.creator.display_name,
                    "username": video.creator.username,
                    "avatar_url": video.creator.avatar_url,
                    "is_verified": video.creator.is_verified,
                    "is_creator": video.creator.is_creator,
                },
                "published_at": video.published_at.isoformat() if video.published_at else None,
                "created_at": video.created_at.isoformat()
            }
            
            # Add engagement status if viewer provided
            if viewer_id:
                is_liked = self.db.query(Like).filter(
                    Like.user_id == viewer_id,
                    Like.video_id == video_id
                ).first() is not None
                
                is_saved = self.db.query(Save).filter(
                    Save.user_id == viewer_id,
                    Save.video_id == video_id
                ).first() is not None
                
                video_data["is_liked"] = is_liked
                video_data["is_saved"] = is_saved
            
            # Cache result
            cache.set(cache_key, video_data, ttl=300)
            
            return video_data
            
        except Exception as e:
            logger.error(f"Failed to get video {video_id}: {str(e)}")
            return None

    def get_feed(self, user_id: str, skip: int = 0, limit: int = 20) -> List[dict]:
        """Get personalized feed with infinite scroll."""
        try:
            from app.models import Video, User, followers
            
            # Get user's following list
            following_ids = self.db.query(User.id).join(
                followers,
                followers.c.following_id == User.id
            ).filter(
                followers.c.follower_id == user_id
            ).all()
            
            following_ids = [f[0] for f in following_ids]
            
            # Get videos from following
            videos = self.db.query(Video).filter(
                Video.user_id.in_(following_ids),
                Video.status == 'approved',
                Video.published_at.isnot(None)
            ).order_by(
                desc(Video.published_at)
            ).offset(skip).limit(limit).all()
            
            # Convert to dict
            feed = []
            for video in videos:
                feed.append(self.get_video_by_id(video.id, user_id))
            
            return [v for v in feed if v is not None]
            
        except Exception as e:
            logger.error(f"Failed to get feed for user {user_id}: {str(e)}")
            return []

    def like_video(self, user_id: str, video_id: str) -> bool:
        """Like a video (idempotent)."""
        try:
            from app.models import Video, Like
            from app.cache.redis import cache
            
            # Check if already liked
            existing = self.db.query(Like).filter(
                Like.user_id == user_id,
                Like.video_id == video_id
            ).first()
            
            if existing:
                return False  # Already liked
            
            # Create like
            like = Like(
                id=str(uuid.uuid4()),
                user_id=user_id,
                video_id=video_id
            )
            self.db.add(like)
            
            # Increment video like count
            video = self.db.query(Video).filter(
                Video.id == video_id
            ).first()
            
            if video:
                video.like_count += 1
                
                # Update earnings if monetized
                if video.is_monetized:
                    like_value = 0.0001  # $0.0001 per like
                    video.earnings += like_value
            
            self.db.commit()
            
            # Invalidate cache
            cache.delete(f"video:{video_id}")
            
            logger.info(f"User {user_id} liked video {video_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to like video: {str(e)}")
            self.db.rollback()
            raise

    def get_analytics(self, video_id: str, user_id: str) -> dict:
        """Get video analytics (creator only)."""
        try:
            from app.models import Video
            
            video = self.db.query(Video).filter(
                Video.id == video_id
            ).first()
            
            if not video or video.user_id != user_id:
                raise PermissionError("Not authorized to view analytics")
            
            # Calculate metrics
            watch_through_rate = 0.0
            if video.view_count > 0:
                watch_through_rate = min(100, (video.like_count / video.view_count) * 100)
            
            return {
                "video_id": video_id,
                "views": video.view_count,
                "likes": video.like_count,
                "comments": video.comment_count,
                "shares": video.share_count,
                "saves": video.save_count,
                "earnings": float(video.earnings) if video.earnings else 0.0,
                "engagement_rate": round((video.like_count / max(1, video.view_count)) * 100, 2),
                "watch_through_rate": round(watch_through_rate, 2),
                "published_at": video.published_at.isoformat() if video.published_at else None,
            }
            
        except Exception as e:
            logger.error(f"Failed to get analytics for video {video_id}: {str(e)}")
            raise


# ============================================================
# User Service
# ============================================================

class UserService:
    """Handles user profile and authentication operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_profile(self, user_id: str) -> Optional[dict]:
        """Get user profile."""
        try:
            from app.models import User
            
            user = self.db.query(User).filter(
                User.id == user_id,
                User.deleted_at.is_(None)
            ).first()
            
            if not user:
                return None
            
            return {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "display_name": user.display_name,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "banner_url": user.banner_url,
                "is_verified": user.is_verified,
                "is_creator": user.is_creator,
                "followers_count": user.followers_count,
                "following_count": user.following_count,
                "videos_count": user.videos_count,
                "total_earned": float(user.total_earned) if user.total_earned else 0.0,
                "total_views": user.total_views,
                "created_at": user.created_at.isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Failed to get user profile {user_id}: {str(e)}")
            return None

    def follow_user(self, follower_id: str, following_id: str) -> bool:
        """Follow a user."""
        try:
            from app.models import User, followers
            
            if follower_id == following_id:
                raise ValueError("Cannot follow yourself")
            
            # Check if already following
            existing = self.db.query(followers).filter(
                followers.c.follower_id == follower_id,
                followers.c.following_id == following_id
            ).first()
            
            if existing:
                return False  # Already following
            
            # Create follow relationship
            stmt = followers.insert().values(
                follower_id=follower_id,
                following_id=following_id
            )
            self.db.execute(stmt)
            
            # Update counts
            following_user = self.db.query(User).filter(
                User.id == following_id
            ).first()
            follower_user = self.db.query(User).filter(
                User.id == follower_id
            ).first()
            
            if following_user:
                following_user.followers_count += 1
            if follower_user:
                follower_user.following_count += 1
            
            self.db.commit()
            
            logger.info(f"User {follower_id} followed {following_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to follow user: {str(e)}")
            self.db.rollback()
            raise

    def update_profile(self, user_id: str, update_data: dict) -> dict:
        """Update user profile."""
        try:
            from app.models import User
            
            user = self.db.query(User).filter(
                User.id == user_id
            ).first()
            
            if not user:
                raise ValueError("User not found")
            
            # Update allowed fields
            allowed_fields = [
                'display_name', 'bio', 'avatar_url', 'banner_url'
            ]
            
            for field, value in update_data.items():
                if field in allowed_fields:
                    setattr(user, field, value)
            
            user.updated_at = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Updated profile for user {user_id}")
            
            return self.get_user_profile(user_id)
            
        except Exception as e:
            logger.error(f"Failed to update profile: {str(e)}")
            self.db.rollback()
            raise


# ============================================================
# Wallet Service
# ============================================================

class WalletService:
    """Handles wallet and transaction operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_wallet_balance(self, user_id: str) -> Optional[dict]:
        """Get wallet balance."""
        try:
            from app.models import WalletBalance
            
            wallet = self.db.query(WalletBalance).filter(
                WalletBalance.user_id == user_id
            ).first()
            
            if not wallet:
                return None
            
            return {
                "available_balance": float(wallet.available_balance),
                "pending_balance": float(wallet.pending_balance),
                "locked_balance": float(wallet.locked_balance),
                "total_earned": float(wallet.total_earned),
                "total_withdrawn": float(wallet.total_withdrawn),
                "updated_at": wallet.updated_at.isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Failed to get wallet balance: {str(e)}")
            return None

    def get_transactions(self, user_id: str, limit: int = 50) -> List[dict]:
        """Get transaction history."""
        try:
            from app.models import Transaction
            
            transactions = self.db.query(Transaction).filter(
                Transaction.user_id == user_id
            ).order_by(
                desc(Transaction.created_at)
            ).limit(limit).all()
            
            return [
                {
                    "id": t.id,
                    "type": t.type,
                    "amount": float(t.amount),
                    "status": t.status,
                    "description": t.description,
                    "created_at": t.created_at.isoformat(),
                }
                for t in transactions
            ]
            
        except Exception as e:
            logger.error(f"Failed to get transactions: {str(e)}")
            return []

    def add_earnings(self, user_id: str, amount: float, source: str) -> bool:
        """Add earnings to wallet."""
        try:
            from app.models import WalletBalance, Transaction, User
            
            # Get wallet
            wallet = self.db.query(WalletBalance).filter(
                WalletBalance.user_id == user_id
            ).first()
            
            if not wallet:
                raise ValueError("Wallet not found")
            
            # Add to pending (will be confirmed later)
            wallet.pending_balance += amount
            wallet.total_earned += amount
            
            # Create transaction record
            transaction = Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                type=source,
                amount=amount,
                status='completed'
            )
            self.db.add(transaction)
            
            # Update user total earnings
            user = self.db.query(User).filter(
                User.id == user_id
            ).first()
            if user:
                user.total_earned += amount
            
            self.db.commit()
            
            logger.info(f"Added ${amount} earnings to user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to add earnings: {str(e)}")
            self.db.rollback()
            raise


# ============================================================
# Notification Service
# ============================================================

class NotificationService:
    """Handles notifications."""

    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        body: str,
        action_url: Optional[str] = None
    ) -> dict:
        """Create notification."""
        try:
            from app.models import Notification
            
            notification = Notification(
                id=str(uuid.uuid4()),
                user_id=user_id,
                type=notification_type,
                title=title,
                body=body,
                action_url=action_url,
                is_read=False,
                created_at=datetime.utcnow()
            )
            
            self.db.add(notification)
            self.db.commit()
            
            return {
                "id": notification.id,
                "type": notification_type,
                "title": title,
                "body": body,
                "is_read": False,
                "created_at": notification.created_at.isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            self.db.rollback()
            raise


# Export all services
__all__ = [
    'VideoService',
    'UserService',
    'WalletService',
    'NotificationService',
]
