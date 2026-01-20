# MCP (AI Assistant Integration)

Trak ships an MCP server (`dist/mcp-server.js`) for AI assistants to control sessions and query history.

## Run the MCP server

```bash
npm run build
npm run mcp-server
```

Tip: the MCP server reads/writes `.trak/` in its working directory. For “fresh repo” demos, `cd` into the repo you want to track before launching the MCP server (or pass `cwd` to the MCP tools).

## Configure (example)

See `mcp-config-example.json`.

## Quick local test (MCP Inspector)

From the repo you want to track:

```bash
cd /path/to/your/fresh-repo
```

Create a local MCP Inspector config:

```bash
cat > /tmp/trak-mcp.json <<'JSON'
{
  "mcpServers": {
    "trak": {
      "command": "node",
      "args": ["/Users/Macintosh/trak/dist/mcp-server.js"],
      "env": {}
    }
  }
}
JSON
```

Run Inspector:

```bash
npx -y @modelcontextprotocol/inspector --config /tmp/trak-mcp.json --server trak
```

## Tools

- `trak_start_session`
- `trak_stop_session`
- `trak_get_status`
- `trak_get_session_history`
- `trak_analyze_session`
- `trak_create_github_issue`
- `trak_login`
- `trak_logout`
