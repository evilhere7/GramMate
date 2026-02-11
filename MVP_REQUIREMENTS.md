# GramMate MVP: Product Requirements Document
## Feature Specification, User Stories, and Acceptance Criteria

**Version:** 1.0  
**Release Target:** Month 6  
**Platform:** iOS, Android, Web (responsive)

---

## 1. MVP Scope Summary

**In Scope for MVP (launch-critical):**
- User authentication (signup, login, email verification)
- Video upload & publishing (in-app editor + raw upload)
- Feed (chronological + basic trending)
- Engagement (view tracking, likes, comments, shares)
- Viewer rewards (real-time micro-payouts per engagement)
- Creator payouts (weekly ACH via Stripe)
- Moderation (basic reporting + human review)
- Wallet (balance display, withdrawal to bank)
- Analytics (basic creator dashboard)

**Out of Scope for MVP:**
- Live streaming
- Brand marketplace
- Creator subscriptions
- AI recommendations (use trending + chronological fallback)
- Cryptocurrency integration
- Creator verification tiers
- Premium features
- Social graph (DMs, follower notifications)
- Merchandise integration

---

## 2. Feature Specifications & User Stories

### Feature 1: User Signup & Onboarding

**User Story 1.1: New User Email Signup**
```
As a new user,
I want to sign up with email + password,
So that I can create an account and start earning immediately.

Acceptance Criteria:
- Email field validates format (RFC 5322 compatible)
- Password requires min 8 chars, at least 1 uppercase, 1 number, 1 special char
- Duplicate email rejected with clear message
- On successful signup:
  * Account created in database
  * Email verification email sent (Sendgrid)
  * User redirected to interest survey screen
  * Email contains 24-hour link (expires after 1 click)
- User can request new verification email
- Email verification required before first video watch (but not to create account)
```

**User Story 1.2: Interest Survey**
```
As a new user completing onboarding,
I want to select content categories I'm interested in,
So that my feed shows relevant videos.

Acceptance Criteria:
- Display 8 category options (music, comedy, education, sports, gaming, trending, food, other)
- User must select minimum 2 categories
- Selection is saved to user profile
- "Continue" button proceeds to feed
- Selected interests used to seed initial feed recommendations
```

**User Story 1.3: Email Verification**
```
As a user with unverified email,
I want to verify my email easily from the app,
So that I unlock higher reward tiers.

Acceptance Criteria:
- Verification prompt shows in app header (dismissible)
- Verification email resend available (rate-limited: 1 per hour)
- Email link deep-links to app's verification screen
- On success: ticker notification "Email verified! Higher rewards now available"
- Unverified user limited to $100/mo earnings (soft cap w/ warning)
```

---

### Feature 2: Video Upload & Publishing

**User Story 2.1: In-App Video Recording**
```
As a creator,
I want to record a video directly in the app,
So that creating content is frictionless.

Acceptance Criteria:
- Camera access permission prompt on first use
- Record button, pause, resume, stop controls
- Timer(max 10 min for MVP)
- Playback preview before upload
- Cancel discards recording
- Auto-trim silence if >2 sec silence detected
- Frame rate: 30fps, bitrate: 2–5 Mbps (adaptive)
```

**User Story 2.2: Video Upload (Gallery or Raw)**
```
As a creator,
I want to upload a pre-recorded video from my phone,
So that I can use higher-quality content.

Acceptance Criteria:
- iOS: Photo library picker (PHPhotoLibrary)
- Android: MediaStore content provider
- Supported formats: MP4, MOV, AVI (auto-convert to MP4)
- Max file size: 500 MB
- Max duration: 10 min
- Progress bar shows upload %, estimated time remaining
- Simultaneous upload limit: 3 videos
- Auto-resume on connection recovery
- Thumbnail auto-generated from frame @ 25% duration
```

