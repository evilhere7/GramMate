# GramMate API Endpoints Documentation

## Overview
Complete REST API for the GramMate creator economy platform. All endpoints except auth require a valid JWT token in the Authorization header.

**Base URL:** `http://localhost:8000`  
**Authentication:** Bearer token in `Authorization: Bearer <token>` header

---

## 1. Health & Status

### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T12:30:00.000000",
  "service": "grammate-api"
}
```

---

## 2. Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "country_code": "US"
}
```

**Requirements:**
- Email must be valid RFC 5322 format
- Password: minimum 8 characters
- Username: 3-50 characters, alphanumeric + underscore

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status:** 200 | 400 (email/username taken)

---

### POST /auth/login
Authenticate user and get access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status:** 200 | 401 (invalid credentials)

---

### POST /auth/verify-email
Mark user email as verified (unlocks higher earning tiers).

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Email verified"
}
```

---

## 3. User Endpoints

### GET /users/{user_id}
Get user profile information.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "username",
  "email": "user@example.com",
  "display_name": "Display Name",
  "bio": "User bio",
  "avatar_url": "https://...",
  "is_creator": true,
  "creator_verified_tier": 1,
  "created_at": "2026-01-01T00:00:00"
}
```

---

### PUT /users/profile/update
Update user profile information.

**Auth Required:** Yes

**Query Parameters:**
- `display_name` (optional): New display name
- `bio` (optional): User biography

**Response:**
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

---

## 4. Video Endpoints

### POST /videos/upload
Upload a new video for transcoding.

**Auth Required:** Yes

**Request:**
```json
{
  "title": "Video Title",
  "description": "Optional description",
  "category": "music",
  "hashtags": ["tag1", "tag2"],
  "monetization_enabled": true
}
```

**Response:**
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Video queued for transcoding"
}
```

---

### GET /videos/{video_id}
Get video details and statistics.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "creator_id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Video Title",
  "description": "Description",
  "video_url": "https://s3.../video.mp4",
  "thumbnail_url": "https://s3.../thumb.jpg",
  "duration_seconds": 120,
  "category": "music",
  "status": "published",
  "view_count": 150,
  "like_count": 45,
  "comment_count": 12,
  "engagement_rate": 0.38,
  "created_at": "2026-01-01T00:00:00"
}
```

---

### GET /feed
Get personalized video feed (chronological for MVP).

**Auth Required:** Yes

**Query Parameters:**
- `limit` (default: 20): Number of videos to return
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "videos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Video Title",
      "video_url": "https://s3.../video.mp4",
      "thumbnail_url": "https://s3.../thumb.jpg",
      "view_count": 150,
      "like_count": 45,
      "engagement_rate": 0.38,
      "creator_id": "550e8400-e29b-41d4-a716-446655440001"
    }
  ],
  "offset": 20,
  "has_more": true
}
```

---

## 5. Engagement Endpoints

### POST /engagements/{video_id}/view
Track a video view and earn reward.

**Auth Required:** Yes

**Request:**
```json
{
  "watch_duration_seconds": 120,
  "completed": true
}
```

**Response:**
```json
{
  "reward_earned_cents": 15,
  "engagement_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Reward Calculation:**
- Base: $0.005 for <50% watch, $0.015 for >50%
- Country multiplier: US/CA/GB/AU = 1.1x, IN = 0.5x, BR = 0.7x, etc.
- Email verification bonus: 1.2x if verified

---

### POST /engagements/{video_id}/like
Like a video and earn reward ($0.01).

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "reward_earned_cents": 10,
  "total_likes": 46
}
```

**Status:** 200 | 400 (already liked)

---

## 6. Wallet & Payout Endpoints

### GET /wallet
Get user's current wallet balance.

**Auth Required:** Yes

**Response:**
```json
{
  "balance_cents": 50000,
  "currency": "USD",
  "pending_payout_cents": 10000,
  "created_at": "2026-01-01T00:00:00"
}
```

---

### POST /wallet/withdraw
Request a withdrawal of earnings.

**Auth Required:** Yes  
**Requirement:** Email must be verified

**Request:**
```json
{
  "amount_cents": 5000,
  "method": "stripe_ach",
  "recipient_id": "stripe_account_id"
}
```

**Response:**
```json
{
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "amount_cents": 5000,
  "expected_arrival": "2026-02-13T12:30:00.000000"
}
```

**Status:** 200 | 400 (insufficient funds, unverified email)

---

### GET /wallet/transactions
Get transaction history.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (default: 50): Number of transactions
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "earn",
      "amount_cents": 150,
      "status": "completed",
      "created_at": "2026-01-01T00:00:00"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "withdraw",
      "amount_cents": 5000,
      "status": "pending",
      "created_at": "2026-01-01T01:00:00"
    }
  ],
  "count": 2
}
```

