// GET /api/dlp-test?type=<ssn|cc|apikey|email|phone>
//
// Returns SYNTHETIC pii-shaped strings so DLP detectors have something to
// catch on egress or inline inspection. Every value here is fabricated:
//
//   - SSN: uses 000-XX-XXXX / 9XX-XX-XXXX ranges reserved as invalid by SSA
//   - CC:  4111 1111 1111 1111 is the industry-standard test card number
//   - API key: a fabricated string with a "sandbox-" prefix
//
// None of these are live credentials.

const PAYLOADS: Record<string, { label: string; value: string; note: string }> = {
  ssn: {
    label: 'ssn (synthetic)',
    value: 'employee ssn on file: 000-12-3456',
    note: 'the 000-XX-XXXX prefix is reserved as invalid by the SSA and is safe to use as a test value.',
  },
  cc: {
    label: 'credit card (synthetic — luhn-valid test card)',
    value: 'card: 4111 1111 1111 1111  exp: 12/29  cvv: 123',
    note: '4111-1111-1111-1111 is the industry-standard visa test number, luhn-valid but non-issued.',
  },
  apikey: {
    label: 'api key (synthetic)',
    value: 'API_KEY=sandbox-cfat-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    note: 'shaped like a plausible token but prefixed with "sandbox-" and contains no valid material.',
  },
  email: {
    label: 'email (synthetic)',
    value: 'contact: not-a-real-person@rhocfsandbox.com',
    note: 'a mailbox on this sandbox domain, not routed anywhere.',
  },
  phone: {
    label: 'phone (synthetic)',
    value: 'phone: (555) 123-4567',
    note: '555-01XX numbers are reserved by the north american numbering plan for fictional use.',
  },
};

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const type = (url.searchParams.get('type') ?? 'ssn').toLowerCase();
  const payload = PAYLOADS[type];

  if (!payload) {
    return new Response(
      JSON.stringify(
        {
          error: 'unknown type',
          supported: Object.keys(PAYLOADS),
        },
        null,
        2,
      ),
      {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  }

  const body = {
    endpoint: '/api/dlp-test',
    type,
    label: payload.label,
    payload: payload.value,
    note: payload.note,
    disclaimer:
      'all values on this endpoint are synthetic and non-issued. this exists solely to give dlp detectors a well-shaped target.',
    hint: 'trigger this endpoint through a warp-enrolled device with dlp enforcement enabled to see the detector fire.',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
