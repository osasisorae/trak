# Dashboard

## Local developer dashboard

Run:

```bash
trak dev
```

This serves the UI from `public/` and exposes JSON APIs:

- `GET /api/sessions` (all archived sessions in `.trak/sessions`)
- `GET /api/sessions/:id` (single session by ID)
- `GET /api/current` (current session)

## GitHub issue creation

If `GITHUB_TOKEN` is set, the dashboard can create GitHub issues from detected findings.

