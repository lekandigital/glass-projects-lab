import json

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

verified_count = len([p for p in projects if p.get("functional_status", "").startswith("verified-functional")])

readme = f"""# Glass Projects Lab

A verified and attributed collection of Liquid Glass, Aero, glassmorphism, CSS, SVG, WebGL, React, Vue, and browser-interface experiments.

[View the live gallery](https://glasslab-gallery.vercel.app) ·
[Browse the source repository](https://github.com/lekandigital/glass-projects-lab) ·
[View all original references](./catalog/sources.json) ·
[View deployment status](./reports/final-functional-summary.md)

[![Live Gallery](https://img.shields.io/badge/Live-Gallery-0ea5e9?style=flat-square)](https://glasslab-gallery.vercel.app)
[![Verify Deployments](https://github.com/lekandigital/glass-projects-lab/actions/workflows/verify-deployments.yml/badge.svg)](https://github.com/lekandigital/glass-projects-lab/actions/workflows/verify-deployments.yml)
[![Validate Catalog](https://github.com/lekandigital/glass-projects-lab/actions/workflows/validate-catalog.yml/badge.svg)](https://github.com/lekandigital/glass-projects-lab/actions/workflows/validate-catalog.yml)
![Catalog Size](https://img.shields.io/badge/Catalog_Projects-{len(projects)}-blue)
![Verified Deployments](https://img.shields.io/badge/Verified_Deployments-{verified_count}-brightgreen)

[![Glass Projects Lab gallery](./docs/images/gallery-preview.png)](https://glasslab-gallery.vercel.app)

## Explore

- [Live gallery](https://glasslab-gallery.vercel.app)
- [View every deployment](./docs/deployments.md)
- [All projects](./catalog/projects.json)
- [Original sources and references](./catalog/sources.json)
- [Browse all original references](./docs/references.md)
- [License information](./catalog/licenses.json)
- [Third-party notices](./THIRD_PARTY_NOTICES.md)
- [Deployment status](./reports/final-functional-summary.md)
- [Known failures and limitations](./reports/remaining-failures.md)
- [How verification works](./docs/verification.md)
- [How projects are reconstructed](./docs/reconstruction.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)

## Projects

| Project | Original source | Author | Framework | License | Live demo | Status |
|---|---|---|---|---|---|---|
"""

for p in projects:
    pid = p["project_id"]
    path = p.get("github_project_path", f"metadata-only/{pid}")
    proj_link = f"[{pid}](./{path}/PROJECT.md)"
    
    orig = p.get("original_url")
    orig_link = f"[Source]({orig})" if orig else "Unknown"
    
    author = p.get("original_author") or "Unknown"
    fw = p.get("framework") or "Unknown"
    lic = p.get("license_status") or "Unknown"
    
    status = p.get("functional_status", "pending")
    
    # Clean status string
    status_label = status.replace("-", " ").capitalize()
    
    if status in ["verified-functional", "verified-functional-with-minor-warnings"] and p.get("production_url"):
        demo_link = f"[Live demo]({p['production_url']})"
    else:
        demo_link = status_label
        
    readme += f"| {proj_link} | {orig_link} | {author} | {fw} | {lic} | {demo_link} | {status_label} |\n"

with open("README.md", "w") as f:
    f.write(readme)

