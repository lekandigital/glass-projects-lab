import os
import csv
import json

REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"
GALLERY_DIR = "/Users/lekan/Dev/glass-projects-lab/gallery"
STATE_FILE = os.path.join(REPORTS_DIR, "deployment-state.json")

def generate_gallery():
    os.makedirs(GALLERY_DIR, exist_ok=True)
    
    with open(os.path.join(REPORTS_DIR, 'project-candidates.tsv'), 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        candidates = {row['project_name']: row for row in reader}
        
    try:
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)
    except:
        state = {}
        
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
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; backdrop-filter: blur(10px); }
            .card h3 { margin-top: 0; color: #e2e8f0; }
            .card p { font-size: 0.9rem; color: #cbd5e1; margin: 0.5rem 0; }
            .card a { color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 0.5rem; }
            .card a:hover { text-decoration: underline; }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-bottom: 0.5rem; }
            .badge-verified { background: #166534; color: #bbf7d0; }
            .badge-failed { background: #991b1b; color: #fecaca; }
            .badge-pending { background: #854d0e; color: #fef08a; }
        </style>
    </head>
    <body>
        <h1>Glass Projects Lab Gallery</h1>
        <div class="grid">
    """
    
    for project_name, p_state in state.items():
        cand = candidates.get(project_name, {})
        framework = cand.get('framework', 'unknown')
        archive = cand.get('archive_name', 'unknown')
        url = p_state.get('verify_url') or p_state.get('prod_url', '#')
        
        status = p_state.get('verification', 'pending')
        badge_class = 'badge-pending'
        if 'verified' in status: badge_class = 'badge-verified'
        elif 'failed' in status or 'broken' in status or '404' in status: badge_class = 'badge-failed'
        
        html += f"""
            <div class="card">
                <span class="badge {badge_class}">{status}</span>
                <h3>{project_name}</h3>
                <p><strong>Archive:</strong> {archive}</p>
                <p><strong>Framework:</strong> {framework}</p>
                <a href="{url}" target="_blank">View Deployment</a>
            </div>
        """
        
    html += """
        </div>
    </body>
    </html>
    """
    
    with open(os.path.join(GALLERY_DIR, 'index.html'), 'w') as f:
        f.write(html)
        
if __name__ == '__main__':
    generate_gallery()
