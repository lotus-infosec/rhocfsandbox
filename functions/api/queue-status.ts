// GET /api/queue-status?id=<correlation_id>
// Reads the result out of KV (populated by site-queue-consumer). Uses the same
// KV binding so we avoid an extra HTTP hop to the consumer worker.

interface Env {
  KV_COUNTER: KVNamespace; // reused: KV binding, not just for counter
}

// The queue consumer stores results in the SAME KV namespace we bound as
// KV_COUNTER on the pages project. The binding was named for the counter demo
// but the underlying namespace is shared.

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 });
  const v = await env.KV_COUNTER.get(`job:${id}`, 'json');
  return new Response(JSON.stringify(v || { pending: true, id }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
