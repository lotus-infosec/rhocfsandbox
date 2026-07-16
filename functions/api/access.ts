// GET /api/access — decode + verify the Cloudflare Access JWT from the
// CF_Authorization cookie, and reflect the identity back to the caller.
//
// This is defense-in-depth: Access already validated the JWT at the edge
// before this Function ran. We re-verify here to demonstrate the pattern
// an origin behind Access would use.

interface Jwk {
  kid: string;
  kty: string;
  alg: string;
  use?: string;
  n: string;
  e: string;
}

interface Jwks {
  keys: Jwk[];
}

// Per-isolate JWKS cache. Cheap; keys rotate rarely.
let jwksCache: { url: string; fetchedAt: number; jwks: Jwks } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000; // 10 minutes

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToJson<T = unknown>(s: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as T;
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

async function getJwks(iss: string): Promise<Jwks> {
  const url = `${iss.replace(/\/$/, '')}/cdn-cgi/access/certs`;
  const now = Date.now();
  if (jwksCache && jwksCache.url === url && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.jwks;
  }
  const res = await fetch(url, { cf: { cacheEverything: true, cacheTtl: 600 } as any });
  if (!res.ok) throw new Error(`jwks fetch failed: ${res.status}`);
  const jwks = (await res.json()) as Jwks;
  jwksCache = { url, fetchedAt: now, jwks };
  return jwks;
}

async function verifyRs256(
  jwk: Jwk,
  signingInput: string,
  signature: Uint8Array,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true } as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    new TextEncoder().encode(signingInput),
  );
}

export const onRequest: PagesFunction = async (context) => {
  const h = context.request.headers;
  const ray = h.get('cf-ray') ?? null;
  const colo = ray ? ray.split('-')[1] ?? null : null;

  const cookieHeader = h.get('cookie');
  const jwt = readCookie(cookieHeader, 'CF_Authorization');

  const base = {
    cookiePresent: !!jwt,
    country: h.get('cf-ipcountry') ?? null,
    ray,
    colo,
    timestamp: new Date().toISOString(),
  };

  if (!jwt) {
    return json({
      ...base,
      authenticated: false,
      reason:
        'no CF_Authorization cookie — this route is not currently gated by an Access application, or you have not authenticated.',
    });
  }

  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return json({ ...base, authenticated: false, reason: 'malformed jwt' }, 400);
  }

  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg: string; kid: string };
  let payload: Record<string, unknown>;
  try {
    header = b64urlToJson(headerB64);
    payload = b64urlToJson(payloadB64);
  } catch {
    return json({ ...base, authenticated: false, reason: 'jwt decode failed' }, 400);
  }

  const iss = typeof payload.iss === 'string' ? payload.iss : null;
  const team = iss ? iss.replace(/^https?:\/\//, '').replace(/\.cloudflareaccess\.com.*$/, '') : null;

  const nowSec = Math.floor(Date.now() / 1000);
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : null;
  const exp = typeof payload.exp === 'number' ? payload.exp : null;
  const iat = typeof payload.iat === 'number' ? payload.iat : null;

  const timeValid =
    (nbf === null || nowSec >= nbf) && (exp === null || nowSec < exp);

  let signatureValid = false;
  let sigError: string | null = null;
  try {
    if (!iss) throw new Error('missing iss claim');
    if (header.alg !== 'RS256') throw new Error(`unsupported alg: ${header.alg}`);
    const jwks = await getJwks(iss);
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) throw new Error(`kid ${header.kid} not in jwks`);
    signatureValid = await verifyRs256(
      jwk,
      `${headerB64}.${payloadB64}`,
      b64urlToBytes(sigB64),
    );
  } catch (err) {
    sigError = err instanceof Error ? err.message : String(err);
  }

  const aud = Array.isArray(payload.aud)
    ? (payload.aud as unknown[]).filter((x): x is string => typeof x === 'string')
    : typeof payload.aud === 'string'
      ? [payload.aud]
      : [];

  return json({
    ...base,
    authenticated: signatureValid && timeValid,
    email: (payload as any).email ?? null,
    sub: (payload as any).sub ?? null,
    identityNonce: (payload as any).identity_nonce ?? null,
    aud,
    iss,
    team,
    type: (payload as any).type ?? null,
    country_claim: (payload as any).country ?? null,
    policyId: (payload as any).policy_id ?? null,
    iat,
    nbf,
    exp,
    timeValid,
    signatureValid,
    signatureError: sigError,
    kid: header.kid,
    alg: header.alg,
  });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
