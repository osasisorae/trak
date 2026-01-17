#!/bin/bash

# Kiro-Trak Quality Gate Hook
# Implements quality gates to prevent low-quality code commits

# Read hook event from STDIN
event=$(cat)
hook_type=$(echo "$event" | jq -r '.hook_event_name')
tool_name=$(echo "$event" | jq -r '.tool_name // empty')
tool_input=$(echo "$event" | jq -r '.tool_input // empty')
cwd=$(echo "$event" | jq -r '.cwd')

# Change to the working directory
cd "$cwd" 2>/dev/null || exit 1

case "$hook_type" in
  "preToolUse")
    # Quality gate for git commits
    if [[ "$tool_name" == "execute_bash" ]]; then
      command=$(echo "$event" | jq -r '.tool_input.command // empty')
      
      # Check for git commit commands
      if [[ "$command" =~ git.*commit ]]; then
        if command -v trak >/dev/null 2>&1; then
          # Check if we have recent session data
          if [ -d ".trak/sessions" ] && [ "$(ls -A .trak/sessions 2>/dev/null)" ]; then
            # Get the most recent session
            latest_session=$(ls -t .trak/sessions/*.json 2>/dev/null | head -1)
            if [ -n "$latest_session" ]; then
              # Extract quality score
              quality_score=$(jq -r '.analysis.metrics.qualityScore // 0' "$latest_session" 2>/dev/null)
              high_issues=$(jq -r '.analysis.metrics.issueCount.high // 0' "$latest_session" 2>/dev/null)
              
              # Quality gate: block commits with score < 60 or high issues > 5
              if [ "$quality_score" -lt 60 ] || [ "$high_issues" -gt 5 ]; then
                echo "🚫 QUALITY GATE: Commit blocked due to code quality issues"
                echo "📊 Quality Score: $quality_score/100 (minimum: 60)"
                echo "🔴 High Priority Issues: $high_issues (maximum: 5)"
                echo ""
                echo "💡 Recommendations:"
                echo "   • Run 'trak dev' to view detailed analysis"
                echo "   • Fix high-priority issues before committing"
                echo "   • Improve code quality to meet standards"
                echo ""
                echo "⚠️  Use 'git commit --no-verify' to bypass this check (not recommended)"
                exit 2  # Block the tool execution
              else
                echo "✅ Quality gate passed - commit allowed"
                echo "📊 Quality Score: $quality_score/100"
                echo "🔍 High Priority Issues: $high_issues"
              fi
            fi
          fi
        fi
      fi
    fi
    ;;
esac

exit 0
