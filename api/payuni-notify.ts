import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { getAdminDb } from './_firebase.js'

const HASH_KEY = process.env.PAYUNI_HASH_KEY || ''
const HASH_IV = process.env.PAYUNI_HASH_IV || ''

function decryptAES(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV)
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
}

function verifySHA256(encryptInfo: string, hashInfo: string): boolean {
  const expected = crypto
    .createHash('sha256')
    .update(HASH_KEY + encryptInfo + HASH_IV)
    .digest('hex')
    .toUpperCase()
  return expected === hashInfo
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // PAYUNi sends POST with EncryptInfo and HashInfo
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  try {
    const { EncryptInfo, HashInfo } = req.body

    if (!EncryptInfo || !HashInfo) {
      return res.status(400).send('Missing EncryptInfo or HashInfo')
    }

    // Verify hash
    if (!verifySHA256(EncryptInfo, HashInfo)) {
      console.error('PAYUNi notify: hash verification failed')
      return res.status(400).send('Hash verification failed')
    }

    // Decrypt
    const decrypted = decryptAES(EncryptInfo)
    const params = new URLSearchParams(decrypted)

    const merTradeNo = params.get('MerTradeNo') || ''
    const tradeStatus = params.get('Status') || ''
    const payuniTradeNo = params.get('TradeNo') || ''
    const paymentMethod = params.get('PaymentType') || ''
    const tradeAmt = params.get('TradeAmt') || ''

    console.log(`PAYUNi notify: ${merTradeNo} status=${tradeStatus} amt=${tradeAmt}`)

    if (!merTradeNo) {
      return res.status(400).send('Missing MerTradeNo')
    }

    const db = getAdminDb()
    const orderRef = db.collection('orders').doc(merTradeNo)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      console.error(`PAYUNi notify: order not found: ${merTradeNo}`)
      return res.status(404).send('Order not found')
    }

    const order = orderDoc.data()!

    // Verify amount matches
    if (String(order.totalAmount) !== tradeAmt) {
      console.error(`PAYUNi notify: amount mismatch. Expected ${order.totalAmount}, got ${tradeAmt}`)
      return res.status(400).send('Amount mismatch')
    }

    // Update order based on status
    // PAYUNi: Status = "SUCCESS" means paid successfully
    if (tradeStatus === 'SUCCESS') {
      await orderRef.update({
        status: 'paid',
        payuniTradeNo,
        paymentMethod,
        paidAt: new Date(),
      })

      // Deduct stock for physical products
      const batch = db.batch()
      for (const item of order.items) {
        if (item.type === 'physical') {
          const productRef = db.collection('products').doc(item.productId)
          const productDoc = await productRef.get()
          if (productDoc.exists) {
            const stock = productDoc.data()!.stock
            if (stock !== -1 && stock > 0) {
              batch.update(productRef, {
                stock: Math.max(0, stock - item.quantity),
              })
            }
          }
        }
      }
      await batch.commit()
    } else {
      await orderRef.update({
        status: 'failed',
        payuniTradeNo,
        paymentMethod,
      })
    }

    // PAYUNi expects "SUCCESS" response
    return res.status(200).send('SUCCESS')
  } catch (err) {
    console.error('PAYUNi notify error:', err)
    return res.status(500).send('Internal server error')
  }
}
