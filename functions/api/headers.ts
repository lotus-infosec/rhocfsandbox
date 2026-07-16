// GET /api/headers — echo back every request header cloudflare forwards.
// Useful for debugging service tokens, access jwts, and warp posture headers.

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    // Redact obvious secrets by default — access jwt is long-lived enough to matter.
    if (key.toLowerCase() === 'cf-access-jwt-assertion') {
      headers[key] = value.slice(0, 24) + '…(redacted)';
    } else if (key.toLowerCase() === 'cookie') {
      headers[key] = '(redacted)';
    } else {
      headers[key] = value;
    }
  });

  const body = {
    method: request.method,
    url: request.url,
    headers,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
