// GET /api/shield-schema?id=<uuid>
// This endpoint is protected by Cloudflare API Shield Schema Validation.
// The uploaded OpenAPI schema requires ?id=<uuid> with format: uuid.
// Requests missing the param or with a non-UUID value are blocked at the
// edge before this function runs.

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || null;
  return new Response(JSON.stringify({
    ok: true,
    id,
    note: 'if you see this response, api shield schema validation let the request through. it means id was present and matched format: uuid.',
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
