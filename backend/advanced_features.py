"""
GramMate Backend - Advanced Features
Includes rate limiting, fraud detection, payout processing, and analytics
"""

from os import getenv
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict
import logging
import time
from collections import defaultdict

logger = logging.getLogger(__name__)

# ====== RATE LIMITING ======


class RateLimiter:
    """In-memory rate limiter for API endpoints"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    def is_allowed(self, identifier: str) -> bool:
        """Check if request is within rate limit"""
        now = time.time()
        minute_ago = now - 60

        # Clean old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > minute_ago
        ]

        if len(self.requests[identifier]) >= self.requests_per_minute:
            return False

        self.requests[identifier].append(now)
        return True

    def get_remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        now = time.time()
        minute_ago = now - 60
        requests = [
            req_time for req_time in self.requests[identifier]
            if req_time > minute_ago
        ]
        return max(0, self.requests_per_minute - len(requests))


# Global rate limiter instances
api_rate_limiter = RateLimiter(requests_per_minute=100)
auth_rate_limiter = RateLimiter(requests_per_minute=5)


async def check_rate_limit(request: Request, db: Session = None):
    """Dependency for checking API rate limits"""
    client_ip = request.client.host if request.client else "unknown"

    if not api_rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    return client_ip


async def check_auth_rate_limit(request: Request):
    """Dependency for checking auth endpoint rate limits"""
    client_ip = request.client.host if request.client else "unknown"

    if not auth_rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429,
                            detail="Too many authentication attempts")

    return client_ip

# ====== FRAUD DETECTION ======


class FraudDetector:
    """Simple fraud detection system"""

    def __init__(self):
        self.suspicious_patterns = {
            'rapid_views': 50,  # Views per minute
            'bot_like_engagement': 0.95,  # 95% like rate suggests bots
            'unusual_watch_duration': 0.05,  # 5% of duration = skip button
        }

    def check_view_behaviour(self, user_id: str, video_id: str,
                             watch_duration: int, video_duration: int) -> Dict:
        """Analyze view behavior for fraud signals"""
        score = 0
        risk_factors = []

        # Check watch rate
        if video_duration > 0:
            watch_rate = watch_duration / video_duration
            if watch_rate < self.suspicious_patterns['unusual_watch_duration']:
                score += 25
                risk_factors.append(
                    "Unusually short watch duration (skip suspected)")
            elif watch_rate > 0.99:
                score += 5
                risk_factors.append(
                    "Perfect watch completion (suspicious pattern)")

        return {
            'risk_score': score,
            'risk_factors': risk_factors,
            'is_suspicious': score >= 50
        }

    def check_engagement_pattern(self, user_id: str, like_count: int,
                                 view_count: int) -> Dict:
        """Check engagement pattern for bot activity"""
        score = 0
        risk_factors = []

        if view_count > 0:
            engagement_rate = like_count / view_count
            threshold = self.suspicious_patterns['bot_like_engagement']
            if engagement_rate > threshold:
                score += 50
                risk_factors.append(
                    "Suspiciously high engagement rate (bot activity)")

        return {
            'risk_score': score,
            'risk_factors': risk_factors,
            'is_suspicious': score >= 50
        }


# Global fraud detector
fraud_detector = FraudDetector()

# ====== PAYOUT PROCESSING ======


class PayoutProcessor:
    """Process creator payouts"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.payout_threshold = 10  # Minimum $10 for payout
        self.payout_schedule = "weekly"

    def calculate_payout(
            self,
            total_earnings: int,
            platform_fee_rate: float = 0.20) -> int:
        """Calculate creator payout after platform fees"""
        # Platform takes 20%, creator gets 80%
        creator_share = int(total_earnings * (1 - platform_fee_rate))
        return creator_share

    def validate_payout(self, user_id: str, amount_cents: int) -> Dict:
        """Validate if payout request is allowed"""
        issues = []

        if amount_cents < (self.payout_threshold * 100):
            issues.append(f'Minimum payout is ${self.payout_threshold}')

        return {
            'valid': len(issues) == 0,
            'issues': issues
        }

    def process_stripe_payout(self, user_stripe_id: str, amount_cents: int):
        """Process payout via Stripe Connect"""
        try:
            # In production, this would call: stripe.Transfer.create(...)
            # For MVP, log the intent
            logger.info(f"Payout to {user_stripe_id}: {amount_cents} cents")
            return {
                'status': 'processing',
                'amount': amount_cents,
                'recipient': user_stripe_id
            }
        except Exception as e:
            logger.error(f"Payout failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Payout processing failed")


# Global payout processor
payout_processor = PayoutProcessor(getenv("STRIPE_API_KEY", "sk_test_dummy"))

# ====== ANALYTICS ======


