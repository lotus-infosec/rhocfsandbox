// GET /api/ratelimit-me
// Trivial endpoint used behind a Cloudflare Rate Limiting rule.
// Cloudflare enforces the limit at the edge; this function only sees
// requests that were allowed through.

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const n = url.searchParams.get('n') || 'n/a';
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  return new Response(JSON.stringify({
    ok: true,
    n,
    from: ip,
    note: 'if you see 429 responses in the client, cloudflare blocked those at the edge before this function ran.',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
