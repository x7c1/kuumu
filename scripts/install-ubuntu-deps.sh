#!/bin/bash

# Install common Ubuntu system dependencies
set -euo pipefail

echo "Installing common Ubuntu system dependencies..."

sudo apt-get update
sudo apt-get install -y \
    build-essential \
    curl \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev \
    jq

echo "Common Ubuntu dependencies installed successfully!"
