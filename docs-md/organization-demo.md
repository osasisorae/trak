# Organization Demo (Mock Server)

The `demo/` folder includes a simple mock org server that accepts session reports and displays them in a small dashboard.

## 1) Start the server

```bash
cd demo
node mock-org-server.js
```

Open:

- `http://localhost:3001`

## 2) Configure Trak

In the shell where you run `trak`:

```bash
export TRAK_ORG_ENDPOINT=http://localhost:3001
```

Then:

```bash
trak logout
trak login demo-token-123
```

## 3) Run a session and send a report

```bash
trak start
# edit some files...
trak stop
```

The org server receives a report at `POST /api/sessions`.

