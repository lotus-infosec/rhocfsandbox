// GET /api/workflow-status?id=<instance_id> → proxies to site-workflow's /status endpoint.

const WF_ORIGIN = 'https://site-workflow.rhomanie-demo-account.workers.dev';

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'missing_id' }, 400);
  const r = await fetch(`${WF_ORIGIN}/status?id=${encodeURIComponent(id)}`);
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
