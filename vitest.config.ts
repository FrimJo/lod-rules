import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Full-corpus validation and CLI checks now load hundreds of canonical files.
    testTimeout: 15_000,
    maxWorkers: 2,
  },
});
