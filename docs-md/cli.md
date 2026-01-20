# CLI Reference

## `trak start`

Starts a session in the current directory and runs a background daemon to watch file changes.

```bash
trak start
```

## `trak status`

Shows current authentication status and active session details (if any).

```bash
trak status
```

## `trak stop`

Stops the session, generates a summary (and AI analysis if configured), then archives the session under `.trak/sessions/`.

```bash
trak stop
```

## `trak dev`

Runs the local dashboard server and opens a browser.

```bash
trak dev
```

## `trak login <org-token>`

Stores org reporting configuration in `~/.trak/config.json`.

```bash
trak login demo-token-123
```

## `trak logout`

Removes `~/.trak/config.json`.

```bash
trak logout
```

