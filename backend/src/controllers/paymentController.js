import { PrismaClient } from '@prisma/client';
import config from '../config.js';
import { getPaymentProvider } from '../services/payments/index.js';
import { markWebhookProcessed, recordWebhookEvent } from '../services/payments/supabaseFinancialService.js';
import {
  getActiveSubscriptionPlan,
  getProfileForPayment,
  getTipByProviderReference,
  insertCheckoutTip,
  insertNotification,
  recordPlatformRevenue,
  recordPointsActivity,
  recordSubscriptionFromStripe,
  recordQualifiedView,
  syncPayoutAccount,
  updatePayoutFromProvider,
  updateTipFromCheckout,
} from '../services/payments/financialOperations.js';
import { runCreatorSettlement } from '../services/payments/settlementService.js';
import { processAutomaticPayout } from '../services/payments/payoutService.js';

const prisma = new PrismaClient();
function requireProvider() {
  const provider = getPaymentProvider();
  if (!provider) {
    const error = new Error('Stripe Connect is not configured on the server.');
    error.status = 503;
    throw error;
  }
  return provider;
}

function serializeAccount(account) {
  return {
    id: account.id,
    status: account.details_submitted ? 'onboarding_complete' : 'onboarding_required',
    detailsSubmitted: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    requirementsDue: account.requirements?.currently_due || [],
  };
}

function requirePositiveMinorAmount(value, maximum = 1000000) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > maximum) {
    const error = new Error('Invalid payment amount.');
    error.status = 400;
    throw error;
  }
  return amount;
}

export async function createSubscriptionCheckout(req, res) {
  const provider = requireProvider();
  const financialUserId = req.user.financialId;
  const { planId } = req.body || {};
  if (!planId) return res.status(400).json({ message: 'A subscription plan is required.' });

  const [plan, profile] = await Promise.all([
    getActiveSubscriptionPlan(planId),
    getProfileForPayment(financialUserId),
  ]);
  if (!plan || !plan.provider_price_id) {
    return res.status(404).json({ message: 'The selected subscription plan is unavailable.' });
  }
  if (!profile) return res.status(404).json({ message: 'Payment profile not found.' });

  const session = await provider.createCheckout({
    mode: 'subscription',
    customer_email: profile.email,
    line_items: [{ price: plan.provider_price_id, quantity: 1 }],
    client_reference_id: financialUserId,
    metadata: { grammate_user_id: financialUserId, plan_id: plan.id },
    subscription_data: { metadata: { grammate_user_id: financialUserId, plan_id: plan.id } },
    success_url: `${config.frontendUrl.replace(/\/$/, '')}/payment-status?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl.replace(/\/$/, '')}/premium?payment=canceled`,
  });

  return res.json({ sessionId: session.id, url: session.url });
}

export async function createTipCheckout(req, res) {
  const provider = requireProvider();
  const financialUserId = req.user.financialId;
  const { creatorId, amountCents } = req.body || {};
  if (!creatorId || creatorId === financialUserId) {
    return res.status(400).json({ message: 'You cannot tip yourself.' });
  }
  const amount = requirePositiveMinorAmount(amountCents, 100000);
  const profile = await getProfileForPayment(financialUserId);
  if (!profile) return res.status(404).json({ message: 'Payment profile not found.' });

  const platformFeeCents = Math.floor(amount * 0.2);
  const creatorAmountCents = amount - platformFeeCents;
  const session = await provider.createCheckout({
    mode: 'payment',
    customer_email: profile.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'GramMate creator tip' },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    client_reference_id: financialUserId,
    metadata: {
      grammate_user_id: financialUserId,
      creator_id: creatorId,
      platform_fee_cents: String(platformFeeCents),
      creator_amount_cents: String(creatorAmountCents),
    },
    success_url: `${config.frontendUrl.replace(/\/$/, '')}/payment-status?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl.replace(/\/$/, '')}/profile/${creatorId}?tip=canceled`,
  });

  await insertCheckoutTip({
    senderId: financialUserId,
    creatorId,
    amountCents: amount,
    currency: 'USD',
    providerReference: session.id,
    platformFeeCents,
    creatorAmountCents,
  });
  return res.json({ sessionId: session.id, url: session.url });
}

