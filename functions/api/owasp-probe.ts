// GET /api/owasp-probe?q=<payload>
// Echoes the query parameter back. In practice, cloudflare's managed rulesets
// (cloudflare managed + owasp core) inspect the request first and will block
// xss / sqli / path-traversal / command-injection payloads before this
// function ever runs. safe queries reach here and return 200.

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  return new Response(JSON.stringify({
    ok: true,
    q,
    note: 'this function only sees requests that the managed rulesets did not block.',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
