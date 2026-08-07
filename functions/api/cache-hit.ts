// GET /api/cache-hit
// Trivial "current time" endpoint. Cloudflare cache rule `SITE_cache_hit_ttl`
// makes this eligible for edge cache with a 300s edge TTL. First request
// after cold cache = MISS (this function runs). Subsequent = HIT (function
// does not run; response served from cache in the requester's colo).
//
// The `cache-tag` header is what makes purge-by-tag possible from the
// dashboard or API.

export const onRequest: PagesFunction = async ({ request }) => {
  const body = {
    ok: true,
    generatedAt: new Date().toISOString(),
    note: 'if you refresh and generatedAt does not change, this response was served from cache. cf-cache-status header tells you which.',
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-tag': 'SITE_cache_demo',
    },
  });
};