class AnalyticsEngine:
    """Track and analyze platform metrics"""

    def __init__(self):
        self.metrics = defaultdict(lambda: defaultdict(int))

    def record_engagement(self, event_type: str, user_id: str,
                          video_id: str, metadata: Dict = None):
        """Record engagement event for analytics"""
        self.metrics[video_id][event_type] += 1
        self.metrics[user_id][f'{event_type}_count'] += 1

        logger.info(f"Analytics: {event_type} by {user_id} on {video_id}")

    def get_video_stats(self, video_id: str) -> Dict:
        """Get video performance stats"""
        return {
            'video_id': video_id,
            'views': self.metrics[video_id].get('view', 0),
            'likes': self.metrics[video_id].get('like', 0),
            'comments': self.metrics[video_id].get('comment', 0),
            'shares': self.metrics[video_id].get('share', 0),
        }

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user performance stats"""
        return {
            'user_id': user_id,
            'total_views': self.metrics[user_id].get('view_count', 0),
            'total_likes': self.metrics[user_id].get('like_count', 0),
            'total_engagements': sum([
                self.metrics[user_id].get(f'{t}_count', 0)
                for t in ['view', 'like', 'comment', 'share']
            ])
        }


# Global analytics engine
analytics_engine = AnalyticsEngine()

# ====== CONTENT MODERATION ======


class ContentModerator:
    """Content moderation and flagging system"""

    def __init__(self):
        # Replace with actual keywords
        self.banned_keywords = [
            'explicit1',
            'explicit2',
            'hateful1',
        ]
        self.nsfw_confidence_threshold = 0.8

    def check_title(self, title: str) -> Dict:
        """Check video title for policy violations"""
        violations = []

        # Check for banned keywords
        for keyword in self.banned_keywords:
            if keyword.lower() in title.lower():
                violations.append(f"Contains banned keyword: {keyword}")

        return {
            'violations': violations,
            'should_flag': len(violations) > 0
        }

    def check_description(self, description: str) -> Dict:
        """Check video description for policy violations"""
        violations = []

        # Check length
        if len(description) > 5000:
            violations.append("Description exceeds maximum length")

        # Check for spam patterns
        if description.count('@') > 10:
            violations.append("Excessive mentions (possible spam)")

        return {
            'violations': violations,
            'should_flag': len(violations) > 0
        }

    def should_require_review(self, video_id: str,
                              title: str, description: str) -> bool:
        """Determine if video needs manual review"""
        title_check = self.check_title(title)
        desc_check = self.check_description(description)

        return title_check['should_flag'] or desc_check['should_flag']


# Global content moderator
content_moderator = ContentModerator()

# ====== ANALYTICS API ROUTES ======
router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/videos/{video_id}")
async def get_video_analytics(video_id: str):
    """Get video performance analytics"""
    stats = analytics_engine.get_video_stats(video_id)
    views = stats.get('views', 0)
    if views > 0:
        likes = stats.get('likes', 0)
        comments = stats.get('comments', 0)
        shares = stats.get('shares', 0)
        engagement_rate = (likes + comments + shares) / max(views, 1)
    else:
        engagement_rate = 0

    return {
        **stats,
        'engagement_rate': engagement_rate
    }


@router.get("/users/{user_id}")
async def get_user_analytics(user_id: str):
    """Get user performance analytics"""
    return analytics_engine.get_user_stats(user_id)


@router.get("/creators/{creator_id}/earnings")
async def get_creator_earnings(creator_id: str, period: str = "weekly"):
    """Get creator earnings summary"""
    # In production, would query database for actual earnings
    return {
        'creator_id': creator_id,
        'period': period,
        'total_earned': 0,
        'pending': 0,
        'withdrawn': 0
    }

# ====== PAYOUT API ROUTES ======
payouts_router = APIRouter(prefix="/payouts", tags=["payouts"])


@payouts_router.post("/request")
async def request_payout(amount_cents: int, db: Session = Depends(None)):
    """Request a payout of current earnings"""
    validation = payout_processor.validate_payout("user_id", amount_cents)

    if not validation['valid']:
        raise HTTPException(status_code=400, detail=validation['issues'][0])

    result = payout_processor.process_stripe_payout("stripe_id", amount_cents)
    return result


@payouts_router.get("/history")
async def get_payout_history():
    """Get user's payout history"""
    return {
        'payouts': [
            {
                'id': 'payout_1',
                'amount': 5000,
                'status': 'completed',
                'date': datetime.utcnow().isoformat()
            }
        ]
    }

# ====== FRAUD CHECK ROUTES ======
fraud_router = APIRouter(prefix="/fraud", tags=["fraud-detection"])


@fraud_router.post("/check-view")
async def check_view_fraud(user_id: str, video_id: str,
                           watch_duration: int, video_duration: int):
    """Check if a view is suspicious"""
    result = fraud_detector.check_view_behaviour(
        user_id, video_id, watch_duration, video_duration
    )
    return result


@fraud_router.post("/check-engagement")
async def check_engagement_fraud(
        user_id: str,
        like_count: int,
        view_count: int):
    """Check if engagement pattern is suspicious"""
    result = fraud_detector.check_engagement_pattern(
        user_id, like_count, view_count)
    return result

# ====== MODERATION ROUTES ======
moderation_router = APIRouter(prefix="/moderation", tags=["moderation"])


@moderation_router.post("/review-content")
async def review_content(title: str, description: str):
    """Check if content needs moderation review"""
    needs_review = content_moderator.should_require_review(
        "video_id", title, description
    )
    return {
        'needs_review': needs_review,
        'reason': 'Policy violation detected' if needs_review else None
    }
