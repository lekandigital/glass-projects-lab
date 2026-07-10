#!/bin/bash
set -e

DIR=$1
PORT=$2
RECIPE=$3

# Read from recipe
PACKAGE_MANAGER=$(jq -r '.package_manager // empty' "$RECIPE")
INSTALL_CMD=$(jq -r '.install_command // empty' "$RECIPE")
BUILD_CMD=$(jq -r '.build_command // empty' "$RECIPE")
OUT_DIR=$(jq -r '.output_directory // "."' "$RECIPE")

echo "Building in $DIR..."
cd "$DIR"

if [ -n "$INSTALL_CMD" ]; then
  eval "$INSTALL_CMD"
fi

if [ -n "$BUILD_CMD" ]; then
  eval "$BUILD_CMD"
fi

echo "Serving $OUT_DIR on port $PORT..."
python3 -m http.server $PORT -d "$OUT_DIR" &
