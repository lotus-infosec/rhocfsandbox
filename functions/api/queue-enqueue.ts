// POST /api/queue-enqueue { text } → publishes a message to site-queue.
// Consumer worker (site-queue-consumer) processes the message asynchronously
// (uppercases the text) and stores the result in Workers KV under job:<id>.
// Client polls /api/queue-status?id=<id> until the result appears.

interface Env {
  QUEUE: Queue;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const text = String(body?.text || '').trim().slice(0, 200);
  if (!text) return json({ error: 'missing_text' }, 400);

  // We don't get the message id back from send(), so we generate a correlation id
  // and include it in the payload so the consumer can persist under a known key.
  const id = crypto.randomUUID();
  await env.QUEUE.send({ id, text, enqueued_at: new Date().toISOString() });
  return json({ id, queued: true, poll_url: `/api/queue-status?id=${id}` }, 202);
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
