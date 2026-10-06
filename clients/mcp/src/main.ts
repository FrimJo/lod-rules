import { readFileSync } from 'node:fs';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { LiveRetrieval } from './corpus.ts';
import { createLodServer } from './server.ts';

// stdout carries the protocol; anything human-readable goes to stderr.
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

const live = new LiveRetrieval();
console.error(
  `lod-rules MCP: ${live.source === 'built' ? 'built index' : 'indexed YAML in memory'}`,
);

const server = createLodServer(live, version);
const transport = new StdioServerTransport();
transport.onclose = () => live.close();
await server.connect(transport);
