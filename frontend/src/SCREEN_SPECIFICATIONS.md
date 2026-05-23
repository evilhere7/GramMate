/**
 * GramMate Screen Layouts & Page Structures
 * Figma-level detail for all major screens
 */

// ============================================================
// 1. LOGIN PAGE LAYOUT
// ============================================================
/*
VIEWPORT: 1920x1080 (desktop) / 390x844 (mobile)
BACKGROUND: Dark gradient from #05070F to #1E2637
GLASS EFFECT: Enabled

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ SPLIT SCREEN (Desktop) / FULL SCREEN (Mobile)               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LEFT SIDE (50% desktop / hidden mobile)    RIGHT SIDE (50%) │
│  ───────────────────────────────────────     ─────────────── │
│  • Hero content                               │               │
│  • Brand story                                │  Login Form    │
│  • Creator earnings preview                   │  • Email       │
│  • Social proof metrics                       │  • Password    │
│  • Animated background                       │  • 2FA opt-in  │
│  • Floating UI elements                      │  • CTA         │
│                                               │  • Socials     │
│                                               │  • Footer link │
│                                               │               │
│                                               │               │
└─────────────────────────────────────────────────────────────┘

COMPONENTS:
- HeroSection (left)
  - GramMate branding + animated logo
  - "Earn while you watch" headline
  - Creator testimonials carousel
  - Earnings metrics: "$2.1M paid to creators"
  - Trust badges: "Secure", "Verified", "Fast payouts"

- LoginForm (right)
  - Email input (prefilled if return user)
  - Password input with strength meter
  - 2FA reminder banner
  - Login button (primary action)
  - Divider: "Or continue with"
  - Social buttons row: Google / Facebook / Apple
  - Footer: "New to GramMate? Sign up" link

ANIMATIONS:
- Entry: form slides in from right (0.5s ease-out)
- Hero background: subtle parallax on scroll
- Social proof: staggered fade-in (150ms interval)
- Testimonials: auto-advance every 5s

RESPONSIVE BEHAVIOR (Mobile):
- 100% width with padding
- Hero hides, focus on form
- Form expands full screen
- Social buttons stack
- Font sizes reduce

STATES:
- Loading: button shows spinner, form disabled
- Error: red glow, error message below field
- Success: green glow, redirect spinner
- 2FA enabled: additional code input field
*/

// ============================================================
// 2. HOME FEED PAGE LAYOUT
// ============================================================
/*
VIEWPORT: Full screen
BACKGROUND: #05070F
LAYOUT: 3-column (desktop) / 1-column (mobile) / 2-column (tablet)

LAYOUT STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│ HEADER / NAVIGATION                                         │
├──────────┬────────────────────────────┬──────────────────────┤
│          │                            │                      │
│ SIDEBAR  │   MAIN FEED AREA           │  SIDE PANEL          │
│          │                            │  (Trending/Recs)     │
│          │  ┌──────────────────────┐ │                      │
│ • Feed   │  │ Video Card 1         │ │  Trending Topics:    │
│ • Explore│  │ ┌────────────────────┤ │  • #CreatorTips      │
│ • Upload │  │ │ Creator Avatar     │ │  • #EarningBoost     │
│ • Studio │  │ │ Title              │ │                      │
│ • Wallet │  │ │ Engagement Overlay │ │  Recommended Creators│
│ • Profile│  │ │ Like/Comment/Share │ │  • @CreatorXYZ       │
│ • Settings│ │ │ Earnings: $38.20   │ │  • @TopCreator       │
│          │  │ └────────────────────┤ │                      │
│          │  │                        │ │  Sponsored Ad:       │
│          │  │ Video Card 2           │ │  (Glass card)        │
│          │  │ (Similar structure)    │ │                      │
│          │  │                        │ │  Notification Badge  │
│          │  │ Video Card 3           │ │  (animated)          │
│          │  │ (Skeleton on scroll)   │ │                      │
│          │  │                        │ │                      │
│          │  │ [INFINITE SCROLL]      │ │                      │
│          │  │                        │ │                      │
└──────────┴────────────────────────────┴──────────────────────┘

COMPONENTS:

SIDEBAR (Desktop only):
- GramMate logo + branding
- Navigation items with icons + labels
- Active state: purple underline + glow
- Bottom section: user avatar + profile menu
- Collapsible on <1024px

MAIN FEED:
- Category chips at top (scrollable)
  - For You (default)
  - Trending
  - Explore
  - Following
  - Creator Tools
- Video cards (infinite scroll)
  - Creator info (avatar, name, verified badge)
  - Video title
  - Thumbnail with play button
  - Engagement overlay:
    - Like count + heart icon
    - Comment count + chat icon
    - Share count + share icon
    - Save icon
    - "Earned $38.20" badge
  - Progress bar (watch progress)
  - Video duration + quality badge

SIDE PANEL (Desktop only):
- Sticky position
- Trending topics carousel
- Creator recommendations
- Sponsored content (native ad)
- Notification center preview
- Hide on <1280px

MOBILE LAYOUT:
- Full-width video cards
- Bottom tab bar:
  - Feed icon (active)
  - Explore icon
  - + Upload button (fab)
  - Messages icon
  - Profile icon
- Comments accessible via swipe-up
- Top sticky header with logo

ANIMATIONS:
- Card entry: fade-in + slide-up (250ms)
- Like button: heart bounce + glow (200ms)
- Infinite scroll: skeleton card fades to real card
- Tab switch: slide transition
- Video auto-play: volume fade-in

INTERACTIONS:
- Swipe up: open comments
- Swipe down: pull-to-refresh
- Long-press card: more options menu
- Double-tap: instant like
- Single-tap video: pause/play
*/

