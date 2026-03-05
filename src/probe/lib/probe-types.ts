export type ScanMode = 'prompt' | 'url' | 'rival'
export type ScanState = 'idle' | 'scanning' | 'done' | 'error'
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface Vulnerability {
  id: string
  name: string
  severity: Severity
  finding: string
  suggestion: string
}

export interface AIIntegrationPotential {
  suitableFeatures: string[]
  businessValue: string
  implementationPriority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ScanAnalysis {
  grade: Grade | 'N/A'
  score: number
  summary: string
  vulnerabilities: Vulnerability[]
  positives: string[]
  overallRecommendation: string
  // N/A (no chatbot detected) 專屬欄位
  detectedTech?: string[]
  aiIntegrationPotential?: AIIntegrationPotential
  securityConsiderations?: string[]
}

export interface ChatbotDetection {
  name: string
  type: 'chatbot' | 'ai-widget' | 'live-chat' | 'custom'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  evidence: string
}

export interface PromptScanResult {
  ok: true
  analysis: ScanAnalysis
}

export interface UrlScanResult {
  ok: true
  detections: ChatbotDetection[]
  analysis: ScanAnalysis
}

export interface RivalAnalysis {
  profileSummary: {
    platform: string
    handle: string
    bio: string
    contentVolume: string
  }
  contentStrategy: {
    themes: { topic: string; percentage: number }[]
    formats: string[]
    postingFrequency: string
    bestPerformingType: string
  }
  engagementPatterns: {
    hookPatterns: string[]
    ctaPatterns: string[]
    interactionStyle: string
  }
  trafficSources: {
    hashtagStrategy: string
    crossPlatformLinks: string[]
    seoKeywords: string[]
  }
  competitiveInsights: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
  promptSuggestions: {
    contentPrompt: string
    hookPrompt: string
    engagementPrompt: string
  }
}

export interface RivalScanResult {
  ok: true
  analysis: RivalAnalysis
}

export interface RivalNeedsInput {
  ok: false
  needsManualInput: true
  reason: string
  partialContent: string
}

export interface ScanError {
  error: string
  resetAt?: number
}

export type SecurityScanResult =
  | { type: 'prompt'; data: PromptScanResult }
  | { type: 'url'; data: UrlScanResult }

export type ScanResult =
  | SecurityScanResult
  | { type: 'rival'; data: RivalScanResult }

export const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: '#FF3A3A',
  HIGH: '#F97316',
  MEDIUM: '#F59E0B',
  LOW: '#3B82F6',
  NONE: '#10B981',
}

export const GRADE_COLORS: Record<Grade, string> = {
  A: '#10B981',
  B: '#34D399',
  C: '#F59E0B',
  D: '#F97316',
  E: '#EF4444',
  F: '#FF3A3A',
}
