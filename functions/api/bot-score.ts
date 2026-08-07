// GET /api/bot-score
// Returns cloudflare bot management signals for the current request. Fields
// available depend on the zone's bot management sku. Free tier gets score +
// verifiedBot at minimum; enterprise gets ja3Hash, corporateProxy,
// detectionIds, and more.

export const onRequest: PagesFunction = async ({ request }) => {
  const cf = (request as any).cf || {};
  const bm = cf.botManagement || {};

  return new Response(JSON.stringify({
    ok: true,
    botManagement: {
      score: bm.score ?? null,
      verifiedBot: bm.verifiedBot ?? null,
      staticResource: bm.staticResource ?? null,
      ja3Hash: bm.ja3Hash ?? null,
      corporateProxy: bm.corporateProxy ?? null,
      detectionIds: bm.detectionIds ?? null,
    },
    userAgent: request.headers.get('user-agent') || 'unknown',
    country: cf.country || 'unknown',
    colo: cf.colo || 'unknown',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
