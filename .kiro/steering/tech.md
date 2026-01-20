---
inclusion: always
---

# Trak: tech steering

## Stack
- Node.js 18+ (ESM project: `type: module`)
- TypeScript (compiled with `tsc` into `dist/`)
- Vitest for unit/integration/property tests
- Express for the local dashboard server
- Chokidar for filesystem watching
- Optional integrations:
  - OpenAI (`OPENAI_API_KEY`) for summaries/issues
  - GitHub via Octokit (`GITHUB_TOKEN`)
  - MCP via `@modelcontextprotocol/sdk`

## Runtime data + configuration
- Runtime/session artifacts are stored under `.trak/` (gitignored).
- User config for org reporting lives at `~/.trak/config.json`.
- Environment configuration uses `dotenv` (`.env` is local-only; `.env.example` is tracked).

## Development constraints
- CLI commands should be idempotent and safe to run repeatedly (`start/status/stop`).
- Watcher/daemon code must avoid double-starting and must shut down cleanly.
- Keep dependencies small; prefer Node/TS standard patterns.