// ============================================================
// 3. CREATOR STUDIO / UPLOAD PAGE
// ============================================================
/*
LAYOUT STRUCTURE:
┌──────────────────────────────────────────────────────────────┐
│ HEADER: "Creator Studio" | Studio Stats | Help              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ UPLOAD SECTION                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ Drag & Drop Zone                                   │ │ │
│  │ │ "Drop video here or click to browse"               │ │ │
│  │ │ (Shows upload progress when active)                │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ METADATA FORM (Multi-step wizard)                       │ │
│  │                                                          │ │
│  │ Step 1: Basic Info                                       │ │
│  │ • Title field (max 255 char)                             │ │
│  │ • Description field (max 5000 char)                      │ │
│  │ • Category dropdown                                      │ │
│  │ • Thumbnail editor (with AI suggestion)                 │ │
│  │                                                          │ │
│  │ Step 2: Tags & AI Enhancement                           │ │
│  │ • Hashtag input (with suggestions)                       │ │
│  │ • AI-generated captions (selectable)                     │ │
│  │ • Copyright check status badge                           │ │
│  │                                                          │ │
│  │ Step 3: Monetization & Publish                          │ │
│  │ • Monetization toggle (if verified)                      │ │
│  │ • Audience targeting dropdown                            │ │
│  │ • Revenue estimator (shows $est)                         │ │
│  │ • Schedule publish (or publish now)                      │ │
│  │ • Brand partnership prompt                               │ │
│  │                                                          │ │
│  │ [Save Draft] [Preview] [Publish] (sticky buttons)       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘

UPLOAD PROGRESS INDICATOR:
┌─ Upload Status ─────────────────────┐
│ File: my-video.mp4 (248 MB)         │
│ [████████░░░░] 65% - 2m 34s         │
│ Status: Processing video codec...   │
│ [Cancel Upload]                     │
└─────────────────────────────────────┘

RESPONSIVE:
- Desktop: 2-column (upload on left, form on right)
- Tablet: Full width, stacked
- Mobile: Full width, single column, vertical flow

STATES:
- Empty: CTA to upload first video
- Uploading: progress bar + cancel option
- Processing: "Please wait, video is being processed"
- Review: "Video uploaded! Edit details below"
- Published: Success message + share options
- Error: Red banner with retry CTA

ANIMATIONS:
- Step progression: slide transition (300ms)
- AI suggestions: slide-in from right (200ms)
- Success checkmark: scale bounce (400ms)
*/

