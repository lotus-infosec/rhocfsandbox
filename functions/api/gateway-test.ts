// GET /api/gateway-test?category=<name>
//
// Returns a labeled, safe response body meant to be paired with a Gateway
// HTTP policy that matches on hostname/path or on custom category rules.
//
// This does NOT host malicious content. It returns a small labeled payload
// so you can watch a Gateway policy fire in analytics against real traffic
// to your own domain.

const CATEGORIES: Record<string, { label: string; description: string }> = {
  malware: {
    label: 'malware (stub)',
    description: 'used to validate http policies scoped to malware category or custom "known bad" hostname lists.',
  },
  phishing: {
    label: 'phishing (stub)',
    description: 'validate anti-phishing http policies and inline block-page rendering.',
  },
  social: {
    label: 'social media (stub)',
    description: 'validate category-based social-media blocks or isolate policies.',
  },
  ai: {
    label: 'ai / generative (stub)',
    description: 'validate ai category rules, prompt-egress detection, and casb ai posture.',
  },
  gambling: {
    label: 'gambling (stub)',
    description: 'validate category-based gambling policies.',
  },
  streaming: {
    label: 'streaming media (stub)',
    description: 'validate qos / streaming-media category rules.',
  },
};

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const category = (url.searchParams.get('category') ?? 'unknown').toLowerCase();
  const match = CATEGORIES[category];

  const body = {
    endpoint: '/api/gateway-test',
    requested_category: category,
    matched: !!match,
    label: match?.label ?? 'unknown category (safe stub)',
    description:
      match?.description ??
      'this category is not recognized. supported: ' + Object.keys(CATEGORIES).join(', '),
    disclaimer:
      'this endpoint returns a labeled synthetic payload only. no malicious, phishing, or otherwise harmful content is hosted here.',
    hint: 'point a warp-enrolled device at this url while a matching gateway policy is enabled to see the block/isolate action fire.',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      // Hint header so http policies can match on a custom response signal too.
      'x-sandbox-category': category,
    },
  });
};
