# 🔌 GramMate API Documentation

Complete REST API reference for GramMate backend.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All endpoints (except `/auth`) require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/signup

Create a new user account.

**Request**:
```json
{
  "username": "john_creator",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "country_code": "US"
}
```

**Response** (201):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors**:
- `400` - Invalid email or username already exists
- `422` - Validation error

---

### POST /auth/login

Authenticate with email and password.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors**:
- `401` - Invalid credentials
- `429` - Too many login attempts

---

### POST /auth/verify-email

Verify email address with verification code.

**Request**:
```json
{
  "email": "john@example.com",
  "verification_code": "123456"
}
```

**Response** (200):
```json
{
  "message": "Email verified successfully",
  "verified": true
}
```

---

## 👤 User Endpoints

### GET /users/{user_id}

Get user profile information.

**Response** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_creator",
  "display_name": "John Smith",
  "email": "john@example.com",
  "bio": "Creator & tech enthusiast",
  "avatar_url": "https://s3.amazonaws.com/grammate/avatar_123.jpg",
  "country_code": "US",
  "email_verified": true,
  "is_creator": true,
  "creator_verified_tier": 2,
  "follower_count": 1250,
  "following_count": 340,
  "total_earnings": 3450.50,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors**:
- `404` - User not found
- `401` - Unauthorized

---

### PUT /users/profile/update

Update user profile information.

**Request**:
```json
{
  "display_name": "John Smith",
  "bio": "Creator & tech enthusiast",
  "avatar_url": "https://s3.amazonaws.com/grammate/avatar_123.jpg"
}
```

