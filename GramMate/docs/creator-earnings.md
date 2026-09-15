# Creator Earnings

Creator earnings are revenue-backed allocations, not fixed payment per view. Qualified activity contributes to a score; it does not create cash by itself.

`creator allocation = confirmed creator pool x creator score / total eligible creator score`

The creator pool and score weights are stored in `economy_settings`. Earnings should remain pending until the settlement, eligibility, fraud, refund, and chargeback windows complete. Every balance change must have an immutable `wallet_transactions` record with an idempotency key.

No confirmed platform revenue means no creator cash earnings. Empty balances are correct and must not be populated with demo values.
