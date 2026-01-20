# <img src="public/logo.svg" alt="Trak" width="120" height="40"> Trak

Trak tracks coding sessions (file changes + time) and generates a session summary plus code-quality signals for developers and teams. It ships a local dashboard, optional org reporting, and an MCP server for AI assistant automation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/osasisorae/trak/actions/workflows/ci.yml/badge.svg)](https://github.com/osasisorae/trak/actions/workflows/ci.yml)

## Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Session tracking**: `trak start/stop` runs a background daemon to track file changes.
- **Local dashboard**: `trak dev` to browse sessions and findings.
- **Optional AI analysis**: set `OPENAI_API_KEY` to generate summaries + issues.
- **Optional org reporting**: `trak login` and `TRAK_ORG_ENDPOINT` to POST session metadata to `/api/sessions`.
- **Optional GitHub issues**: set `GITHUB_TOKEN` to create issues from detected findings (dashboard + MCP).

## Quick Start

Install from source:

```bash
git clone https://github.com/osasisorae/trak.git
cd trak
npm install
npm run build
npm link

cp .env.example .env
```

Track a session in any repo:

```bash
trak start
# edit/add/delete files...
trak status
trak stop
```

Open the local dashboard:

```bash
trak dev
```

Prefer not to `npm link`? Run the CLI directly:

```bash
node /absolute/path/to/trak/dist/cli.js start
node /absolute/path/to/trak/dist/cli.js status
node /absolute/path/to/trak/dist/cli.js stop
```

## Configuration

Copy `.env.example` and fill what you need:

```bash
cp .env.example .env
```

```env
OPENAI_API_KEY=your_openai_api_key_here
GITHUB_TOKEN=your_github_token_here
TRAK_ORG_ENDPOINT=https://api.trak.dev
```

## Documentation

- Start here: [docs-md/README.md](docs-md/README.md)
- Getting started: [docs-md/getting-started.md](docs-md/getting-started.md)
- CLI reference: [docs-md/cli.md](docs-md/cli.md)
- Configuration: [docs-md/configuration.md](docs-md/configuration.md)
- Privacy: [docs-md/privacy.md](docs-md/privacy.md)
- Dashboard: [docs-md/dashboard.md](docs-md/dashboard.md)
- Organization demo: [docs-md/organization-demo.md](docs-md/organization-demo.md)
- MCP: [docs-md/mcp.md](docs-md/mcp.md)
- Development: [docs-md/development.md](docs-md/development.md)

## Contributing

See `CONTRIBUTING.md`.

## License

MIT — see `LICENSE`.
