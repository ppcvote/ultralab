import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyWebhookSignature } from './_stripe.js'
import { getAdminDb } from './_firebase.js'

/**
 * Stripe Webhook Handler
 *
 * POST /api/stripe-webhook
 *
 * Handles:
 * - checkout.session.completed → Upgrade API key to Pro tier
 * - customer.subscription.deleted → Downgrade to Free tier
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' })
  }

  try {
    // Verify webhook signature
    const rawBody = JSON.stringify(req.body)
    const event = verifyWebhookSignature(rawBody, signature as string, webhookSecret)

    console.log(`[Stripe Webhook] ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any

        // Extract metadata
        const apiKeyId = session.metadata?.apiKeyId
        const tier = session.metadata?.tier || 'pro'
        const customerId = session.customer

        if (!apiKeyId) {
          console.error('[Stripe] Missing apiKeyId in metadata')
          return res.status(400).json({ error: 'Missing apiKeyId' })
        }

        // Update API key tier in Firestore
        const db = getAdminDb()
        const keysRef = db.collection('api_keys')
        const snapshot = await keysRef.where('key', '==', apiKeyId).limit(1).get()

        if (snapshot.empty) {
          console.error(`[Stripe] API key not found: ${apiKeyId}`)
          return res.status(404).json({ error: 'API key not found' })
        }

        const keyDoc = snapshot.docs[0]
        await keyDoc.ref.update({
          tier,
          monthlyLimit: null, // Unlimited for Pro
          stripeCustomerId: customerId,
          upgradedAt: new Date(),
        })

        console.log(`[Stripe] Upgraded ${apiKeyId} to ${tier} tier`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Downgrade to Free tier
        const db = getAdminDb()
        const keysRef = db.collection('api_keys')
        const snapshot = await keysRef.where('stripeCustomerId', '==', customerId).get()

        if (!snapshot.empty) {
          const batch = db.batch()
          snapshot.forEach((doc) => {
            batch.update(doc.ref, {
              tier: 'free',
              monthlyLimit: 100,
              downgradedAt: new Date(),
            })
          })
          await batch.commit()

          console.log(`[Stripe] Downgraded customer ${customerId} to free tier`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const customerId = invoice.customer

        console.warn(`[Stripe] Payment failed for customer ${customerId}`)
        // TODO: Send email notification
        break
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err)
    return res.status(400).json({ error: 'Webhook verification failed' })
  }
}

// IMPORTANT: Disable body parsing for webhook (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
}
