import OpenAI from 'openai';
import { config } from 'dotenv';
import type { Session } from './sessionManager.js';
import { TrakError, ErrorCode, handleError, logError } from './errorHandler.js';

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
      return this.heuristicAnalysis(session, fileContents, startTime);
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
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.fallbackAnalysis(session, startTime);
      }

      return this.parseAnalysisResponse(content, startTime);
    } catch (error) {
      const trakError = handleError(error, 'code analysis');
      logError(trakError);
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

**Scoring rubric (0–100):**
- Start from 100.
- Subtract ~18 points per high severity issue, ~8 per medium, ~3 per low.
- Apply additional penalties for overall complexity/duplication if they are meaningfully high.
- If there are no issues, qualityScore should generally be >= 85.
- qualityScore must be an integer between 0 and 100.

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
- Keep metrics calibrated: use the scoring rubric and avoid extreme scores without strong justification

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
      const parsed = JSON.parse(content);
      const parsedIssues = Array.isArray(parsed?.issues) ? parsed.issues : [];

      // Calculate issue counts
      const issueCount = {
        high: parsedIssues.filter((i: DetectedIssue) => i.severity === 'high').length,
        medium: parsedIssues.filter((i: DetectedIssue) => i.severity === 'medium').length,
        low: parsedIssues.filter((i: DetectedIssue) => i.severity === 'low').length
      };

      const issues = parsedIssues.slice(0, 25).map((issue: any, index: number) => ({
        id: String(issue.id || `issue-${Date.now()}-${index}`),
        type: issue.type,
        severity: issue.severity,
        filePath: String(issue.filePath || ''),
        lineNumber: Number(issue.lineNumber || 1),
        description: String(issue.description || ''),
        suggestion: String(issue.suggestion || '')
      })) as DetectedIssue[];

      const complexity = Number(parsed?.metrics?.complexity || 0);
      const duplication = Number(parsed?.metrics?.duplication || 0);
      const qualityScore = calculateQualityScore({ issueCount, complexity, duplication });

      return {
        issues,
        metrics: {
          qualityScore,
          complexity,
          duplication,
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

  private heuristicAnalysis(session: Session, fileContents: Map<string, string>, startTime: number): AnalysisResult {
    const issues: DetectedIssue[] = [];

    for (const [filePath, content] of fileContents.entries()) {
      if (issues.length >= 25) break;

      const addIssue = (issue: Omit<DetectedIssue, 'id'>) => {
        issues.push({ id: `heur-${Date.now()}-${issues.length}`, ...issue });
      };

      const matchers: Array<{
        type: DetectedIssue['type'];
        severity: DetectedIssue['severity'];
        regex: RegExp;
        description: (m: RegExpMatchArray) => string;
        suggestion: string;
      }> = [
        {
          type: 'security',
          severity: 'high',
          regex: /\beval\s*\(/g,
          description: () =>
            'The code uses `eval()`, which executes arbitrary strings as code. This is a high-risk pattern because it can enable code injection if any part of the input is influenced externally. It also makes behavior harder to reason about and can break common security expectations.',
          suggestion: 'Avoid `eval()` and replace it with safe parsing/dispatch logic (e.g., JSON parsing or explicit function mapping).'
        },
        {
          type: 'security',
          severity: 'high',
          regex: /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AIzaSy[A-Za-z0-9_\-]{20,})\b/g,
          description: () =>
            'The code appears to include a token-like string that matches a common secret format. Committing secrets can lead to account compromise, unauthorized access, and security incidents. Even if this is a test value, it trains the codebase toward unsafe practices.',
          suggestion: 'Remove the secret from code, rotate the credential, and load it from environment variables or a secure secret store.'
        },
        {
          type: 'error-handling',
          severity: 'medium',
          regex: /\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/g,
          description: () =>
            'There is an empty `catch` block that suppresses errors without handling them. This makes failures silent and can hide bugs, data loss, or partial state updates. In production, this usually results in hard-to-debug behavior and missing diagnostics.',
          suggestion: 'Handle the error explicitly: log with context, rethrow, or return a meaningful error result.'
        },
        {
          type: 'error-handling',
          severity: 'medium',
          regex: /\bcatch\s*(?:\([^)]*\))?\s*\{\s*\/\/\s*ignore[^\n]*\s*\}/gi,
          description: () =>
            'The code explicitly ignores an error inside a `catch` block. While sometimes justified, this can mask real failures and make it difficult to diagnose issues under load or edge cases. Over time, ignored errors tend to accumulate and reduce reliability.',
          suggestion: 'If ignoring is intentional, document why and consider at least logging at debug level with enough context to trace failures.'
        },
        {
          type: 'performance',
          severity: 'low',
          regex: /\bconsole\.log\s*\(/g,
          description: () =>
            'The code includes `console.log` statements that may be left in production paths. Excessive logging can become noisy, slow down hot paths, and leak potentially sensitive runtime details. It can also make debugging harder by drowning out important signals.',
          suggestion: 'Use a leveled logger and avoid noisy logs in hot paths; remove debug logs before release.'
        }
      ];

      for (const matcher of matchers) {
        if (issues.length >= 25) break;
        const m = content.match(matcher.regex);
        if (!m) continue;

        const firstIdx = content.search(matcher.regex);
        const lineNumber = firstIdx >= 0 ? lineNumberAt(content, firstIdx) : 1;
        addIssue({
          type: matcher.type,
          severity: matcher.severity,
          filePath,
          lineNumber,
          description: matcher.description(m),
          suggestion: matcher.suggestion
        });
      }

      if (issues.length >= 25) break;

      const todos = content.match(/\b(TODO|FIXME)\b/g);
      if (todos && todos.length > 0) {
        addIssue({
          type: 'complexity',
          severity: 'low',
          filePath,
          lineNumber: 1,
          description:
            'The code contains TODO/FIXME markers which indicate incomplete work or known gaps. These items can accumulate and reduce maintainability if they are not tracked and resolved. They also create ambiguity for future contributors about expected behavior.',
          suggestion: 'Convert TODOs into tracked issues/tasks and resolve them or add clear ownership and a deadline.'
        });
      }
    }

    const issueCount = {
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length
    };

    const complexity = estimateComplexity(fileContents);
    const duplication = 0;
    const qualityScore = calculateQualityScore({ issueCount, complexity, duplication });

    return {
      issues,
      metrics: {
        qualityScore,
        complexity,
        duplication,
        issueCount
      },
      summary: issues.length > 0 ? 'Heuristic analysis detected potential issues' : 'Heuristic analysis found no obvious issues',
      analysisTime: Date.now() - startTime
    };
  }
}

export function createCodeAnalyzer(): CodeAnalyzer {
  return new CodeAnalyzer();
}

function calculateQualityScore(input: {
  issueCount: { high: number; medium: number; low: number };
  complexity: number;
  duplication: number;
}): number {
  let score = 100;
  score -= input.issueCount.high * 18;
  score -= input.issueCount.medium * 8;
  score -= input.issueCount.low * 3;

  // Soft penalties: keep bounded and avoid dominating the score.
  score -= Math.min(12, Math.floor(input.complexity / 25) * 3);
  score -= Math.min(10, Math.max(0, Math.floor(input.duplication)));

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (input.issueCount.high === 0 && input.issueCount.medium === 0 && input.issueCount.low === 0) {
    score = Math.max(score, 85);
  }

  return score;
}

function estimateComplexity(fileContents: Map<string, string>): number {
  let points = 0;
  for (const content of fileContents.values()) {
    points += (content.match(/\bif\s*\(/g) || []).length;
    points += (content.match(/\bfor\s*\(/g) || []).length;
    points += (content.match(/\bwhile\s*\(/g) || []).length;
    points += (content.match(/\bswitch\s*\(/g) || []).length;
    points += (content.match(/\bcase\b/g) || []).length;
    points += (content.match(/&&|\|\|/g) || []).length;
  }
  return points;
}

function lineNumberAt(content: string, index: number): number {
  if (index <= 0) return 1;
  return content.slice(0, index).split('\n').length;
}
