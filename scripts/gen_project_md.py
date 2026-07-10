import json
import os

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

for p in projects:
    pid = p["project_id"]
    path = p.get("github_project_path", f"metadata-only/{pid}")
    os.makedirs(path, exist_ok=True)
    
    status_label = p.get("functional_status", "pending").replace("-", " ").capitalize()
    live_demo = f"[Live demo]({p['production_url']})" if p.get("production_url") else status_label
    source_in_repo = p.get("source_in_public_repo", False)
    
    content = f"""# {p.get("display_name", pid)}

[Original source]({p.get('original_url') or '#'}) ·
{live_demo} ·
[Main gallery](https://glasslab-gallery.vercel.app) ·
[Repository home](https://github.com/lekandigital/glass-projects-lab)

## Overview
- **Author:** {p.get("original_author", "Unknown")}
- **Framework:** {p.get("framework", "Unknown")}
- **License:** {p.get("license", "Unknown")}
- **Verification Status:** {status_label}

## Provenance
This project was identified as `{p.get('source_type', 'unknown')}`.
"""
    if source_in_repo:
        content += "\nThis project is included in the public repository with full source code because its license permits redistribution.\n"
    else:
        content += "\nThis project is included as metadata-only because its original license is unknown or restricts redistribution.\n"
        
    with open(f"{path}/PROJECT.md", "w") as f:
        f.write(content)
