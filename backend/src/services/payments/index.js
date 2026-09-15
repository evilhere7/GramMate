import config from '../../config.js';
import { createStripeProvider } from './stripeProvider.js';

export function getPaymentProvider() {
  if (config.activePaymentProvider === 'stripe') {
    return createStripeProvider(config.stripeSecretKey);
  }
  return null;
}