**User Story 2.3: Video Metadata & Publishing**
```
As a creator,
I want to add title, description, category, and hashtags to my video,
So that my videos are discoverable.

Acceptance Criteria:
- Title field: required, max 100 chars
- Description field: optional, max 500 chars
- Category dropdown: trending, music, comedy, education, sports, gaming, food, beauty, other
- Hashtag input: auto-complete from trending hashtags
- Max 10 hashtags, must start with #
- Hashtags with potential policy violations flagged (e.g., #xxxx)
- Preview screen shows video + metadata
- "Publish" button:
  * Video queued for transcoding
  * UI shows "Processing... 5% complete"
  * During processing: user can leave app; background notification on completion
  * Transcoding SLA: 95% complete within 30 seconds, 100% within 5 minutes
  * On completion: video published, visible in creator's profile
```

---

### Feature 3: Feed & Video Discovery

**User Story 3.1: Personalized Feed**
```
As a viewer,
I want to see a feed of relevant videos,
So that I find content I enjoy.

Acceptance Criteria:
- Feed loads within 500 ms (cached results)
- Initial feed:
  * If logged in: mix of selected interests + trending + popular creators
  * If not logged in: trending videos globally
- Pull-to-refresh shows latest videos from selected interests
- Infinite scroll (pagination): load 20 at a time
- Each video shows:
  * Thumbnail + play button
  * Creator name + verified badge (if any)
  * Video title
  * View count, like count, engagement rate
  * "Watch" CTA button
- Tap video or button opens fullscreen video player
```

**User Story 3.2: Trending & Category Browse**
```
As a viewer,
I want to explore trending videos and browse by category,
So that I discover new content.

Acceptance Criteria:
- "Trending" tab shows:
  * Videos sorted by (view_count + engagement) in last 24h
  * Updated every hour
  * Limited to videos published in last 7 days
- "Categories" tab shows 8 tabs:
  * Each tab shows top10 videos in that category
  * Sorted by trending score
- Search bar (for later MVP+):
  * Disabled in MVP (send users to trending instead)
```

**User Story 3.3: Creator Page**
```
As a viewer,
I want to visit a creator's profile,
So that I can see all their videos and follow them.

Acceptance Criteria:
- Tapping creator name navigates to their profile
- Profile shows:
  * Avatar + bio
  * Follower count (not editable by others)
  * Follow/Unfollow button (disabled in MVP, shows "Coming Soon")
  * Creator's 10 most recent videos
  * "Load More" button for pagination
  * Creator's total engagement rate (sum of all video engagements / total views)
  * If creator is verified: badge or label shown
```

---

### Feature 4: Engagement & Rewards

**User Story 4.1: View Tracking & Viewer Reward**
```
As a viewer,
I want to earn money for watching videos,
So that I'm incentivized to use the platform.

Acceptance Criteria:
- Video playback tracks:
  * Duration watched (seconds)
  * Completion rate (%)
  * Age of video (for algo signals)
  * Viewer country (from IP geolocation)
- View counts as "engagement" if >1 second watched
- Reward calculation (shown immediately after video ends or on exit):
  * 0–50% watched: $0.005 base reward
  * 50–100% watched: $0.015 base reward
  * Country multiplier: US 1.2x, UK 1.1x, Canada 1.1x, others 0.8x
  * Verified email bonus: +1.2x multiplier
  * Total displayed in green ticker: "You earned $0.18!"
- Cumulative session earnings shown at top of feed
- Earnings persist across app close (stored locally + synced to server)
```

**User Story 4.2: Like & Engagement Reward**
```
As a viewer,
I want to earn bonus for liking and engaging with videos,
So that I'm rewarded for strong engagement.

Acceptance Criteria:
- Like button (heart icon):
  * Tap toggles like state (visual feedback: animation + color change)
  * On like: immediate popup "$0.01 earned!"
  * Can unlike (reward clawed back from pending balance)
  * Like count updates in real-time
- Comment button:
  * Opens comment input modal
  * Min 5 characters required
  * AI flag check for spam/hate speech (simple keyword filter for MVP)
  * On post: "$0.02 earned!" notification
  * Comment count updates
  * Comments visible in thread below video (show 3 recent, "Load More")
  * Comment not eligible for reward if flagged as spam/abuse
- Share button:
  * Options: Copy link, Share to (FB, Twitter, WhatsApp, etc)
  * On share: "$0.05 earned!" notification
  * In-app share counts toward reward; external shares don't (hard to track)
```

