// GET  /api/counter → returns current count
// POST /api/counter → atomically increments and returns new count
// Backed by Workers KV (SITE_counter_kv) via the KV_COUNTER binding.
// KV is eventually consistent globally, so a burst of increments can show
// up out of order across colos. Fine for a demo, do not use for banking.

interface Env {
  KV_COUNTER: KVNamespace;
}

const KEY = 'global_counter';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const v = await env.KV_COUNTER.get(KEY);
  return json({ count: parseInt(v || '0', 10) });
};

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const cur = parseInt((await env.KV_COUNTER.get(KEY)) || '0', 10);
  const next = cur + 1;
  await env.KV_COUNTER.put(KEY, String(next));
  return json({ count: next, incremented: true });
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
