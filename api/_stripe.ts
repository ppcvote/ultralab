import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY

    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }

    _stripe = new Stripe(apiKey, {
      apiVersion: '2025-08-27.basil', // Latest API version
      typescript: true,
    })
  }

  return _stripe
}

/**
 * Stripe Pricing Configuration
 */
export const STRIPE_CONFIG = {
  // Pro tier: Pay-as-you-go ($0.01/scan, billed monthly)
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_PRO || '', // e.g., price_xxx (from Stripe dashboard)
    name: 'Pro Plan',
    description: 'Unlimited scans at $0.01 each',
  },

  // Enterprise tier: Custom pricing (contact sales)
  enterprise: {
    name: 'Enterprise Plan',
    description: 'Custom pricing, dedicated support, self-hosted option',
  },
}

/**
 * Create Stripe Checkout Session for Pro upgrade
 */
export async function createCheckoutSession(params: {
  apiKeyId: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const stripe = getStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    line_items: [
      {
        price: STRIPE_CONFIG.pro.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      apiKeyId: params.apiKeyId,
      tier: 'pro',
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })

  return session.url!
}

/**
 * Create Customer Portal session (for subscription management)
 */
export async function createCustomerPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<string> {
  const stripe = getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })

  return session.url
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