// ============================================================
// 4. WALLET / MONETIZATION DASHBOARD
// ============================================================
/*
LAYOUT STRUCTURE:
┌──────────────────────────────────────────────────────────────┐
│ HEADER: "Wallet & Earnings" | Time Range Filter             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ BALANCE HERO CARDS (3-column grid, mobile: 1-column)         │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│ │ Available      │ │ Pending        │ │ Total Earned   │    │
│ │ $2,847.32      │ │ $340.18        │ │ $18,420.56     │    │
│ │ ↓ Withdraw     │ │ Next payout: 3d│ │ ↑ +$48 today   │    │
│ └────────────────┘ └────────────────┘ └────────────────┘    │
│                                                               │
│ EARNINGS CHART (Glass card, full-width)                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Daily | Weekly | Monthly | Yearly                         │ │
│ │ $2500 ┐                                                    │ │
│ │       │    ╱─╲    ╱─╲                                      │ │
│ │ $2000 ├───╱   ╲──╱   ╲──                                  │ │
│ │       │  ╱           ╲  ╲                                  │ │
│ │ $1500 ├─╱               ╲                                  │ │
│ │       │                                                    │ │
│ │ May1 May5 May10 May15 May20 May25 May30                  │ │
│ │ [Revenue by source] [AI Insights]                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ REVENUE BREAKDOWN (Cards)                                    │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ Ad Revenue   │ │ Creator Bonus│ │ Tips/Support │          │
│ │ $1,250.50    │ │ $480.20      │ │ $240.60      │          │
│ │ 52%          │ │ 20%          │ │ 10%          │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                               │
│ PAYOUT METHODS (Editable)                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Active: Bank Transfer (****2847) [Default]               │ │
│ │ → Last withdrawal: $500 on May 22                         │ │
│ │                                                           │ │
│ │ Add payment method: [+ Stripe] [+ PayPal] [+ Crypto]    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ TRANSACTION HISTORY                                          │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Filters: [All] [Earnings] [Withdrawals] [Refunds]        │ │
│ │                                                           │ │
│ │ May 23 | Ad Revenue    | +$48.50  | Completed     ✓      │ │
│ │ May 22 | Withdrawal    | -$500.00 | Processing    ⏳      │ │
│ │ May 21 | Creator Bonus | +$240.00 | Completed     ✓      │ │
│ │ May 20 | Tip Received  | +$50.00  | Completed     ✓      │ │
│ │ May 19 | Refund        | -$24.00  | Completed     ✓      │ │
│ │                                                           │ │
│ │ [Load More Transactions]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘

WITHDRAWAL FLOW (Modal):
Step 1: Amount & Method
┌─────────────────────────────────┐
│ Withdraw Funds                  │
│                                 │
│ Amount: $ _______ [Max: $847.32]│
│ Method: [Bank Transfer ▼]       │
│ Fee: -$1.00 (Standard)          │
│ You'll receive: $846.32         │
│                                 │
│ [Cancel] [Continue]             │
└─────────────────────────────────┘

Step 2: Confirmation
┌─────────────────────────────────┐
│ Confirm Withdrawal              │
│                                 │
│ Amount: $846.32                 │
│ Account: ****2847               │
│ Processing time: 1-2 business d │
│                                 │
│ ✓ I confirm this withdrawal     │
│                                 │
│ [Cancel] [Confirm]              │
└─────────────────────────────────┘

RESPONSIVE:
- Desktop: Cards in grid, chart full-width
- Tablet: 2-column cards, chart below
- Mobile: 1-column, stacked, no chart (summary only)

STATES:
- Empty: CTA to make first earning
- Loading: skeleton cards while fetching
- Error: retry button + error message
- Withdrawal in progress: processing badge + timer
*/

