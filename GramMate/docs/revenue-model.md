# Revenue Model

Only confirmed external revenue may enter GramMate's distributable economy.

Supported sources include premium subscriptions, tips, creator subscriptions, marketplace transactions, sponsored campaigns, and confirmed advertising revenue. Stripe revenue and advertising-network revenue are separate ingestion paths; advertising revenue is never inferred from frontend impressions.

Confirmed revenue is recorded in `platform_revenue` or `ad_revenue` with provider references, fees, taxes or adjustments, currency, status, and idempotency. Net distributable revenue is split using the validated `pool_allocations` setting. Refunds and chargebacks require reversal entries and must never delete the original revenue record.
