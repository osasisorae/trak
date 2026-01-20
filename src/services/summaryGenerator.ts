import OpenAI from 'openai';
import { config } from 'dotenv';
import type { Session } from './sessionManager.js';
import { createCodeAnalyzer, type AnalysisResult } from './codeAnalyzer.js';

config();

export class SummaryGenerator {
  private client: OpenAI | null = null;
  private codeAnalyzer = createCodeAnalyzer();

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async generateSummary(session: Session, fileContents: Map<string, string>): Promise<{ summary: string; analysis: AnalysisResult }> {
    // Run code analysis first
    const analysis = await this.codeAnalyzer.analyzeSession(session, fileContents);
    
    // Generate enhanced summary including analysis results
    const summary = await this.generateEnhancedSummary(session, fileContents, analysis);
    
    return { summary, analysis };
  }

  private async generateEnhancedSummary(session: Session, fileContents: Map<string, string>, analysis: AnalysisResult): Promise<string> {
    if (!this.client) {
      return this.fallbackSummary(session, analysis);
    }

    try {
      const prompt = this.buildEnhancedPrompt(session, fileContents, analysis);
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software developer assistant that summarizes coding sessions for both developers and managers. Be concrete, avoid speculation, and ground the summary in the provided change list and analysis. Keep it short and high-signal.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || this.fallbackSummary(session, analysis);
    } catch (error) {
      console.error('⚠️  Summary generation failed, using fallback');
      return this.fallbackSummary(session, analysis);
    }
  }

  private buildEnhancedPrompt(session: Session, fileContents: Map<string, string>, analysis: AnalysisResult): string {
    const duration = this.formatDuration(session);
    const changesList = session.changes.map(c => 
      `- ${c.path} (${c.type}, ${c.changeCount} changes)`
    ).join('\n');

    const analysisInsights = analysis.issues.length > 0 
      ? `\n**Code Analysis Results**:\n- ${analysis.issues.length} issues detected (${analysis.metrics.issueCount.high} high, ${analysis.metrics.issueCount.medium} medium, ${analysis.metrics.issueCount.low} low priority)\n- Quality Score: ${analysis.metrics.qualityScore}/100\n- Key issues: ${analysis.issues.slice(0, 3).map(i => i.type).join(', ')}`
      : '\n**Code Analysis**: No significant issues detected';

    let fileContentsSample = '';
    let count = 0;
    for (const [path, content] of fileContents) {
      if (count >= 2) break;
      fileContentsSample += `\n### ${path}\n\`\`\`\n${content.slice(0, 300)}\n\`\`\`\n`;
      count++;
    }

    return `Analyze this coding session and generate a concise summary:

**Session Duration**: ${duration}
**Working Directory**: ${session.cwd}

**File Changes**:
${changesList}
${analysisInsights}

**Sample File Contents** (first 2 files):
${fileContentsSample}

Output format:
1) 2–4 bullet points describing what changed and why it matters.
2) One final line: "Quality: <score>/100 — <high/med/low issue counts> — <top 1–2 issue types or 'no issues'>".

Do not invent features; if details aren’t present, say so briefly.`;
  }

  private formatDuration(session: Session): string {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private fallbackSummary(session: Session, analysis: AnalysisResult): string {
    const added = session.changes.filter(c => c.type === 'added').length;
    const modified = session.changes.filter(c => c.type === 'modified').length;
    const deleted = session.changes.filter(c => c.type === 'deleted').length;
    
    let summary = `Worked on ${session.changes.length} files: ${added} added, ${modified} modified, ${deleted} deleted.`;
    
    if (analysis.issues.length > 0) {
      summary += ` Code analysis detected ${analysis.issues.length} issues for review.`;
    }
    
    return summary;
  }
}

export function createSummaryGenerator(): SummaryGenerator {
  return new SummaryGenerator();
}
