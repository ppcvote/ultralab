import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Discord Interaction types
const PING = 1
const APPLICATION_COMMAND = 2
const PONG = 1
const CHANNEL_MESSAGE_WITH_SOURCE = 4
const PURPLE = 0x8A5CFF

// Read posts directly from content/blog/*.md — no HTTP round-trip, no deps
function parseFrontmatter(raw: string): Record<string, any> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const data: Record<string, any> = {}
  let currentKey = ''
  for (const line of match[1].split(/\r?\n/)) {
    const listItem = line.match(/^\s+-\s+(.+)/)
    if (listItem) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(listItem[1].trim())
      continue
    }
    const kv = line.match(/^(\w+):\s*(.*)/)
    if (!kv) continue
    currentKey = kv[1]
    const val = kv[2].replace(/^["']|["']$/g, '')
    data[currentKey] = val || null
  }
  return data
}

function readingTime(text: string): number {
  return Math.max(1, Math.ceil(text.length / 400))
}

function loadPosts(): any[] {
  const dir = path.join(process.cwd(), 'content', 'blog')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      const fm = parseFrontmatter(raw)
      const slug = f.replace(/\.md$/, '')
      return {
        slug,
        title: fm.title ?? slug,
        description: fm.description ?? '',
        date: fm.date ?? '',
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        readingTime: readingTime(raw),
        url: `https://ultralab.tw/blog/${slug}`,
      }
    })
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}

// Required: disable body parsing to verify Ed25519 signature on raw bytes
export const config = { api: { bodyParser: false } }

function verifySignature(publicKey: string, sig: string, timestamp: string, body: string): boolean {
  try {
    return crypto.verify(
      'ed25519',
      Buffer.from(timestamp + body),
      Buffer.from(publicKey, 'hex'),
      Buffer.from(sig, 'hex'),
    )
  } catch {
    return false
  }
}

function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}


function blogEmbed(title: string, posts: any[], footer?: string) {
  return {
    title,
    url: 'https://ultralab.tw/blog',
    color: PURPLE,
    fields: posts.map(p => ({
      name: p.title,
      value: `[閱讀全文](${p.url}) · \`${p.date}\` · ${p.readingTime} 分鐘`,
      inline: false,
    })),
    ...(footer ? { footer: { text: footer } } : {}),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const publicKey = process.env.DISCORD_PUBLIC_KEY ?? ''
  const sig = req.headers['x-signature-ed25519'] as string
  const timestamp = req.headers['x-signature-timestamp'] as string
  const rawBody = await getRawBody(req)

  if (!sig || !timestamp || !verifySignature(publicKey, sig, timestamp, rawBody)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const body = JSON.parse(rawBody)

  // Discord verification ping
  if (body.type === PING) {
    return res.status(200).json({ type: PONG })
  }

  if (body.type === APPLICATION_COMMAND && body.data?.name === 'blog') {
    const sub = body.data?.options?.[0]

    let posts: any[]
    try {
      posts = loadPosts()
    } catch {
      return res.status(200).json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '⚠️ 無法取得部落格資料，請稍後再試。', flags: 64 },
      })
    }

    // /blog latest [count]
    if (sub?.name === 'latest') {
      const count = Math.max(1, Math.min(sub.options?.[0]?.value ?? 5, 10))
      return res.status(200).json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [blogEmbed('📚 Ultra Lab 最新文章', posts.slice(0, count), `共 ${posts.length} 篇 | ultralab.tw/blog`)],
        },
      })
    }

    // /blog search <keyword>
    if (sub?.name === 'search') {
      const kw = (sub.options?.[0]?.value ?? '').toLowerCase()
      const results = posts.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(kw))
      )

      if (!results.length) {
        return res.status(200).json({
          type: CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🔍 找不到關於「${kw}」的文章。完整列表：<https://ultralab.tw/blog>` },
        })
      }

      const show = results.slice(0, 5)
      const footer = results.length > 5 ? `顯示前 5 篇，共 ${results.length} 篇結果` : undefined
      return res.status(200).json({
        type: CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [{
            ...blogEmbed(`🔍 搜尋：${kw}`, show, footer),
            description: `找到 ${results.length} 篇相關文章`,
          }],
        },
      })
    }
  }

  return res.status(400).json({ error: 'Unknown interaction' })
}