**User Story 4.3: Daily Streak Bonus**
```
As a viewer,
I want to earn bonuses for consistent engagement,
So that I build a daily habit.

Acceptance Criteria:
- Streak counter: days watched ≥1 video with ≥1 engagement
- Streak resets if user doesn't engage for 24 hours
- Milestone bonuses:
  * 5-day streak: $0.50 bonus
  * 10-day streak: $1.00 bonus
  * 30-day streak: $5.00 bonus
- Streak displayed on profile + feed
- Streak notification on first watch each day: "Day 5! Keep it up 🔥"
```

---

### Feature 5: Wallet & Payouts

**User Story 5.1: Wallet Dashboard**
```
As a user,
I want to see my wallet balance and transaction history,
So that I can track my earnings.

Acceptance Criteria:
- Wallet tab shows:
  * Balance in USD (large, prominent)
  * "Total earned this week" subtotal
  * "Pending payout" (if creator)
  * "Withdraw" button (disabled until balance > $1)
- Transaction history:
  * Show 20 most recent transactions (scroll for more)
  * Each transaction shows:
    - Type (view, like, comment, share, payout, etc)
    - Amount
    - Date/time
    - Status (completed, pending, failed)
  * Failed transactions show retry option
```

**User Story 5.2: Withdraw to Bank (Viewer)**
```
As a viewer with $20+ earned,
I want to withdraw my balance to my bank account,
So that I can access my money.

Acceptance Criteria:
- Withdraw button launches flow:
  * Step 1: Amount input (max = balance, min = $1)
  * Step 2: Link bank account (Plaid Link modal)
    - Plaid handles auth + MFA
    - Returns account name + last 4 digits
  * Step 3: Confirm (show amount, bank, fees)
    - Fee: 1.5% ($0.02 per $1.33 withdrawal)
    - Time: 1–2 business days typical
  * Step 4: Success screen ("Withdrawal submitted!")
- Transaction state: "pending" → "processing" (next day) → "completed"
- Email confirmation on successful withdrawal
- Failed withdrawals surface in transaction history; user sees "Retry" option
- Rate limit: 1 withdrawal per hour, max 10 per day
```

**User Story 5.3: Creator Automatic Weekly Payout**
```
As a creator,
I want to receive automatic weekly payouts to my bank account,
So that I don't have to manually claim.

Acceptance Criteria:
- Payout schedule:
  * Period: Mon–Sun
  * Payout triggered every Friday @ 4 PM UTC
  * Minimum balance to trigger payout: $20
- Payout calculation:
  * Viewer contribution: sum of per-view rewards (based on creator's videos)
  * Ad revenue (if ads running): TBD (see ads feature)
  * Subtotal deductions: platform 20% cut
  * Stripe processing fee: 1.25% + $0.25 per ACH
  * Net payout = subtotal - platform cut - fees
- Bank account setup:
  * First payout requires Plaid link (sec Feature 5.2)
  * Subsequent payouts auto-use linked account
  * Creator can whitelist multiple accounts
- Transaction recorded:
  * Payout record shows breakdown: views, engagement, gross, fees, net
  * Invoice-style detail page available
- Tax documentation (future MVP+):
  * 1099 generated end-of-year for US creators
```

---

### Feature 6: Creator Analytics Dashboard

**User Story 6.1: Video Analytics**
```
As a creator,
I want to see detailed analytics on each video,
So that I understand what's working.

Acceptance Criteria:
- Navigate to "Analytics" tab (visible only to creators)
- Select a video from dropdown or recents list
- Show metrics:
  * Total views
  * Watch completion rate (%)
  * Engagement rate (engagement / views)
  * Likes, comments, shares (counts)
  * Top 3 countries (by view count)
  * Estimated earnings ($)
    - Base: views * avg_per_view_reward
    - Breakdown: viewer contribution, ads (if any)
    - Net after platform cut
  * Best performing time (hour of day with most views)
- Chart: Views over time (hourly for first 24h, then daily)
- Actionable insights:
  * "Your videos in [category] get 40% higher engagement"
  * "Most viewers from US (60%)"
```

