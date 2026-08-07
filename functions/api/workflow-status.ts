// GET /api/workflow-status?id=<instance_id>
// Returns the current status of a workflow instance.

interface Env {
  WORKFLOW: Workflow;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'missing_id' }, 400);

  try {
    const instance = await env.WORKFLOW.get(id);
    const status = await instance.status();
    return json({ id, status });
  } catch (e: any) {
    return json({ id, error: e.message || String(e) }, 404);
  }
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
