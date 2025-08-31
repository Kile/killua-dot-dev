#!/bin/bash

echo "Starting Killua Dashboard Backend..."

# Load root .env if present for runtime vars
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

# Ensure local dev hits local upstream unless explicitly overridden
if [ -z "$EXTERNAL_API_BASE_URL" ]; then
    export EXTERNAL_API_BASE_URL="http://127.0.0.1:7650"
fi

# Set reasonable local default for redirect URI if not provided
if [ -z "$DISCORD_REDIRECT_URI" ]; then
    export DISCORD_REDIRECT_URI="http://localhost:5173/auth/callback"
fi

# Validate required OAuth env vars
missing=()
[ -z "$DISCORD_CLIENT_ID" ] && missing+=(DISCORD_CLIENT_ID)
[ -z "$DISCORD_CLIENT_SECRET" ] && missing+=(DISCORD_CLIENT_SECRET)
if [ ${#missing[@]} -ne 0 ]; then
    echo "Error: Missing required env vars: ${missing[*]}"
    echo "Tip: Add them to the repo root .env and re-run."
    exit 1
fi

# Check if Java 17+ is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed. Please install Java 17 or higher."
    exit 1
fi

java_version=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$java_version" -lt 17 ]; then
    echo "Error: Java 17 or higher is required. Current version: $java_version"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "Error: Maven is not installed. Please install Maven."
    exit 1
fi

echo "Java version: $(java -version 2>&1 | head -n 1)"
echo "Maven version: $(mvn -version 2>&1 | head -n 1)"

# Install dependencies
echo "Installing dependencies..."
mvn -q -DskipTests clean install || mvn -DskipTests clean install

# Start the application
echo "Starting Spring Boot application in development mode..."
mvn -q spring-boot:run -Dspring-boot.run.profiles=dev
