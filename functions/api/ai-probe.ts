// GET /api/ai-probe
// Trivial endpoint used behind a WAF custom rule blocking AI scraper
// user-agents. If you see this response, the WAF let you through.

export const onRequest: PagesFunction = async ({ request }) => {
  const ua = request.headers.get('user-agent') || 'unknown';
  return new Response(JSON.stringify({
    ok: true,
    userAgent: ua,
    note: 'you are not an ai scraper (or you are, and you spoofed a normal user-agent).',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
