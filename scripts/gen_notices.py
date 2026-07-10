import json

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

licenses = []
for p in projects:
    lic_status = p.get("license_status", "unknown")
    if lic_status not in [l["license_status"] for l in licenses]:
        licenses.append({
            "license_status": lic_status,
            "description": "Unknown or custom license" if lic_status == "unknown" else "Permissive license"
        })

with open("catalog/licenses.json", "w") as f:
    json.dump(licenses, f, indent=2)

tpn = """# Third-Party Notices

This repository contains code, assets, and concepts derived from various third-party sources. We acknowledge the original authors and their respective licenses.

## Acknowledged Authors & Sources
"""
authors = sorted(list(set([p.get("original_author") for p in projects if p.get("original_author")])))
for a in authors:
    if a != "Unknown":
        tpn += f"- {a}\n"

tpn += "\nFor a full list of sources, see `catalog/sources.json`.\n"

with open("THIRD_PARTY_NOTICES.md", "w") as f:
    f.write(tpn)
