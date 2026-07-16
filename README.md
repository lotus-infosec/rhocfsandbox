# cloudflare-pages-sandbox

A minimal, opinionated template for a personal Cloudflare sandbox site: static
frontend + edge Functions, deployed to Cloudflare Pages. Designed as a live
demo surface for real Cloudflare product behavior (Access, Gateway, DLP,
edge metadata) against real DNS traffic.

Built with **Astro** (static output) and **Cloudflare Pages Functions**.

---

## What this template gives you

A working Pages site with:

- A terminal-style dark theme (single CSS file, no framework)
- Five example Pages Functions that demonstrate common edge patterns
- Security headers via `public/_headers`
- An Access-protected route (`/admin`) that also self-verifies the Access JWT
  against Cloudflare's JWKS as a defense-in-depth pattern
- Local dev + preview scripts wired up

Everything is intentionally small so it's easy to read end-to-end.

---

## Layout

```
.
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── wrangler.toml
├── public/
│   ├── _headers            # security headers + cache rules for /api/*
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── layouts/Layout.astro
│   ├── pages/              # index / about / demos / whoami / admin
│   └── styles/global.css
└── functions/api/
    ├── whoami.ts           # GET /api/whoami        edge metadata JSON
    ├── headers.ts          # GET /api/headers       header echo
    ├── access.ts           # GET /api/access        Access JWT + JWKS verify
    ├── gateway-test.ts     # GET /api/gateway-test  labeled safe payloads
    └── dlp-test.ts         # GET /api/dlp-test      synthetic PII strings
```

The site copy in `src/pages/` is intentionally personal to the original author;
fork it and rewrite as your own.

---

## Prerequisites

- Node.js 20+
- A Cloudflare account
- `wrangler` v4+ (installed via devDependencies)

---

## Local development

```bash
npm install
npm run dev
```

Astro's dev server runs on `http://localhost:4321`. **Pages Functions do not
run under `astro dev`.** To exercise the Functions locally, build then run
Wrangler's Pages dev server:

```bash
npm run build
npm run preview      # wrangler pages dev ./dist
```

`wrangler pages dev` runs the built site plus Functions on the same Workers
runtime that Pages uses in production.

---

## Deployment

Two options.

### Option A: Git integration (recommended)

Connect the repo to a Cloudflare Pages project via the Cloudflare dashboard.
Every push to `main` produces a production deploy; every push to any other
branch or PR produces a preview deploy at a unique `*.pages.dev` URL.

Build settings:

- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** *(leave blank if the repo root is the project root)*
- **Environment variables:** none required by this template

### Option B: Direct upload via Wrangler

```bash
npm run deploy
# expands to: npm run build && wrangler pages deploy ./dist --project-name=<your-project>
```

Update the `deploy` script in `package.json` to match your Pages project name.

For scripted deploys, mint a scoped API token with:

- `Account → Cloudflare Pages → Edit`
- `User → User Details → Read`

Then:

```bash
export CLOUDFLARE_API_TOKEN=<the token>
export CLOUDFLARE_ACCOUNT_ID=<your account id>
npm run deploy
```

Never commit tokens. Use `.env` locally (gitignored) or your CI's secret store.

---

## Custom domain

In the Pages dashboard for the project → **Custom domains** → **Set up a
custom domain**. If the DNS zone is on the same Cloudflare account, Pages
will provision the correct proxied CNAMEs (CNAME flattening handles the
apex).

If wiring DNS manually:

| Type  | Name           | Target                       | Proxy   |
|-------|----------------|------------------------------|---------|
| CNAME | `example.com`  | `<project>.pages.dev`        | Proxied |
| CNAME | `www`          | `<project>.pages.dev`        | Proxied |

Pick one canonical hostname and redirect the other via a Cloudflare Single
Redirect rule.

---

## Access-gating a route

The `/admin` route is designed to sit behind **Cloudflare Access**. The Pages
site itself does not enforce auth. Access enforces at the edge and sets the
`CF_Authorization` cookie with a signed JWT. The `/api/access` Function then
decodes that cookie and verifies the signature against Cloudflare's JWKS as a
defense-in-depth demo.

### Setup

1. Zero Trust dashboard → **Access → Applications → Add an application → Self-hosted**.
2. Application domain: your hostname, path `/admin` (add `/admin/*` for nested paths).
3. **Do not** include `/api/access` in the Access application. That Function
   intentionally lives outside Access so it can read the cookie the browser
   already has and self-verify. Gating it would just re-run Access's own check.
4. Add identity providers and at least one Allow policy.

### How the JWT verification works

`functions/api/access.ts`:

1. Reads `CF_Authorization` from the request cookies.
2. Splits the JWT into `header.payload.signature` and base64url-decodes them.
3. Fetches JWKS from `<iss>/cdn-cgi/access/certs` (cached ~10 min per isolate).
4. Finds the JWK matching the token's `kid`.
5. Verifies the RS256 signature via WebCrypto (`crypto.subtle.verify`).
6. Checks `nbf` and `exp`.
7. Returns `authenticated`, `signatureValid`, `timeValid`, and decoded claims.

The `/admin` page renders all of this in an identity table.

---

## Gateway demo endpoint

`/api/gateway-test` returns a labeled, **safe** JSON payload. It does not host
malicious content. Pair it with a Gateway HTTP policy scoped to your hostname
(or specifically the `/api/gateway-test*` path) to demonstrate block, isolate,
or category-scoped rules.

```bash
curl "https://<your-host>/api/gateway-test?category=malware"
curl "https://<your-host>/api/gateway-test?category=ai"
```

From a WARP-enrolled device with a matching Gateway HTTP policy enabled, the
request should be blocked or isolated at the edge.

---

## DLP demo endpoint

`/api/dlp-test` returns **synthetic** PII-shaped strings so DLP detectors have
something to catch. Every value is either from a reserved-invalid range
(SSN `000-XX`, `555-01XX` phone numbers) or a well-known industry test value
(Visa `4111 1111 1111 1111`). Read the file before using it.

From a WARP-enrolled device with DLP + TLS decryption enabled:

```bash
curl "https://<your-host>/api/dlp-test?type=ssn"
curl "https://<your-host>/api/dlp-test?type=cc"
curl "https://<your-host>/api/dlp-test?type=apikey"
```

Expected: DLP inspects the response body on egress, matches the corresponding
detector, and blocks or logs per policy.

---

## References

- [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [`_headers` file syntax](https://developers.cloudflare.com/pages/configuration/headers/)
- [Cloudflare Access self-hosted apps](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/)
- [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)
- [`request.cf` object properties](https://developers.cloudflare.com/workers/runtime-apis/request/#the-cf-property-requestinitcfproperties)
- [CNAME flattening at the zone apex](https://developers.cloudflare.com/dns/cname-flattening/)

---

## License

MIT. See [`LICENSE`](./LICENSE).
