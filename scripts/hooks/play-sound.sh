#!/bin/bash
# macOS notification sound for Claude Code hooks
# Usage: play-sound.sh <done|notify>
#   done   - Stop hook: the turn finished
#   notify - Notification hook: Claude needs the user (permission prompt, question, idle)
#
# Always plays a local system sound directly, distinct per event so
# "done" and "notify" are audibly different. No external notifier app
# involved. macOS only.

EVENT="${1:-done}"
cat >/dev/null

if [[ "$EVENT" == "notify" ]]; then
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
else
    afplay /System/Library/Sounds/Submarine.aiff 2>/dev/null &
fi

exit 0
