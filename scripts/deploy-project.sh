#!/bin/bash
# Minimal standalone script to deploy a project to Vercel
if [ -z "$1" ]; then
  echo "Usage: $0 <project-dir>"
  exit 1
fi

PROJECT_DIR=$1
cd "$PROJECT_DIR" || exit 1

vercel deploy --prod --yes