**User Story 6.2: Channel Analytics**
```
As a creator,
I want to see overall channel performance,
So that I can track growth.

Acceptance Criteria:
- Analytics tab summary view shows:
  * Total videos uploaded
  * Total views (all time)
  * Avg engagement rate
  * Total earnings (all time)
  * Earnings this week (vs last week %)
  * Top 3 videos (by views)
- Charts:
  * Weekly earnings trend (bar chart)
  * Views trend (line chart)
- Performance benchmarks (vs category average):
  * "Your avg engagement: 8.2% vs category avg 5.1%"
```

---

### Feature 7: Content Moderation

**User Story 7.1: Report Inappropriate Content**
```
As a viewer,
I want to report videos or comments that violate policies,
So that the platform stays safe.

Acceptance Criteria:
- Three-dot menu on video shows "Report" option
- Report modal shows categories:
  * Spam (repeated, low-effort content)
  * Nudity (explicit sexual content)
  * Violence (graphic injury, threats)
  * Hate speech (racial, religious slurs)
  * Copyright (unauthorized music, footage)
  * Other (free text)
- User can add details (optional text field)
- Submit stores report in database
- Success message: "Thank you. We'll review this."
- Users can report up to 10 videos per day (soft limit, not enforced server-side in MVP)
```

**User Story 7.2: Admin Video Review Queue**
```
As a Trust & Safety moderator,
I want to review reported videos,
So that I can remove policy-violating content.

Acceptance Criteria:
- Internal admin tool (separate from app):
  * Shows queue of flagged videos (paginated, 50 per page)
  * Sort by: newest, report count
  * Each item shows:
    - Thumbnail + video preview (max 60 sec)
    - Creator name
    - Report count
    - Top flag reason (with count)
    - User comments
  * Reviewer can:
    - Approve (leave video live)
    - Shadowban (hidden from feed, creator unaware)
    - Remove (deleted, creator notified)
    - Escalate (for legal team)
  * SLA: 95% reviewed within 24 hours
  * Reviewer decision logged (audit trail)
```

---

### Feature 8: Authentication & Account Security

**User Story 8.1: Login & Session Management**
```
As a returning user,
I want to log in with email + password,
So that I can access my account.

Acceptance Criteria:
- Login screen:
  * Email + password fields
  * "Forgot password?" link (disabled in MVP, shows "Coming soon")
  * "Sign up" link for new users
  * Login button disabled until both fields filled
- On successful login:
  * JWT token generated (24-hour expiry)
  * Device ID stored for tracking
  * User redirected to feed
  * "Welcome back!" notification
- Failed login:
  * 5 attempts trigger 5-minute lockout (rate limiting)
  * Error message: "Invalid email or password"
- Session managed:
  * Auto-refresh token on app open
  * Logout clears stored token
  * Multiple logins allowed (no single-session limit in MVP)
```

**User Story 8.2: User Profile & Account Settings**
```
As a user,
I want to manage my profile & account settings,
So that I control my data visibility.

Acceptance Criteria:
- Settings tab shows:
  * Display name (editable)
  * Username (read-only after signup)
  * Bio (optional, max 150 chars)
  * Avatar upload (max 5 MB, auto-crop to square)
  * Email address (display, not editable in MVP)
  * Country (display for verification tier, editable)
- Save changes button
- Logout button
- Delete account button (disabled in MVP, shows "Contact support")
- Dark mode toggle (saved to user preferences) [Optional for MVP if time permits]
```

---

### Feature 9: Ads (Creator & Advertiser Side)

**User Story 9.1: Ad Inventory Setup (Creator)**
```
As a creator,
I want to opt-in to showing ads on my videos,
So that I earn additional revenue.

Acceptance Criteria:
- Settings screen, "Monetization" section:
  * Toggle: "Enable ads on my videos"
  * When enabled, videos automatically eligible for ad pre-roll
  * Estimated CPM shown: "$2–$5 depending on audience"
- Ad revenue appears in payout breakdown next week
- Creator can't disable retroactively (ads already scheduled won't change)
```

