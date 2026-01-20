# Configuration

Trak uses environment variables plus an optional `~/.trak/config.json` (created by `trak login`).

## Environment variables

### `OPENAI_API_KEY`

Enables AI summary + code analysis during `trak stop`.

### `GITHUB_TOKEN`

Enables “Create GitHub issue” actions from the dashboard and MCP tool.

### `TRAK_ORG_ENDPOINT`

Base URL for your org server (Trak POSTs to `${TRAK_ORG_ENDPOINT}/api/sessions`).

Example:

```env
OPENAI_API_KEY=...
GITHUB_TOKEN=...
TRAK_ORG_ENDPOINT=http://localhost:3001
```

## `~/.trak/config.json`

Created by `trak login <org-token>`. Contains:

- `orgToken`
- `orgEndpoint`
- `developerId`
- `developerName`
- `lastLogin`

