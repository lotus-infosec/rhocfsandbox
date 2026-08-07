// GET /api/sensitive-block/{type}
// Same synthetic PII payloads as /api/sensitive-log/{type}, but the SDD
// managed ruleset on this path prefix is configured with action = BLOCK.
// The function runs and emits a response body; Cloudflare inspects it at
// egress, matches the detector, and replaces the response with a 403 block
// page before it leaves the edge.

const PAYLOADS: Record<string, { label: string; value: string; note: string }> = {
  ssn: {
    label: 'social security number',
    value: 'SSN: 000-12-3456',
    note: 'synthetic. 000-XX ssns are reserved-invalid.',
  },
  cc: {
    label: 'credit card',
    value: 'card: 4111 1111 1111 1111 exp 12/29 cvv 123',
    note: 'synthetic. industry test visa number.',
  },
  email: {
    label: 'email address',
    value: 'contact: not-a-real-person@example.com',
    note: 'synthetic. example.com is reserved by rfc 2606.',
  },
  phone: {
    label: 'phone number',
    value: 'phone: (555) 012-3456',
    note: 'synthetic. 555-01XX numbers are reserved.',
  },
  apikey: {
    label: 'api key',
    value: 'API_KEY=sandbox-cfat-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    note: 'synthetic. shaped like a plausible token but contains no valid material.',
  },
};

export const onRequest: PagesFunction<any, 'type'> = async ({ params }) => {
  const type = String(params.type || '').toLowerCase();
  const payload = PAYLOADS[type];

  if (!payload) {
    return new Response(JSON.stringify({
      error: 'unknown type',
      available: Object.keys(PAYLOADS),
    }, null, 2), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify({
    action: 'block-if-sdd-catches-this',
    type,
    label: payload.label,
    payload: payload.value,
    note: payload.note,
    sdd: 'cloudflare sensitive data detection is configured to BLOCK matches on this path prefix. if you are reading this in your client, sdd did not catch it — check the managed ruleset deployment.',
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
