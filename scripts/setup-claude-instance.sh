#!/bin/bash

if [ -z "$INSTANCE" ]; then
    echo "Error: INSTANCE environment variable is required"
    echo "Usage: INSTANCE=frontend make claude"
    exit 1
fi

echo "Setting up Claude instance: $INSTANCE"

# Create directories
mkdir -p claude.local/shared
mkdir -p claude.local/${INSTANCE}

# Create bash history file if it doesn't exist
touch claude.local/${INSTANCE}/.bash_history

# Create shared config if it doesn't exist
if [ ! -f claude.local/shared/.claude.json ]; then
    echo "{}" > claude.local/shared/.claude.json
fi

echo "Instance $INSTANCE setup complete"
echo "  - Shared config: claude.local/shared/"
echo "  - Instance history: claude.local/${INSTANCE}/.bash_history"