async function syncStripeAccount(userId, account) {
  const completed = Boolean(account.details_submitted && account.payouts_enabled);
  return prisma.user.update({
    where: { id: userId },
    data: {
      stripeAccountId: account.id,
      stripeAccountStatus: completed ? 'active' : 'onboarding_required',
      stripeOnboardingCompletedAt: completed ? new Date() : null,
      stripePayoutsEnabled: Boolean(account.payouts_enabled),
      stripeChargesEnabled: Boolean(account.charges_enabled),
      stripeDetailsSubmitted: Boolean(account.details_submitted),
    },
  });
}

function getString(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const error = new Error(`${field} is required.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function getSafeInteger(value, field, minimum = 0, maximum = 86400) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    const error = new Error(`Invalid ${field}.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

export async function recordQualifiedViewEvent(req, res) {
  const videoId = getString(req.body?.videoId, 'videoId');
  const creatorId = getString(req.body?.creatorId, 'creatorId');
  const sessionKey = getString(req.body?.sessionKey, 'sessionKey');
  const watchSeconds = getSafeInteger(req.body?.watchSeconds, 'watchSeconds');
  const durationSeconds = getSafeInteger(req.body?.durationSeconds, 'durationSeconds', 1);
  const riskScore = getSafeInteger(req.body?.riskScore ?? 0, 'riskScore', 0, 100);
  const event = await recordQualifiedView({ viewerId: req.user.financialId, videoId, creatorId, watchSeconds, durationSeconds, sessionKey, riskScore });
  return res.status(201).json({ event });
}

export async function recordPointsActivityEvent(req, res) {
  const source = getString(req.body?.source, 'source');
  const idempotencyKey = getString(req.body?.idempotencyKey, 'idempotencyKey');
  const referenceId = req.body?.referenceId || null;
  const allowedSources = ['qualified_watch', 'meaningful_comment', 'follow_creator', 'qualified_referral', 'campaign_activity'];
  if (!allowedSources.includes(source)) return res.status(400).json({ message: 'Unsupported points activity.' });
  const ledger = await recordPointsActivity({ userId: req.user.financialId, source, referenceId, idempotencyKey });
  return res.status(201).json({ ledger });
}

export async function runCreatorSettlementJob(req, res) {
  const periodStart = getString(req.body?.periodStart, 'periodStart');
  const periodEnd = getString(req.body?.periodEnd, 'periodEnd');
  const result = await runCreatorSettlement({ periodStart, periodEnd, actorId: req.user.financialId });
  return res.status(result.duplicate ? 200 : 201).json(result);
}

export async function processPayout(req, res) {
  const userId = getString(req.body?.userId, 'userId');
  const result = await processAutomaticPayout({ userId, settlementId: req.body?.settlementId || null, actorId: req.user.id });
  return res.status(result.duplicate ? 200 : 201).json(result);
}

export async function createConnectOnboardingLink(req, res) {
  const provider = requireProvider();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  let account;
  if (user.stripeAccountId) {
    account = await provider.getConnectedAccountStatus(user.stripeAccountId);
  } else {
    account = await provider.createConnectedAccount({ email: user.email, metadata: { grammate_user_id: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: account.id, stripeAccountStatus: 'onboarding_required' },
    });
  }

  const accountLink = await provider.createAccountLink({
    account: account.id,
    refresh_url: config.stripeRefreshUrl,
    return_url: config.stripeReturnUrl,
    type: 'account_onboarding',
  });

  return res.json({ url: accountLink.url, account: serializeAccount(account) });
}

export async function getConnectAccountStatus(req, res) {
  const provider = requireProvider();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.stripeAccountId) {
    return res.json({ account: null, status: 'not_started' });
  }

  const account = await provider.getConnectedAccountStatus(user.stripeAccountId);
  await syncStripeAccount(user.id, account);
  return res.json({ account: serializeAccount(account) });
}

export async function handleStripeWebhook(req, res) {
  const provider = requireProvider();
  if (!config.stripeWebhookSecret) {
    return res.status(503).json({ message: 'Stripe webhook signing secret is not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = provider.verifyWebhook(req.body, signature, config.stripeWebhookSecret);
  } catch (error) {
    return res.status(400).json({ message: `Invalid Stripe webhook: ${error.message}` });
  }

  const storedEvent = await recordWebhookEvent({ provider: provider.name, event });
  if (storedEvent.duplicate) return res.json({ received: true, duplicate: true });

  if (event.type === 'account.updated') {
    const account = event.data.object;
    const userId = account.metadata?.grammate_user_id;
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst({ where: { stripeAccountId: account.id } });
    if (user) await syncStripeAccount(user.id, account);
    if (user) await syncPayoutAccount({ userId: user.id, providerAccountId: account.id, account });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.grammate_user_id || session.client_reference_id;
    if (session.mode === 'subscription' && session.subscription && userId) {
      const subscription = await provider.getSubscription(session.subscription);
      await recordSubscriptionFromStripe(subscription, userId, session.metadata?.plan_id);
      await insertNotification({ userId, type: 'subscription_activated', title: 'Premium payment received', message: 'Your Premium subscription is being verified.' });
    }
    if (session.mode === 'payment' && session.metadata?.creator_id) {
      await updateTipFromCheckout({ session, status: 'confirmed' });
      const tip = await getTipByProviderReference(session.id);
      if (tip) {
        await recordPlatformRevenue({
          eventId: event.id,
          revenueType: 'tip',
          grossAmountCents: tip.gross_amount_cents,
          feeCents: tip.platform_fee_cents,
          currency: tip.currency,
          reference: session.payment_intent || session.id,
          metadata: { tip_id: tip.id, creator_id: tip.creator_id },
        });
        await insertNotification({ userId: tip.creator_id, type: 'tip_received', title: 'Tip received', message: 'A creator tip is pending settlement and verification.', metadata: { tip_id: tip.id } });
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.grammate_user_id;
    if (userId) await recordSubscriptionFromStripe(subscription, userId, subscription.metadata?.plan_id);
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const userId = invoice.subscription_details?.metadata?.grammate_user_id || invoice.metadata?.grammate_user_id;
    if (userId) await insertNotification({ userId, type: 'payment_failed', title: 'Premium payment failed', message: 'Your Premium payment could not be completed.' });
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    const subscription = subscriptionId ? await provider.getSubscription(subscriptionId) : null;
    const userId = subscription?.metadata?.grammate_user_id || invoice.metadata?.grammate_user_id;
    if (userId) {
      await recordSubscriptionFromStripe(subscription, userId, subscription.metadata?.plan_id);
      await recordPlatformRevenue({
        eventId: event.id,
        revenueType: 'premium_subscription',
        grossAmountCents: invoice.amount_paid || 0,
        feeCents: 0,
        reference: invoice.payment_intent || invoice.id,
        currency: invoice.currency || 'usd',
        metadata: { subscription_id: subscriptionId },
        status: 'confirmed',
      });
      await insertNotification({ userId, type: 'subscription_activated', title: 'Premium is active', message: 'Your Premium subscription payment has been verified.' });
    }
  }

  if (['payout.paid', 'payout.failed', 'payout.canceled'].includes(event.type)) {
    const providerPayout = event.data.object;
    const statusMap = { 'payout.paid': 'paid', 'payout.failed': 'failed', 'payout.canceled': 'canceled' };
    const payout = await updatePayoutFromProvider({
      providerPayoutId: providerPayout.id,
      status: statusMap[event.type],
      failureCode: providerPayout.failure_code || null,
      failureMessage: providerPayout.failure_message || null,
    });
    if (payout) {
      await insertNotification({
        userId: payout.user_id,
        type: `payout_${statusMap[event.type]}`,
        title: `Payout ${statusMap[event.type]}`,
        message: statusMap[event.type] === 'paid'
          ? 'Your payout has been confirmed by the provider.'
          : 'Your payout was not completed. Your funds remain protected while the issue is reviewed.',
        metadata: { payout_id: payout.id, amount_cents: payout.amount_cents },
      });
    }
  }

  await markWebhookProcessed(event.id);

  return res.json({ received: true });
}
