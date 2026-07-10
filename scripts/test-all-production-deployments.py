import json
import os
import urllib.request
import urllib.error

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

errors = 0
for p in projects:
    if p["functional_status"].startswith("verified-functional") and p.get("production_url"):
        url = p["production_url"]
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            urllib.request.urlopen(req, timeout=5)
            print(f"PASS: {url}")
        except Exception as e:
            print(f"FAIL: {url} ({e})")
            errors += 1

if errors > 0:
    print(f"Validation failed with {errors} errors.")
    exit(1)
else:
    print("All production deployments passed.")
    exit(0)
