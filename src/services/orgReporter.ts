import { detectGitBranch, detectGitHubRepo } from './gitRepo.js';

interface SessionReport {
  developerId: string;
  developerName: string;
  repo?: string;
  branch?: string;
  sessionId: string;
  timestamp: string;
  duration: string;
  files: number;
  summary: string;
  qualityScore: number;
  issues: number;
  changes?: Array<{
    path: string;
    type: 'added' | 'modified' | 'deleted';
    changeCount: number;
  }>;
  issueDetails?: Array<{
    id: string;
    type: string;
    severity: string;
    filePath: string;
    lineNumber: number;
    description: string;
    suggestion: string;
  }>;
}

interface TrakConfig {
  orgToken: string;
  orgEndpoint: string;
  developerId: string;
  developerName: string;
  lastLogin: string;
}

export async function sendSessionReport(sessionData: any, config: TrakConfig): Promise<boolean> {
  const repoInfo = typeof sessionData?.cwd === 'string' ? detectGitHubRepo(sessionData.cwd) : null;
  const branch = typeof sessionData?.cwd === 'string' ? detectGitBranch(sessionData.cwd) : null;

  const issueDetails = Array.isArray(sessionData?.analysis?.issues) ? sessionData.analysis.issues : [];
  const changes = Array.isArray(sessionData?.changes)
    ? sessionData.changes.map((c: any) => ({
        path: String(c.path),
        type: c.type as 'added' | 'modified' | 'deleted',
        changeCount: Number(c.changeCount || 1),
      }))
    : [];

  const report: SessionReport = {
    developerId: config.developerId,
    developerName: config.developerName,
    repo: repoInfo?.fullName,
    branch: branch || undefined,
    sessionId: sessionData.id,
    timestamp: sessionData.endTime?.toISOString() || new Date().toISOString(),
    duration: calculateDuration(sessionData.startTime, sessionData.endTime || new Date()),
    files: changes.length,
    summary: sessionData.summary || 'No summary available',
    qualityScore: sessionData.analysis?.metrics?.qualityScore || 0,
    issues: issueDetails.length || 0,
    changes,
    issueDetails: issueDetails.slice(0, 25)
  };

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  const url = `${config.orgEndpoint}/api/sessions`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.orgToken}`,
          'User-Agent': 'trak-cli/0.1.0'
        },
        body: JSON.stringify(report),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        return true;
      }

      if (attempt === maxRetries) {
        console.warn(`⚠️  Failed to send session report: HTTP ${response.status}`);
        return false;
      }

    } catch (error) {
      if (attempt === maxRetries) {
        console.warn(`⚠️  Failed to send session report: ${error instanceof Error ? error.message : 'Network error'}`);
        return false;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}

function calculateDuration(start: Date | string, end: Date | string): string {
  const startTime = start instanceof Date ? start : new Date(start);
  const endTime = end instanceof Date ? end : new Date(end);
  
  const duration = endTime.getTime() - startTime.getTime();
  const minutes = Math.floor(duration / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
