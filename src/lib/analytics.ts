/**
 * GA4 事件追蹤工具
 * 使用方式：trackEvent('cta_click', { label: '免費諮詢' })
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (window.gtag) {
    window.gtag('event', eventName, params)
  }
}

export function trackCTAClick(label: string) {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: label,
  })
}

export function trackFormSubmit(service: string) {
  trackEvent('form_submit', {
    event_category: 'conversion',
    event_label: service,
  })
}