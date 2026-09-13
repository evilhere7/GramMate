import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import config from '../config.js';

const prisma = new PrismaClient();
const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

function requireStripe() {
  if (!stripe) {
    const error = new Error('Stripe Connect is not configured on the server.');
    error.status = 503;
    throw error;
  }
  return stripe;
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

export async function createConnectOnboardingLink(req, res) {
  const stripeClient = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  let account;
  if (user.stripeAccountId) {
    account = await stripeClient.accounts.retrieve(user.stripeAccountId);
  } else {
    account = await stripeClient.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { grammate_user_id: user.id },
      capabilities: { transfers: { requested: true } },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: account.id, stripeAccountStatus: 'onboarding_required' },
    });
  }

  const accountLink = await stripeClient.accountLinks.create({
    account: account.id,
    refresh_url: config.stripeRefreshUrl,
    return_url: config.stripeReturnUrl,
    type: 'account_onboarding',
  });

  return res.json({ url: accountLink.url, account: serializeAccount(account) });
}

export async function getConnectAccountStatus(req, res) {
  const stripeClient = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.stripeAccountId) {
    return res.json({ account: null, status: 'not_started' });
  }

  const account = await stripeClient.accounts.retrieve(user.stripeAccountId);
  await syncStripeAccount(user.id, account);
  return res.json({ account: serializeAccount(account) });
}

export async function handleStripeWebhook(req, res) {
  const stripeClient = requireStripe();
  if (!config.stripeWebhookSecret) {
    return res.status(503).json({ message: 'Stripe webhook signing secret is not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret);
  } catch (error) {
    return res.status(400).json({ message: `Invalid Stripe webhook: ${error.message}` });
  }

  if (event.type === 'account.updated') {
    const account = event.data.object;
    const userId = account.metadata?.grammate_user_id;
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst({ where: { stripeAccountId: account.id } });
    if (user) await syncStripeAccount(user.id, account);
  }

  return res.json({ received: true });
}
