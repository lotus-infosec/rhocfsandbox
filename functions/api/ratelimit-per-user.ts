// GET /api/ratelimit-per-user
// Trivial endpoint behind a Cloudflare Advanced Rate Limiting rule that
// counts by the `x-user-id` header. Different values get independent buckets.

export const onRequest: PagesFunction = async ({ request }) => {
  const userId = request.headers.get('x-user-id') || 'no-user-id';
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  return new Response(JSON.stringify({
    ok: true,
    userId,
    from: ip,
    note: 'if you see 429 responses in the client, cloudflare rate limited that user id at the edge before this function ran.',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
