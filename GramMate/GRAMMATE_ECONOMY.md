# GramMate Economy

GramMate's economy is designed around real platform revenue.

Revenue must enter GramMate through a trusted server, admin workflow, payment webhook, advertising integration, or marketplace provider before it can be distributed. The frontend must never create money, approve withdrawals, confirm provider payments, or calculate final user payouts.

## Revenue Model

Supported revenue categories are prepared for:

- Advertising
- Premium subscriptions
- Creator subscriptions
- Tips
- Marketplace transactions
- Business campaigns
- Sponsored content
- Premium services
- Other approved revenue

Each confirmed revenue item is stored in `platform_revenue` with gross amount, fees, generated net amount, status, source reference, metadata, and an idempotency key.

## Revenue Pools

Net distributable revenue is allocated into:

- Creator pool
- Viewer reward pool
- Platform reserve

The configurable `pool_allocations` setting defaults to 70%, 10%, and 20%. The migration validates that percentages are non-negative, no greater than 100, and total exactly 100.

## Creator Revenue Sharing

Creator revenue sharing is proportional, not fixed per view. A monthly settlement uses confirmed revenue, pool allocation snapshots, and creator score snapshots to create `creator_earnings` rows and wallet ledger transactions.

Default creator score weights are stored in `economy_settings`:

- Qualified watch time: 50%
- Viewer retention: 20%
- Meaningful engagement: 15%
- Returning viewers: 10%
- Shares and saves: 5%

These weights are settings, not hard-coded payout promises.

## Viewer Rewards

Viewer rewards are based on legitimate participation and the available viewer reward pool. Points are stored separately from cash and are not a guaranteed currency balance.

Default viewer controls include:

- Daily points limit
- Monthly points limit
- Point-to-currency estimate
- Minimum redemption
- Reward cooldown

Cash values shown for viewer rewards must be treated as estimates until a settlement confirms them.

## Qualified Views

Qualified view settings include minimum watch seconds, minimum percent watched, maximum risk score, and same-viewer cooldown. Viewing a video does not automatically create money. Qualified activity only contributes to a future proportional settlement after real revenue exists.

## Wallet Ledger

`wallets` stores summary balances:

- `available_cents`
- `pending_cents`
- `risk_hold_cents`
- `lifetime_earned_cents`
- `lifetime_withdrawn_cents`
- `lifetime_rewards_cents`
- `points_balance`
- `points_lifetime_earned`

`wallet_transactions` is the auditable append-only ledger for credits, debits, points, holds, reversals, refunds, adjustments, and source references. Completed ledger rows should not be silently edited; use reversal transactions.

## Withdrawals

Withdrawals are request-only until a payout provider is configured.

The `request_wallet_withdrawal` database function checks:

- Authenticated user
- `withdrawals_enabled` feature flag
- Minimum withdrawal
- Available balance
- Idempotency

It creates a `withdrawal_requests` row, creates a hold ledger transaction, and moves funds from available balance into risk hold. It does not pay money externally.

Do not store card numbers, passwords, private bank credentials, or payment secrets in the frontend or database.

## Fraud Prevention

The schema includes `fraud_events`, risk scores, fraud statuses, reward event risk scores, score fraud statuses, and withdrawal review states. Suspicious activity should be reviewed by admins before irreversible action.

Fraud statuses:

- normal
- review
- restricted
- blocked

## Feature Flags

The `feature_flags` setting defaults all monetization products to disabled:

- `creator_revenue_sharing_enabled`
- `viewer_rewards_enabled`
- `tips_enabled`
- `creator_subscriptions_enabled`
- `referrals_enabled`
- `marketplace_enabled`
- `advertising_enabled`
- `withdrawals_enabled`

Keep unfinished or unintegrated systems disabled in production.

## Payment Status

Current status:

- Actually integrated: none
- Configured but inactive: none
- Architecture only: advertising, tips, creator subscriptions, sponsored campaigns, referrals, marketplace, withdrawals, revenue settlement
- Not implemented: provider webhooks, real ad network ingestion, real payout provider execution, KYC/tax collection, legal agreement acceptance

Prepared provider status keys:

- Stripe
- PayPal
- eSewa
- Khalti
- Bank transfer
- Advertising provider

## Supabase Setup

Run migrations in order:

1. `supabase/migrations/202606160001_profile_video_uploads.sql`
2. `supabase/migrations/202606260002_admin_panel_tables.sql`
3. `supabase/migrations/202609130001_creator_viewer_economy.sql`

The economy migration is additive. It creates missing tables and extends existing wallets without deleting user or video data.

## Environment Variables

Frontend-safe variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Server-only future variables:

- Supabase service role key
- Payment provider secret keys
- Payment webhook secrets
- Payout provider credentials
- Advertising provider credentials
- Tax/KYC provider credentials

Never expose server-only secrets through Vite variables.

## Deployment Notes

Before real-money distribution:

- Use server-side jobs or edge functions for settlements.
- Use provider webhooks for payment confirmation.
- Add provider idempotency keys and webhook replay protection.
- Configure payout provider verification.
- Add KYC, tax, and age policy flows where legally required.
- Publish creator monetization terms, payout rules, refund policy, privacy policy, and fraud policy.
- Verify RLS with real Supabase-authenticated sessions or signed custom JWTs that map Firebase identity to Supabase `auth.uid()`.

## Current Frontend

Added screens:

- `/wallet`: cash wallet, points, ledger, withdrawal readiness
- `/earnings`: creator earnings, score formula, eligibility settings
- `/rewards`: viewer points, estimates, reward score, activity history
- `/admin` economy tab: confirmed revenue, allocations, feature flags, provider status, review queues

Empty states intentionally show no fake data.