// ============================================================
// 5. CREATOR PROFILE PAGE
// ============================================================
/*
LAYOUT STRUCTURE:
┌──────────────────────────────────────────────────────────────┐
│ BANNER (Hero image, desktop) / Avatar (mobile) + Creator Stats│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Profile Header                                         │  │
│ │ Avatar (128px) | Creator Name | Verified Badge        │  │
│ │                | @username    | Creator Badge         │  │
│ │                | Bio text...                           │  │
│ │                                                        │  │
│ │ [Subscribe] [Tip] [Message] [More Options]            │  │
│ │                                                        │  │
│ │ Stats Bar (scrollable on mobile):                      │  │
│ │ 245K Followers | 8.2M Views | $48K Earned | 3M Total │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ TABS / SECTIONS (sticky):                                    │
│ [Videos] [Playlists] [Community] [Store] [About]            │
│                                                               │
│ Videos Grid (adaptive):                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Video    │ │ Video    │ │ Video    │ │ Video    │         │
│ │ Thumb    │ │ Thumb    │ │ Thumb    │ │ Thumb    │         │
│ │ 2.3M ▶   │ │ 1.8M ▶   │ │ 892K ▶   │ │ 234K ▶   │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ Video    │ │ Video    │ │ Video    │                      │
│ │ Thumb    │ │ Thumb    │ │ Thumb    │                      │
│ │ 1.2M ▶   │ │ 567K ▶   │ │ 234K ▶   │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
│                                                               │
│ Community Tab (if creator has community):                    │
│ [Community Guidelines] [Posts] [Events]                      │
│ Recent posts, events, challenges                             │
│                                                               │
│ Store Tab (if creator has digital store):                    │
│ [Merchandise] [Courses] [Digital Products]                   │
│ Product grid with pricing                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘

RESPONSIVE:
- Desktop: 4-column video grid, full header
- Tablet: 3-column grid, condensed header
- Mobile: 2-column grid, minimal header with avatar

INTERACTIONS:
- Subscribe button: toggle + count update
- Tip button: opens modal with preset amounts
- Video card tap: opens mini player or redirects to video
- Profile menu: [Share] [Block] [Report] [Copy Link]

STATES:
- Your own profile: edit button instead of subscribe
- Unverified creator: pending verification badge
- Banned: "This creator's account is inactive"
- Private profile: "This account is private"
*/

