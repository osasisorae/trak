# Kiro ↔ Trak integration: requirements

## Summary
Integrate Trak with Kiro so agent-driven development automatically creates high-quality, reviewable session artifacts (changes, timings, summaries, and quality signals).

## Goals
- Auto-start/stop Trak sessions based on Kiro agent lifecycle.
- Provide lightweight visibility during development (when files are written / builds run).
- Optionally block low-quality commits via a quality gate (configurable).
- Keep all tracking local by default; org reporting stays opt-in.

## Non-goals
- Replace Trak’s standalone CLI workflows.
- Require Kiro for Trak to function.
- Ship proprietary Kiro internals; use documented hook contracts only.

## Functional requirements
1. When a Kiro agent spawns, start a Trak session if none is active.
2. When the agent stops, stop the active Trak session and generate analysis.
3. When file writes occur, emit a small “session update” message (duration + files tracked).
4. When a `git commit` is attempted, optionally enforce a quality gate using the most recent Trak session analysis.

## Operational requirements
- Hooks must be safe to run repeatedly (no duplicate sessions, no noisy failures).
- Hooks must run fast (timeouts under ~15s) and degrade gracefully if `trak` isn’t installed.
- Store tracking artifacts under `.trak/` only; never write secrets to the repo.

## Dependencies
- `trak` CLI available on PATH (e.g., `npm link` during dev).
- `jq` available for parsing JSON hook payloads and session artifacts.

