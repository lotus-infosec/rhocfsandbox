// GET /api/geo-check
// Returns the detected country. If the request came from the US, the WAF
// custom rule `SITE_waf_geo_us_block` will have blocked it before this
// function ran, so this response is only visible to non-US visitors.

export const onRequest: PagesFunction = async ({ request }) => {
  const cf = (request as any).cf || {};
  const country = cf.country || request.headers.get('cf-ipcountry') || 'unknown';
  const colo = cf.colo || 'unknown';
  const asn = cf.asn || 'unknown';

  return new Response(JSON.stringify({
    ok: true,
    country,
    colo,
    asn,
    note: 'if you can see this response, the waf geo rule did not block you (you are not in the US).',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
