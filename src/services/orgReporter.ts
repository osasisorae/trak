interface SessionReport {
  developerId: string;
  developerName: string;
  sessionId: string;
  timestamp: string;
  duration: string;
  files: number;
  summary: string;
  qualityScore: number;
  issues: number;
}

interface TrakConfig {
  orgToken: string;
  orgEndpoint: string;
  developerId: string;
  developerName: string;
  lastLogin: string;
}

export async function sendSessionReport(sessionData: any, config: TrakConfig): Promise<boolean> {
  const report: SessionReport = {
    developerId: config.developerId,
    developerName: config.developerName,
    sessionId: sessionData.id,
    timestamp: sessionData.endTime?.toISOString() || new Date().toISOString(),
    duration: calculateDuration(sessionData.startTime, sessionData.endTime || new Date()),
    files: sessionData.changes?.length || 0,
    summary: sessionData.summary || 'No summary available',
    qualityScore: sessionData.analysis?.metrics?.qualityScore || 0,
    issues: sessionData.analysis?.issues?.length || 0
  };

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${config.orgEndpoint}/api/sessions`, {
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

function calculateDuration(start: Date, end: Date): string {
  const duration = end.getTime() - start.getTime();
  const minutes = Math.floor(duration / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
