/**
 * GramMate Frontend Architecture
 * Production-grade folder structure and routing
 */

// ============================================================
// FOLDER STRUCTURE
// ============================================================

/*
frontend/
├── public/
│   ├── images/
│   ├── icons/
│   ├── videos/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── feed/
│   │   │   │   └── page.tsx
│   │   │   ├── explore/
│   │   │   │   └── page.tsx
│   │   │   ├── creator/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── studio/
│   │   │   │       ├── dashboard/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── upload/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── analytics/
│   │   │   │           └── page.tsx
│   │   │   ├── wallet/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── payouts/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── transactions/
│   │   │   │       └── page.tsx
│   │   │   ├── messages/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── account/
│   │   │   │   ├── security/
│   │   │   │   ├── privacy/
│   │   │   │   └── monetization/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx (default feed)
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── moderation/
│   │   │   │   └── page.tsx
│   │   │   ├── payouts/
│   │   │   │   └── page.tsx
│   │   │   ├── fraud/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx (root)
│   │   └── page.tsx (landing)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── SkeletonLoader.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StatusIndicator.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── MiniPlayer.tsx
│   │   │   └── FloatingActionButton.tsx
│   │   ├── feed/
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoFeed.tsx
│   │   │   ├── CreatorCard.tsx
│   │   │   ├── FeedOverlay.tsx
│   │   │   ├── CommentsDrawer.tsx
│   │   │   └── ReactionBubbles.tsx
│   │   ├── creator/
│   │   │   ├── CreatorProfile.tsx
│   │   │   ├── CreatorStats.tsx
│   │   │   ├── CreatorPortfolio.tsx
│   │   │   └── SubscribeButton.tsx
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── WithdrawalForm.tsx
│   │   │   ├── EarningsChart.tsx
│   │   │   └── PayoutMethodCard.tsx
│   │   ├── upload/
│   │   │   ├── VideoUploader.tsx
│   │   │   ├── ThumbnailEditor.tsx
│   │   │   ├── MetadataForm.tsx
│   │   │   └── MonetizationSettings.tsx
│   │   └── admin/
│   │       ├── UserManagementTable.tsx
│   │       ├── ModerationQueue.tsx
│   │       ├── FraudDetectionDash.tsx
│   │       └── PayoutApprovalFlow.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFeed.ts
│   │   ├── useWallet.ts
│   │   ├── useUpload.ts
│   │   ├── useNotifications.ts
│   │   ├── useRealtime.ts
│   │   └── useMediaOptimization.ts
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── feed.store.ts
│   │   ├── wallet.store.ts
│   │   ├── ui.store.ts
│   │   └── notifications.store.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── feed.service.ts
│   │   ├── wallet.service.ts
│   │   ├── upload.service.ts
│   │   ├── realtime.service.ts
│   │   └── analytics.service.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── media.utils.ts
│   │   └── performance.utils.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   ├── video.types.ts
│   │   ├── wallet.types.ts
│   │   └── ui.types.ts
│   ├── design-system/
│   │   ├── tokens.ts
│   │   ├── components.css
│   │   └── animations.css
│   ├── middleware.ts
│   ├── config.ts
│   └── providers.tsx
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── .env.local
*/

// ============================================================
// ROUTING ARCHITECTURE (App Router)
// ============================================================

export const ROUTES = {
  // Public
  landing: '/',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  
  // Protected - App
  feed: '/feed',
  explore: '/explore',
  creatorStudio: '/creator/studio',
  uploadVideo: '/creator/studio/upload',
  analytics: '/creator/studio/analytics',
  profile: (id: string) => `/creator/${id}`,
  wallet: '/wallet',
  transactions: '/wallet/transactions',
  payouts: '/wallet/payouts',
  messages: '/messages',
  notifications: '/notifications',
  settings: '/settings',
  settingsSecurity: '/settings/security',
  settingsPrivacy: '/settings/privacy',
  settingsMonetization: '/settings/monetization',
  
  // Protected - Admin
  adminDashboard: '/admin',
  adminUsers: '/admin/users',
  adminModeration: '/admin/moderation',
  adminPayouts: '/admin/payouts',
  adminFraud: '/admin/fraud',
};

