import os
import json

CATALOG_FILE = "/Users/lekan/Dev/glass-projects-lab/catalog/projects.json"
GALLERY_DIR = "/Users/lekan/Dev/glass-projects-lab/gallery"

def generate_gallery():
    os.makedirs(GALLERY_DIR, exist_ok=True)
    
    with open(CATALOG_FILE, 'r') as f:
        projects = json.load(f)
        
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Glass Projects Lab Gallery</title>
        <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; padding: 2rem; margin: 0; }
            h1 { text-align: center; color: #38bdf8; }
            .header-links { display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; }
            .header-links a { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; }
            .header-links a:hover { color: #38bdf8; text-decoration: underline; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; backdrop-filter: blur(10px); display: flex; flex-direction: column; }
            .card h3 { margin-top: 0; color: #e2e8f0; font-size: 1.2rem; }
            .card p { font-size: 0.9rem; color: #cbd5e1; margin: 0.3rem 0; }
            .card a { color: #38bdf8; text-decoration: none; }
            .card a:hover { text-decoration: underline; }
            .badges { margin-bottom: 1rem; }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-right: 0.5rem; margin-bottom: 0.5rem; }
            .badge-verified { background: #166534; color: #bbf7d0; }
            .badge-failed { background: #991b1b; color: #fecaca; }
            .badge-pending { background: #854d0e; color: #fef08a; }
            .badge-metadata { background: #374151; color: #d1d5db; border: 1px solid #4b5563; }
            .badge-deleted { background: #7f1d1d; color: #fca5a5; }
            .actions { margin-top: auto; padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
            .btn { padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; text-align: center; font-weight: bold; font-size: 0.9rem; }
            .btn-primary { background: #0ea5e9; color: #fff; }
            .btn-primary:hover { background: #0284c7; text-decoration: none; }
            .btn-secondary { background: #334155; color: #fff; }
            .btn-secondary:hover { background: #475569; text-decoration: none; }
            .btn-disabled { background: #1e293b; color: #64748b; cursor: not-allowed; }
        </style>
    </head>
    <body>
        <h1>Glass Projects Lab Gallery</h1>
        
        <div class="header-links">
            <a href="https://github.com/lekandigital/glass-projects-lab">GitHub Repository</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/README.md">README</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/docs/deployments.md">All Deployments</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/docs/references.md">All References</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/THIRD_PARTY_NOTICES.md">Third-Party Notices</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/catalog/licenses.json">License Information</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/docs/verification.md">Verification Methodology</a>
            <a href="https://github.com/lekandigital/glass-projects-lab/blob/main/reports/remaining-failures.md">Known Failures</a>
        </div>
        
        <div class="grid">
    """
    
    for p in projects:
        status = p.get('functional_status', 'pending')
        badge_class = 'badge-pending'
        if 'verified' in status: badge_class = 'badge-verified'
        elif 'broken' in status or 'failed' in status: badge_class = 'badge-failed'
        
        source_in_repo = p.get('source_in_public_repo')
        metadata_badge = '<span class="badge badge-metadata">Metadata Only</span>' if not source_in_repo else ''
        deleted_badge = '<span class="badge badge-deleted">Deleted Source</span>' if p.get('original_url_status') == 'deleted' else ''
        
        demo_btn = ""
        if status in ['verified-functional', 'verified-functional-with-minor-warnings'] and p.get('production_url'):
            demo_btn = f'<a href="{p["production_url"]}" target="_blank" class="btn btn-primary">Live Demo</a>'
        else:
            demo_btn = f'<span class="btn btn-disabled">Not Runnable</span>'
            
        source_url = p.get('original_url') or '#'
        source_text = "Original Source"
        if p.get('original_url_status') == 'deleted':
            source_text = "Original Source (Deleted)"
            
        repo_path = p.get("github_project_path", f"metadata-only/{p['project_id']}")
        repo_link = f"https://github.com/lekandigital/glass-projects-lab/blob/main/{repo_path}/PROJECT.md"
        repo_link_text = "View source and build instructions" if source_in_repo else "View metadata and provenance"
        
        html += f"""
            <div class="card" data-framework="{p.get('framework')}" data-status="{status}" data-source="{p.get('source_type')}">
                <div class="badges">
                    <span class="badge {badge_class}">{status}</span>
                    {metadata_badge}
                    {deleted_badge}
                </div>
                <h3>{p.get('display_name')}</h3>
                <p><strong>Author:</strong> {p.get('original_author')}</p>
                <p><strong>Framework:</strong> {p.get('framework')}</p>
                <p><strong>License:</strong> {p.get('license_status')}</p>
                <p><strong>Last Verified:</strong> {p.get('last_verified_at')[:10] if p.get('last_verified_at') else 'Never'}</p>
                
                <div class="actions">
                    {demo_btn}
                    <a href="{repo_link}" target="_blank" class="btn btn-secondary">{repo_link_text}</a>
                    <a href="{source_url}" target="_blank" class="btn btn-secondary">{source_text}</a>
                </div>
            </div>
        """
        
    html += """
        </div>
    </body>
    </html>
    """
    
    with open(os.path.join(GALLERY_DIR, 'index.html'), 'w') as f:
        f.write(html)
        
    print(f"Gallery generated at {GALLERY_DIR}/index.html")

if __name__ == '__main__':
    generate_gallery()
