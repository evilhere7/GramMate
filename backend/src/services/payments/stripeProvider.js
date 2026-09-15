import Stripe from 'stripe';

export function createStripeProvider(secretKey) {
  if (!secretKey) return null;
  const stripe = new Stripe(secretKey);

  return {
    name: 'stripe',
    createConnectedAccount({ email, metadata = {} }) {
      return stripe.accounts.create({
        type: 'express',
        email,
        metadata,
        capabilities: { transfers: { requested: true } },
      });
    },
    createAccountLink(params) {
      return stripe.accountLinks.create(params);
    },
    getConnectedAccountStatus(accountId) {
      return stripe.accounts.retrieve(accountId);
    },
    createCheckout(params, options = {}) {
      return stripe.checkout.sessions.create(params, options);
    },
    getCheckoutSession(sessionId, options = {}) {
      return stripe.checkout.sessions.retrieve(sessionId, options);
    },
    createSubscription(params, options = {}) {
      return stripe.subscriptions.create(params, options);
    },
    getSubscription(subscriptionId) {
      return stripe.subscriptions.retrieve(subscriptionId);
    },
    cancelSubscription(subscriptionId) {
      return stripe.subscriptions.cancel(subscriptionId);
    },
    createPayout(params, options = {}) {
      return stripe.payouts.create(params, options);
    },
    getPayoutStatus(payoutId) {
      return stripe.payouts.retrieve(payoutId);
    },
    refundPayment(params, options = {}) {
      return stripe.refunds.create(params, options);
    },
    verifyWebhook(payload, signature, secret) {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    },
  };
}