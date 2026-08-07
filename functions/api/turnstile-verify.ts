// POST /api/turnstile-verify
// Verifies a cloudflare turnstile token against the siteverify api using the
// secret key from pages env vars. Never expose the secret in client code.

interface Env {
  TURNSTILE_SECRET_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'invalid_json' }, 400);
  }

  const token = body?.token;
  if (!token) {
    return json({ success: false, error: 'missing_token' }, 400);
  }
  if (!env.TURNSTILE_SECRET_KEY) {
    return json({ success: false, error: 'server_misconfigured_no_secret' }, 500);
  }

  const ip = request.headers.get('cf-connecting-ip') || '';
  const form = new URLSearchParams();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const verify = await verifyRes.json() as any;

  if (verify.success) {
    return json({
      success: true,
      message: 'form accepted. in a real app this is where you would persist the submission.',
      verify: {
        challenge_ts: verify.challenge_ts,
        hostname: verify.hostname,
        action: verify.action,
      },
    }, 200);
  }
  return json({
    success: false,
    error: 'turnstile_failed',
    verify: { 'error-codes': verify['error-codes'] || [] },
  }, 403);
};

function json(obj: any, status: number): Response {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
