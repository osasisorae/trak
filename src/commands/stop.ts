import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createSessionManager } from '../services/sessionManager.js';
import { createSummaryGenerator } from '../services/summaryGenerator.js';

export async function stopCommand() {
  const sessionManager = createSessionManager();
  
  if (!sessionManager.isSessionActive()) {
    console.log('❌ No active session. Run "trak start" first.');
    process.exit(1);
  }

  const session = sessionManager.getSession();
  if (!session) {
    console.log('❌ No active session found.');
    process.exit(1);
  }

  console.log('⏳ Analyzing code and generating summary...');

  const fileContents = new Map<string, string>();
  for (const change of session.changes) {
    if (change.type !== 'unlink') {
      const fullPath = join(session.cwd, change.path);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          fileContents.set(change.path, content);
        } catch {}
      }
    }
  }

  const summaryGenerator = createSummaryGenerator();
  const { summary, analysis } = await summaryGenerator.generateSummary(session, fileContents);

  const stoppedSession = sessionManager.stopSession();
  
  if (stoppedSession) {
    const sessionWithAnalysis = { ...stoppedSession, summary, analysis };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const sessionPath = join(session.cwd, '.trak', 'sessions', `${timestamp}-session.json`);
    writeFileSync(sessionPath, JSON.stringify(sessionWithAnalysis, null, 2));

    const start = new Date(session.startTime);
    const end = new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const added = session.changes.filter(c => c.type === 'add').length;
    const modified = session.changes.filter(c => c.type === 'change').length;
    const deleted = session.changes.filter(c => c.type === 'unlink').length;

    console.log('\n📊 Session Summary');
    console.log('─────────────────────');
    console.log(`Duration: ${duration}`);
    console.log(`Files: ${added} added, ${modified} modified, ${deleted} deleted`);
    
    // Display code analysis results
    if (analysis.issues.length > 0) {
      console.log(`\n🔍 Code Analysis:`);
      console.log(`   Quality Score: ${analysis.metrics.qualityScore}/100`);
      console.log(`   Issues Found: ${analysis.issues.length} (${analysis.metrics.issueCount.high} high, ${analysis.metrics.issueCount.medium} medium, ${analysis.metrics.issueCount.low} low)`);
      
      // Show top 3 issues
      const topIssues = analysis.issues.slice(0, 3);
      if (topIssues.length > 0) {
        console.log('\n   Top Issues:');
        topIssues.forEach(issue => {
          const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
          console.log(`   ${severityIcon} ${issue.type}: ${issue.description}`);
          console.log(`      📁 ${issue.filePath}:${issue.lineNumber}`);
        });
      }
    } else {
      console.log(`\n✅ Code Analysis: No issues detected (Quality Score: ${analysis.metrics.qualityScore}/100)`);
    }
    
    console.log('');
    console.log(summary);
    console.log('─────────────────────');
    console.log(`✅ Session saved to .trak/sessions/${timestamp}-session.json`);
    
    if (analysis.issues.length > 0) {
      console.log(`💡 Run "trak dev" to view detailed analysis in the dashboard`);
    }
  }
}