**Response** (200):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_creator",
    "display_name": "John Smith",
    "bio": "Creator & tech enthusiast"
  }
}
```

---

## 🎬 Video Endpoints

### POST /videos/upload

Upload a new video.

**Request** (multipart/form-data):
```
file: <video_file>
title: "My Awesome Video"
description: "This is my latest video about..."
category: "entertainment"
hashtags: "#trendy #viral #fyp"
```

**Response** (201):
```json
{
  "id": "video_550e8400",
  "creator_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Awesome Video",
  "description": "This is my latest video about...",
  "video_url": "https://s3.amazonaws.com/grammate/videos/video_550e8400.mp4",
  "thumbnail_url": "https://s3.amazonaws.com/grammate/thumbs/video_550e8400.jpg",
  "status": "processing",
  "created_at": "2024-01-16T14:22:00Z"
}
```

**Errors**:
- `413` - File too large
- `415` - Invalid file type
- `401` - Not authenticated

---

### GET /videos/{video_id}

Get video details.

**Response** (200):
```json
{
  "id": "video_550e8400",
  "creator_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Awesome Video",
  "description": "This is my latest video about...",
  "video_url": "https://s3.amazonaws.com/grammate/videos/video_550e8400.mp4",
  "thumbnail_url": "https://s3.amazonaws.com/grammate/thumbs/video_550e8400.jpg",
  "status": "published",
  "duration_seconds": 45,
  "category": "entertainment",
  "hashtags": ["trendy", "viral", "fyp"],
  "view_count": 1250,
  "like_count": 342,
  "comment_count": 89,
  "share_count": 45,
  "is_monetized": true,
  "created_at": "2024-01-16T14:22:00Z"
}
```

---

### GET /feed

Get personalized video feed.

**Query Parameters**:
- `limit` (int, default 20) - Number of videos
- `offset` (int, default 0) - Pagination offset
- `sort` (string, default "newest") - Sort order

**Response** (200):
```json
{
  "videos": [
    {
      "id": "video_abc123",
      "title": "Cool Video",
      "creator_id": "user_123",
      "thumbnail_url": "https://...",
      "view_count": 500,
      "like_count": 120,
      "engagement_rate": 0.12
    },
    {
      "id": "video_def456",
      "title": "Another Video",
      "creator_id": "user_456",
      "thumbnail_url": "https://...",
      "view_count": 800,
      "like_count": 240,
      "engagement_rate": 0.30
    }
  ],
  "total": 2450,
  "offset": 0,
  "limit": 20
}
```

---

## 🎯 Engagement Endpoints

### POST /engagements/{video_id}/view

Track a video view and earn reward.

**Request**:
```json
{
  "watch_duration_seconds": 45,
  "completed": true
}
```

**Response** (200):
```json
{
  "engagement_id": "eng_550e8400",
  "reward_earned_cents": 50,
  "reward_earned_dollars": 0.50,
  "watch_rate": 1.0,
  "location_multiplier": 1.2,
  "message": "Nice! You earned $0.50"
}
```

**Errors**:
- `404` - Video not found
- `409` - Already watched (might be cached, try again)

---

### POST /engagements/{video_id}/like

Like a video and earn micro-reward.

**Request** (empty body):

**Response** (200):
```json
{
  "engagement_id": "eng_550e8401",
  "liked": true,
  "reward_earned_cents": 5,
  "total_likes": 343
}
```

**Errors**:
- `404` - Video not found
- `409` - Already liked

---

### POST /engagements/{video_id}/comment

Add a comment to a video.

**Request**:
```json
{
  "content": "This is awesome! Great work 👏"
}
```

**Response** (201):
```json
{
  "id": "comment_550e8400",
  "user_id": "user_123",
  "video_id": "video_550e8400",
  "content": "This is awesome! Great work 👏",
  "created_at": "2024-01-16T15:45:00Z",
  "likes": 0
}
```

---

## 💰 Wallet Endpoints

### GET /wallet

Get user wallet balance and status.

**Response** (200):
```json
{
  "id": "wallet_550e8400",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "balance_cents": 34500,
  "balance": 345.00,
  "pending_balance_cents": 2500,
  "pending_balance": 25.00,
  "total_earned_cents": 134500,
  "total_earned": 1345.00,
  "updated_at": "2024-01-16T16:00:00Z"
}
```

---

### GET /wallet/transactions

Get transaction history.

**Query Parameters**:
- `limit` (int, default 50) - Number of transactions
- `offset` (int, default 0) - Pagination offset
- `type` (string) - Filter by type (view, like, referral, withdrawal, refund)

**Response** (200):
```json
{
  "transactions": [
    {
      "id": "tx_550e8400",
      "type": "view",
      "amount": 50,
      "video_id": "video_123",
      "created_at": "2024-01-16T15:30:00Z"
    },
    {
      "id": "tx_550e8401",
      "type": "like",
      "amount": 5,
      "video_id": "video_456",
      "created_at": "2024-01-16T14:25:00Z"
    },
    {
      "id": "tx_550e8402",
      "type": "withdrawal",
      "amount": -5000,
      "status": "completed",
      "method": "stripe",
      "created_at": "2024-01-16T10:00:00Z"
    }
  ],
  "total": 1250,
  "offset": 0,
  "limit": 50
}
```

---

### POST /wallet/withdraw

Request a withdrawal of earned money.

**Request**:
```json
{
  "amount_cents": 5000,
  "method": "stripe"
}
```

Methods: `stripe`, `paypal`, `crypto`

**Response** (200):
```json
{
  "transaction_id": "tx_550e8403",
  "status": "processing",
  "amount": 50.00,
  "method": "stripe",
  "estimated_arrival": "2024-01-19T00:00:00Z",
  "message": "Withdrawal request submitted!"
}
```

**Errors**:
- `400` - Amount below minimum ($5)
- `400` - Insufficient balance
- `422` - Missing payment method

---

### POST /wallet/link-bank

Link a bank account for payouts.

**Request**:
```json
{
  "plaid_public_token": "public_token_abc123"
}
```

**Response** (200):
```json
{
  "linked": true,
  "account_name": "John's Checking",
  "last_four": "4242",
  "status": "verified"
}
```

---

## 👨‍💼 Creator Endpoints

### GET /creators/{creator_id}

Get creator profile with stats.

**Response** (200):
```json
{
  "id": "user_550e8400",
  "username": "john_creator",
  "display_name": "John Smith",
  "bio": "Creator & tech enthusiast",
  "avatar_url": "https://s3.amazonaws.com/grammate/avatar_123.jpg",
  "verified": true,
  "verification_tier": 2,
  "follower_count": 5000,
  "following_count": 340,
  "total_videos": 142,
  "total_views": 250000,
  "total_likes": 45000,
  "total_earnings": 12345.67,
  "weekly_earnings": 450.25,
  "avg_engagement_rate": 0.18,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### GET /creators/{creator_id}/videos

Get creator's videos.

**Query Parameters**:
- `limit` (int, default 20)
- `offset` (int, default 0)
- `sort` (string, default "newest")

**Response** (200):
```json
{
  "videos": [
    {
      "id": "video_abc123",
      "title": "My First Video",
      "thumbnail_url": "https://...",
      "view_count": 5000,
      "like_count": 1200,
      "duration_seconds": 60,
      "created_at": "2024-01-15T10:00:00Z",
      "earnings_cents": 10000
    }
  ],
  "total": 142,
  "offset": 0,
  "limit": 20
}
```

---

### GET /creators/{creator_id}/analytics

Get creator performance analytics.

**Query Parameters**:
- `period` (string) - "daily", "weekly", "monthly"

**Response** (200):
```json
{
  "period": "weekly",
  "total_views": 50000,
  "total_engagements": 12500,
  "engagement_rate": 0.25,
  "avg_watch_duration": 45,
  "followers_gained": 250,
  "total_earnings": 450.50,
  "top_video": {
    "id": "video_abc123",
    "title": "Top Video",
    "views": 15000,
    "earnings": 250.00
  }
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/videos/{video_id}

Get video performance analytics.

**Response** (200):
```json
{
  "video_id": "video_abc123",
  "views": 5000,
  "likes": 1200,
  "comments": 350,
  "shares": 180,
  "engagement_rate": 0.30,
  "avg_watch_duration": 45,
  "completion_rate": 0.85,
  "earnings": 125.00
}
```

---

### GET /analytics/users/{user_id}

Get user analytics.

**Response** (200):
```json
{
  "user_id": "user_123",
  "total_views": 250000,
  "total_likes": 45000,
  "total_engagements": 65000,
  "engagement_rate": 0.26,
  "followers": 5000,
  "following": 340
}
```

---

## 🛡️ Fraud Detection Endpoints

### POST /fraud/check-view

Check if a view is suspicious.

**Request**:
```json
{
  "user_id": "user_123",
  "video_id": "video_abc",
  "watch_duration_seconds": 2,
  "video_duration_seconds": 60
}
```

**Response** (200):
```json
{
  "risk_score": 25,
  "risk_factors": ["Unusually short watch duration (skip suspected)"],
  "is_suspicious": false
}
```

---

### POST /fraud/check-engagement

Check engagement pattern for bot activity.

**Request**:
```json
{
  "user_id": "user_123",
  "like_count": 950,
  "view_count": 1000
}
```

**Response** (200):
```json
{
  "risk_score": 50,
  "risk_factors": ["Suspiciously high engagement rate (bot activity)"],
  "is_suspicious": true
}
```

---

## 🛡️ Moderation Endpoints

### POST /moderation/review-content

Check if content needs moderation review.

**Request**:
```json
{
  "title": "My Cool Video",
  "description": "Check out my new video..."
}
```

**Response** (200):
```json
{
  "needs_review": false,
  "reason": null
}
```

---

## 💸 Payout Endpoints

### POST /payouts/request

Request a creator payout.

**Request**:
```json
{
  "amount_cents": 50000
}
```

**Response** (200):
```json
{
  "status": "processing",
  "amount": 500.00,
  "recipient": "stripe_acct_abc123",
  "message": "Payout queued for processing"
}
```

---

### GET /payouts/history

Get payout history.

**Response** (200):
```json
{
  "payouts": [
    {
      "id": "payout_123",
      "amount": 500.00,
      "status": "completed",
      "date": "2024-01-15T00:00:00Z"
    }
  ]
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate, already exists) |
| 413 | Payload Too Large |
| 415 | Unsupported Media Type |
| 422 | Unprocessable Entity (invalid data) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

API is rate limited to **100 requests per minute** per IP.

Rate limit info in response headers:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 95
- `X-RateLimit-Reset`: 1705430400

---

## Webhooks

Stripe webhook for payout notifications:

```
POST /webhooks/stripe
```

Events:
- `payout.created` - Payout initiated
- `payout.paid` - Payout completed
- `payout.failed` - Payout failed
- `charge.refunded` - User refund initiated

---

**Last Updated**: January 2024
**Version**: 1.0.0
