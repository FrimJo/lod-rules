import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A shared-password gate for test deployments. With `ACCESS_PASSWORD` set, every server
 * request (pages, server functions, the chat route, rulebook pages) needs a cookie that
 * `/login` issues for the right password. Unset, the gate is off, as in dev.
 */
export const ACCESS_COOKIE = 'lod_access';
const MAX_AGE = 60 * 60 * 24 * 30;
const FAILURE_LIMIT = 10;
const FAILURE_WINDOW_MS = 10 * 60 * 1000;

export function accessPassword(): string | null {
  return process.env.ACCESS_PASSWORD?.trim() || null;
}

/** The cookie value for a password. Changing the password signs everyone out. */
export function accessToken(password: string): string {
  return createHmac('sha256', password).update('lod-rules access v1').digest('base64url');
}

function sameSecret(a: string, b: string): boolean {
  const left = createHmac('sha256', 'compare').update(a).digest();
  const right = createHmac('sha256', 'compare').update(b).digest();
  return timingSafeEqual(left, right);
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq !== -1 && part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return null;
}

export function hasAccess(request: Request, password: string): boolean {
  const cookie = readCookie(request, ACCESS_COOKIE);
  return cookie !== null && sameSecret(cookie, accessToken(password));
}

/** Only same-site paths, so `/login?next=` cannot redirect elsewhere. */
export function safeNext(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/';
}

function cookieHeader(request: Request, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ACCESS_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function loginPage(next: string, message: string | null, status: number): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sign in · League of Dungeoneers rules</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f6f4ef; color: #222; }
  form { display: grid; gap: 0.75rem; width: min(22rem, 90vw); padding: 2rem; background: #fff; border-radius: 0.5rem; box-shadow: 0 1px 4px rgb(0 0 0 / 0.12); }
  h1 { font-size: 1.15rem; margin: 0; }
  input, button { font: inherit; padding: 0.5rem 0.75rem; border-radius: 0.375rem; border: 1px solid #bbb; }
  button { background: #222; color: #fff; border-color: #222; cursor: pointer; }
  .error { color: #a40000; margin: 0; }
</style>
</head>
<body>
<form method="post" action="/login">
  <h1>League of Dungeoneers rules</h1>
  <label for="password">This test site needs a password.</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  ${message ? `<p class="error" role="alert">${escapeHtml(message)}</p>` : ''}
  <button type="submit">Sign in</button>
</form>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Per-instance count of failed sign-ins by client address. */
const failures = new Map<string, { count: number; since: number }>();

function clientAddress(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function tooManyFailures(address: string, now: number): boolean {
  const entry = failures.get(address);
  if (entry && now - entry.since > FAILURE_WINDOW_MS) failures.delete(address);
  return (failures.get(address)?.count ?? 0) >= FAILURE_LIMIT;
}

function recordFailure(address: string, now: number): void {
  const entry = failures.get(address) ?? { count: 0, since: now };
  entry.count += 1;
  failures.set(address, entry);
}

async function signIn(request: Request, password: string): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const next = safeNext(form?.get('next'));
  const address = clientAddress(request);
  const now = Date.now();
  if (tooManyFailures(address, now))
    return loginPage(next, 'Too many attempts. Try again in a few minutes.', 429);
  const given = form?.get('password');
  if (typeof given !== 'string' || !sameSecret(given, password)) {
    recordFailure(address, now);
    return loginPage(next, 'That password is not right.', 401);
  }
  failures.delete(address);
  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      'Set-Cookie': cookieHeader(request, accessToken(password), MAX_AGE),
    },
  });
}

/**
 * The gate's answer to a request: a response to send instead (sign-in page, redirect, 401),
 * or null to let the request through.
 */
export async function accessGate(request: Request): Promise<Response | null> {
  const password = accessPassword();
  if (!password) return null;
  const url = new URL(request.url);

  if (url.pathname === '/login') {
    if (request.method === 'POST') return signIn(request, password);
    return loginPage(safeNext(url.searchParams.get('next')), null, 200);
  }
  if (url.pathname === '/logout') {
    return new Response(null, {
      status: 303,
      headers: { Location: '/login', 'Set-Cookie': cookieHeader(request, '', 0) },
    });
  }
  if (hasAccess(request, password)) return null;

  const wantsPage =
    request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html');
  if (wantsPage) {
    const next = encodeURIComponent(`${url.pathname}${url.search}`);
    return new Response(null, { status: 303, headers: { Location: `/login?next=${next}` } });
  }
  return new Response('Sign in required', {
    status: 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}
