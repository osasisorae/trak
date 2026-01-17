const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

// Store received reports in memory for demo
const reports = [];

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

app.listen(port, () => {
  console.log(`🏢 Mock Organization Server running on http://localhost:${port}`);
  console.log('📡 Ready to receive session reports from trak clients');
  console.log('💡 Use TRAK_ORG_ENDPOINT=http://localhost:3001/report when logging in\n');
});
