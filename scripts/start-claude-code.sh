#!/bin/bash

# Fix volume mount permissions first
sudo chown -R developer:developer /home/developer/.npm-global 2>/dev/null || true

# Check if user-level Claude Code is installed
if [ ! -d "/home/developer/.npm-global/lib/node_modules/@anthropic-ai/claude-code" ]; then
    echo "First startup detected. Installing Claude Code to user directory..."

    # Install Claude Code
    npm install -g @anthropic-ai/claude-code
    echo "Installation completed."
else
    echo "Claude Code is already installed. Checking for updates..."

    # Update Claude Code to latest version
    npm update -g @anthropic-ai/claude-code
    echo "Update check completed."
fi

# Start Claude Code
exec claude
