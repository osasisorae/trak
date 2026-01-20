---
inclusion: always
---

# Trak: structure steering

## Source layout
- `src/cli.ts`: CLI entrypoint and command wiring.
- `src/commands/*`: user-facing commands (`start/stop/status/dev/login/logout`).
- `src/services/*`: implementation modules (session manager, daemon, watcher, dashboard, analysis, reporting).
- `src/mcp-server.ts`: MCP server entrypoint.

## Data and artifacts
- `.trak/`: local runtime state and session archives (gitignored).
- `dist/`: build output (gitignored).

## Docs and demos
- `README.md`: top-level overview and quick start.
- `docs-md/`: long-form docs intended for GitHub browsing.
- `demo/` + `DEMO.md`: dashboard/demo assets and walkthrough.
- `kiro-integration/`: Kiro hook scripts + example agent config.

## Conventions
- Prefer small, composable services in `src/services/` with clear inputs/outputs.
- Keep CLI commands thin; put logic in services and keep side effects centralized.
- Avoid writing session state outside `.trak/` and `~/.trak/`.

