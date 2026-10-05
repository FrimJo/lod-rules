import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start';
import { accessGate } from './server/access.ts';

/** Sends every server request through the shared-password gate (off without ACCESS_PASSWORD). */
const access = createMiddleware().server(async ({ next, request }) => {
  const blocked = await accessGate(request);
  return blocked ?? next();
});

/**
 * Registering middleware here replaces Start's default CSRF check on server functions, so it
 * is added back, and extended to the POST routes (chat, sign-in).
 */
const csrf = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn' || ctx.request.method === 'POST',
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, access],
}));
