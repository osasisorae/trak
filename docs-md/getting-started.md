# Getting Started

## Prerequisites

- Node.js 18+

## Install (from source)

```bash
git clone https://github.com/osasisorae/trak.git
cd trak
npm install
npm run build
npm link
```

Verify:

```bash
trak --help
```

## Run in a project

In the repo you want to track:

```bash
trak start
# edit files...
trak status
trak stop
```

Sessions are stored in `.trak/` inside the tracked project:

- `.trak/current-session.json`
- `.trak/sessions/<timestamp>-session.json`

If you want to view sessions in a UI:

```bash
trak dev
```

