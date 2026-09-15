# Payments

GramMate treats Supabase as the financial source of truth and providers as external payment processors. The backend payment layer is provider-based; Stripe is the initial adapter, but the application does not assume Stripe or Connect is available in every country.

## Current implementation

- Stripe Connect account onboarding endpoints exist in the backend.
- Stripe webhook signatures are verified using the raw request body.
- Verified webhook event IDs are stored in `payment_webhook_events` and duplicate events are ignored.
- Provider-confirmed revenue tables and subscription tables are created by `202609150002_financial_provider_foundation.sql`.
- No checkout, subscription activation, creator earning, or payout feature is enabled by default.

## Required server variables

- `PAYMENTS_MODE=development` or `production`
- `ACTIVE_PAYMENT_PROVIDER=stripe`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_RETURN_URL`
- `STRIPE_REFRESH_URL`

Secret variables must exist only on the server. Never use them as `VITE_` variables.

## Production gate

Before enabling any payment flag, verify business registration/provider availability, pricing and tax rules, signed webhook delivery, Supabase migrations and RLS, reconciliation, refund handling, and a provider test transaction in the intended country and currency.
