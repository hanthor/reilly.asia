export const STRICT_CONTENT_SECURITY_POLICY =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'sha256-J7Va4FlAf5KpCsWNMyrZcDZ4n3RviiLUQw5wBOgAf54='; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests";

export const HANDBOOK_CONTENT_SECURITY_POLICY =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests";

export const SECURITY_HEADERS = {
  "Content-Security-Policy": STRICT_CONTENT_SECURITY_POLICY,
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

/** Apply the site's security policy to static assets and Worker-generated responses. */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    // The proxied mdBook needs its own inline-script policy; every other
    // security header is authoritative and replaces any upstream value.
    if (name !== "Content-Security-Policy" || !headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
