// GET /api/deny-403
// Returns a branded 403 forbidden page. Demo endpoint for custom error UX.

export const onRequest: PagesFunction = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  if (wantsJson) {
    return new Response(JSON.stringify({
      error: 'forbidden',
      status: 403,
      message: 'the request was authenticated but not allowed to access this resource.',
    }, null, 2), {
      status: 403,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>403 — rhocfsandbox</title>
<meta http-equiv="refresh" content="0; url=/errors/403/">
<link rel="canonical" href="/errors/403/"></head>
<body><p>403 forbidden. see <a href="/errors/403/">/errors/403/</a>.</p></body></html>`;

  return new Response(html, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
