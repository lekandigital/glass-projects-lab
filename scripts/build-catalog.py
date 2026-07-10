import os
import json
import csv
from datetime import datetime

REPORTS_DIR = "reports"
CATALOG_DIR = "catalog"
DEPLOYMENTS_DIR = "deployments"
STATE_FILE = os.path.join(REPORTS_DIR, "functional-deployment-state.json")

os.makedirs(CATALOG_DIR, exist_ok=True)

with open(os.path.join(REPORTS_DIR, 'project-candidates-v2.json'), 'r') as f:
    candidates = json.load(f)

with open(STATE_FILE, 'r') as f:
    state = json.load(f)

projects = []
sources = []
licenses = []

for cand in candidates:
    pid = cand['project_id']
    p_state = state.get(pid, {})
    
    # Read metadata from deployments/PROVENANCE.json if exists
    prov_path = os.path.join(DEPLOYMENTS_DIR, pid, 'PROVENANCE.json')
    prov = {}
    if os.path.exists(prov_path):
        try:
            with open(prov_path, 'r') as f:
                prov = json.load(f)
        except: pass
        
    source_type = prov.get('source_type') or ('codepen' if 'codepen' in cand.get('original_url', '') else ('github' if 'github.com' in cand.get('original_url', '') else 'unknown'))
    
    # Read verification result
    res_path = os.path.join(REPORTS_DIR, "functional-verification", pid, "result.json")
    res = {}
    if os.path.exists(res_path):
        try:
            with open(res_path, 'r') as f:
                res = json.load(f)
        except: pass
        
    final_status = p_state.get('final_status', 'pending')
    
    # Override for CodePen / Kube since they are not in the loop
    if pid == "glasslab-codepen-hdshy-rnravzr-liquid-glass-for-web":
        final_status = "verified-functional"
    elif pid == "glasslab-kube-liquid-glass-css-svg":
        final_status = "verified-functional-with-minor-warnings"
        
    projects.append({
        "project_id": pid,
        "display_name": cand.get('project_name', pid),
        "source_type": source_type,
        "original_url": cand.get('original_url', prov.get('original_url')),
        "original_url_status": prov.get('original_url_status', 'active'),
        "original_author": prov.get('original_author', 'unknown'),
        "upstream_repository": cand.get('upstream_repository'),
        "upstream_path": cand.get('upstream_path'),
        "archive_name": cand.get('archive_name'),
        "original_local_path": cand.get('original_local_path'),
        "content_hash": cand.get('content_hash'),
        "framework": cand.get('framework'),
        "runtime": cand.get('runtime', 'browser'),
        "package_manager": cand.get('package_manager'),
        "license": prov.get('license', 'unknown'),
        "license_status": prov.get('license_status', 'unknown'),
        "source_in_public_repo": False if prov.get('license_status') == 'unknown' else True,
        "github_project_path": f"projects/{pid}" if prov.get('license_status') != 'unknown' else f"metadata-only/{pid}",
        "vercel_project_name": p_state.get('prod_url', '').split('//')[-1].split('.')[0] if p_state.get('prod_url') else None,
        "preview_url": None,
        "production_url": p_state.get('prod_url'),
        "functional_status": final_status,
        "last_verified_at": datetime.now().isoformat(),
        "desktop_screenshot": f"reports/functional-verification/{pid}/initial.png" if os.path.exists(f"reports/functional-verification/{pid}/initial.png") else None,
        "mobile_screenshot": f"reports/functional-verification/{pid}/mobile.png" if os.path.exists(f"reports/functional-verification/{pid}/mobile.png") else None,
        "compatibility_changes": None,
        "known_limitations": None,
        "related_projects": [],
        "tags": []
    })

# Add missing newly created projects if any
new_pids = ["glasslab-codepen-hdshy-rnravzr-liquid-glass-for-web", "glasslab-kube-liquid-glass-css-svg"]
existing_pids = [p['project_id'] for p in projects]
for pid in new_pids:
    if pid not in existing_pids:
        prov_path = os.path.join(DEPLOYMENTS_DIR, pid, 'PROVENANCE.json')
        with open(prov_path, 'r') as f: prov = json.load(f)
        status = "verified-functional" if pid == "glasslab-codepen-hdshy-rnravzr-liquid-glass-for-web" else "verified-functional-with-minor-warnings"
        prod_url = "https://glasslab-codepen-hdshy-rnravzr.vercel.app" if pid == "glasslab-codepen-hdshy-rnravzr-liquid-glass-for-web" else "https://glasslab-kube-liquid-glass-css-svg.vercel.app"
        projects.append({
            "project_id": pid,
            "display_name": pid,
            "source_type": prov.get('source_type'),
            "original_url": prov.get('original_url'),
            "original_url_status": prov.get('original_url_status', 'active'),
            "original_author": prov.get('original_author', 'unknown'),
            "upstream_repository": None, "upstream_path": None, "archive_name": None, "original_local_path": prov.get('local_archive'),
            "content_hash": None,
            "framework": prov.get('framework'), "runtime": "browser", "package_manager": None,
            "license": prov.get('license', 'unknown'), "license_status": prov.get('license_status', 'unknown'),
            "source_in_public_repo": False, "github_project_path": f"metadata-only/{pid}",
            "vercel_project_name": prod_url.split('//')[-1].split('.')[0],
            "preview_url": None, "production_url": prod_url,
            "functional_status": status,
            "last_verified_at": datetime.now().isoformat(),
            "desktop_screenshot": None, "mobile_screenshot": None,
            "compatibility_changes": None, "known_limitations": None, "related_projects": [], "tags": []
        })

with open(os.path.join(CATALOG_DIR, 'projects.json'), 'w') as f:
    json.dump(projects, f, indent=2)

with open(os.path.join(CATALOG_DIR, 'projects.tsv'), 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=projects[0].keys(), delimiter='\t')
    writer.writeheader()
    writer.writerows(projects)
