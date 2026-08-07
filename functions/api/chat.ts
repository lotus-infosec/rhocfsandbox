// POST /api/chat { prompt, turnstile_token }
// Runs the prompt through llama-3.3-70b-instruct-fp8-fast via AI Gateway.
// AI Gateway enforces rate limiting (3 requests/hour per IP, configured on the gateway).
// Turnstile is required to prove humanity. Input truncated to 500 chars, output capped at 200 tokens.
// A short system prompt keeps responses focused on Cloudflare / networking / web technology.

interface Env {
  AI: Ai;
  TURNSTILE_SECRET_KEY: string;
  AI_GATEWAY_ID: string;
}

const SYSTEM = `you are a technical assistant embedded on rhocfsandbox.com,
a cloudflare product demo site. answer questions about web technology, networking,
cloudflare products, cdns, tls, http, dns, load balancing, and adjacent topics.
if the user asks about anything outside of tech (weather, personal advice, current events,
politics, adult content), politely decline in one sentence and suggest a tech question instead.
you have no internet access. do not claim to know current weather, stock prices, or news.
keep answers under 200 tokens, be direct, no filler.`;

const MAX_PROMPT = 500;
const MAX_TOKENS = 200;
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const prompt = String(body?.prompt || '').trim().slice(0, MAX_PROMPT);
  const tsToken = body?.turnstile_token;
  if (!prompt) return json({ error: 'missing_prompt' }, 400);
  if (!tsToken) return json({ error: 'missing_turnstile_token' }, 400);

  // Turnstile check
  const form = new URLSearchParams();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', tsToken);
  const ip = request.headers.get('cf-connecting-ip') || '';
  if (ip) form.set('remoteip', ip);
  const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: form,
  });
  const verify = await vr.json() as any;
  if (!verify.success) return json({ error: 'turnstile_failed', codes: verify['error-codes'] }, 403);

  // Call Workers AI through AI Gateway.
  // Using the AI binding's `gateway` option routes the call through our gateway,
  // which applies its configured rate-limit (3/hour/IP), logs, and analytics.
  try {
    const t0 = Date.now();
    const resp = await env.AI.run(
      MODEL as any,
      {
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        max_tokens: MAX_TOKENS,
      } as any,
      { gateway: { id: env.AI_GATEWAY_ID } as any } as any,
    );
    const ms = Date.now() - t0;
    const text = (resp as any)?.response ?? String(resp);
    return json({
      ok: true,
      model: MODEL,
      gateway: env.AI_GATEWAY_ID,
      elapsed_ms: ms,
      response: text,
    });
  } catch (e: any) {
    // AI Gateway returns 429 when the rate limit is hit; propagate that up.
    const msg = String(e?.message || e);
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
      return json({
        error: 'rate_limited',
        message: 'ai gateway rate limit: 3 requests per hour per ip. try again later.',
      }, 429);
    }
    return json({ error: 'ai_call_failed', message: msg }, 500);
  }
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
