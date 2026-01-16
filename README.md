# trak

Track and summarize coding sessions with AI.

## Installation

```bash
npm install
npm run build
npm link
```

## Usage

### Start tracking a session
```bash
trak start
```

Begins watching file changes in your current directory.

### Stop and generate summary
```bash
trak stop
```

Stops tracking and generates an AI-powered summary of your coding session.

### Show current session
```bash
trak status
```

Displays information about the current tracking session.

## Configuration

Create a `.env` file with your OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
```

## How it works

`trak` watches file changes during your coding session and uses AI to generate a summary of what you worked on when you stop tracking.
