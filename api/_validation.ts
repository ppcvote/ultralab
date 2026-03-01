/**
 * Input validation and sanitization utilities
 * for UltraProbe security
 */

/**
 * Sanitize user input by removing dangerous characters
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  // 1. Trim + length check
  let cleaned = input.trim()
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
  }

  // 2. Remove control characters (except newline, tab)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')

  // 3. Normalize Unicode (prevent homograph attacks)
  cleaned = cleaned.normalize('NFC')

  return cleaned
}

/**
 * Check if input contains malicious patterns
 */
export function containsMaliciousPatterns(input: string): boolean {
  const MALICIOUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,  // XSS script tags
    /javascript:/gi,                  // JavaScript protocol
    /on\w+\s*=/gi,                    // Event handlers (onclick, onerror, etc.)
    /eval\s*\(/gi,                    // eval() execution
    /expression\s*\(/gi,              // IE expression()
    /import\s+/gi,                    // Import statements
    /__proto__/gi,                    // Prototype pollution
    /constructor\s*\[/gi,             // Constructor access
  ]

  return MALICIOUS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Improved email validation (RFC 5322 simplified)
 */
export function isValidEmail(email: string): boolean {
  // More comprehensive email regex
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!re.test(email)) return false

  // Additional checks
  if (email.length > 254) return false  // RFC 5321
  const [local, domain] = email.split('@')
  if (local.length > 64) return false  // RFC 5321
  if (domain.split('.').some(part => part.length > 63)) return false  // DNS label limit

  // Block disposable email domains (optional)
  const DISPOSABLE_DOMAINS = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'throwaway.email',
    'maildrop.cc',
  ]

  if (DISPOSABLE_DOMAINS.some(d => domain.toLowerCase().endsWith(d))) {
    return false
  }

  return true
}

/**
 * Check Content-Length to prevent large payloads
 */
export function isContentLengthValid(
  contentLength: string | undefined,
  maxSize: number = 100 * 1024  // 100 KB default
): boolean {
  if (!contentLength) return true  // No Content-Length header

  const size = parseInt(contentLength, 10)
  return !isNaN(size) && size <= maxSize
}
