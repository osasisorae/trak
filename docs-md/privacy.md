# Privacy & Data Handling

## Local data

Sessions are written to the tracked project under `.trak/`:

- `.trak/current-session.json`
- `.trak/sessions/<timestamp>-session.json`
- `.trak/daemon.log` (daemon debug log)

`.trak/` is gitignored by default in this repo.

## OpenAI usage

If `OPENAI_API_KEY` is set, `trak stop` may send code snippets to OpenAI to generate:

- A short session summary
- A structured analysis (issues + metrics)

Today, Trak reads the contents of files that changed in the session (excluding deleted files). The analyzer currently limits what it sends to at most 5 files and truncates each file to ~2000 characters.

If `OPENAI_API_KEY` is not set, Trak uses a local fallback summary and returns an “analysis unavailable” result.

## Organization reporting

If you ran `trak login`, `trak stop` sends a report to `${TRAK_ORG_ENDPOINT}/api/sessions` containing metadata (developer identity, sessionId, timestamps, counts, summary, and aggregate metrics). It does not send source code.

