#!/bin/bash
# Setup script for Claude Code configuration
# Run this after cloning the repo to ~/.claude/
#
# Usage: bash ~/.claude/scripts/setup.sh

set -e

CLAUDE_DIR="$HOME/.claude"
TEMPLATE="$CLAUDE_DIR/settings.template.json"
OUTPUT="$CLAUDE_DIR/settings.json"

echo "Setting up Claude Code configuration..."

# Check we're in the right directory
if [ ! -f "$TEMPLATE" ]; then
    echo "Error: settings.template.json not found at $TEMPLATE"
    echo "Make sure the repo is cloned to ~/.claude/"
    exit 1
fi

# Warn if not a git repo (user skipped git init steps)
if [ ! -d "$CLAUDE_DIR/.git" ]; then
    echo ""
    echo "Warning: $CLAUDE_DIR is not a git repository."
    echo "You won't be able to receive updates via 'git pull'."
    echo "See README.md Installation section to set up git."
    echo ""
fi

# Generate settings.json from template
if [ -f "$OUTPUT" ]; then
    echo "settings.json already exists."
    echo "  [m] Smart merge template changes (preserves your customizations) (default)"
    echo "  [o] Full overwrite (resets to template defaults)"
    echo "  [s] Skip"
    read -r -p "Choose action [m/o/s]: " response
    case "$response" in
        [Oo])
            node "$CLAUDE_DIR/scripts/merge-settings.js" --overwrite
            ;;
        [Ss])
            echo "Skipping settings.json generation."
            ;;
        *)
            node "$CLAUDE_DIR/scripts/merge-settings.js"
            ;;
    esac
else
    node "$CLAUDE_DIR/scripts/merge-settings.js"
fi

# Make hook scripts executable
if [ -d "$CLAUDE_DIR/scripts/hooks" ]; then
    find "$CLAUDE_DIR/scripts/hooks" -name "*.sh" -exec chmod +x {} \;
fi
[ -d "$CLAUDE_DIR/plugins" ] && find "$CLAUDE_DIR/plugins" -name "*.sh" -exec chmod +x {} \;

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run \`gh auth login\` so gh and git can reach GitHub"
echo "  2. Review ~/.claude/settings.json and adjust permissions as needed"
echo "  3. Start Claude Code in any project directory"
