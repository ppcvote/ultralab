import { getAdminDb } from './_firebase.js'

export interface ApiKey {
  key: string
  userId: string
  tier: 'free' | 'pro' | 'enterprise'
  monthlyLimit: number | null // null = unlimited
  createdAt: Date
  lastUsedAt: Date
  enabled: boolean
}

export interface ApiKeyValidation {
  valid: boolean
  keyData?: ApiKey
  error?: string
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyValidation> {
  if (!apiKey || !apiKey.startsWith('up_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  try {
    const db = getAdminDb()
    const keysRef = db.collection('api_keys')
    const snapshot = await keysRef.where('key', '==', apiKey).limit(1).get()

    if (snapshot.empty) {
      return { valid: false, error: 'API key not found' }
    }

    const keyDoc = snapshot.docs[0]
    const keyData = keyDoc.data() as ApiKey

    if (!keyData.enabled) {
      return { valid: false, error: 'API key has been disabled' }
    }

    // Update last used timestamp
    await keyDoc.ref.update({ lastUsedAt: new Date() })

    return { valid: true, keyData }
  } catch (err) {
    console.error('API key validation error:', err)
    return { valid: false, error: 'Internal server error' }
  }
}

export async function checkApiKeyUsage(apiKey: string, _tier: string, monthlyLimit: number | null): Promise<{
  allowed: boolean
  usage: number
  limit: number | null
  error?: string
}> {
  try {
    const db = getAdminDb()
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const usageRef = db.collection('api_usage').doc(apiKey).collection('monthly').doc(month)
    const usageDoc = await usageRef.get()

    const currentUsage = usageDoc.exists ? (usageDoc.data()?.scans || 0) : 0

    // Unlimited for pro/enterprise
    if (monthlyLimit === null) {
      return { allowed: true, usage: currentUsage, limit: null }
    }

    // Check limit for free tier
    if (currentUsage >= monthlyLimit) {
      return {
        allowed: false,
        usage: currentUsage,
        limit: monthlyLimit,
        error: `Monthly limit exceeded (${monthlyLimit} scans/month). Upgrade to Pro for unlimited scans.`,
      }
    }

    return { allowed: true, usage: currentUsage, limit: monthlyLimit }
  } catch (err) {
    console.error('API usage check error:', err)
    return { allowed: false, usage: 0, limit: monthlyLimit, error: 'Internal server error' }
  }
}

export async function incrementApiKeyUsage(apiKey: string): Promise<void> {
  try {
    const db = getAdminDb()
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const usageRef = db.collection('api_usage').doc(apiKey).collection('monthly').doc(month)

    await db.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef)

      if (!usageDoc.exists) {
        transaction.set(usageRef, {
          scans: 1,
          lastScan: new Date(),
        })
      } else {
        transaction.update(usageRef, {
          scans: (usageDoc.data()?.scans || 0) + 1,
          lastScan: new Date(),
        })
      }
    })
  } catch (err) {
    console.error('API usage increment error:', err)
  }
}
