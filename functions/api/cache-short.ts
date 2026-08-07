// GET /api/cache-short
// Cache rule sets edge TTL to 1 second. Basically un-cached in practice —
// nearly every refresh will MISS and re-run this function.

export const onRequest: PagesFunction = async ({ request }) => {
  const body = { ok: true, generatedAt: new Date().toISOString(), ttl: 1 };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-tag': 'SITE_cache_rules_demo',
    },
  });
};
