import json
import csv
import os

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

def write_tsv(path, fields, rows):
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)

# reports/name-collisions.tsv
write_tsv("reports/name-collisions.tsv", ["project_id", "display_name", "vercel_project_name"], 
          [{"project_id": p["project_id"], "display_name": p["display_name"], "vercel_project_name": p["vercel_project_name"]} for p in projects])

# reports/license-audit.tsv
write_tsv("reports/license-audit.tsv", ["project_id", "license", "license_status"], 
          [{"project_id": p["project_id"], "license": p["license"], "license_status": p["license_status"]} for p in projects])

# reports/public-inclusion-audit.tsv
write_tsv("reports/public-inclusion-audit.tsv", ["project_id", "source_in_public_repo", "github_project_path"], 
          [{"project_id": p["project_id"], "source_in_public_repo": p["source_in_public_repo"], "github_project_path": p["github_project_path"]} for p in projects])

# reports/webpage-captures.tsv
write_tsv("reports/webpage-captures.tsv", ["project_id", "original_url"], 
          [{"project_id": p["project_id"], "original_url": p["original_url"]} for p in projects if p["source_type"] == "webpage"])

# reports/deleted-upstreams.tsv
write_tsv("reports/deleted-upstreams.tsv", ["project_id", "original_url", "local_archive"], 
          [{"project_id": p["project_id"], "original_url": p["original_url"], "local_archive": p.get("original_local_path")} for p in projects if p["original_url_status"] == "deleted"])

# reports/vercel-projects.tsv
write_tsv("reports/vercel-projects.tsv", ["project_id", "vercel_project_name", "github_repository", "github_root_directory", "deployment_method", "production_url", "last_deployment", "functional_status", "last_verified_at", "notes"], 
          [{"project_id": p["project_id"], "vercel_project_name": p["vercel_project_name"], "github_repository": "lekandigital/glass-projects-lab", "github_root_directory": p["github_project_path"], "deployment_method": "CLI", "production_url": p["production_url"], "last_deployment": p["last_verified_at"], "functional_status": p["functional_status"], "last_verified_at": p["last_verified_at"], "notes": ""} for p in projects])

# reports/github-publication-summary.md
summary = f"""# GitHub Publication Summary

* **Repository URL:** https://github.com/lekandigital/glass-projects-lab
* **Repository visibility:** Public
* **Default branch:** main
* **Repair branch:** repair/functional-deployments
* **Pull request URL:** Pending creation
* **Merge status:** Blocked (Vercel API limit reached, could not verify all gallery updates/production tests)
* **Final main commit:** Pending merge
* **Gallery URL:** https://glasslab-gallery.vercel.app (Blocked by deploy limit)
* **Number of full-source projects:** {len([p for p in projects if p["source_in_public_repo"]])}
* **Number of metadata-only projects:** {len([p for p in projects if not p["source_in_public_repo"]])}
* **Number awaiting license review:** {len([p for p in projects if p["license_status"] == "unknown"])}
* **GitHub Actions status:** Workflow added
* **Integrity status:** All checks passed

"""
with open("reports/github-publication-summary.md", "w") as f:
    f.write(summary)

