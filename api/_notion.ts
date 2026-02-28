import { Client } from '@notionhq/client'

// Type definitions
export interface NotionInquiryData {
  name: string
  email: string
  phone?: string
  lineId?: string
  company?: string
  service: string
  budget?: string
  contactMethod: string
  message?: string
  source: string
  status?: string
  notes?: string
  createdAt: Date
  updatedAt?: Date
  firestoreId?: string
}

export interface NotionProbeLeadData {
  email: string
  scanType: 'prompt' | 'url'
  grade?: string
  score?: number
  vulnerabilityCount?: number
  scanCount: number
  status: string
  source: string
  createdAt: Date
  lastSeenAt: Date
  ip: string
  userAgent: string
  firestoreId: string
}

// Singleton Notion client
let notionClient: Client | null = null

/**
 * Get Notion client (singleton pattern)
 * Returns null if Notion is not configured
 */
export function getNotionClient(): Client | null {
  // Check if disabled
  if (process.env.NOTION_ENABLED === 'false') {
    return null
  }

  // Check if already initialized
  if (notionClient) {
    return notionClient
  }

  // Check required env vars
  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) {
    console.log('[Notion] API key not configured, skipping sync')
    return null
  }

  // Initialize client
  notionClient = new Client({ auth: apiKey })
  console.log('[Notion] Client initialized')
  return notionClient
}

/**
 * Create Inquiry page in Notion database
 */
export async function createInquiryPage(data: NotionInquiryData): Promise<void> {
  try {
    const notion = getNotionClient()
    if (!notion) {
      console.log('[Notion] Not configured, skipping inquiry sync')
      return
    }

    const databaseId = process.env.NOTION_INQUIRIES_DB_ID
    if (!databaseId) {
      console.log('[Notion] Inquiries database ID not configured, skipping')
      return
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [
            {
              text: {
                content: data.name,
              },
            },
          ],
        },
        'Email': {
          email: data.email,
        },
        ...(data.phone && {
          'Phone': {
            phone_number: data.phone,
          },
        }),
        ...(data.service && {
          'Service': {
            select: {
              name: data.service,
            },
          },
        }),
        ...(data.budget && {
          'Budget': {
            select: {
              name: data.budget,
            },
          },
        }),
        ...(data.contactMethod && {
          'Contact Method': {
            select: {
              name: data.contactMethod,
            },
          },
        }),
        'Source': {
          select: {
            name: data.source,
          },
        },
        'Status': {
          select: {
            name: data.status || '新詢問',
          },
        },
        'Created At': {
          date: {
            start: data.createdAt.toISOString(),
          },
        },
        ...(data.message && {
          'Message': {
            rich_text: [
              {
                text: {
                  content: data.message.substring(0, 2000), // Notion rich_text limit
                },
              },
            ],
          },
        }),
      },
    })

    console.log('[Notion] Inquiry page created:', data.email)
  } catch (error) {
    console.error('[Notion] Failed to create inquiry page:', error)
    // Do NOT throw - fire-and-forget
  }
}

/**
 * Create Probe Lead page in Notion database
 */
export async function createProbeLeadPage(data: NotionProbeLeadData): Promise<void> {
  try {
    const notion = getNotionClient()
    if (!notion) {
      console.log('[Notion] Not configured, skipping probe lead sync')
      return
    }

    const databaseId = process.env.NOTION_PROBE_LEADS_DB_ID
    if (!databaseId) {
      console.log('[Notion] Probe leads database ID not configured, skipping')
      return
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Email': {
          title: [
            {
              text: {
                content: data.email,
              },
            },
          ],
        },
        'Scan Type': {
          select: {
            name: data.scanType === 'prompt' ? 'Prompt 掃描' : 'URL 掃描',
          },
        },
        ...(data.grade && {
          'Grade': {
            select: {
              name: data.grade,
            },
          },
        }),
        ...(typeof data.score === 'number' && {
          'Score': {
            number: data.score,
          },
        }),
        ...(typeof data.vulnerabilityCount === 'number' && {
          'Vulnerabilities': {
            number: data.vulnerabilityCount,
          },
        }),
        'Scan Count': {
          number: data.scanCount,
        },
        'Status': {
          select: {
            name: data.status,
          },
        },
        'Source': {
          rich_text: [
            {
              text: {
                content: data.source,
              },
            },
          ],
        },
        'Created At': {
          date: {
            start: data.createdAt.toISOString(),
          },
        },
        'Last Seen': {
          date: {
            start: data.lastSeenAt.toISOString(),
          },
        },
        'IP Address': {
          rich_text: [
            {
              text: {
                content: data.ip,
              },
            },
          ],
        },
        'Firestore ID': {
          rich_text: [
            {
              text: {
                content: data.firestoreId,
              },
            },
          ],
        },
      },
    })

    console.log('[Notion] Probe lead page created:', data.email)
  } catch (error) {
    console.error('[Notion] Failed to create probe lead page:', error)
    // Do NOT throw - fire-and-forget
  }
}