**User Story 9.2: Simple Advertiser Campaign Creation (MVP Basic)**
```
As an advertiser,
I want to create a simple ad campaign,
So that I can promote my app to GramMate users.

Acceptance Criteria:
[NOTE: This is barebones for MVP; full marketplace comes in V1]
- Campaign creation (web only, not in mobile app for MVP):
  * Campaign name field
  * Budget input (USD, min $100)
  * Target geography: dropdown (US, Canada, UK only in MVP)
  * Creative upload: video file (max 30 sec)
  * Start & end date
  * Submit creates campaign
  * Campaign status: "Active" (auto-started)
- Dashboard shows:
  * Campaign name + status
  * Impressions (count)
  * Spend (USD, updated real-time)
  * Estimated engagement (rough forecast)
- Video insertion:
  * Ads randomly inserted as pre-roll on 30% of videos
  * No targeting by creator niche yet (MVP baseline)
  * No pause/optimization (MVP simplicity)
- Billing:
  * Stripe charged daily (actual spend, not advance)
  * Paused when budget exhausted
  * Email alerts at 50%, 90%, 100% spend
```

---

### Feature 10: Notifications & Engagement Loop

**User Story 10.1: Push Notifications**
```
As a user,
I want to receive notifications about earnings and streak milestones,
So that I'm incentivized to stay engaged.

Acceptance Criteria:
- Push notification topics:
  * 5-day streak: "5-day streak! Keep it up 🔥"
  * First earn milestone: "You earned your first $1 🎉"
  * Weekly payout (creators): "Your weekly payout of $XXX is on the way!"
  * Daily reminder (if no engagement): "$0.XX waiting for you" (once per day, 7 PM)
- User can disable notifications in Settings
- Notification timing:
  * Push at optimal time (user's timezone, typical app usage time)
  * Rate-limited: max 2 notifications per day per user
- Deep linking:
  * Tapping notification opens relevant screen (feed, wallet, analytics)
```

---

## 3. Non-Functional Requirements

| Requirement | Spec | Testing |
|---|---|---|
| **Performance** | Feed load <500ms | Load test to 10K concurrent users |
| **Availability** | 99% uptime (1 week) | Monitor 5-minute error rate |
| **Data Security** | End-to-end encryption for passwords (TLS + bcrypt) | Penetration test by external vendor |
| **API Rate Limit** | 1K req/min per IP, 100 per user/min | Enforce 429 responses |
| **Video Processing** | 95% within 30 sec, 100% within 5 min | Measure for 1000 videos |
| **Moderation SLA** | 95% of reports reviewed within 24 hours | Daily report on queue status |
| **Payout Accuracy** | ±$0.01 per calculation | Audit random 100 payouts weekly |
| **Accessibility** | WCAG 2.1 AA for web | Lighthouse audit + manual testing |

---

## 4. MVP Success Metrics

**Launch targets (end of Month 6):**
- 100K signups achieved
- 60% Day 7 retention
- 8%+ engagement rate (likes + comments + shares per video view)
- 50% of creators upload ≥1 video by Day 30
- Zero critical security breaches
- <100ms P99 API latency

**Post-launch targets (Month 7):**
- 50K DAU
- 300K MAU by Month 9
- $100K platform revenue (payout fees + Stripe fees)
- 5K active creators
- $0.25B GMV (gross payout volume)

---

## 5. Out of Scope Details for MVP

**These features explicitly DELAYED to V1+:**
- Live streaming (complex encoding, moderation)
- Creator verification tiers (require KYC integration)
- Brand marketplace (advertiser self-serve complex)
- Creator subscriptions (paywall technology)
- Advanced recommendations (ML model requires data)
- Cryptocurrency integration (add compliance complexity)
- Creator funds (marketing budget allocation model?)
- Direct messaging (social graph, spam risk)
- Creator collaboration tools (duets, stitches)

---

## 6. Testing Strategy

**Unit Testing:** 80%+ coverage for critical paths (auth, payouts, engagement calculation)

**Integration Testing:** 
- Video upload → transcoding → feed population
- Engagement → reward calculation → wallet update
- Payout calculation → Stripe submission

**E2E Testing (Selenium/Nightwatch):**
- User signup → watch video → earn → withdraw
- Creator upload → monitor analytics → receive payout

**Load Testing:** 10K concurrent users, 100 requests per user per session

---

**Status:** Ready for development team | **Next Step:** Sprint planning & task breakdown

