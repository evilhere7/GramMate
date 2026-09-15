import { auth } from '../lib/firebase';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function authenticatedRequest(path, options = {}) {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Please sign in before starting a payment.');

  const token = await firebaseUser.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/payments${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Payment request could not be completed.');
  return payload;
}

export function createSubscriptionCheckout(planId) {
  return authenticatedRequest('/checkout/subscription', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

export function createTipCheckout({ creatorId, amountCents }) {
  return authenticatedRequest('/checkout/tip', {
    method: 'POST',
    body: JSON.stringify({ creatorId, amountCents }),
  });
}

export function createPayoutOnboardingLink() {
  return authenticatedRequest('/connect/onboarding-link', { method: 'POST' });
}

export function getPayoutAccountStatus() {
  return authenticatedRequest('/connect/account-status');
}
