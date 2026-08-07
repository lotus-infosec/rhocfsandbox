// POST /api/workflow-start { input } → triggers the demo workflow
// The workflow lives in the site-workflow worker (Cloudflare Workflows).
// It has 3 steps with sleeps between them:
//   1. uppercase the input
//   2. wait 3 seconds
//   3. reverse the string
//   4. wait 3 seconds
//   5. return the length
// Total run time ~6-8 seconds. Client polls /api/workflow-status?id=<instance_id>.

interface Env {
  WORKFLOW: Workflow;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const input = String(body?.input || 'demo').slice(0, 60);

  const instance = await env.WORKFLOW.create({ params: { input } });
  return json({ id: instance.id, started_at: new Date().toISOString() }, 202);
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
