// POST /api/vector-search { query }
// Uses Workers AI to embed the query, then queries the Vectorize index for
// nearest neighbors. Returns the top 5 matches with their metadata.

interface Env {
  AI: Ai;
  VEC: VectorizeIndex;
}

const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';
const TOP_K = 5;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const query = String(body?.query || '').trim().slice(0, 200);
  if (!query) return json({ error: 'missing_query' }, 400);

  const embed = await env.AI.run(EMBED_MODEL as any, { text: [query] }) as any;
  const vec = embed?.data?.[0];
  if (!vec) return json({ error: 'embedding_failed' }, 500);

  const matches = await env.VEC.query(vec, { topK: TOP_K, returnMetadata: 'all' });
  return json({
    query,
    matches: (matches?.matches || []).map((m: any) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata,
    })),
  });
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
