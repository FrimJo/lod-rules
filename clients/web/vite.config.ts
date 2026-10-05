import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import { bundleData } from './build/bundle-data.ts';
import { DATA_DIR } from './src/server/data-root.ts';

export default defineConfig({
  server: { port: 1234 },
  resolve: {
    alias: [
      {
        // scripts/ask/models.ts imports the Laya runtime lazily; keep onnxruntime out of the server.
        find: /^\.\.\/decisions\/laya\.ts$/,
        replacement: fileURLToPath(new URL('./src/server/laya-shelved.ts', import.meta.url)),
      },
    ],
  },
  ssr: {
    // The ask pipeline loads these from the corpus repo's node_modules.
    external: ['@typesafe-ai/sdk', 'yaml', 'ajv', 'ajv-formats'],
  },
  plugins: [
    tanstackStart(),
    nitro({
      // The preset is detected from the environment: `vercel` on Vercel, `node-server` locally.
      // A module adds a hook; `hooks.compiled` here would replace the preset's own.
      modules: [
        {
          name: 'lod-data',
          setup(nitro) {
            nitro.hooks.hook('compiled', () => {
              bundleData(join(nitro.options.output.serverDir, DATA_DIR));
            });
          },
        },
      ],
    }),
    viteReact(),
  ],
});
