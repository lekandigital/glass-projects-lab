#!/bin/bash
# Minimal standalone script to build a project locally
if [ -z "$1" ]; then
  echo "Usage: $0 <project-dir>"
  exit 1
fi

PROJECT_DIR=$1
cd "$PROJECT_DIR" || exit 1

if [ -f "package-lock.json" ]; then
  npm ci
  npm run build
elif [ -f "yarn.lock" ]; then
  yarn install
  yarn build
elif [ -f "pnpm-lock.yaml" ]; then
  pnpm install
  pnpm run build
elif [ -f "bun.lock" ] || [ -f "bun.lockb" ]; then
  bun install
  bun run build
else
  # Fallback
  npm install
  npm run build
fi
