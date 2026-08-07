// GET /api/sensitive-log/{type}
// Returns synthetic PII of the requested type. Cloudflare Sensitive Data
// Detection managed ruleset is deployed on this path prefix with action = LOG.
// The response body reaches the client unchanged; SDD records a finding in
// Security Events for observability.
//
// All values are synthetic:
//   - SSN uses the reserved-invalid 000-XX range
//   - CC is the industry test Visa 4111 1111 1111 1111
//   - phone uses the reserved 555-01XX range
//   - email is example.com per RFC 2606
//   - apikey is a plausibly-shaped fake with a demo prefix

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
    action: 'log',
    type,
    label: payload.label,
    payload: payload.value,
    note: payload.note,
    sdd: 'cloudflare sensitive data detection is configured to LOG matches on this path prefix. finding appears in security events.',
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
