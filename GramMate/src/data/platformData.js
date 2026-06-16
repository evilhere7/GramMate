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

export const uploadChecklist = [
  'MP4, MOV, or WebM up to 1GB',
  'Auto thumbnail generated after processing',
  'Manual thumbnail, categories, and visibility controls',
  'Compression queue and moderation scan before distribution',
];

export const securityPillars = [
  { title: 'Session controls', copy: 'Email verification, password reset, device list, and one-click session revoke.', icon: UserCheck },
  { title: 'Reward integrity', copy: 'View quality, watch duration, traffic source, and campaign eligibility checks.', icon: ShieldCheck },
  { title: 'Operational review', copy: 'Manual queues for reports, creator payouts, fraud holds, and support tickets.', icon: CheckCircle2 },
  { title: 'Growth analytics', copy: 'Creator, viewer, revenue, and retention analytics share a single trusted model.', icon: LineChart },
  { title: 'Human support', copy: 'Escalations, appeal history, payout notes, and internal audit logs are captured.', icon: MessageCircle },
  { title: 'Creator tooling', copy: 'Scheduled uploads, thumbnail workflow, category targeting, and sponsor readiness.', icon: Sparkles },
];

