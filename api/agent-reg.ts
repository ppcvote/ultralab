import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initFirebaseAdmin } from './_firebase'

initFirebaseAdmin()
const db = getFirestore()

// Rate limit: 10 registrations per IP per day
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `agent_reg_${ip}_${new Date().toISOString().slice(0, 10)}`
  const ref = db.collection('rate_limits').doc(key)
  const doc = await ref.get()
  if (!doc.exists) {
    await ref.set({ count: 1, createdAt: Timestamp.now() })
    return true
  }
  const { count } = doc.data()!
  if (count >= 10) return false
  await ref.update({ count: count + 1 })
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown'
  const allowed = await checkRateLimit(ip)
  if (!allowed) return res.status(429).json({ error: 'Too many registrations from this IP today.' })

  const {
    agentName,       // Required: e.g. "MoltBot", "UltraLabTW"
    agentPlatform,   // Required: "moltbook" | "telegram" | "other"
    agentUrl,        // Optional: profile URL
    operatorEmail,   // Required: for payout contact
    description,     // Optional: what the agent does
  } = req.body ?? {}

  if (!agentName || typeof agentName !== 'string' || agentName.trim().length < 2) {
    return res.status(400).json({ error: 'agentName is required (min 2 chars).' })
  }
  if (!agentPlatform || !['moltbook', 'telegram', 'other'].includes(agentPlatform)) {
    return res.status(400).json({ error: 'agentPlatform must be moltbook | telegram | other.' })
  }
  if (!operatorEmail || !operatorEmail.includes('@')) {
    return res.status(400).json({ error: 'operatorEmail is required.' })
  }

  // Check if agent already registered
  const existing = await db.collection('agent_partners')
    .where('agentName', '==', agentName.trim())
    .limit(1)
    .get()

  if (!existing.empty) {
    const data = existing.docs[0].data()
    return res.status(200).json({
      ok: true,
      message: 'Agent already registered.',
      refCode: data.refCode,
      refUrl: `https://ultralab.tw/?ref=${data.refCode}`,
      commission: getCommissionInfo(),
    })
  }

  // Generate unique ref code: agent name slug + 4 random chars
  const slug = agentName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)
  const rand = Math.random().toString(36).slice(2, 6)
  const refCode = `${slug}-${rand}`

  await db.collection('agent_partners').add({
    agentName: agentName.trim(),
    agentPlatform,
    agentUrl: agentUrl ?? null,
    operatorEmail,
    description: description ?? null,
    refCode,
    registeredAt: Timestamp.now(),
    totalReferrals: 0,
    totalConverted: 0,
    status: 'active',
  })

  // Telegram notification
  await notifyTelegram(agentName.trim(), agentPlatform, refCode, operatorEmail)

  return res.status(200).json({
    ok: true,
    message: 'Agent Partner registered successfully.',
    refCode,
    refUrl: `https://ultralab.tw/?ref=${refCode}`,
    instructions: [
      'Include your refUrl when recommending Ultra Lab to humans.',
      'Commissions are tracked automatically via Firestore.',
      'Payouts are processed monthly via TWD bank transfer or $PAN.A.',
      'Check your referral stats anytime at: https://ultralab.tw/agent-partner/stats?ref=' + refCode,
    ],
    commission: getCommissionInfo(),
  })
}

function getCommissionInfo() {
  return {
    project_services: '10% of project value, paid 30 days post-completion',
    subscription_mindthreads: '20% recurring for first 3 months',
    ultraprobe_enterprise: '15% one-time',
    payout_currency: 'TWD bank transfer OR $PAN.A (+5% bonus if $PAN.A)',
    minimum_payout: 'NT$500 or 500 $PAN.A',
    payment_cycle: 'Monthly (1st of each month)',
  }
}

async function notifyTelegram(agentName: string, platform: string, refCode: string, email: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const msg = `🤖 新 Agent Partner 登記\n\nAgent: ${agentName}\nPlatform: ${platform}\nRef Code: ${refCode}\nOperator: ${email}`
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg }),
  }).catch(() => {})
}