---

## 7. Creator Endpoints

### GET /creators/{creator_id}
Get creator profile with statistics.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "username": "creator_username",
  "display_name": "Creator Name",
  "avatar_url": "https://...",
  "bio": "Creator bio",
  "is_verified": true,
  "verified_tier": 2,
  "total_videos": 50,
  "total_views": 50000,
  "engagement_rate": 0.45
}
```

---

### GET /creators/{creator_id}/videos
Get creator's published videos.

**Query Parameters:**
- `limit` (default: 20): Number of videos
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "videos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Video Title",
      "video_url": "https://s3.../video.mp4",
      "view_count": 150,
      "published_at": "2026-01-01T00:00:00"
    }
  ]
}
```

---

## 8. Analytics Endpoints

### GET /analytics/videos/{video_id}
Get detailed video performance analytics.

**Response:**
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "views": 150,
  "likes": 45,
  "comments": 12,
  "shares": 5,
  "engagement_rate": 0.41
}
```

---

### GET /analytics/users/{user_id}
Get user performance statistics.

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "total_views": 5000,
  "total_likes": 450,
  "total_engagements": 500
}
```

---

### GET /analytics/creators/{creator_id}/earnings
Get creator earnings summary.

**Query Parameters:**
- `period` (default: "weekly"): "daily", "weekly", or "monthly"

**Response:**
```json
{
  "creator_id": "550e8400-e29b-41d4-a716-446655440001",
  "period": "weekly",
  "total_earned": 50000,
  "pending": 10000,
  "withdrawn": 40000
}
```

---

## 9. Payout Endpoints

### POST /payouts/request
Request a creator payout.

**Auth Required:** Yes

**Query Parameters:**
- `amount_cents`: Amount in cents to request

**Response:**
```json
{
  "status": "processing",
  "amount": 50000,
  "recipient": "user_id"
}
```

---

### GET /payouts/history
Get creator's payout history.

**Auth Required:** Yes

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "payouts": [
    {
      "id": "payout_1",
      "amount": 50000,
      "status": "completed",
      "date": "2026-01-01T00:00:00"
    }
  ]
}
```

---

## 10. Moderation Endpoints

### POST /moderation/review-content
Check if content requires manual review.

**Request:**
```json
{
  "title": "Video Title",
  "description": "Video description"
}
```

**Response:**
```json
{
  "needs_review": false,
  "reason": null
}
```

---

## 11. Fraud Detection Endpoints

### POST /fraud/check-view
Check if a view is suspicious.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "watch_duration": 5,
  "video_duration": 120
}
```

**Response:**
```json
{
  "risk_score": 25,
  "risk_factors": ["Unusually short watch duration (skip suspected)"],
  "is_suspicious": false
}
```

---

### POST /fraud/check-engagement
Check if engagement pattern is suspicious.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "like_count": 95,
  "view_count": 100
}
```

**Response:**
```json
{
  "risk_score": 0,
  "risk_factors": [],
  "is_suspicious": false
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

---

## Rate Limiting

- **General API:** 100 requests/minute per IP
- **Authentication:** 5 requests/minute per IP

Rate limit exceeded returns:
```json
{
  "detail": "Rate limit exceeded"
}
```

---

## Authentication Example

```bash
# 1. Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "myusername",
    "password": "SecurePass123!",
    "country_code": "US"
  }'

# Response includes access_token

# 2. Make authenticated request
curl http://localhost:8000/wallet \
  -H "Authorization: Bearer <access_token>"
```

---

## Production Deployment Checklist

- [ ] Change default database URL to PostgreSQL RDS
- [ ] Set `SECRET_KEY` to strong random value
- [ ] Configure real Stripe API keys
- [ ] Enable Plaid integration with real credentials
- [ ] Set up AWS S3 bucket for video storage
- [ ] Configure CloudFront CDN
- [ ] Enable CORS for frontend domain
- [ ] Set up monitoring and alerting
- [ ] Configure SSL/TLS certificates
- [ ] Set up database backups
- [ ] Enable request logging

---

**API Version:** 1.0.0  
**Last Updated:** February 11, 2026
