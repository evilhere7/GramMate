# Financial Security

Financial writes belong to trusted server logic, verified provider webhooks, admin workflows, or controlled database functions. Browser code may read a user's permitted records but must not set balances, confirm payments, change payout status, or calculate final allocations.

## Controls

- Supabase RLS protects user-owned wallet, subscription, payout, and points reads.
- Admin-only policies protect revenue, webhook event records, advertising revenue, provider settings, and financial audit logs.
- Provider webhook signatures are verified before event storage.
- Provider/event IDs and financial idempotency keys are unique.
- Historical financial records are corrected with reversals or adjustments, not silent edits.
- Service-role and provider secrets are server-only.
- Development mode must never be presented as production money.

## Launch checklist

- [ ] Provider country/business eligibility verified
- [ ] Production secrets configured outside the repository
- [ ] Migrations applied and RLS tested with real sessions
- [ ] Webhook signature and replay tests passed
- [ ] Settlement and payout jobs deployed
- [ ] Refund, chargeback, and failed payout paths tested
- [ ] Reconciliation and admin review process operational
- [ ] All monetization and automatic payout flags explicitly enabled by an authorized admin
