#!/bin/bash

# Trak + Kiro Integration Demo Script
# Demonstrates the enhanced development workflow

echo "🚀 Trak + Kiro Integration Demo"
echo "================================"
echo ""

echo "📋 What this demo shows:"
echo "• Automatic session management when Kiro agent starts/stops"
echo "• Real-time code quality monitoring during development"
echo "• Quality gates that prevent low-quality commits"
echo "• Enhanced development insights and context"
echo ""

echo "🛠️ Setup Instructions:"
echo "1. Copy kiro-integration/ folder to your project root"
echo "2. Update paths in kiro-agent-config.json to match your setup"
echo "3. Configure your Kiro agent to use the provided configuration"
echo "4. Start coding with Kiro - trak will work automatically!"
echo ""

echo "🎯 Key Features:"
echo "• ✅ Auto-start trak sessions when agent spawns"
echo "• ✅ Monitor file changes and provide quality insights"  
echo "• ✅ Block git commits with quality score < 60"
echo "• ✅ Show real-time session statistics"
echo "• ✅ Seamless integration with existing workflows"
echo ""

echo "💡 Test Commands:"
echo "# These would trigger the hooks in a real Kiro environment:"
echo "kiro-cli chat  # Starts agent (triggers trak start)"
echo "# Edit some files (triggers monitoring)"
echo "git commit -m 'test'  # May trigger quality gate"
echo "# Exit chat (triggers trak stop)"
echo ""

echo "📊 Expected Output:"
echo "• Session start/stop messages in Kiro chat"
echo "• Quality insights after code changes"
echo "• Commit blocking for low-quality code"
echo "• Enhanced context for AI assistance"
echo ""

echo "🔗 Integration Complete!"
echo "Trak now works seamlessly with Kiro for enhanced development tracking."
