import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { ACCESS_COOKIE, accessGate, accessToken, safeNext } from '../src/server/access.ts';

const ORIGIN = 'https://lod.example';
const page = (path: string, cookie?: string) =>
  new Request(`${ORIGIN}${path}`, {
    headers: { accept: 'text/html', ...(cookie ? { cookie } : {}) },
  });
const signIn = (password: string, next = '/', address = '203.0.113.1') =>
  new Request(`${ORIGIN}/login`, {
    method: 'POST',
    headers: { 'x-forwarded-for': address },
    body: new URLSearchParams({ password, next }),
  });

afterEach(() => {
  delete process.env.ACCESS_PASSWORD;
});

test('without ACCESS_PASSWORD the gate lets everything through', async () => {
  assert.equal(await accessGate(page('/')), null);
  assert.equal(await accessGate(new Request(`${ORIGIN}/api/rulebook`)), null);
});

test('pages redirect to sign-in and other requests get 401 until the cookie is set', async () => {
  process.env.ACCESS_PASSWORD = 'secret';
  const redirect = await accessGate(page('/review?case=x'));
  assert.equal(redirect?.status, 303);
  assert.equal(redirect?.headers.get('location'), '/login?next=%2Freview%3Fcase%3Dx');
  assert.equal((await accessGate(new Request(`${ORIGIN}/api/rulebook-page/3`)))?.status, 401);
  assert.equal((await accessGate(page('/login')))?.status, 200);

  const cookie = `${ACCESS_COOKIE}=${accessToken('secret')}`;
  assert.equal(await accessGate(page('/', cookie)), null);
  assert.equal((await accessGate(page('/', `${ACCESS_COOKIE}=forged`)))?.status, 303);
});

test('signing in checks the password, sets a secure cookie and only redirects on-site', async () => {
  process.env.ACCESS_PASSWORD = 'secret';
  assert.equal((await accessGate(signIn('wrong', '/', '203.0.113.2')))?.status, 401);

  const ok = await accessGate(signIn('secret', '//evil.example/', '203.0.113.2'));
  assert.equal(ok?.status, 303);
  assert.equal(ok?.headers.get('location'), '/');
  const setCookie = ok?.headers.get('set-cookie') ?? '';
  assert.ok(setCookie.startsWith(`${ACCESS_COOKIE}=${accessToken('secret')};`));
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);

  assert.equal(safeNext('/rulebook'), '/rulebook');
  assert.equal(safeNext('https://evil.example'), '/');
  assert.equal(safeNext(null), '/');
});

test('a changed password signs everyone out', async () => {
  process.env.ACCESS_PASSWORD = 'secret';
  const cookie = `${ACCESS_COOKIE}=${accessToken('secret')}`;
  process.env.ACCESS_PASSWORD = 'rotated';
  assert.equal((await accessGate(page('/', cookie)))?.status, 303);
});

test('repeated wrong passwords from one address are throttled', async () => {
  process.env.ACCESS_PASSWORD = 'secret';
  for (let i = 0; i < 10; i++) await accessGate(signIn('wrong', '/', '203.0.113.9'));
  assert.equal((await accessGate(signIn('secret', '/', '203.0.113.9')))?.status, 429);
  assert.equal((await accessGate(signIn('secret', '/', '203.0.113.10')))?.status, 303);
});
