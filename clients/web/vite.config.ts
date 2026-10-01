import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  ssr: {
    // The ask pipeline loads native and model packages from the corpus repo's node_modules.
    external: ['@receptron/laya', '@typesafe-ai/sdk', 'onnxruntime-node', 'yaml', 'ajv', 'ajv-formats'],
  },
  plugins: [tanstackStart(), viteReact()],
});
