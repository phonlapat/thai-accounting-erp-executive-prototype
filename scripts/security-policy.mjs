export const PRODUCTION_CSP_DIRECTIVES = Object.freeze([
  "default-src 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self'",
  "style-src-attr 'none'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "media-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
]);

export const PRODUCTION_CSP = PRODUCTION_CSP_DIRECTIVES.join('; ');
