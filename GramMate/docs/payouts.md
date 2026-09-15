# Payouts

Payouts are provider operations, not withdrawal confirmations. A withdrawal request may place funds on hold, but the wallet is marked paid only after a verified provider event confirms payment.

## Required checks

Before creating a payout, verify:

- user eligibility and good standing
- available balance and minimum threshold
- connected payout account and provider verification
- no fraud hold or concurrent payout
- unique settlement/user idempotency key
- supported country and currency

The `payout_accounts` and `payouts` tables store provider IDs, statuses, failure details, and idempotency keys without storing bank credentials. Failed or reversed payouts must create auditable reversal records rather than editing historical transactions.

The default schedule is monthly and automatic payouts remain disabled until a real provider, webhook handler, settlement job, reconciliation job, and operational review process are configured.
