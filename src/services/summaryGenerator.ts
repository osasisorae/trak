import OpenAI from 'openai';
import { config } from 'dotenv';
import type { Session } from './sessionManager.js';

config();

export class SummaryGenerator {
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async generateSummary(session: Session, fileContents: Map<string, string>): Promise<string> {
    if (!this.client) {
      return this.fallbackSummary(session);
    }

    try {
      const prompt = this.buildPrompt(session, fileContents);
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software developer assistant that analyzes coding sessions and generates concise, meaningful summaries. Focus on what was built, fixed, or improved. Be specific but brief.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || this.fallbackSummary(session);
    } catch (error) {
      console.error('⚠️  OpenAI API error, using fallback summary');
      return this.fallbackSummary(session);
    }
  }

  private buildPrompt(session: Session, fileContents: Map<string, string>): string {
    const duration = this.formatDuration(session);
    const changesList = session.changes.map(c => 
      `- ${c.path} (${c.type}, ${c.changeCount} changes)`
    ).join('\n');

    let fileContentsSample = '';
    let count = 0;
    for (const [path, content] of fileContents) {
      if (count >= 3) break;
      fileContentsSample += `\n### ${path}\n\`\`\`\n${content.slice(0, 500)}\n\`\`\`\n`;
      count++;
    }

    return `Analyze this coding session and generate a concise summary.

**Session Duration**: ${duration}
**Working Directory**: ${session.cwd}

**File Changes**:
${changesList}

**Sample File Contents** (first 3 files):
${fileContentsSample}

Provide a brief summary (2-3 sentences) of what was accomplished in this session. Focus on the main features, fixes, or improvements.`;
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

  private fallbackSummary(session: Session): string {
    const added = session.changes.filter(c => c.type === 'add').length;
    const modified = session.changes.filter(c => c.type === 'change').length;
    const deleted = session.changes.filter(c => c.type === 'unlink').length;
    
    return `Worked on ${session.changes.length} files: ${added} added, ${modified} modified, ${deleted} deleted.`;
  }
}

export function createSummaryGenerator(): SummaryGenerator {
  return new SummaryGenerator();
}
