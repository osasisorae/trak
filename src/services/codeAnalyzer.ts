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
    return `You are a senior software engineer conducting a thorough code review. Your goal is to identify meaningful quality issues and provide detailed, actionable feedback.

**Issue Categories to Detect:**
1. **Complexity**: High cyclomatic complexity, deeply nested code, overly long functions, complex conditional logic
2. **Duplication**: Repeated code blocks, similar patterns that could be abstracted, copy-paste programming
3. **Error Handling**: Missing try-catch blocks, unhandled promises, inadequate error recovery, silent failures
4. **Security**: SQL injection risks, XSS vulnerabilities, hardcoded secrets, insecure data handling
5. **Performance**: Inefficient algorithms, memory leaks, blocking operations, unnecessary computations

**Quality Standards:**
- Only report genuine issues that impact code maintainability, security, or performance
- Avoid nitpicking style issues unless they significantly affect readability
- Focus on issues that would matter in a production codebase
- Prioritize high-impact problems over minor improvements

**Issue Description Requirements:**
- Each description must be at least 3 complete sentences
- First sentence: Clearly state what the problem is
- Second sentence: Explain why this is problematic or what risks it introduces
- Third sentence: Describe the potential impact or consequences
- Use technical language appropriate for experienced developers

**Severity Guidelines:**
- **High**: Critical security vulnerabilities, major performance issues, code that could cause system failures
- **Medium**: Maintainability problems, moderate performance issues, error handling gaps
- **Low**: Minor optimizations, style improvements that aid readability

Return valid JSON only with this exact structure:
{
  "issues": [
    {
      "id": "unique-id",
      "type": "complexity|duplication|error-handling|security|performance",
      "severity": "high|medium|low",
      "filePath": "src/path/to/file.ts",
      "lineNumber": 42,
      "description": "Detailed 3+ sentence description of the issue and its implications",
      "suggestion": "Specific, actionable recommendation for fixing the issue"
    }
  ],
  "metrics": {
    "qualityScore": 85,
    "complexity": 12,
    "duplication": 5
  },
  "summary": "Professional summary of the overall code quality and key findings"
}`;
  }

  private buildAnalysisPrompt(session: Session, fileContents: Map<string, string>): string {
    const languages = this.detectLanguages(fileContents);
    const filesData = Array.from(fileContents.entries())
      .slice(0, 5) // Limit to first 5 files to avoid token limits
      .map(([path, content]) => `### ${path}\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\``)
      .join('\n\n');

    return `Conduct a thorough code review of the following changes from a development session:

**Project Context**: TypeScript CLI tool for development session tracking
**Languages**: ${languages.join(', ')}
**Session Duration**: ${this.formatDuration(session)}
**Files Changed**: ${session.changes.length}

**Code to Review**:
${filesData}

**Review Focus Areas:**
- Look for actual code quality issues, not style preferences
- Identify security vulnerabilities and error handling gaps
- Find performance bottlenecks and complexity issues
- Spot code duplication that should be refactored
- Ensure each issue description is detailed (3+ sentences minimum)

Provide a professional code review with specific, actionable feedback in the required JSON format.`;
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
