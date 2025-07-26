#!/bin/bash

# Script to run ensure-newline.sh on staged text files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENSURE_NEWLINE_SCRIPT="$SCRIPT_DIR/ensure-newline.sh"

# Check if ensure-newline.sh exists
if [[ ! -x "$ENSURE_NEWLINE_SCRIPT" ]]; then
    echo "Error: ensure-newline.sh not found or not executable at $ENSURE_NEWLINE_SCRIPT" >&2
    exit 1
fi

echo "Checking staged files..."

# Get staged files (including added, modified, and renamed)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=AMR | grep -v "/node_modules/" | grep -v "/.git/")

if [[ -z "$STAGED_FILES" ]]; then
    echo "No files are staged for commit."
    exit 0
fi

echo "Found staged files:"
echo "$STAGED_FILES"
echo ""

# Filter only existing files (in case of deletions)
EXISTING_FILES=""
while IFS= read -r file; do
    if [[ -f "$file" ]]; then
        EXISTING_FILES+="$file"$'\n'
    fi
done <<< "$STAGED_FILES"

if [[ -z "$EXISTING_FILES" ]]; then
    echo "No existing staged files to process."
    exit 0
fi

echo "Running ensure-newline.sh on staged files..."
echo ""

# Run ensure-newline.sh on the filtered files (it will handle text file detection)
# Capture files that were modified
MODIFIED_FILES=$(echo "$EXISTING_FILES" | "$ENSURE_NEWLINE_SCRIPT" | grep "Adding newline to:" | sed 's/Adding newline to: //')

# Re-stage any files that were modified
if [[ -n "$MODIFIED_FILES" ]]; then
    echo ""
    echo "Re-staging modified files:"
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            echo "  git add $file"
            git add "$file"
        fi
    done <<< "$MODIFIED_FILES"
else
    echo "No files were modified."
fi
