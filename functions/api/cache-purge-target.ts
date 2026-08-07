// GET /api/cache-purge-target
// Same shape as /api/cache-hit but with a long edge TTL (1 hour) and its
// own cache tag `SITE_cache_purge_demo`. Purpose: purge-by-tag demo. You
// hit it a few times to warm the cache, then purge that tag from the
// dashboard or API, then refresh to see a new `generatedAt`.

export const onRequest: PagesFunction = async ({ request }) => {
  const body = {
    ok: true,
    generatedAt: new Date().toISOString(),
    note: 'edge ttl 3600s. purge cache tag SITE_cache_purge_demo to force a refetch.',
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-tag': 'SITE_cache_purge_demo',
    },
  });
};
