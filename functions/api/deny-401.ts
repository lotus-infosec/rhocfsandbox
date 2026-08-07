// GET /api/deny-401
// Returns a branded 401 unauthorized page. Demo endpoint for custom error UX.

export const onRequest: PagesFunction = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  if (wantsJson) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      status: 401,
      message: 'this endpoint expects credentials that were not provided.',
    }, null, 2), {
      status: 401,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'www-authenticate': 'Bearer realm="rhocfsandbox demo"',
      },
    });
  }

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>401 — rhocfsandbox</title>
<meta http-equiv="refresh" content="0; url=/errors/401/">
<link rel="canonical" href="/errors/401/"></head>
<body><p>401 unauthorized. see <a href="/errors/401/">/errors/401/</a>.</p></body></html>`;

  return new Response(html, {
    status: 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'www-authenticate': 'Bearer realm="rhocfsandbox demo"',
    },
  });
};
