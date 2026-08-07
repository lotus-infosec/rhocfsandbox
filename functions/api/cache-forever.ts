// GET /api/cache-forever
// Cache rule sets edge TTL to 86400 seconds (1 day). Once warm, every
// request in that colo returns the same cached response.

export const onRequest: PagesFunction = async ({ request }) => {
  const body = { ok: true, generatedAt: new Date().toISOString(), ttl: 86400 };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-tag': 'SITE_cache_rules_demo',
    },
  });
};
