const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

// Store received reports in memory for demo
const reports = [];

function normalizeRepo(repo) {
  if (!repo) return null;
  const str = String(repo).trim();
  if (!str) return null;
  // Accept owner/repo only (strip https://github.com/.. and .git if present)
  const match = str.match(/(?:github\.com[\/:]|^)([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (!match) return str;
  return `${match[1]}/${match[2]}`;
}

function buildIssueBody({ report, issue }) {
  const when = report.timestamp || report.receivedAt || new Date().toISOString();
  const repo = normalizeRepo(report.repo) || 'unknown';
  return `## Issue detected by Trak (demo org dashboard)

**Developer:** ${report.developerName || 'Unknown'} (${report.developerId || 'unknown'})
**Repo:** ${repo}
**Session ID:** ${report.sessionId || 'unknown'}
**When:** ${when}
**Quality Score:** ${report.qualityScore ?? 'n/a'}/100

### Issue
**Severity:** ${issue.severity}
**Type:** ${issue.type}
**File:** \`${issue.filePath}:${issue.lineNumber}\`

${issue.description}

### Suggested fix
${issue.suggestion}

---
_Created from the Trak demo org dashboard._`;
}

app.post('/api/sessions', (req, res) => {
  const report = req.body;
  const timestamp = new Date().toISOString();
  
  console.log('\n📊 New Session Report Received');
  console.log('─────────────────────────────');
  console.log(`👤 Developer: ${report.developerName} (${report.developerId})`);
  console.log(`🆔 Session ID: ${report.sessionId}`);
  console.log(`⏰ Timestamp: ${report.timestamp}`);
  console.log(`⏱️  Duration: ${report.duration}`);
  console.log(`📁 Files Changed: ${report.files}`);
  console.log(`📊 Quality Score: ${report.qualityScore}/100`);
  console.log(`🔍 Issues Found: ${report.issues}`);
  console.log(`📝 Summary: ${report.summary}`);
  console.log('─────────────────────────────\n');
  
  // Store report
  reports.push({
    ...report,
    repo: normalizeRepo(report.repo),
    receivedAt: timestamp
  });
  
  res.json({
    success: true,
    message: 'Session report received successfully',
    reportId: `report_${Date.now()}`
  });
});

// Optional: endpoint to view all reports
app.get('/api/sessions', (req, res) => {
  res.json({
    total: reports.length,
    reports: reports
  });
});

// Fetch a single report by sessionId
app.get('/api/sessions/:sessionId', (req, res) => {
  const report = reports.find(r => r.sessionId === req.params.sessionId);
  if (!report) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(report);
});

// Create a GitHub issue from a reported finding
app.post('/api/github/issues', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'GITHUB_TOKEN is not set on the org server process'
      });
    }

    const repo = normalizeRepo(req.body?.repo);
    const issue = req.body?.issue;
    const report = req.body?.report;

    if (!repo || !issue || !report) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: repo, issue, report'
      });
    }

    const titleBase = String(issue.description || 'Issue').split('\n')[0].slice(0, 120);
    const title = `[trak] ${issue.severity}: ${issue.type} — ${titleBase}`;
    const body = buildIssueBody({ report, issue });

    const labels = ['trak', String(issue.type || 'issue'), String(issue.severity || 'unknown')].filter(Boolean);

    const ghRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'trak-demo-org-server',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body, labels })
    });

    const data = await ghRes.json().catch(() => ({}));
    if (!ghRes.ok) {
      return res.status(ghRes.status).json({
        success: false,
        error: data?.message || `GitHub API error (${ghRes.status})`,
        details: data
      });
    }

    return res.json({
      success: true,
      issueUrl: data.html_url,
      issueNumber: data.number
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to create GitHub issue'
    });
  }
});

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(port, () => {
  console.log(`🏢 Mock Organization Server running on http://localhost:${port}`);
  console.log('📡 Ready to receive session reports from trak clients');
  console.log('🌐 Dashboard available at http://localhost:3001');
  console.log('💡 Use TRAK_ORG_ENDPOINT=http://localhost:3001 when logging in\n');
});
