import OpenAI from 'openai';
import { config } from 'dotenv';
import type { Session } from './sessionManager.js';

config();

export interface DetectedIssue {
  id: string;
  type: 'complexity' | 'duplication' | 'error-handling' | 'security' | 'performance';
  severity: 'high' | 'medium' | 'low';
  filePath: string;
  lineNumber: number;
  description: string;
  suggestion: string;
  codeExample?: {
    before: string;
    after: string;
  };
}

export interface AnalysisResult {
  issues: DetectedIssue[];
  metrics: {
    qualityScore: number;
    complexity: number;
    duplication: number;
    issueCount: {
      high: number;
      medium: number;
      low: number;
    };
  };
  summary: string;
  analysisTime: number;
}

export class CodeAnalyzer {
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async analyzeSession(session: Session, fileContents: Map<string, string>): Promise<AnalysisResult> {
    const startTime = Date.now();

    if (!this.client) {
      return this.fallbackAnalysis(session, startTime);
    }

    try {
      const prompt = this.buildAnalysisPrompt(session, fileContents);
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.fallbackAnalysis(session, startTime);
      }

      return this.parseAnalysisResponse(content, startTime);
    } catch (error) {
      console.error('⚠️  Code analysis failed, using fallback');
      return this.fallbackAnalysis(session, startTime);
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert code reviewer that identifies quality issues, security vulnerabilities, and performance problems.

Detect 5 types of issues:
1. **Complexity**: High cyclomatic complexity, deep nesting, long functions
2. **Duplication**: Similar code blocks, repeated patterns
3. **Error Handling**: Missing try-catch, unhandled promises
4. **Security**: SQL injection, XSS vulnerabilities, hardcoded secrets
5. **Performance**: Inefficient loops, memory leaks, blocking operations

Categorize by severity: high (critical), medium (important), low (nice-to-have)
Provide specific file paths and line numbers
Generate actionable improvement suggestions
Focus on real issues, avoid false positives

Return valid JSON only with this structure:
{
  "issues": [
    {
      "id": "unique-id",
      "type": "complexity|duplication|error-handling|security|performance",
      "severity": "high|medium|low",
      "filePath": "src/path/to/file.ts",
      "lineNumber": 42,
      "description": "Clear description of the issue",
      "suggestion": "Actionable improvement suggestion"
    }
  ],
  "metrics": {
    "qualityScore": 85,
    "complexity": 12,
    "duplication": 5
  },
  "summary": "Brief analysis summary"
}`;
  }

  private buildAnalysisPrompt(session: Session, fileContents: Map<string, string>): string {
    const languages = this.detectLanguages(fileContents);
    const filesData = Array.from(fileContents.entries())
      .slice(0, 5) // Limit to first 5 files to avoid token limits
      .map(([path, content]) => `### ${path}\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\``)
      .join('\n\n');

    return `Analyze the following code changes for quality issues:

**Programming Languages**: ${languages.join(', ')}
**Project Context**: CLI tool for session tracking
**Session Duration**: ${this.formatDuration(session)}

**Files to Analyze**:
${filesData}

Please identify issues in the 5 categories (complexity, duplication, error-handling, security, performance) and return the structured JSON response.`;
  }

  private detectLanguages(fileContents: Map<string, string>): string[] {
    const extensions = new Set<string>();
    for (const path of fileContents.keys()) {
      const ext = path.split('.').pop()?.toLowerCase();
      if (ext) extensions.add(ext);
    }

    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'tsx': 'typescript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust'
    };

    return Array.from(extensions)
      .map(ext => langMap[ext] || ext)
      .filter(Boolean);
  }

  private formatDuration(session: Session): string {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes} minutes`;
  }

  private parseAnalysisResponse(content: string, startTime: number): AnalysisResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      
      const parsed = JSON.parse(jsonStr);
      
      // Add unique IDs if missing
      parsed.issues = parsed.issues.map((issue: any, index: number) => ({
        ...issue,
        id: issue.id || `issue-${Date.now()}-${index}`
      }));

      // Calculate issue counts
      const issueCount = {
        high: parsed.issues.filter((i: DetectedIssue) => i.severity === 'high').length,
        medium: parsed.issues.filter((i: DetectedIssue) => i.severity === 'medium').length,
        low: parsed.issues.filter((i: DetectedIssue) => i.severity === 'low').length
      };

      return {
        issues: parsed.issues || [],
        metrics: {
          qualityScore: parsed.metrics?.qualityScore || 80,
          complexity: parsed.metrics?.complexity || 0,
          duplication: parsed.metrics?.duplication || 0,
          issueCount
        },
        summary: parsed.summary || 'Code analysis completed',
        analysisTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return this.fallbackAnalysis(null, startTime);
    }
  }

  private fallbackAnalysis(session: Session | null, startTime: number): AnalysisResult {
    return {
      issues: [],
      metrics: {
        qualityScore: 75,
        complexity: 0,
        duplication: 0,
        issueCount: { high: 0, medium: 0, low: 0 }
      },
      summary: 'Analysis unavailable - OpenAI API not configured or failed',
      analysisTime: Date.now() - startTime
    };
  }
}

export function createCodeAnalyzer(): CodeAnalyzer {
  return new CodeAnalyzer();
}
