import { getAdminDb } from './_firebase.js'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export async function checkRateLimit(
  ip: string,
  action: string,
  maxRequests: number = 5,
  windowMs: number = 3600000
): Promise<RateLimitResult> {
  const db = getAdminDb()
  const docRef = db.collection('rate_limits').doc(`${action}:${ip.replace(/[/.]/g, '_')}`)
  const now = Date.now()

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef)
    const data = doc.data()

    if (!data || data.resetAt < now) {
      tx.set(docRef, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
    }

    if (data.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: data.resetAt }
    }

    tx.update(docRef, { count: data.count + 1 })
    return { allowed: true, remaining: maxRequests - data.count - 1, resetAt: data.resetAt }
  })
}

export async function checkDailyBudget(maxDaily: number = 200): Promise<boolean> {
  const db = getAdminDb()
  const today = new Date().toISOString().split('T')[0]
  const docRef = db.collection('counters').doc(`gemini-${today}`)

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(docRef)
    const data = doc.data()

    if (!data) {
      tx.set(docRef, { count: 1 })
      return true
    }

    if (data.count >= maxDaily) {
      return false
    }

    tx.update(docRef, { count: data.count + 1 })
    return true
  })
}
