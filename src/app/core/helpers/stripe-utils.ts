import { Stripe } from '@stripe/stripe-js';

export function getStripeInstance(apiKey: string): Stripe {
  // This condition ensures that the code is running in a browser environment and that the Stripe.js library has been loaded:
  if (typeof window !== 'undefined' && window.Stripe) {
    return new (window.Stripe as any)(apiKey); // Add a type assertion here
  }

  throw new Error('Stripe.js is not loaded');
}
