import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { getAdminDb } from './_firebase.js'

const MER_ID = process.env.PAYUNI_MER_ID || ''
const HASH_KEY = process.env.PAYUNI_HASH_KEY || ''
const HASH_IV = process.env.PAYUNI_HASH_IV || ''
const IS_SANDBOX = process.env.PAYUNI_SANDBOX === 'true'

const PAYUNI_API = IS_SANDBOX
  ? 'https://sandbox-api.payuni.com.tw/api/upp'
  : 'https://api.payuni.com.tw/api/upp'

interface CheckoutItem {
  productId: string
  quantity: number
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address?: string
}

function encryptAES(plaintext: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', HASH_KEY, HASH_IV)
  return cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex')
}

function hashSHA256(encryptInfo: string): string {
  return crypto
    .createHash('sha256')
    .update(HASH_KEY + encryptInfo + HASH_IV)
    .digest('hex')
    .toUpperCase()
}

function generateTradeNo(): string {
  const ts = Date.now().toString(36)
  const rand = crypto.randomBytes(4).toString('hex')
  return `MY${ts}${rand}`.substring(0, 20).toUpperCase()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { items, customer } = req.body as {
      items: CheckoutItem[]
      customer: CustomerInfo
    }

    // Validate input
    if (!items?.length || !customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Fetch products from Firestore to verify prices
    const db = getAdminDb()
    const productRefs = items.map((item) => db.collection('products').doc(item.productId))
    const productDocs = await db.getAll(...productRefs)

    const orderItems: {
      productId: string
      name: string
      price: number
      quantity: number
      type: string
    }[] = []
    let totalAmount = 0

    for (let i = 0; i < items.length; i++) {
      const doc = productDocs[i]
      if (!doc.exists) {
        return res.status(400).json({ error: `Product not found: ${items[i].productId}` })
      }

      const product = doc.data()!
      if (!product.active) {
        return res.status(400).json({ error: `Product not available: ${product.name}` })
      }

      // Check stock for physical products
      if (product.type === 'physical' && product.stock !== -1 && product.stock < items[i].quantity) {
        return res.status(400).json({ error: `Insufficient stock: ${product.name}` })
      }

      const qty = items[i].quantity
      orderItems.push({
        productId: items[i].productId,
        name: product.name,
        price: product.price,
        quantity: qty,
        type: product.type,
      })
      totalAmount += product.price * qty
    }

    // Generate unique trade number
    const merTradeNo = generateTradeNo()

    // Create order in Firestore (status: pending)
    await db.collection('orders').doc(merTradeNo).set({
      merTradeNo,
      items: orderItems,
      totalAmount,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        ...(customer.address ? { address: customer.address } : {}),
      },
      status: 'pending',
      createdAt: new Date(),
    })

    // Build PAYUNi trade info string
    const tradeInfo: Record<string, string> = {
      MerID: MER_ID,
      MerTradeNo: merTradeNo,
      MerRemark: '',
      TradeAmt: String(totalAmount),
      ExpireDate: '', // use default
      ReturnURL: `${req.headers.origin || 'https://ultralab.tw'}/api/payuni-return`,
      NotifyURL: `${req.headers.origin || 'https://ultralab.tw'}/api/payuni-notify`,
      QueryURL: `${req.headers.origin || 'https://ultralab.tw'}/minyi?order=query`,
      TradeDesc: `Min Yi Shop — ${orderItems.length} 件商品`,
      Param1: '',
      Param2: '',
      Param3: '',
    }

    // Need physical shipping? Check if any physical items
    const hasPhysical = orderItems.some((i) => i.type === 'physical')
    if (hasPhysical && customer.address) {
      tradeInfo.Param1 = customer.address
    }

    // URL-encode the trade info as query string
    const plaintext = Object.entries(tradeInfo)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')

    // Encrypt
    const encryptInfo = encryptAES(plaintext)
    const hashInfo = hashSHA256(encryptInfo)

    return res.status(200).json({
      action: PAYUNI_API,
      MerID: MER_ID,
      Version: '1.0',
      EncryptInfo: encryptInfo,
      HashInfo: hashInfo,
      merTradeNo,
    })
  } catch (err) {
    console.error('Checkout error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
