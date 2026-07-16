// GET /api/whoami — return everything cloudflare knows about the request.
// Runs as a Pages Function on Cloudflare's edge.

interface Env {}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const cf = (request as any).cf ?? {};
  const headers = request.headers;

  const ip = headers.get('cf-connecting-ip') ?? '';
  const ipVersion = ip.includes(':') ? 'IPv6' : ip ? 'IPv4' : '';

  const data = {
    // core identifiers
    ray: headers.get('cf-ray') ?? null,
    colo: (headers.get('cf-ray') ?? '').split('-')[1] ?? null,
    ip,
    ipVersion,

    // geoip
    country: cf.country ?? headers.get('cf-ipcountry') ?? null,
    continent: cf.continent ?? null,
    region: cf.region ?? null,
    regionCode: cf.regionCode ?? null,
    city: cf.city ?? null,
    postalCode: cf.postalCode ?? null,
    timezone: cf.timezone ?? null,
    latitude: cf.latitude ?? null,
    longitude: cf.longitude ?? null,

    // network
    asn: cf.asn ?? null,
    asOrganization: cf.asOrganization ?? null,

    // tls / http
    tlsVersion: cf.tlsVersion ?? null,
    tlsCipher: cf.tlsCipher ?? null,
    httpProtocol: cf.httpProtocol ?? null,

    // client
    userAgent: headers.get('user-agent') ?? null,
    isWarp: headers.get('cf-warp-tag-id') !== null || (headers.get('cf-ray') ?? '').length > 0 && !!cf.clientTcpRtt,

    // access (if enforced on this route)
    accessEmail: headers.get('cf-access-authenticated-user-email') ?? null,

    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
};
