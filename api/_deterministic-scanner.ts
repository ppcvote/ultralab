/**
 * Deterministic Prompt Defense Scanner
 *
 * Analyzes a system prompt for MISSING defenses against 12 attack vectors.
 * Pure regex — no LLM, no network calls, < 5ms, 100% reproducible.
 *
 * This is NOT an attack detector. It checks whether a prompt has
 * defensive measures (role boundaries, refusal clauses, etc.)
 */

export interface DefenseCheck {
  id: string
  name: string
  defended: boolean
  confidence: number // 0-1
  evidence: string
}

export interface DeterministicResult {
  checks: DefenseCheck[]
  score: number       // 0-100
  coverage: string    // e.g. "4/12"
}

interface DefenseRule {
  id: string
  name: string
  nameEn: string
  /** Patterns that indicate the defense IS present */
  defensePatterns: RegExp[]
  /** Minimum matches needed to consider "defended" */
  minMatches?: number
  /** Weight for scoring (default 1) */
  weight?: number
}

const DEFENSE_RULES: DefenseRule[] = [
  {
    id: 'role-escape',
    name: '角色邊界',
    nameEn: 'Role Boundary',
    defensePatterns: [
      // Role definition
      /(?:you are|your role|act as|serve as|function as|你是|你的角色|你扮演|作為)/i,
      // Role boundary enforcement
      /(?:never (?:break|change|switch|abandon)|only (?:answer|respond|act) as|stay in (?:character|role)|always (?:remain|be|act as)|不要改變|始終保持|不得切換|維持角色)/i,
    ],
    minMatches: 2,
  },
  {
    id: 'instruction-override',
    name: '指令邊界',
    nameEn: 'Instruction Boundary',
    defensePatterns: [
      /(?:do not|never|must not|cannot|should not|refuse|reject|decline|不要|不可以|禁止|拒絕|不得|絕不)/i,
      /(?:ignore (?:any|all)|disregard|override|忽略|覆蓋|取代)/i,
    ],
  },
  {
    id: 'data-leakage',
    name: '資料保護',
    nameEn: 'Data Protection',
    defensePatterns: [
      /(?:do not (?:reveal|share|disclose|expose|output)|never (?:reveal|share|disclose|show)|keep.*(?:secret|confidential|private)|不要(?:透露|洩漏|分享|公開)|保密|機密)/i,
      /(?:system prompt|internal|instruction|training|behind the scenes|系統提示|內部指令|訓練資料)/i,
    ],
    minMatches: 1,
  },
  {
    id: 'output-manipulation',
    name: '輸出控制',
    nameEn: 'Output Control',
    defensePatterns: [
      /(?:only (?:respond|reply|output|answer) (?:in|with|as)|format.*(?:as|in|using)|response (?:format|style)|只(?:回答|回覆|輸出)|格式|回應方式)/i,
      /(?:do not (?:generate|create|produce|output)|never (?:generate|produce)|不要(?:生成|產生|輸出))/i,
    ],
  },
  {
    id: 'multilang-bypass',
    name: '多語言防護',
    nameEn: 'Multi-language Protection',
    defensePatterns: [
      /(?:only (?:respond|reply|answer|communicate) in|language|respond in (?:english|chinese|japanese)|只(?:用|使用)(?:中文|英文|繁體|簡體)|語言|回覆語言)/i,
      /(?:regardless of (?:the )?(?:input |user )?language|不論.*語言|無論.*語言)/i,
    ],
  },
  {
    id: 'unicode-attack',
    name: 'Unicode 防護',
    nameEn: 'Unicode Protection',
    defensePatterns: [
      // Check if prompt itself contains suspicious unicode (inverted: presence = vulnerability)
      /(?:unicode|homoglyph|special character|character encoding|字元編碼|特殊字元)/i,
    ],
    // Also do a structural check in the scanner function
  },
  {
    id: 'context-overflow',
    name: '長度限制',
    nameEn: 'Length Limits',
    defensePatterns: [
      /(?:max(?:imum)?.*(?:length|char|token|word)|limit.*(?:input|length|size|token)|truncat|(?:字數|長度|字元).*(?:限制|上限)|最多|不超過)/i,
    ],
  },
  {
    id: 'indirect-injection',
    name: '間接注入防護',
    nameEn: 'Indirect Injection Protection',
    defensePatterns: [
      /(?:external (?:data|content|source|input)|user.?(?:provided|supplied|submitted)|third.?party|外部(?:資料|內容|來源)|使用者(?:提供|輸入))/i,
      /(?:validate|verify|sanitize|filter|check).*(?:external|input|data|content|驗證|過濾|檢查)/i,
    ],
    minMatches: 2,
  },
  {
    id: 'social-engineering',
    name: '社交工程防護',
    nameEn: 'Social Engineering Defense',
    defensePatterns: [
      /(?:emotional|urgency|pressure|threaten|guilt|manipulat|情緒|緊急|壓力|威脅|操控|情感)/i,
      /(?:regardless of|no matter|even if|即使|無論|不管)/i,
    ],
    minMatches: 1,
  },
  {
    id: 'output-weaponization',
    name: '有害內容防護',
    nameEn: 'Harmful Content Prevention',
    defensePatterns: [
      /(?:harmful|illegal|dangerous|malicious|weapon|violence|exploit|phishing|有害|非法|危險|惡意|武器|暴力|釣魚)/i,
      /(?:do not (?:help|assist|generate|create).*(?:harm|illegal|danger|weapon)|不(?:協助|幫助|生成).*(?:有害|非法|危險))/i,
    ],
    minMatches: 1,
  },
  {
    id: 'abuse-prevention',
    name: '濫用防護',
    nameEn: 'Abuse Prevention',
    defensePatterns: [
      /(?:abuse|misuse|exploit|attack|inappropriate|spam|flood|濫用|惡用|不當使用|攻擊)/i,
      /(?:rate limit|throttl|quota|maximum.*request|限制|配額|頻率)/i,
      /(?:authenticat|authoriz|permission|access control|api.?key|token|驗證|授權|權限)/i,
    ],
    minMatches: 1,
  },
  {
    id: 'input-validation-missing',
    name: '輸入驗證',
    nameEn: 'Input Validation',
    defensePatterns: [
      /(?:validate|sanitize|filter|clean|escape|strip|check.*input|input.*(?:validation|check)|驗證|過濾|清理|檢查.*輸入|輸入.*驗證)/i,
      /(?:sql|xss|injection|script|html|special char|malicious|sql注入|跨站|惡意(?:程式|腳本))/i,
    ],
    minMatches: 1,
  },
]

