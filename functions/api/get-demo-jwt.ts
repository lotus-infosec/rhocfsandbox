// GET /api/get-demo-jwt?exp=<seconds>&sub=<subject>
// Mints a short-lived RS256 JWT signed with the site's private key (from
// pages env var). Returned in the response body so the client can copy
// it into an Authorization header on the next call.
//
// Params:
//   exp   — seconds until expiry (default 300, max 3600, negative = already expired)
//   sub   — subject claim (default "rho-demo-user")

interface Env {
  SITE_JWT_PRIVATE_JWK: string;
}

function b64url(input: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SITE_JWT_PRIVATE_JWK) {
    return new Response(JSON.stringify({ error: 'server_misconfigured_no_key' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);
  let expIn = parseInt(url.searchParams.get('exp') || '300', 10);
  if (isNaN(expIn)) expIn = 300;
  if (expIn > 3600) expIn = 3600;
  const sub = url.searchParams.get('sub') || 'rho-demo-user';

  const priv = JSON.parse(env.SITE_JWT_PRIVATE_JWK);
  const header = { alg: 'RS256', typ: 'JWT', kid: priv.kid };
  const payload = {
    iss: 'https://rhocfsandbox.com',
    sub,
    aud: 'rhocfsandbox-demo',
    iat: now,
    nbf: now,
    exp: now + expIn,
    jti: crypto.randomUUID(),
  };
  const signingInput = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));

  const key = await crypto.subtle.importKey(
    'jwk',
    { ...priv, key_ops: ['sign'] },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const jwt = signingInput + '.' + b64url(sig);

  return new Response(JSON.stringify({
    jwt,
    header,
    payload,
    note: 'copy the jwt string into an Authorization: Bearer <jwt> header on the next call to /api/shield-jwt.',
    expiresInSeconds: expIn,
  }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
