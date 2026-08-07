// GET /.well-known/jwks.json
// Publishes the public key(s) as a JWKS. Cloudflare API Shield's JWT
// validation config points at this URL and fetches keys from here.
// Private JWK lives in Pages env var SITE_JWT_PRIVATE_JWK; we derive the
// public JWK on the fly (kty, kid, alg, use, n, e) so there is one source
// of truth.

interface Env {
  SITE_JWT_PRIVATE_JWK: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.SITE_JWT_PRIVATE_JWK) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
  const priv = JSON.parse(env.SITE_JWT_PRIVATE_JWK);
  const pub = { kty: priv.kty, use: priv.use, alg: priv.alg, kid: priv.kid, n: priv.n, e: priv.e };
  return new Response(JSON.stringify({ keys: [pub] }, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
};
