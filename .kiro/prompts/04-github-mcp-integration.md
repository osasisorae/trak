# GitHub MCP Integration Guide

## Overview
Integrate GitHub MCP into the trak dashboard to enable one-click issue creation from detected code quality problems.

## Integration Architecture

```
Dashboard Frontend
├── "Create Issue" button on each detected issue
├── POST /api/issues/create with issue data
└── Display success/error feedback

Backend API Handler
├── Receive issue creation request
├── Format issue for GitHub (title, body, labels)
├── Use Kiro agent to call GitHub MCP
└── Return created issue URL or error
```

## Implementation Steps

### 1. Backend API Endpoint

**Add to DashboardServer**:

```typescript
this.app.post('/api/issues/create', async (req, res) => {
  try {
    const { issue, repository } = req.body;
    const githubIssue = await this.createGitHubIssue(issue, repository);
    res.json({ success: true, issueUrl: githubIssue.html_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Issue Formatting

```typescript
private formatIssueTitle(issue: DetectedIssue): string {
  const typeEmoji = {
    'complexity': '🔄',
    'duplication': '📋',
    'error-handling': '⚠️',
    'security': '🔒',
    'performance': '⚡'
  };
  
  return `${typeEmoji[issue.type]} ${issue.type}: ${issue.description}`;
}

private formatIssueBody(issue: DetectedIssue): string {
  return `
## Issue Details

**Type**: ${issue.type}
**Severity**: ${issue.severity}
**File**: \`${issue.filePath}\`
**Line**: ${issue.lineNumber}

## Description
${issue.description}

## Suggested Fix
${issue.suggestion}

---
*Created automatically by Trak code analysis*
`;
}
```

### 3. Frontend Integration

```javascript
async createGitHubIssue(issueId) {
  const issue = this.findIssueById(issueId);
  const repository = await this.getRepositoryName();
  
  const response = await fetch('/api/issues/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue, repository })
  });
  
  const result = await response.json();
  
  if (result.success) {
    this.showSuccess(issueId, result.issueUrl);
  } else {
    this.showError(issueId, result.error);
  }
}
```

## Acceptance Criteria

### Backend Integration
- ✅ API endpoint handles issue creation requests
- ✅ Issues formatted with proper GitHub markdown
- ✅ Labels assigned based on issue type and severity
- ✅ Error handling for MCP unavailability

### Frontend Features
- ✅ "Create Issue" button on each detected issue
- ✅ Loading states during issue creation
- ✅ Success feedback with issue URL
- ✅ Error handling with retry option
