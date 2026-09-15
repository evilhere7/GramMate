# Production Money Checklist

Do not enable real-money features until every item is complete:

- [ ] Business and payment-provider availability verified for the operating country
- [ ] Provider account approved and payout capabilities enabled
- [ ] `PAYMENTS_MODE=production` set server-side
- [ ] Stripe secret and webhook signing secrets configured server-side
- [ ] Supabase service-role key configured server-side and never exposed to Vite
- [ ] All Supabase migrations applied in order
- [ ] RLS verified for normal users and admin sessions
- [ ] Webhook endpoint configured and signature/replay tests passed
- [ ] Subscription, tip, refund, chargeback, and payout event handling tested
- [ ] Settlement, payout, and reconciliation jobs scheduled
- [ ] Fraud review and support procedures documented
- [ ] Minimum withdrawal, currencies, countries, fees, and pool allocations reviewed
- [ ] Test payout completed in provider test mode
- [ ] Production feature flags enabled gradually, starting with one product
