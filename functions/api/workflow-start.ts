// POST /api/workflow-start { input } → proxies to the site-workflow worker's /start endpoint.
// Pages doesn't support the workflows binding in wrangler.toml, so instead of a
// direct binding we hop over HTTP to the workflow-hosting worker. Adds one hop
// of latency (a few ms edge-to-edge) but keeps the demo working.

const WF_ORIGIN = 'https://site-workflow.rhomanie-demo-account.workers.dev';

export const onRequestPost: PagesFunction = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const input = String(body?.input || 'demo').slice(0, 60);

  const r = await fetch(`${WF_ORIGIN}/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
