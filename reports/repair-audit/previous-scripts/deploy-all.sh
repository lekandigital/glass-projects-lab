#!/bin/bash
# Wrapper to run the python deployment automation
set -e

echo "Starting automated deployments..."
python3 scripts/deploy-all.py
echo "Deployment automation finished."