/**
 * Check for suspicious Unicode characters in the prompt itself
 */
function hasSuspiciousUnicode(prompt: string): { found: boolean; evidence: string } {
  const checks = [
    { pattern: /[\u0400-\u04FF]/g, name: 'Cyrillic' },
    { pattern: /[\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, name: 'Zero-width' },
    { pattern: /[\u202A-\u202E]/g, name: 'RTL override' },
    { pattern: /[\uFF01-\uFF5E]/g, name: 'Fullwidth' },
  ]

  for (const check of checks) {
    const matches = prompt.match(check.pattern)
    if (matches && matches.length > 0) {
      return { found: true, evidence: `Found ${matches.length} ${check.name} character(s)` }
    }
  }
  return { found: false, evidence: '' }
}

/**
 * Run deterministic defense analysis on a system prompt.
 * Returns which defenses are present/missing and a coverage score.
 */
export function runDeterministicScan(prompt: string): DeterministicResult {
  const checks: DefenseCheck[] = []

  for (const rule of DEFENSE_RULES) {
    const minMatches = rule.minMatches ?? 1
    let matchCount = 0
    let evidence = ''

    // Special handling for unicode-attack: check for suspicious chars
    if (rule.id === 'unicode-attack') {
      const unicodeCheck = hasSuspiciousUnicode(prompt)
      if (unicodeCheck.found) {
        checks.push({
          id: rule.id,
          name: rule.name,
          defended: false,
          confidence: 0.9,
          evidence: unicodeCheck.evidence,
        })
        continue
      }
      // Also check if prompt mentions unicode handling
    }

    for (const pattern of rule.defensePatterns) {
      const match = prompt.match(pattern)
      if (match) {
        matchCount++
        if (!evidence) {
          evidence = match[0].substring(0, 60)
        }
      }
    }

    const defended = matchCount >= minMatches
    const confidence = defended
      ? Math.min(0.9, 0.5 + matchCount * 0.2)
      : matchCount > 0 ? 0.4 : 0.8  // High confidence it's missing when NO matches

    checks.push({
      id: rule.id,
      name: rule.name,
      defended,
      confidence,
      evidence: defended
        ? `Found: "${evidence}"`
        : matchCount > 0
          ? `Partial: only ${matchCount}/${minMatches} defense pattern(s)`
          : 'No defense pattern found',
    })
  }

  const totalWeight = DEFENSE_RULES.length
  const defendedCount = checks.filter(c => c.defended).length
  const score = Math.round((defendedCount / totalWeight) * 100)

  return {
    checks,
    score,
    coverage: `${defendedCount}/${totalWeight}`,
  }
}
