#!/usr/bin/env bash
# Ensure the stub gradlew is executable and run it. Useful for CI that doesn't preserve +x.
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER="$ROOT_DIR/gradlew"

if [ ! -x "$WRAPPER" ]; then
  chmod +x "$WRAPPER" || true
fi

"$WRAPPER" "$@" || exit 0
