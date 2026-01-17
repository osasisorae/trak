#!/bin/bash

# Kiro-Trak Session Manager Hook
# Handles automatic session start/stop based on agent lifecycle

# Read hook event from STDIN
event=$(cat)
hook_type=$(echo "$event" | jq -r '.hook_event_name')
cwd=$(echo "$event" | jq -r '.cwd')

# Change to the working directory
cd "$cwd" 2>/dev/null || exit 1

case "$hook_type" in
  "agentSpawn")
    # Start trak session when Kiro agent spawns
    if command -v trak >/dev/null 2>&1; then
      # Check if session is already active
      if ! trak status >/dev/null 2>&1 || ! trak status 2>/dev/null | grep -q "Active Session"; then
        trak start >/dev/null 2>&1
        if [ $? -eq 0 ]; then
          echo "🚀 Trak session started automatically for development tracking"
          echo "📊 Your coding activity will be analyzed for quality insights"
        else
          echo "⚠️ Could not start trak session (may already be active)"
        fi
      else
        echo "📊 Trak session already active - continuing tracking"
      fi
    else
      echo "⚠️ Trak not found - install with 'npm install -g trak'"
    fi
    ;;
    
  "stop")
    # Stop trak session when agent finishes
    if command -v trak >/dev/null 2>&1; then
      # Check if session is active
      if trak status 2>/dev/null | grep -q "Active Session"; then
        echo "📊 Stopping trak session and generating analysis..."
        trak stop >/dev/null 2>&1
        if [ $? -eq 0 ]; then
          echo "✅ Trak session completed - code quality analysis generated"
          echo "💡 Run 'trak dev' to view detailed insights in the dashboard"
        fi
      fi
    fi
    ;;
    
  *)
    # Unknown hook type
    exit 0
    ;;
esac

exit 0
