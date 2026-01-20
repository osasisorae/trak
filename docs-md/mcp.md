# MCP (AI Assistant Integration)

Trak ships an MCP server (`dist/mcp-server.js`) for AI assistants to control sessions and query history.

## Run the MCP server

```bash
npm run build
npm run mcp-server
```

## Configure (example)

See `mcp-config-example.json`.

## Tools

- `trak_start_session`
- `trak_stop_session`
- `trak_get_status`
- `trak_get_session_history`
- `trak_analyze_session`
- `trak_create_github_issue`
- `trak_login`
- `trak_logout`

