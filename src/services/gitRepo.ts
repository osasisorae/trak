import { execSync } from 'child_process';

export interface GitRepoInfo {
  provider: 'github';
  owner: string;
  repo: string;
  fullName: string; // owner/repo
}

export function detectGitHubRepo(cwd: string): GitRepoInfo | null {
  const remoteUrl = getGitRemoteUrl(cwd);
  if (!remoteUrl) return null;

  // Supported formats:
  // - https://github.com/owner/repo.git
  // - https://github.com/owner/repo
  // - git@github.com:owner/repo.git
  // - ssh://git@github.com/owner/repo.git
  const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (!match) return null;

  const owner = match[1];
  const repo = match[2];
  return { provider: 'github', owner, repo, fullName: `${owner}/${repo}` };
}

export function detectGitBranch(cwd: string): string | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      cwd,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return branch || null;
  } catch {
    return null;
  }
}

function getGitRemoteUrl(cwd: string): string | null {
  // Prefer origin; fall back to first remote if needed.
  const tryCommands = [
    'git remote get-url origin',
    "git remote -v | head -n 1 | awk '{print $2}'",
  ];

  for (const command of tryCommands) {
    try {
      const result = execSync(command, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (result) return result;
    } catch {
      // try next
    }
  }

  return null;
}
