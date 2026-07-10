import os
import sys
import subprocess

def run(cmd):
    print(f"> {cmd}")
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"FAILED: {cmd}")
        sys.exit(1)

projects = [
    "7-Aero-Stylesheet",
    "archisvaze-liquid-glass",
    "liquid-glass-js"
]

for p in projects:
    print(f"=== DEPLOYING {p} ===")
    run(f".venv/bin/python scripts/deploy-project.py {p}")
    run(f".venv/bin/python scripts/record-golden-master.py {p} verified-functional")
