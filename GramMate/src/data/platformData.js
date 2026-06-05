import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FileVideo,
  Flag,
  Gift,
  Heart,
  LineChart,
  LockKeyhole,
  MessageCircle,
  PlaySquare,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';

export const videos = [
  {
    id: 'city-food',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Street food tour in 60 seconds',
    creator: 'Maya Chen',
    handle: 'mayaeats',
    category: 'Food',
    description: 'A quick walk through a night market menu: dumplings, noodles, and the best mango stand.',
    likes: '124K',
    comments: '4.2K',
    shares: '12K',
    saves: '18K',
    rewardRate: '$0.02/min',
    duration: '0:58',
    verified: true,
  },
  {
    id: 'studio-workflow',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'How I plan a creator shoot',
    creator: 'Jon Bell',
    handle: 'joncreates',
    category: 'Creator Tips',
    description: 'A practical look at scripting, light checks, and thumbnail notes before filming.',
    likes: '89K',
    comments: '1.1K',
    shares: '5K',
    saves: '9K',
    rewardRate: '$0.015/min',
    duration: '1:12',
    verified: false,
  },
  {
    id: 'finance-basics',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'Creator taxes: three basics',
    creator: 'Ari Lane',
    handle: 'ari.money',
    category: 'Finance',
    description: 'Separate accounts, tracked expenses, and payout reserves explained simply.',
    likes: '210K',
    comments: '8.7K',
    shares: '31K',
    saves: '44K',
    rewardRate: '$0.018/min',
    duration: '0:47',
    verified: true,
  },
];

export const landingSections = [
  {
    title: 'Watch',
    copy: 'A fast video feed with transparent watch rewards and clear campaign eligibility.',
    icon: Eye,
  },
  {
    title: 'Create',
    copy: 'Upload short or long videos, schedule releases, publish thumbnails, and track growth.',
    icon: UploadCloud,
  },
  {
    title: 'Earn',
    copy: 'Combine ad revenue share, tips, donations, sponsorships, and viewer reward programs.',
    icon: BadgeDollarSign,
  },
];

export const platformFeatures = [
  { label: 'Short and long video', icon: PlaySquare },
  { label: 'Trending, recommended, and search feeds', icon: Search },
  { label: 'Creator analytics and upload manager', icon: BarChart3 },
  { label: 'Tips, donations, campaigns, and sponsorships', icon: Gift },
  { label: 'Wallet, withdrawals, and transaction history', icon: Wallet },
  { label: 'Reports, blocks, and moderation workflows', icon: Flag },
];

export const trustFeatures = [
  'Fake view detection',
  'Bot and spam scoring',
  'Multi-account risk checks',
  'AI plus manual moderation',
  'Withdrawal review rules',
  'Audit trails for sensitive changes',
];

export const faqs = [
  {
    q: 'How do viewers earn?',
    a: 'Viewers earn from eligible watch, engagement, and campaign rewards after quality and fraud checks clear.',
  },
  {
    q: 'How do creators earn?',
    a: 'Creators can earn through ad revenue sharing, tips, donations, campaign bonuses, and sponsorship marketplace deals.',
  },
  {
    q: 'Are rewards instant?',
    a: 'Balances update quickly, but withdrawals use clearing windows, compliance checks, and platform risk review.',
  },
  {
    q: 'What keeps rewards fair?',
    a: 'GramMate uses rate limits, device signals, view-quality scoring, report queues, and admin review before payouts.',
  },
];

export const creatorStats = [
  { label: 'Watch time', value: '18,420 hrs', delta: '+12.4%', icon: Clock3 },
  { label: 'Revenue', value: '$24,860', delta: '+8.1%', icon: BadgeDollarSign },
  { label: 'Engagement', value: '9.8%', delta: '+2.0%', icon: Heart },
  { label: 'Audience', value: '142K', delta: '+18.7%', icon: Users },
];

export const uploadChecklist = [
  'MP4, MOV, or WebM up to 1GB',
  'Auto thumbnail generated after processing',
  'Manual thumbnail, categories, and visibility controls',
  'Compression queue and moderation scan before distribution',
];

export const adminStats = [
  { label: 'Total users', value: '45,231', icon: Users, trend: '+6.2%' },
  { label: 'Videos reviewed', value: '18,904', icon: FileVideo, trend: '98.2% SLA' },
  { label: 'Open reports', value: '23', icon: Flag, trend: '-14.0%' },
  { label: 'Risk holds', value: '$12,450', icon: LockKeyhole, trend: '42 cases' },
];

export const moderationQueue = [
  { item: 'Video #8a9b2', reason: 'Suspicious engagement velocity', score: 92, action: 'Hold rewards' },
  { item: '@boost_loop', reason: 'Device cluster overlap', score: 88, action: 'Review accounts' },
  { item: 'Comment burst', reason: 'Repeated spam phrases', score: 77, action: 'Limit comments' },
];

export const walletTransactions = [
  { type: 'Watch reward', amount: '+$4.18', status: 'Cleared', date: 'Today' },
  { type: 'Creator ad share', amount: '+$842.30', status: 'Pending', date: 'Yesterday' },
  { type: 'Withdrawal', amount: '-$1,200.00', status: 'Review', date: 'May 28' },
  { type: 'Tip from @northstar', amount: '+$25.00', status: 'Cleared', date: 'May 27' },
];

export const securityPillars = [
  { title: 'Session controls', copy: 'Email verification, password reset, device list, and one-click session revoke.', icon: UserCheck },
  { title: 'Reward integrity', copy: 'View quality, watch duration, traffic source, and campaign eligibility checks.', icon: ShieldCheck },
  { title: 'Operational review', copy: 'Manual queues for reports, creator payouts, fraud holds, and support tickets.', icon: CheckCircle2 },
  { title: 'Growth analytics', copy: 'Creator, viewer, revenue, and retention analytics share a single trusted model.', icon: LineChart },
  { title: 'Human support', copy: 'Escalations, appeal history, payout notes, and internal audit logs are captured.', icon: MessageCircle },
  { title: 'Creator tooling', copy: 'Scheduled uploads, thumbnail workflow, category targeting, and sponsor readiness.', icon: Sparkles },
];
