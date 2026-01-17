#!/bin/bash

# Kiro-Trak Code Monitor Hook
# Monitors code changes and provides quality insights

# Read hook event from STDIN
event=$(cat)
hook_type=$(echo "$event" | jq -r '.hook_event_name')
tool_name=$(echo "$event" | jq -r '.tool_name // empty')
cwd=$(echo "$event" | jq -r '.cwd')

# Change to the working directory
cd "$cwd" 2>/dev/null || exit 1

case "$hook_type" in
  "preToolUse")
    # Before code operations - could implement quality gates here
    if [[ "$tool_name" == "fs_write" ]]; then
      # Get current session status for context
      if command -v trak >/dev/null 2>&1 && trak status 2>/dev/null | grep -q "Active Session"; then
        echo "📝 Code modification detected - trak is monitoring for quality analysis"
      fi
    fi
    ;;
    
  "postToolUse")
    # After code operations - provide insights
    case "$tool_name" in
      "fs_write")
        if command -v trak >/dev/null 2>&1; then
          # Check if we have an active session
          if trak status 2>/dev/null | grep -q "Active Session"; then
            # Get session info
            session_info=$(trak status 2>/dev/null | grep -E "(Duration|Files tracked)" | head -2)
            if [ -n "$session_info" ]; then
              echo "📊 Trak Session Update:"
              echo "$session_info"
              echo "🔍 Code changes are being tracked for quality analysis"
            fi
          else
            echo "💡 Tip: Run 'trak start' to begin tracking code quality for this session"
          fi
        fi
        ;;
        
      "execute_bash")
        # Monitor build/test commands that might indicate development activity
        tool_input=$(echo "$event" | jq -r '.tool_input.command // empty')
        if [[ "$tool_input" =~ (npm|yarn|cargo|go|python|pytest|jest|test) ]]; then
          if command -v trak >/dev/null 2>&1 && trak status 2>/dev/null | grep -q "Active Session"; then
            echo "🧪 Build/test command detected - trak is capturing development activity"
          fi
        fi
        ;;
    esac
    ;;
    
  *)
    # Unknown hook type
    exit 0
    ;;
esac

exit 0
