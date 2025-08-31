#!/bin/bash

echo "Starting Killua Dashboard Frontend..."

# Load root .env if present for build-time/dev vars
ROOT_ENV_FILE="$(cd "$(dirname "$0")"/.. && pwd)/.env"
if [ -f "$ROOT_ENV_FILE" ]; then
    echo "Loading env from $ROOT_ENV_FILE"
    set -a
    # shellcheck disable=SC1090
    . "$ROOT_ENV_FILE"
    set +a
else
    echo "Warning: .env not found at repo root. Proceeding without it."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "Error: Node.js 18 or higher is required. Current version: $node_version"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm."
    exit 1
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Start the development server
echo "Starting development server..."
npm run dev
