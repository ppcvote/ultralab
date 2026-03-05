import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateApiKey } from './_api-auth.js'
import { createCustomerPortalSession } from './_stripe.js'
import { getAdminDb } from './_firebase.js'

/**
 * Create Stripe Customer Portal session
 *
 * POST /api/customer-portal
 * Headers: Authorization: Bearer up_live_YOUR_API_KEY
 *
 * Returns: { portalUrl: string }
 *
 * Use this to let users manage their subscription (update payment, cancel, etc.)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Extract API key
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
    })
  }

  const apiKey = authHeader.replace('Bearer ', '')

  // Validate API key
  const validation = await validateApiKey(apiKey)
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error })
  }

  const { tier } = validation.keyData!

  // Only Pro/Enterprise users have Stripe customers
  if (tier === 'free') {
    return res.status(400).json({
      error: 'Free tier users cannot access customer portal. Upgrade to Pro first.',
    })
  }

  try {
    // Get Stripe customer ID from Firestore
    const db = getAdminDb()
    const keysRef = db.collection('api_keys')
    const snapshot = await keysRef.where('key', '==', apiKey).limit(1).get()

    if (snapshot.empty) {
      return res.status(404).json({ error: 'API key not found' })
    }

    const keyData = snapshot.docs[0].data()
    const customerId = keyData.stripeCustomerId

    if (!customerId) {
      return res.status(400).json({
        error: 'No Stripe customer found. Please contact support.',
      })
    }

    const baseUrl = req.headers.origin || 'https://ultralab.tw'

    const portalUrl = await createCustomerPortalSession({
      customerId,
      returnUrl: `${baseUrl}/api/docs`, // Redirect back to API docs
    })

    return res.status(200).json({
      ok: true,
      portalUrl,
    })
  } catch (err) {
    console.error('Customer portal error:', err)
    return res.status(500).json({
      error: 'Failed to create customer portal session. Please try again.',
    })
  }
}
