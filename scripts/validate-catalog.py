import json
import os

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

for p in projects:
    assert "project_id" in p
    assert "functional_status" in p

print("Catalog validated successfully.")
