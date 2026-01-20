---
inclusion: always
---

# Trak: product steering

## What this is
Trak is a local-first developer tool that tracks coding sessions (time + file change events) and produces:
- session summaries
- code-quality signals/findings
- optional AI-generated analysis

It ships:
- a CLI (`trak`) to start/stop/status sessions
- a local dashboard (`trak dev`) to review sessions and findings
- an MCP server (`npm run mcp-server`) for AI-assistant automation
- optional org reporting (`TRAK_ORG_ENDPOINT`) to POST session metadata
- optional GitHub issue creation (`GITHUB_TOKEN`) from findings

## Target users
- Individual developers who want an audit trail of work and quality signals.
- Teams that want lightweight reporting across dev sessions (opt-in org endpoint).
- AI-assisted workflows that benefit from session context via MCP.

## Key workflows
- Start a session → edit files → stop session → review summary/findings.
- Run the dashboard to browse sessions and drill into changes.
- Use Kiro hooks (see `kiro-integration/`) to automatically manage sessions during agent lifecycle.

## Principles
- Local-first and privacy-aware: session data is stored under `.trak/` by default.
- Explicit opt-ins: AI analysis and org reporting are disabled unless configured.
- Keep the CLI predictable and scriptable for automation/hooks.

