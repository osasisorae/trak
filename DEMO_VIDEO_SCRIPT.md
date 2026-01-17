# 🎬 Trak Hackathon Demo Video Script
*Duration: 2-3 minutes | Target: Dynamous × Kiro AI Coding Hackathon judges*

## 🎯 Opening Hook (15 seconds)
**[Screen: Terminal in clean directory]**

**Voiceover:** "What if your AI coding assistant could not only help you write code, but also track and analyze the quality of what you build together? Meet Trak - AI-powered development intelligence."

**[Type command]**
```bash
trak --help
```

## 🚀 Core Demo Flow (90 seconds)

### 1. Start Session (20 seconds)
**[Screen: Terminal]**

**Voiceover:** "Let's start tracking a coding session. Trak monitors file changes in real-time."

```bash
trak start
```

**[Show output]**
```
🟢 Session started. Tracking changes...
Press Ctrl+C or run 'trak stop' to end session
```

### 2. Make Code Changes (30 seconds)
**[Screen: Split - Terminal + Code Editor]**

**Voiceover:** "Now I'll make some code changes. Trak automatically detects every modification."

**[Create/edit files quickly]**
- Create `utils.ts` with a complex function
- Modify existing file
- Add a security issue (hardcoded API key)

**[Terminal shows live updates]**
```
📝 Modified: src/utils.ts
➕ Added: src/config.ts
```

### 3. Stop & Analyze (40 seconds)
**[Screen: Terminal]**

**Voiceover:** "When I stop the session, Trak uses AI to analyze code quality and provide actionable insights."

```bash
trak stop
```

**[Show AI analysis output]**
```
⏳ Analyzing code and generating summary...

📊 Session Summary
─────────────────────
Duration: 2m 15s
Files: 2 added, 1 modified

🔍 Code Analysis:
   Quality Score: 72/100
   Issues Found: 3 (1 high, 2 medium)

   Top Issues:
   🔴 security: Hardcoded API key detected
      📁 src/config.ts:12
   🟡 complexity: Function has high cyclomatic complexity
      📁 src/utils.ts:45

✅ Session saved to .trak/sessions/2026-01-17-session.json
```

## 🤖 AI Assistant Integration (30 seconds)
**[Screen: Terminal]**

**Voiceover:** "But here's where it gets powerful - Trak integrates with AI assistants like Kiro through MCP."

```bash
# Show MCP server running
npm run mcp-server
```

**[Screen: Show Kiro CLI or MCP tools list]**

**Voiceover:** "AI assistants can now automatically start sessions, analyze code, and even create GitHub issues from detected problems."

## 📊 Dashboard & Team Features (20 seconds)
**[Screen: Web browser]**

```bash
trak dev
```

**[Show dashboard opening]**

**Voiceover:** "The web dashboard provides visual insights and team reporting. Perfect for engineering leaders who need visibility into AI-assisted development."

**[Quick tour of dashboard features]**
- Session history
- Quality trends
- GitHub issue creation
- Team analytics

## 🎯 Closing (15 seconds)
**[Screen: Homepage or GitHub]**

**Voiceover:** "Trak transforms development tracking from manual logging to intelligent insights. Built for the age of AI-assisted coding. Open source, privacy-first, and ready for your team."

**[Show key stats]**
- 18+ languages supported
- 6 AI tools integrated
- MIT licensed

**[End with]**
```
github.com/osasisorae/trak
```

---

## 📝 Recording Notes

### Pre-Recording Setup:
1. **Clean environment**: Fresh terminal, organized desktop
2. **Prepare files**: Have sample code ready to modify
3. **Test commands**: Ensure all commands work smoothly
4. **Set up demo directory**: Use a clean project folder

### Technical Setup:
- **Screen resolution**: 1920x1080 for clarity
- **Terminal**: Large font, high contrast theme
- **Recording tool**: OBS Studio or QuickTime
- **Audio**: Clear microphone, no background noise

### Timing Breakdown:
- **Opening**: 0:00-0:15
- **Core Demo**: 0:15-1:45
- **AI Integration**: 1:45-2:15
- **Dashboard**: 2:15-2:35
- **Closing**: 2:35-2:50

### Key Messages to Emphasize:
1. **AI-native**: Built for the age of AI coding assistants
2. **Intelligent**: Not just tracking, but analyzing and providing insights
3. **Practical**: Solves real problems for developers and teams
4. **Hackathon relevant**: Perfect integration with Kiro and MCP

### Fallback Plan:
If any command fails during recording:
- Have pre-recorded terminal sessions ready
- Use static screenshots for dashboard if server issues
- Keep the script flexible - focus on the story, not perfect execution