// ============================================================
// STATE MANAGEMENT (Zustand)
// ============================================================

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface FeedState {
  videos: Video[];
  isLoading: boolean;
  hasMore: boolean;
  cursor: string | null;
  fetchFeed: () => Promise<void>;
  fetchMoreVideos: () => Promise<void>;
  likeVideo: (videoId: string) => Promise<void>;
  saveVideo: (videoId: string) => Promise<void>;
}

export interface WalletState {
  balance: number;
  pendingBalance: number;
  transactions: Transaction[];
  isLoading: boolean;
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  initiateWithdrawal: (amount: number, method: string) => Promise<void>;
}

export interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  modalOpen: string | null;
  notificationOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

// ============================================================
// API ARCHITECTURE
// ============================================================

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    firebaseLogin: '/auth/firebase-login',
    verify2FA: '/auth/verify-2fa',
    refreshToken: '/auth/refresh',
  },
  
  // Feed
  feed: {
    list: '/feed',
    trending: '/feed/trending',
    explore: '/feed/explore',
    recommendations: '/feed/recommendations',
  },
  
  // Videos
  videos: {
    get: (id: string) => `/videos/${id}`,
    upload: '/videos/upload',
    complete: '/videos/upload/complete',
    process: (id: string) => `/videos/${id}/process`,
    analytics: (id: string) => `/videos/${id}/analytics`,
    like: (id: string) => `/videos/${id}/like`,
    unlike: (id: string) => `/videos/${id}/unlike`,
    save: (id: string) => `/videos/${id}/save`,
    comment: (id: string) => `/videos/${id}/comments`,
  },
  
  // Users/Creators
  creators: {
    get: (id: string) => `/creators/${id}`,
    profile: '/creators/me',
    follow: (id: string) => `/creators/${id}/follow`,
    unfollow: (id: string) => `/creators/${id}/unfollow`,
    verify: (id: string) => `/creators/${id}/verify`,
  },
  
  // Wallet
  wallet: {
    balance: '/wallet/balance',
    transactions: '/wallet/transactions',
    withdraw: '/wallet/withdraw',
    methods: '/wallet/methods',
    addMethod: '/wallet/methods',
  },
  
  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    moderate: '/admin/moderate',
    payouts: '/admin/payouts',
    fraud: '/admin/fraud',
  },
};

// ============================================================
// HOOK PATTERNS
// ============================================================

export const HOOK_PATTERNS = {
  // useAuth - handles login, signup, session
  // useAuth: () => { user, token, login(), signup(), logout() }
  
  // useFeed - infinite scroll, video fetching, caching
  // useFeed: () => { videos, isLoading, hasMore, loadMore() }
  
  // useWallet - balance, transactions, withdrawals
  // useWallet: () => { balance, transactions, withdraw() }
  
  // useRealtime - WebSocket connections
  // useRealtime: (channel) => { data, subscribe(), unsubscribe() }
  
  // useMediaOptimization - video preload, quality selection
  // useMediaOptimization: () => { quality, bandwidth, preloadVideo() }
  
  // useNotifications - realtime notifications and toasts
  // useNotifications: () => { notifications, add(), remove() }
};

// ============================================================
// PERFORMANCE OPTIMIZATION
// ============================================================

export const PERFORMANCE_STRATEGY = {
  // Code splitting
  codeSplitting: {
    feed: 'dynamic import on demand',
    admin: 'lazy load admin routes',
    components: 'split large components',
  },
  
  // Image optimization
  images: {
    avatars: { width: 64, height: 64, quality: 80 },
    thumbnails: { width: 320, height: 180, quality: 85 },
    banners: { width: 1200, height: 300, quality: 80 },
  },
  
  // Video optimization
  videos: {
    preload: 'next video while current plays',
    quality: 'adaptive bitrate streaming',
    caching: 'service worker + local cache',
  },
  
  // API optimization
  api: {
    caching: 'TanStack Query with 5min revalidation',
    pagination: 'cursor-based with limit',
    compression: 'gzip enabled',
  },
};
