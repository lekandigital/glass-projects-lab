import os
import json
import shutil
import re
import csv
import subprocess

REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"
DEPLOYMENTS_DIR = "/Users/lekan/Dev/glass-projects-lab/deployments"
ORIGINALS_DIR = "/Users/lekan/Dev/glass-projects-lab/originals"

def run_cmd(cmd, cwd):
    result = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.returncode

def copy_dir(src, dst):
    if os.path.exists(dst):
        shutil.rmtree(dst)
    # Use rsync for efficiency and to respect excludes
    cmd = [
        'rsync', '-a',
        '--exclude=.git',
        '--exclude=.vercel',
        '--exclude=node_modules',
        '--exclude=dist',
        '--exclude=build',
        '--exclude=.next',
        f"{src}/",
        f"{dst}/"
    ]
    subprocess.run(cmd)

def convert_esm_imports(js_content):
    # Replace remote ESM imports with standard npm package imports
    replacements = {
        r'https://esm.sh/react-dom/client': 'react-dom/client',
        r'https://esm.sh/react-dom': 'react-dom',
        r'https://esm.sh/react': 'react',
        r'https://esm.sh/@react-three/fiber': '@react-three/fiber',
        r'https://esm.sh/@react-three/drei': '@react-three/drei',
        r'https://esm.sh/three': 'three'
    }
    content = js_content
    for pattern, replacement in replacements.items():
        content = re.sub(r'["\']' + pattern + r'["\']', f"'{replacement}'", content)
    return content

