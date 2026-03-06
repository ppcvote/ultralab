/**
 * Analytics helper for Plausible + Google Analytics 4
 *
 * Usage:
 *   import { trackEvent, ProbeEvents } from '@/lib/analytics'
 *   trackEvent('Scan Completed', { grade: 'B', type: 'prompt' })
 *   ProbeEvents.scanCompleted('prompt', 'B', 85)
 */

interface EventProps {
  [key: string]: string | number | boolean
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void
    gtag?: (...args: any[]) => void
  }
}

/**
 * Track custom event to Plausible + GA4
 */
export function trackEvent(eventName: string, props?: EventProps) {
  // Plausible
  if (window.plausible) {
    window.plausible(eventName, props ? { props } : undefined)
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, props)
  }

  // Fallback: console log in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, props)
  }
}

/**
 * Track page view (for SPA routing)
 */
export function trackPageView(path?: string) {
  const url = path || window.location.pathname

  // Plausible auto-tracks page views, manual trigger if needed
  if (window.plausible) {
    window.plausible('pageview', { props: { path: url } })
  }

  // GA4
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: url,
    })
  }
}

/**
 * Legacy helpers (backward compatibility)
 */
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

/**
 * UltraProbe event helpers
 */
export const ProbeEvents = {
  scanStarted: (type: 'prompt' | 'url') =>
    trackEvent('Scan Started', { scan_type: type }),

  scanCompleted: (type: 'prompt' | 'url', grade: string, score: number) =>
    trackEvent('Scan Completed', {
      scan_type: type,
      grade,
      score,
    }),

  emailGateUnlock: (scanType: 'prompt' | 'url', emailDomain: string) =>
    trackEvent('Email Gate Unlock', {
      scan_type: scanType,
      email_domain: emailDomain, // e.g., 'gmail.com' (privacy-safe)
    }),

  vulnDetailsView: (severity: string) =>
    trackEvent('Vulnerability Details Viewed', { severity }),

  ctaClick: (location: string, target: string) =>
    trackEvent('CTA Clicked', {
      location, // e.g., 'scan_results', 'hero', 'footer'
      target, // e.g., 'contact', 'github', 'product_hunt'
    }),

  githubClick: () =>
    trackEvent('GitHub Repository Clicked', {}),

  apiDocsClick: () =>
    trackEvent('API Documentation Clicked', {}),
}

/**
 * Main site event helpers
 */
export const SiteEvents = {
  contactFormSubmit: (service: string) =>
    trackEvent('Contact Form Submitted', { service }),

  serviceView: (serviceName: string) =>
    trackEvent('Service Viewed', { service: serviceName }),

  pricingView: (tier: string) =>
    trackEvent('Pricing Viewed', { tier }),

  externalLink: (destination: string) =>
    trackEvent('External Link Clicked', { destination }),
}