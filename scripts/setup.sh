#!/bin/bash
# Setup script for Claude Code configuration
# Run this after cloning the repo to ~/.claude/
#
# Usage: bash ~/.claude/scripts/setup.sh

set -e

CLAUDE_DIR="$HOME/.claude"
TEMPLATE="$CLAUDE_DIR/settings.template.json"
OUTPUT="$CLAUDE_DIR/settings.json"
SECRETS_EXAMPLE="$CLAUDE_DIR/.secrets.example"
SECRETS_FILE="$CLAUDE_DIR/.secrets"

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
            sed "s|__HOME__|$HOME|g" "$TEMPLATE" > "$OUTPUT"
            echo "Generated settings.json (full overwrite) with paths for: $HOME"
            ;;
        [Ss])
            echo "Skipping settings.json generation."
            ;;
        *)
            node "$CLAUDE_DIR/scripts/merge-settings.js"
            ;;
    esac
else
    sed "s|__HOME__|$HOME|g" "$TEMPLATE" > "$OUTPUT"
    echo "Generated settings.json with paths for: $HOME"
fi

# Setup secrets file
if [ ! -f "$SECRETS_FILE" ] && [ -f "$SECRETS_EXAMPLE" ]; then
    cp "$SECRETS_EXAMPLE" "$SECRETS_FILE"
    chmod 600 "$SECRETS_FILE"
    echo "Created .secrets from template (permissions: 600). Edit it with your tokens:"
    echo "  $SECRETS_FILE"
elif [ -f "$SECRETS_FILE" ]; then
    chmod 600 "$SECRETS_FILE"
fi

# Make hook scripts executable
if [ -d "$CLAUDE_DIR/scripts/hooks" ]; then
    find "$CLAUDE_DIR/scripts/hooks" -name "*.sh" -exec chmod +x {} \;
fi
[ -d "$CLAUDE_DIR/plugins" ] && find "$CLAUDE_DIR/plugins" -name "*.sh" -exec chmod +x {} \;

# Install notification sounds. They ship with the repo; regenerate any that are
# missing so a partial checkout still ends up with a working Stop chime.
SOUNDS_DIR="$CLAUDE_DIR/assets/sounds"
missing_sounds=false
for sound in done notify; do
    [ -f "$SOUNDS_DIR/$sound.wav" ] || missing_sounds=true
done

if [ "$missing_sounds" = true ]; then
    if command -v node &>/dev/null && [ -f "$SOUNDS_DIR/generate.js" ]; then
        node "$SOUNDS_DIR/generate.js" >/dev/null && echo "Generated missing notification sounds in assets/sounds/"
    else
        echo "Warning: notification sounds missing from $SOUNDS_DIR and cannot be generated (node not found)."
    fi
else
    echo "Notification sounds installed: $SOUNDS_DIR"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run \`gh auth login\` (or edit ~/.claude/.secrets with your GH_TOKEN)"
echo "  2. Review ~/.claude/settings.json and adjust permissions as needed"
echo "  3. Start Claude Code in any project directory"
