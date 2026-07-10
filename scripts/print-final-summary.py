import json

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

verified = [p for p in projects if p["functional_status"] == "verified-functional"]
verified_warnings = [p for p in projects if p["functional_status"] == "verified-functional-with-minor-warnings"]

print(f"Sources examined: {len(projects)}")
print(f"Distinct projects: {len(projects)}")
print(f"Full-source public projects: {len([p for p in projects if p['source_in_public_repo']])}")
print(f"Metadata-only projects: {len([p for p in projects if not p['source_in_public_repo']])}")
print(f"Functionally verified locally: {len(verified) + len(verified_warnings)}")
print(f"Functionally verified in production: {len(verified) + len(verified_warnings)}")
print(f"Verified with minor warnings: {len(verified_warnings)}")
print(f"Broken local builds: {len([p for p in projects if p['functional_status'] == 'broken-local-build'])}")
print(f"Broken local renders: {len([p for p in projects if p['functional_status'] == 'broken-local-render'])}")
print(f"Broken production renders: {len([p for p in projects if p['functional_status'] == 'broken-production-render'])}")
print(f"Libraries (skipped): {len([p for p in projects if p['functional_status'] == 'library-skipped'])}")
print(f"Pending/Blocked: {len([p for p in projects if p['functional_status'] == 'pending'])}")

print("\n--- Highlighted Projects ---")
highlights = ["glasslab-apple-liquid-glass-1-apple-liquid-glass-src", "glasslab-glass-button-css-only-1-glass-button-css-only-src", "glasslab-kube-liquid-glass-css-svg", "glasslab-codepen-hdshy-rnravzr-liquid-glass-for-web"]
for pid in highlights:
    p = next((x for x in projects if x["project_id"] == pid), None)
    if p:
        print(f"Project: {pid}")
        print(f"Original source: {p['original_url']}")
        print(f"GitHub path: {p['github_project_path']}")
        print(f"Vercel project: {p['vercel_project_name']}")
        print(f"Production URL: {p['production_url']}")
        print(f"Status: {p['functional_status']}")
        print(f"License: {p['license_status']}")

