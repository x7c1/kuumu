#!/bin/bash
# scripts/update-pr.sh

pr_number="$1"
title="$2"
description="$3"
labels="$4"  # optional

# Check required arguments
if [ -z "$pr_number" ] || [ -z "$title" ] || [ -z "$description" ]; then
    echo "Usage: $0 <pr_number> <title> <description> [labels]"
    exit 1
fi

# Check title length limit (60 characters)
if [ ${#title} -gt 60 ]; then
    echo "Error: Title exceeds 60 characters (${#title}): $title"
    exit 1
fi

# Check for unnecessary content in description
if echo "$description" | grep -q "Files Added"; then
    echo "Error: Description contains unnecessary 'Files Added' section - please remove it"
    exit 1
fi

# Update PR
gh pr edit "$pr_number" --title "$title" --body "$description"
if [ -n "$labels" ]; then
    gh pr edit "$pr_number" --add-label "$labels"
fi

echo "PR #$pr_number updated successfully"
echo "Title: $title (${#title} characters)"
