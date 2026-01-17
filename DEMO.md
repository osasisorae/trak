# 🎯 Trak Hackathon Demo Script

> **Complete demo flow for judges - showcasing AI-powered development tracking**

## 🚀 Demo Overview (5 minutes)

**What we're showing:** Trak transforms development tracking from manual logging to intelligent, automated insights that enhance both individual productivity and team collaboration.

**Key message:** "Trak makes code quality visible and actionable - whether you're coding solo or with AI assistants like Kiro."

## 📋 Demo Flow

### 1. **Opening Hook** (30 seconds)
**Say:** "How many of you have ever wondered what you actually accomplished during a coding session? Trak answers that question with AI-powered insights."

**Show:** Quick overview of what trak does
```bash
trak --help
```

**Expected output:**
```
Usage: trak [options] [command]

Track and summarize coding sessions with AI

Commands:
  start              Start tracking a coding session
  stop               Stop tracking and generate AI summary
  status             Show current session status
  dev                Launch developer dashboard
  login <org-token>  Login to organization dashboard
  logout             Logout from organization dashboard
```

### 2. **Core Functionality Demo** (2 minutes)

#### Start a Session
**Say:** "Let's start tracking a coding session"
```bash
trak start
```

**Expected output:**
```
🟢 Session started. Tracking changes...
Press Ctrl+C or run 'trak stop' to end session
```

#### Make Some Code Changes
**Say:** "Now I'll make some intentional code changes with quality issues"

Create a test file with issues:
```bash
# Create test file with quality issues
cat > demo-code.js << 'EOF'
// Intentional code quality issues for demo
const SECRET_KEY = "hardcoded-secret-123"; // Security issue

function complexFunction(data) {
    console.log("Debug info:", data); // Console.log in production
    
    if (data) {
        if (data.length > 0) {
            if (data[0]) {
                if (data[0].id) {
                    return data[0].id; // Deep nesting
                }
            }
        }
    }
    // No return statement for all paths
}

// Unused variable
const unusedVar = "never used";
EOF
```

#### Stop Session and See Analysis
**Say:** "Now let's stop the session and see what trak discovered"
```bash
trak stop
```

**Expected output:**
```
⏳ Analyzing code and generating summary...

📊 Session Summary
─────────────────────
Duration: 2m
Files: 1 added, 0 modified, 0 deleted

🔍 Code Analysis:
   Quality Score: 45/100
   Issues Found: 5 (3 high, 2 medium, 0 low)

   Top Issues:
   🔴 security: Hardcoded secret key detected
      📁 demo-code.js:2
   🔴 complexity: Deep nesting makes code hard to maintain
      📁 demo-code.js:5
   🟡 error-handling: Missing return statement in function
      📁 demo-code.js:4

✅ Session saved to .trak/sessions/2026-01-17-session.json
💡 Run "trak dev" to view detailed analysis in the dashboard
```

**Key talking point:** "Notice how trak automatically detected security issues, complexity problems, and code quality concerns - with specific line numbers and actionable suggestions."

### 3. **Dashboard Demo** (1.5 minutes)

#### Launch Dashboard
**Say:** "Let's see the beautiful dashboard with detailed insights"
```bash
trak dev
```

**Expected output:**
```
🚀 Dashboard server starting on http://localhost:3000
🌐 Browser opened to http://localhost:3000
```

**Show in browser:**
- Modern, responsive interface
- Session list with quality scores
- Detailed issue breakdown
- Color-coded quality indicators
- GitHub issue creation buttons

**Key talking points:**
- "Professional dashboard that makes code quality visual"
- "Each issue has specific location and actionable suggestions"
- "One-click GitHub issue creation for team collaboration"

### 4. **AI Assistant Integration** (1 minute)

#### Show MCP Tools
**Say:** "Trak integrates with AI assistants through the Model Context Protocol"
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm run mcp-server
```

**Expected output:** JSON showing 6 available tools

**Key talking point:** "AI assistants can now automatically start/stop sessions, analyze code quality, and even create GitHub issues - making development tracking invisible and powerful."

#### Show Kiro Integration
**Say:** "With Kiro CLI, trak becomes completely automatic"

**Show:** `kiro-integration/` folder contents
- Hook scripts for automatic session management
- Quality gates that prevent bad commits
- Real-time insights during development

**Key talking point:** "Imagine coding with an AI assistant that automatically tracks your progress, analyzes quality, and prevents you from committing problematic code."

### 5. **Organization Features** (30 seconds)

#### Show Team Integration
**Say:** "For teams, trak provides organization-wide insights"
```bash
trak login demo-token-123
# Follow prompts
trak status
```

**Expected output:** Shows organization login status

**Key talking point:** "Teams get centralized insights while maintaining developer privacy - only metadata is shared, never actual code."

## 🎯 Key Talking Points

### **Problem Statement**
- Developers lose track of what they accomplished
- Code quality issues go unnoticed until too late
- Teams lack visibility into development patterns
- AI assistants need context about actual coding activity

### **Solution Highlights**
- **Automatic tracking** with intelligent analysis
- **Real-time quality insights** with specific suggestions
- **Beautiful dashboard** for visual understanding
- **AI assistant integration** for enhanced workflows
- **Team collaboration** through GitHub integration
- **Organization reporting** for management insights

### **Technical Innovation**
- AI-powered code analysis across 18+ languages
- Model Context Protocol integration for AI assistants
- Automatic Git repository detection
- Quality gates with configurable thresholds
- Privacy-focused team reporting

### **Market Differentiation**
- **Standalone value** - works for any developer
- **Enhanced with AI** - supercharged with Kiro integration
- **Team-ready** - organization dashboard and reporting
- **Developer-friendly** - beautiful UI, clear insights

## 🚨 Troubleshooting

### If trak start fails:
- Check if already running: `trak status`
- Ensure in a directory with write permissions
- Verify Node.js installation

### If dashboard doesn't open:
- Check port 3000 availability
- Manually open http://localhost:3000
- Check console for error messages

### If MCP server fails:
- Ensure project is built: `npm run build`
- Check for missing dependencies
- Verify JSON formatting in test commands

### If GitHub integration fails:
- Verify GITHUB_TOKEN in .env
- Ensure using classic token (not fine-grained)
- Check token has repo scope

## 🏆 Closing Statement

**Say:** "Trak transforms development from 'what did I do?' to 'here's exactly what I accomplished, with insights to make me better.' Whether you're coding solo or with AI assistants, trak makes your development process visible, measurable, and continuously improving."

**Call to action:** "Try trak in your next coding session - you'll be amazed at what you discover about your own development patterns."

---

**Demo Duration:** 5 minutes
**Preparation Time:** 2 minutes
**Wow Factor:** High - combines practical utility with technical innovation
