import { getAdminDb } from './_firebase.js'
import * as crypto from 'crypto'

interface VulnerabilityRecord {
  id: string
  name: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  finding: string
  category: string
}

interface ScanRecord {
  scanType: 'prompt' | 'url'
  source: string // URL or hashed prompt (for privacy)
  grade: string
  score: number
  scannedAt: Date
  vulnerabilities: VulnerabilityRecord[]
  metadata: {
    userAgent?: string
    ipHash?: string
    language: string
  }
}

/**
 * Hash sensitive data (IP, prompt) for privacy-safe storage
 */
function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/**
 * Collect vulnerability data from scan results
 * Fire-and-forget - won't block scan response
 */
export async function collectVulnerabilityData(
  scanType: 'prompt' | 'url',
  source: string, // URL or prompt text
  grade: string,
  score: number,
  vulnerabilities: any[],
  language: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const db = getAdminDb()

    // Hash sensitive data for privacy
    const sourceHash = scanType === 'url' ? source : hashString(source)
    const ipHash = ipAddress ? hashString(ipAddress) : undefined

    // Map vulnerabilities to cleaner format
    const vulnRecords: VulnerabilityRecord[] = vulnerabilities.map((v) => ({
      id: v.id || 'unknown',
      name: v.name || 'Unknown',
      severity: v.severity || 'LOW',
      finding: v.finding || '',
      category: extractCategory(v.name || v.id),
    }))

    const record: ScanRecord = {
      scanType,
      source: sourceHash,
      grade,
      score,
      scannedAt: new Date(),
      vulnerabilities: vulnRecords,
      metadata: {
        userAgent,
        ipHash,
        language,
      },
    }

    // Store in Firestore
    await db.collection('vulnerability_database').add(record)
  } catch (err) {
    // Silent fail - don't block scan response
    console.error('Failed to collect vulnerability data:', err)
  }
}

/**
 * Extract vulnerability category from name/id
 */
function extractCategory(nameOrId: string): string {
  const lower = nameOrId.toLowerCase()

  if (lower.includes('role') || lower.includes('escape')) return 'Role Escape'
  if (lower.includes('instruction') || lower.includes('override')) return 'Instruction Override'
  if (lower.includes('format') || lower.includes('manipulation')) return 'Output Format Manipulation'
  if (lower.includes('data') || lower.includes('leak')) return 'Data Extraction/Leakage'
  if (lower.includes('language') || lower.includes('bypass')) return 'Multi-language Bypass'
  if (lower.includes('unicode') || lower.includes('homoglyph')) return 'Unicode/Homoglyph Attacks'
  if (lower.includes('context') || lower.includes('overflow')) return 'Context Window Overflow'
  if (lower.includes('indirect') || lower.includes('injection')) return 'Indirect Prompt Injection'
  if (lower.includes('social') || lower.includes('engineering')) return 'Social Engineering'
  if (lower.includes('output') || lower.includes('weapon')) return 'Output Weaponization'

  return 'Other'
}

/**
 * Get vulnerability statistics (for admin dashboard)
 */
export async function getVulnerabilityStats(days: number = 30): Promise<{
  totalScans: number
  averageGrade: string
  averageScore: number
  topVulnerabilities: Array<{ name: string; count: number; severity: string }>
  severityDistribution: Record<string, number>
}> {
  const db = getAdminDb()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const snapshot = await db
    .collection('vulnerability_database')
    .where('scannedAt', '>=', cutoff)
    .get()

  if (snapshot.empty) {
    return {
      totalScans: 0,
      averageGrade: 'N/A',
      averageScore: 0,
      topVulnerabilities: [],
      severityDistribution: {},
    }
  }

  let totalScore = 0
  const vulnCounts: Record<string, { count: number; severity: string }> = {}
  const severityCounts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  }

  snapshot.forEach((doc) => {
    const data = doc.data() as ScanRecord
    totalScore += data.score

    data.vulnerabilities.forEach((v) => {
      const key = v.name
      if (!vulnCounts[key]) {
        vulnCounts[key] = { count: 0, severity: v.severity }
      }
      vulnCounts[key].count++

      if (severityCounts[v.severity] !== undefined) {
        severityCounts[v.severity]++
      }
    })
  })

  const totalScans = snapshot.size
  const averageScore = Math.round(totalScore / totalScans)

  // Calculate average grade
  const gradeMap: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }
  const reverseMap = ['F', 'E', 'D', 'C', 'B', 'A']
  const gradeIndex = Math.floor(averageScore / 20)
  const averageGrade = reverseMap[Math.min(gradeIndex, 5)]

  // Top vulnerabilities
  const topVulnerabilities = Object.entries(vulnCounts)
    .map(([name, { count, severity }]) => ({ name, count, severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalScans,
    averageGrade,
    averageScore,
    topVulnerabilities,
    severityDistribution: severityCounts,
  }
}
