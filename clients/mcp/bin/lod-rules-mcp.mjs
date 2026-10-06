#!/usr/bin/env node
// Runs the TypeScript server through tsx, resolved from this package, so the server starts
// from any working directory (another repo's .mcp.json, `claude mcp add`, the Agent SDK).
import { register } from 'tsx/esm/api';

register();
await import('../src/main.ts');
