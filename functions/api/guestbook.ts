// GET  /api/guestbook          → list 20 most recent entries
// POST /api/guestbook          → { name, message, turnstile_token } — server verifies turnstile,
//                                strips ip/ua, truncates fields, inserts into D1.
// Data is purged twice daily (14:00 and 22:00 UTC) by the SITE_guestbook_cron
// worker running on a cron trigger. Visitor content is never intended to persist.

interface Env {
  DB_GUESTBOOK: D1Database;
  TURNSTILE_SECRET_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const res = await env.DB_GUESTBOOK
    .prepare('SELECT id, name, message, created_at FROM guestbook ORDER BY id DESC LIMIT 20')
    .all();
  return json({ entries: res.results || [] });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const name = String(body?.name || '').trim().slice(0, 40);
  const message = String(body?.message || '').trim().slice(0, 280);
  const tsToken = body?.turnstile_token;

  if (!name || !message) return json({ error: 'missing_name_or_message' }, 400);
  if (!tsToken) return json({ error: 'missing_turnstile_token' }, 400);

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

  await env.DB_GUESTBOOK
    .prepare('INSERT INTO guestbook (name, message) VALUES (?, ?)')
    .bind(name, message)
    .run();

  return json({ ok: true, message: 'signed. auto-purge at 14:00 and 22:00 UTC daily.' }, 201);
};

function json(o: unknown, status = 200): Response {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
