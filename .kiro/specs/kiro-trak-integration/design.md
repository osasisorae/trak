# Kiro ↔ Trak integration: design

## Hook configuration
`kiro-integration/kiro-agent-config.json` defines 3 hook commands:
- Session manager: `kiro-integration/kiro-trak-session.sh` (`agentSpawn`, `stop`)
- Code monitor: `kiro-integration/kiro-trak-monitor.sh` (`preToolUse`, `postToolUse`)
- Quality gate: `kiro-integration/kiro-trak-quality-gate.sh` (`preToolUse` for `execute_bash`)

## Data flow
1. Kiro emits a JSON payload to STDIN for each hook execution.
2. Hook scripts parse fields using `jq`:
   - `hook_event_name`, `cwd`, `tool_name`, `tool_input.command`
3. Scripts `cd` into `cwd` and then invoke `trak`:
   - `trak start`, `trak status`, `trak stop`
4. Trak persists session artifacts under `.trak/sessions/*.json`.
5. The quality gate reads the latest session JSON and blocks commits if thresholds fail.

## Failure modes and behavior
- If `trak` is not installed, hooks should print a single helpful message and exit 0.
- If no session is active, monitor hooks should suggest `trak start` (no error).
- If `.trak/sessions/` is empty, the quality gate should not block commits.

## Extensibility
- Future: emit links to `trak dev` dashboard, or attach summarized findings back into agent context.
- Future: make quality gate thresholds configurable via env or `~/.trak/config.json`.

