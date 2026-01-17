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

### GitHub Integration (Optional)

To enable GitHub issue creation from the dashboard, add your GitHub personal access token:

```
GITHUB_TOKEN=your_github_token_here
```

**To get a GitHub token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Click "Generate new token (classic)" (**Important: Use classic tokens, not fine-grained**)
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos only)
4. Copy the token and add it to your `.env` file

Without this token, you can still view code analysis but won't be able to create GitHub issues directly from the dashboard.

### Troubleshooting GitHub Integration

**Error: "Resource not accessible by personal access token"**

This error occurs when the GitHub token doesn't have sufficient permissions or when using fine-grained tokens instead of classic tokens. To fix:

1. **Use classic tokens**: Make sure you created a "Token (classic)" not a "Fine-grained personal access token"
2. **Check token scopes**: Your token needs `repo` scope (full repository access) or `public_repo` scope (for public repositories only)
2. **Regenerate token**: Go to GitHub Settings → Developer settings → Personal access tokens
3. **Select correct scopes**: 
   - For private repos: Check `repo` (this includes issues, pull requests, etc.)
   - For public repos: Check `public_repo` 
4. **Update .env file**: Replace the old token with the new one
5. **Restart trak dev**: The server needs to restart to pick up the new token

**Note**: Fine-grained personal access tokens may have different permission requirements. Classic tokens are recommended for simplicity.

## How it works

`trak` watches file changes during your coding session and uses AI to generate a summary of what you worked on when you stop tracking.
