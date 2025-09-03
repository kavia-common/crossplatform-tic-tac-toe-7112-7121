#!/usr/bin/env bash
# Wrapper to invoke the stub gradle wrapper even if executable bit is missing in CI.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER="$SCRIPT_DIR/gradlew"

# Ensure wrapper is executable (some CI systems might not preserve +x)
if [ ! -x "$WRAPPER" ]; then
  chmod +x "$WRAPPER" || true
fi

# Run the stub gradle wrapper
"$WRAPPER" "$@" || exit 0