def reconstruct_all():
    os.makedirs(DEPLOYMENTS_DIR, exist_ok=True)
    
    with open(os.path.join(REPORTS_DIR, 'project-candidates-v2.json'), 'r') as f:
        candidates = json.load(f)
        
    for cand in candidates:
        project_id = cand['project_id']
        framework = cand['framework']
        html_is_fragment = cand['html_is_fragment']
        uses_jsx = cand['uses_jsx']
        uses_react = cand['uses_react']
        
        # Skip special regression ones if they are already handled manually,
        # but actually we can handle them automatically or let the script regenerate them.
        # Let's skip apple-liquid-glass and glass-button-css-only if they are manual, or let the script recreate them.
        # Wait, our manual reconstructions are robust, let's keep them if they exist or let the script skip them.
        if project_id in ['glasslab-apple-liquid-glass-1-apple-liquid-glass-src', 'glasslab-glass-button-css-only-1-glass-button-css-only-src']:
            print(f"[{project_id}] Skipping regression test project (manually verified).")
            continue
            
        dest_dir = os.path.join(DEPLOYMENTS_DIR, project_id)
        print(f"[{project_id}] Reconstructing project (Type: {framework}, Fragment: {html_is_fragment})...")
        
        # Determine strategy
        if cand['requires_workspace_context']:
            # Monorepo strategy: copy the workspace root
            print(f"[{project_id}] Copying monorepo workspace context...")
            copy_dir(cand['workspace_root'], dest_dir)
            
        elif html_is_fragment or framework == 'html-fragment' or cand['source_type'] in ['codepen', 'jsfiddle']:
            # Fragment reconstruction strategy
            os.makedirs(dest_dir, exist_ok=True)
            upstream_dir = os.path.join(dest_dir, 'upstream')
            os.makedirs(upstream_dir, exist_ok=True)
            
            # Copy all files from candidate root to upstream
            for name in os.listdir(cand['candidate_root']):
                src_path = os.path.join(cand['candidate_root'], name)
                dst_path = os.path.join(upstream_dir, name)
                if os.path.isdir(src_path):
                    if name not in ['node_modules', '.git', 'dist', 'build']:
                        shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
                else:
                    shutil.copy2(src_path, dst_path)
            
            # Load original files
            orig_html = ""
            html_path = os.path.join(upstream_dir, 'index.html')
            if os.path.exists(html_path):
                with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
                    orig_html = f.read()
                    
            orig_css = ""
            css_name = 'style.css' if 'style.css' in os.listdir(upstream_dir) else ('styles.css' if 'styles.css' in os.listdir(upstream_dir) else '')
            if css_name:
                with open(os.path.join(upstream_dir, css_name), 'r', encoding='utf-8', errors='ignore') as f:
                    orig_css = f.read()
                    
            orig_js = ""
            js_name = 'script.js' if 'script.js' in os.listdir(upstream_dir) else ('index.js' if 'index.js' in os.listdir(upstream_dir) else '')
            if js_name:
                with open(os.path.join(upstream_dir, js_name), 'r', encoding='utf-8', errors='ignore') as f:
                    orig_js = f.read()
            
            if uses_jsx or uses_react:
                # JSX / React Vite reconstruction
                print(f"[{project_id}] Reconstructing as React/Vite project...")
                
                # Write package.json
                pkg_data = {
                    "name": project_id,
                    "private": True,
                    "version": "1.0.0",
                    "type": "module",
                    "scripts": {
                        "dev": "vite",
                        "build": "vite build",
                        "preview": "vite preview"
                    },
                    "dependencies": {
                        "react": "^18.2.0",
                        "react-dom": "^18.2.0",
                        "three": "^0.150.0",
                        "@react-three/fiber": "^8.12.0",
                        "@react-three/drei": "^9.56.0"
                    },
                    "devDependencies": {
                        "@vitejs/plugin-react": "^4.0.0",
                        "vite": "^4.3.0"
                    }
                }
                with open(os.path.join(dest_dir, 'package.json'), 'w') as f:
                    json.dump(pkg_data, f, indent=2)
                    
                # Write vite.config.js
                vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
})
"""
                with open(os.path.join(dest_dir, 'vite.config.js'), 'w') as f:
                    f.write(vite_config)
                    
                # Create src
                os.makedirs(os.path.join(dest_dir, 'src'), exist_ok=True)
                
                # Write src/style.css
                with open(os.path.join(dest_dir, 'src', 'style.css'), 'w') as f:
                    f.write(orig_css)
                    
                # Write src/main.jsx (with esm imports converted)
                converted_js = convert_esm_imports(orig_js)
                with open(os.path.join(dest_dir, 'src', 'main.jsx'), 'w') as f:
                    f.write(converted_js)
                    
                # Write index.html
                # Check if root is present
                root_div = ""
                if 'id="root"' not in orig_html and "id='root'" not in orig_html:
                    root_div = '\n  <div id="root"></div>'
                
                # Remote stylesheets and scripts
                remote_links = ""
                if cand['remote_stylesheets']:
                    for url in cand['remote_stylesheets'].split(','):
                        remote_links += f'\n  <link rel="stylesheet" href="{url}">'
                remote_scripts_tags = ""
                if cand['remote_scripts']:
                    for url in cand['remote_scripts'].split(','):
                        remote_scripts_tags += f'\n  <script src="{url}"></script>'
                        
                wrapper_html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{cand['display_name']}</title>{remote_links}
  <link rel="stylesheet" href="./src/style.css">
</head>
<body>
  {orig_html}{root_div}{remote_scripts_tags}
  <script type="module" src="./src/main.jsx"></script>
</body>
</html>
"""
                with open(os.path.join(dest_dir, 'index.html'), 'w') as f:
                    f.write(wrapper_html)
                    
            else:
                # Plain CSS and HTML fragment reconstruction
                print(f"[{project_id}] Reconstructing as static HTML/CSS project...")
                
                # Write style.css
                if css_name:
                    with open(os.path.join(dest_dir, 'style.css'), 'w') as f:
                        f.write(orig_css)
                
                # Write script.js
                if js_name:
                    with open(os.path.join(dest_dir, 'script.js'), 'w') as f:
                        f.write(orig_js)
                
                # Remote stylesheets and scripts
                remote_links = ""
                if cand['remote_stylesheets']:
                    for url in cand['remote_stylesheets'].split(','):
                        remote_links += f'\n  <link rel="stylesheet" href="{url}">'
                remote_scripts_tags = ""
                if cand['remote_scripts']:
                    for url in cand['remote_scripts'].split(','):
                        remote_scripts_tags += f'\n  <script src="{url}"></script>'
                
                local_css_link = '\n  <link rel="stylesheet" href="./style.css">' if css_name else ''
                local_js_script = '\n  <script type="module" src="./script.js"></script>' if js_name else ''
                
                wrapper_html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{cand['display_name']}</title>{remote_links}{local_css_link}
</head>
<body>
  {orig_html}{remote_scripts_tags}{local_js_script}
</body>
</html>
"""
                with open(os.path.join(dest_dir, 'index.html'), 'w') as f:
                    f.write(wrapper_html)
                    
        else:
            # Standalone candidate root strategy
            print(f"[{project_id}] Copying standalone application...")
            copy_dir(cand['candidate_root'], dest_dir)

    print("Reconstruction finished successfully.")

if __name__ == '__main__':
    reconstruct_all()