// ============================================================
// 6. ADMIN DASHBOARD
// ============================================================
/*
LAYOUT STRUCTURE:
┌────────────┬─────────────────────────────────────────────────┐
│ ADMIN SIDE │ MAIN CONTENT AREA                               │
│ BAR        │                                                 │
├────────────┼─────────────────────────────────────────────────┤
│            │ HEADER: Admin Dashboard                         │
│ • Dashboard│ Time Range: [Last 24h ▼] | Refresh            │
│ • Users    │                                                 │
│ • Moderation
│ • Payouts  │ KPI CARDS (4-column)                            │
│ • Fraud    │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│ • Settings │ │Total   │ │Active  │ │ Revenue│ │Flagged│ │
│ • Reports  │ │Users   │ │Creators│ │ Today  │ │Videos │ │
│ • Analytics│ │245K    │ │8,340   │ │ $48.5K │ │ 127   │ │
│ • System   │ │↑ 2.3% │ │↑ 0.8% │ │ ↑ 12%  │ │ 7new  │ │
│ • Logs     │ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
│            │                                                 │
│            │ ALERT CARDS (scrollable)                        │
│            │ ┌──────────────────────────────────────────┐    │
│            │ │ 🚨 Fraud Alert: Unusual payout pattern │    │
│            │ │    User: #user_24581                    │    │
│            │ │    Action: [Review] [Freeze] [Dismiss]  │    │
│            │ └──────────────────────────────────────────┘    │
│            │                                                 │
│            │ REAL-TIME ACTIVITY LOG                          │
│            │ ┌──────────────────────────────────────────┐    │
│            │ │ 14:32 | User created account            │    │
│            │ │ 14:28 | Video flagged for review        │    │
│            │ │ 14:25 | Creator verified               │    │
│            │ │ 14:20 | Payment processed              │    │
│            │ │ 14:18 | Suspension - abuse report      │    │
│            │ └──────────────────────────────────────────┘    │
│            │                                                 │
│            │ TABS: [Overview] [Users] [Content] [Finance]   │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘

USER MANAGEMENT PAGE:
┌────────────────────────────────────────────────────────────┐
│ Users Management                                            │
│ [Filters: Status▼] [Role▼] [Verified▼] [Search...]        │
│                                                             │
│ Table:                                                      │
│ ID    | Name      | Email        | Status  | Joined  | Act │
│ 24581 │ John D.   │ john@...     │ Active  │ 5d ago  │ ... │
│ 24580 │ Creator*  │ creator@...  │ Active  │ 8d ago  │ ... │
│ 24579 │ Banned    │ banned@...   │ Banned  │ 12d ago │ ... │
│ 24578 │ Flagged   │ flag@...     │ Flagged │ 3d ago  │ ... │
│                                                             │
│ [Bulk Actions] [Export] [Load More]                         │
│                                                             │
│ Detail Modal (click user):                                  │
│ ┌─────────────────────────────────┐                         │
│ │ User ID: #24581                 │                         │
│ │ Name: John Doe                  │                         │
│ │ Email: john@example.com         │                         │
│ │ Status: [Active ▼]              │                         │
│ │ Role: Creator                   │                         │
│ │ Verified: Yes                   │                         │
│ │ Last Login: 2 hours ago         │                         │
│ │ Devices: 3 active sessions      │                         │
│ │ Revenue This Month: $4,230      │                         │
│ │ Flags: None                     │                         │
│ │                                 │                         │
│ │ Actions: [Verify] [Ban] [Block] │                         │
│ │ [View Transactions] [Close]     │                         │
│ └─────────────────────────────────┘                         │
└────────────────────────────────────────────────────────────┘

MODERATION QUEUE:
┌────────────────────────────────────────────────────────────┐
│ Moderation Queue                                            │
│ Filters: [All] [Videos] [Comments] [Users] [Reports]       │
│ [Priority: High▼] [Date Range: Last 7d▼]                   │
│                                                             │
│ Queue Items:                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Video: "Inappropriate content"                      │   │
│ │ Reporter: 12 users | Priority: High                 │   │
│ │ Video thumbnail + preview player                    │   │
│ │                                                      │   │
│ │ AI Confidence: 92% | Category: Explicit             │   │
│ │                                                      │   │
│ │ [Approve] [Reject] [Flag for human review]          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Comment: "Harassing user"                           │   │
│ │ Reporter: 3 users | Priority: Medium                │   │
│ │ Comment text + context                              │   │
│ │                                                      │   │
│ │ AI Confidence: 78% | Category: Harassment           │   │
│ │                                                      │   │
│ │ [Delete] [Approve] [Investigate]                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘

FRAUD DASHBOARD:
┌────────────────────────────────────────────────────────────┐
│ Fraud Detection System                                      │
│                                                             │
│ Risk Score: 7.2/10 [Rising ⬆️]                             │
│                                                             │
│ Top Anomalies:                                              │
│ • Unusual payout velocity (User #24512)                    │
│ • Mass account creation pattern (IP: 192.168.x.x)          │
│ • Video engagement spike (Video #45821)                    │
│ • Multiple devices, single user (User #24505)              │
│                                                             │
│ Fraud Rules: [Configure]                                   │
│ • Rule: Payout > $5K same-day [Enabled] [Alert]           │
│ • Rule: Account age < 7 days, payout > $100 [Enabled]    │
│ • Rule: 10+ videos uploaded < 1 hour [Enabled]            │
│                                                             │
│ Recent Blocked Transactions:                               │
│ • $10K payout blocked (high velocity) - User action       │
│ • $2.5K blocked (manual review pending) - Waiting        │
│ • $800 blocked (duplicate recipient) - Auto-blocked       │
│                                                             │
└────────────────────────────────────────────────────────────┘

PAYOUTS APPROVAL:
┌────────────────────────────────────────────────────────────┐
│ Payout Requests                                             │
│ [Pending] [Approved] [Rejected]                             │
│                                                             │
│ Pending (23 requests):                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ User: Creator_Jane | Amount: $5,230 | Method: Bank  │   │
│ │ Status: Awaiting verification | Risk: Low           │   │
│ │ Documents: ✓ Tax Form ✓ ID                          │   │
│ │ [Approve] [Request More Info] [Reject]              │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘

RESPONSIVE:
- Desktop: Full sidebar + main content
- Tablet: Collapsible sidebar
- Mobile: Bottom tab navigation, card-based layout
*/
