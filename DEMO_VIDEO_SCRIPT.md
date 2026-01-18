# 🎬 Trak Hackathon Demo Video Script
*Duration: 2-3 minutes | Target: Dynamous × Kiro AI Coding Hackathon judges*

## 🎯 Introduction: The Hook (30 seconds)
**[Screen: Split screen - Stressed manager at desk + Code review interface]**

**Voiceover:** "You're managing 6 developers. Sarah just billed 10 hours for authentication. But here's the question that keeps you up at night: Did she really spend 10 hours? What did she actually build? And what bugs did she just introduce into your system?"

**[Screen: Multiple browser tabs - GitHub PRs, time tracking, Slack conversations]**

**Voiceover:** "Right now, to truly know the answers, you'd have to review every single line of code, track every comment, and somehow verify every hour claimed. Even you would break under that workload."

**[Screen: Terminal with trak logo]**

**Voiceover:** "But what if I told you there's a way to know exactly what your developers accomplished, their skill level, and their commitment level - without reviewing a single line of code?"

## 🚀 Development: The Solution (60 seconds)

### Setup (15 seconds)
**[Screen: Terminal]**

**Voiceover:** "Here's how it works. Your developer installs Trak, you create an org."

```bash
# Developer side
npm install -g trak
trak login demo-token-123
```

**[Show login flow]**
```
Enter your name: Sarah Chen
Enter your developer ID: sarah@company.com
✅ Successfully logged in to organization
```

### Developer Workflow (25 seconds)
**[Screen: Split - Terminal + Code Editor]**

**Voiceover:** "Now here's the magic. While Sarah works normally, Trak silently tracks every change she makes."

```bash
trak start
```

**[Show real coding - creating authentication system]**
- Create auth middleware
- Add password hashing
- Implement JWT tokens
- Make a mistake: hardcode API key

**[Terminal shows live updates]**
```
📝 Modified: src/auth/middleware.ts
➕ Added: src/auth/jwt.ts
📝 Modified: src/config/database.ts
```

### AI Analysis (20 seconds)
**[Screen: Terminal]**

**Voiceover:** "When Sarah finishes, Trak's AI analyzes everything - quality, security, complexity."

```bash
trak stop
```

**[Show detailed analysis]**
```
📊 Session Summary - Sarah Chen
─────────────────────────────────
Duration: 2h 15m (billed: 2.25 hours)
Files: 3 added, 2 modified, 847 lines changed

🔍 AI Code Analysis:
   Quality Score: 78/100
   Security Issues: 2 high-priority
   Complexity: Medium
   
   🔴 CRITICAL: Hardcoded API key in config/database.ts:23
   🟡 WARNING: Password validation could be stronger
   ✅ GOOD: Proper JWT implementation with expiration

✅ Report sent to organization dashboard
```

## 🎪 Climax: Manager Dashboard (45 seconds)
**[Screen: Web browser - Organization dashboard]**

**Voiceover:** "And here's where you get your answers. You get instant visibility into exactly what Sarah accomplished."

**[Show dashboard with Sarah's session]**

**Dashboard shows:**
- Real work done: Authentication system
- Time accuracy: 2.25 hours (matches billing)
- Skill assessment: Strong backend, needs security review
- Immediate issues: 2 security problems found

**[Click on security issue]**

**Voiceover:** "With one click, you create a GitHub issue with full context. Sarah gets clear direction, you get peace of mind."

**[Show GitHub issue creation]**
```
Title: SECURITY: Remove hardcoded API key from database config
Priority: High
Assigned: Sarah Chen

AI Analysis:
Hardcoded API key detected in src/config/database.ts line 23.
This poses a security risk if code is committed to version control.

Suggestion: Use environment variables or secure key management.
```

### AI Engineer Integration (15 seconds)
**[Screen: Terminal with Kiro CLI]**

**Voiceover:** "For AI engineers using Kiro, it's even simpler. Connect Trak's MCP server and everything is automatic."

```bash
# Kiro automatically starts/stops sessions
# Every AI-assisted change is tracked
# Quality reports flow to your manager
```

## 🎯 Resolution: The Impact (30 seconds)
**[Screen: Dashboard showing team overview]**

**Voiceover:** "Now you know exactly what each developer accomplished, their skill level, and their commitment - without reviewing a single line of code."

**[Show team metrics]**
- Sarah: 78% avg quality, security-focused training needed
- Mike: 92% avg quality, ready for senior promotion  
- Team: 15% faster delivery, 40% fewer bugs in production

**[Screen: Trak logo + GitHub URL]**

**Voiceover:** "Trak: Finally, development intelligence that scales with your team. Open source, privacy-first, AI-native."

**[End with]**
```
github.com/osasisorae/trak
Built for the age of AI-assisted development
```

---

## 📝 Recording Notes

### Story Arc:
1. **Introduction**: Relatable pain point (overworked CTO)
2. **Development**: Simple solution demonstration  
3. **Climax**: Powerful manager dashboard reveal
4. **Resolution**: Transformed team management

### Key Emotional Beats:
- **Frustration**: "Even the strongest leaders break"
- **Hope**: "What if there was a better way?"
- **Relief**: "Without reviewing a single line of code"
- **Confidence**: "Finally, development intelligence that scales"

### Technical Credibility:
- Real code changes (not toy examples)
- Actual security issues detected
- Genuine time tracking validation
- Professional GitHub integration

### Hackathon Relevance:
- AI-native development focus
- Kiro/MCP integration showcase
- Solves real business problems
- Technical depth + practical value
