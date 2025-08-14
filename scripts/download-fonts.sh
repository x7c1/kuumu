#!/bin/bash
set -e

SCRIPT_DIR="$(dirname "$0")"
CONFIG_FILE="$SCRIPT_DIR/font-config.json"
FONT_DIR="frontend/apps/layouter-demo/public/fonts"

# Check if VITE_KUUMU_FONT_PATH is set
if [ -z "$VITE_KUUMU_FONT_PATH" ]; then
  echo "Error: VITE_KUUMU_FONT_PATH environment variable is not set"
  exit 1
fi

# Extract font filename from path
FONT_NAME="$(basename "$VITE_KUUMU_FONT_PATH")"
echo "Target font: $FONT_NAME"
echo "Reading font configuration..."

# Find matching font in config by name
FONT_CONFIG=$(jq --arg name "$FONT_NAME" '.fonts[] | select(.name == $name)' "$CONFIG_FILE")

if [ -z "$FONT_CONFIG" ]; then
  echo "Error: No font found with name '$FONT_NAME' in font-config.json"
  echo "Available fonts:"
  jq -r '.fonts[] | "  - \(.name)"' "$CONFIG_FILE"
  exit 1
fi

ZIP_URL=$(echo "$FONT_CONFIG" | jq -r '.zipUrl')
PATH_IN_ZIP=$(echo "$FONT_CONFIG" | jq -r '.pathInZip')

# Download the matching font
mkdir -p "$FONT_DIR"

echo "Downloading font archive..."
TEMP_ZIP=$(mktemp).zip
curl -L -o "$TEMP_ZIP" "$ZIP_URL"

echo "Extracting font: $FONT_NAME"
unzip -p "$TEMP_ZIP" "$PATH_IN_ZIP" > "$FONT_DIR/$FONT_NAME"

# Cleanup
rm "$TEMP_ZIP"
echo "Font downloaded successfully: $FONT_NAME"
