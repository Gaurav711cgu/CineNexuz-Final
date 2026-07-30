/**
 * CineNexus DOMPurify & XSS Input Sanitization Engine (Phase 2 Security)
 * Prevents Cross-Site Scripting (XSS) attacks in search inputs, user reviews, and dynamic content.
 */

export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Basic HTML entity encoding to prevent XSS script injection
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

export function sanitizeQuery(query) {
  if (!query) return '';
  // Strip control characters & dangerous injection characters
  return query.replace(/[^\w\s\-\.\,\:\?]/gi, '').trim();
}
