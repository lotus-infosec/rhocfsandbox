// GET /api/deny-429
// Returns a branded 429 too-many-requests page. Static demo of the 429 UX
// without needing to actually exhaust the rate limit rule.
// For the real edge-served 429 from a rate limit, see /waf-ratelimit.

export const onRequest: PagesFunction = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  if (wantsJson) {
    return new Response(JSON.stringify({
      error: 'too_many_requests',
      status: 429,
      message: 'demo endpoint. always returns 429. this is a static preview of the 429 experience.',
    }, null, 2), {
      status: 429,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '10',
      },
    });
  }

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>429 — rhocfsandbox</title>
<meta http-equiv="refresh" content="0; url=/errors/429/">
<link rel="canonical" href="/errors/429/"></head>
<body><p>429 too many requests. see <a href="/errors/429/">/errors/429/</a>.</p></body></html>`;

  return new Response(html, {
    status: 429,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '10',
    },
  });
};
