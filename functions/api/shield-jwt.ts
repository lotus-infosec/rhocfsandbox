// GET /api/shield-jwt
// This endpoint is protected by Cloudflare API Shield JWT validation.
// If a request reaches this function, API Shield already verified the
// token's signature, expiration, and not-before at the edge.
//
// The function decodes and echoes the claims for demo visibility. It does
// NOT re-verify the signature — the whole point is to show that API
// Shield already did that upstream.

export const onRequestGet: PagesFunction = async ({ request }) => {
  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  let decoded: any = null;
  if (m) {
    const parts = m[1].split('.');
    if (parts.length === 3) {
      try {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        decoded = JSON.parse(payloadJson);
      } catch { /* ignore */ }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    note: 'if you see this response, api shield jwt validation let the request through. the token is cryptographically valid, not expired, and matches the configured token validation.',
    claims: decoded,
    hasBearer: !!m,
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
