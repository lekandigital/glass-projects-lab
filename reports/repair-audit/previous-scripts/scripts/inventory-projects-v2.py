import os
import json
import hashlib
import csv
import re

ORIGINALS_DIR = "/Users/lekan/Dev/glass-projects-lab/originals"
REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"

def hash_directory(directory):
    hasher = hashlib.sha256()
    for root, dirs, files in os.walk(directory):
        for name in sorted(files):
            if name.startswith('.'): continue
            filepath = os.path.join(root, name)
            try:
                stat = os.stat(filepath)
                hasher.update(f"{name}:{stat.st_size}".encode('utf-8'))
            except:
                pass
    return hasher.hexdigest()

def sanitize_name(name):
    name = name.lower()
    name = re.sub(r'[^a-z0-9-]', '-', name)
    name = re.sub(r'-+', '-', name)
    return name.strip('-')

def is_complete_html(content):
    content_lower = content.lower()
    has_doctype = "<!doctype" in content_lower
    has_html = "<html" in content_lower
    has_body = "<body" in content_lower
    has_head = "<head" in content_lower
    if has_doctype or (has_html and has_body) or (has_html and has_head):
        return True
    return False

def analyze_file_content(filepath):
    """Analyze file content for various features like jsx, ts, webgl, etc."""
    results = {
        'uses_jsx': False, 'uses_ts': False, 'uses_tsx': False,
        'uses_react': False, 'uses_vue': False, 'uses_svelte': False,
        'uses_scss': False, 'uses_less': False, 'uses_pug': False,
        'uses_webgl': False, 'uses_canvas': False, 'uses_svg_filters': False,
        'remote_scripts': [], 'remote_stylesheets': []
    }
    
    ext = os.path.splitext(filepath)[1].lower()
    if ext in ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.vue', '.svelte']:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                content_lower = content.lower()
                
                # Check for framework keywords and imports
                if 'react' in content_lower or 'reactdom' in content_lower or 'usememo' in content_lower or '@react-three' in content_lower:
                    results['uses_react'] = True
                if 'vue' in content_lower or 'v-model' in content_lower:
                    results['uses_vue'] = True
                if 'svelte' in content_lower:
                    results['uses_svelte'] = True
                
                # Check for syntax types
                if ext == '.ts': results['uses_ts'] = True
                if ext == '.tsx':
                    results['uses_tsx'] = True
                    results['uses_react'] = True
                if ext == '.jsx':
                    results['uses_jsx'] = True
                    results['uses_react'] = True
                
                # Regex for JSX inside .js files
                if ext == '.js':
                    # Look for JSX tags e.g. <mesh or <div ... > or return ( ... <
                    # A basic check: tags like <mesh, <Canvas, <div, etc. followed by closing
                    if re.search(r'</[a-zA-Z0-9]+>', content) or re.search(r'<[A-Z][a-zA-Z0-9]*\s*/?>', content) or re.search(r'return\s*\(\s*<', content):
                        results['uses_jsx'] = True
                        results['uses_react'] = True
                
                # Check for styling preprocessors
                if ext == '.scss' or 'scss' in content_lower: results['uses_scss'] = True
                if ext == '.less': results['uses_less'] = True
                if ext == '.pug': results['uses_pug'] = True
                
                # Graphics
                if 'webgl' in content_lower or 'three' in content_lower or 'renderer' in content_lower or 'gl_position' in content_lower:
                    results['uses_webgl'] = True
                if '<canvas' in content_lower or 'canvas' in content_lower:
                    results['uses_canvas'] = True
                if 'feimage' in content_lower or 'fedisplacementmap' in content_lower or 'feturbulence' in content_lower or 'filter id="svgmode"' in content_lower or 'filter id="glass' in content_lower:
                    results['uses_svg_filters'] = True
                
                # Remote ESM imports or script tags
                # Remote scripts in html
                if ext == '.html':
                    scripts = re.findall(r'<script\s+[^>]*src=["\'](http[^"\']+)["\']', content, re.IGNORECASE)
                    results['remote_scripts'].extend(scripts)
                    links = re.findall(r'<link\s+[^>]*rel=["\']stylesheet["\']\s+[^>]*href=["\'](http[^"\']+)["\']', content, re.IGNORECASE)
                    results['remote_stylesheets'].extend(links)
                
                # Remote imports in js/ts
                imports = re.findall(r'import\s+.*?from\s+["\'](http[^"\']+)["\']', content)
                results['remote_scripts'].extend(imports)
        except Exception as e:
            pass
            
    return results

def determine_source_type_and_url(archive_name):
    archive_lower = archive_name.lower()
    if 'codepen' in archive_lower:
        return 'codepen', 'https://codepen.io/'
    if 'jsfiddle' in archive_lower:
        return 'jsfiddle', 'https://jsfiddle.net/'
    if 'kube' in archive_lower:
        return 'saved-webpage', 'https://kube.io/'
    # Default is github or archive
    return 'github', 'https://github.com/lekandigital/glass-projects-lab'

def main():
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    candidates = []
    duplicates = []
    non_runnable = []
    
    archive_hashes = {}
    project_names = {}
    
    # First pass to find duplicates
    for archive_name in os.listdir(ORIGINALS_DIR):
        archive_root = os.path.join(ORIGINALS_DIR, archive_name)
        if not os.path.isdir(archive_root): continue
        
        dir_hash = hash_directory(archive_root)
        if dir_hash in archive_hashes:
            duplicates.append({
                'archive_name': archive_name,
                'duplicate_of': archive_hashes[dir_hash],
                'reason': 'Exact archive directory duplicate'
            })
            continue
        archive_hashes[dir_hash] = archive_name

    # Second pass: search candidates
    for archive_name in os.listdir(ORIGINALS_DIR):
        archive_root = os.path.join(ORIGINALS_DIR, archive_name)
        if not os.path.isdir(archive_root): continue
        
        # Check if it was marked duplicate
        is_dup = False
        for d in duplicates:
            if d['archive_name'] == archive_name:
                is_dup = True
                break
        if is_dup: continue
        
        # Determine source url
        source_type, source_url = determine_source_type_and_url(archive_name)
        
        # Search candidate roots
        for root, dirs, files in os.walk(archive_root):
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if '.git' in dirs: dirs.remove('.git')
            if 'dist' in dirs: dirs.remove('dist')
            if 'build' in dirs: dirs.remove('build')
            
            is_pkg = 'package.json' in files
            is_html = 'index.html' in files
            
            if is_pkg or is_html:
                # This root is a candidate
                candidate_root = root
                
                # Check workspace context
                requires_workspace = False
                workspace_root = candidate_root
                
                # Look upwards for pnpm-workspace.yaml or package.json that defines workspaces
                p = root
                while p != archive_root:
                    p = os.path.dirname(p)
                    if 'pnpm-workspace.yaml' in os.listdir(p) or ('package.json' in os.listdir(p) and 'workspaces' in open(os.path.join(p, 'package.json'), errors='ignore').read()):
                        workspace_root = p
                        requires_workspace = True
                        break
                
                # Analyze candidate files
                candidate_analysis = {
                    'uses_jsx': False, 'uses_ts': False, 'uses_tsx': False,
                    'uses_react': False, 'uses_vue': False, 'uses_svelte': False,
                    'uses_scss': False, 'uses_less': False, 'uses_pug': False,
                    'uses_webgl': False, 'uses_canvas': False, 'uses_svg_filters': False,
                    'remote_scripts': [], 'remote_stylesheets': []
                }
                
                css_files = []
                script_files = []
                
                for r, d, f in os.walk(candidate_root):
                    if 'node_modules' in d: d.remove('node_modules')
                    if '.git' in d: d.remove('.git')
                    if 'dist' in d: d.remove('dist')
                    if 'build' in d: d.remove('build')
                    
                    for name in f:
                        if name.startswith('.'): continue
                        filepath = os.path.join(r, name)
                        rel_file = os.path.relpath(filepath, candidate_root)
                        
                        ext = os.path.splitext(name)[1].lower()
                        if ext in ['.css', '.scss', '.sass', '.less']:
                            css_files.append(rel_file)
                        if ext in ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte']:
                            script_files.append(rel_file)
                            
                        # Analyze content
                        file_results = analyze_file_content(filepath)
                        for k in candidate_analysis:
                            if isinstance(candidate_analysis[k], list):
                                candidate_analysis[k].extend(file_results[k])
                            else:
                                candidate_analysis[k] = candidate_analysis[k] or file_results[k]
                
                # HTML Complete vs Fragment check
                html_is_complete = False
                html_is_fragment = False
                if is_html:
                    html_path = os.path.join(candidate_root, 'index.html')
                    try:
                        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
                            html_content = f.read()
                            if is_complete_html(html_content):
                                html_is_complete = True
                            else:
                                html_is_fragment = True
                    except:
                        pass
                
                # Framework, package manager, and lockfile
                framework = 'static-html'
                pm = 'npm'
                lockfile = ''
                
                pkg_json = {}
                if is_pkg:
                    try:
                        with open(os.path.join(candidate_root, 'package.json'), 'r') as f:
                            pkg_json = json.load(f)
                    except:
                        pass
                
                # Determine lockfile and package manager
                siblings = os.listdir(workspace_root)
                if 'pnpm-lock.yaml' in siblings:
                    lockfile = 'pnpm-lock.yaml'
                    pm = 'pnpm'
                elif 'yarn.lock' in siblings:
                    lockfile = 'yarn.lock'
                    pm = 'yarn'
                elif 'package-lock.json' in siblings:
                    lockfile = 'package-lock.json'
                    pm = 'npm'
                
                # Framework classification
                deps = pkg_json.get('dependencies', {})
                dev_deps = pkg_json.get('devDependencies', {})
                all_deps = {**deps, **dev_deps}
                
                if 'next' in all_deps: framework = 'nextjs'
                elif 'vue' in all_deps: framework = 'vue'
                elif 'react' in all_deps: framework = 'react'
                elif 'svelte' in all_deps: framework = 'svelte'
                elif 'vite' in all_deps:
                    if 'vue' in all_deps or '@vitejs/plugin-vue' in all_deps: framework = 'vite-vue'
                    elif 'react' in all_deps or '@vitejs/plugin-react' in all_deps: framework = 'vite-react'
                    else: framework = 'vite-vanilla'
                elif is_html:
                    if html_is_fragment:
                        framework = 'html-fragment'
                    else:
                        framework = 'static-html'
                
                # Build command & dev command
                build_required = False
                build_cmd = ''
                dev_cmd = ''
                output_dir = ''
                
                if is_pkg:
                    scripts = pkg_json.get('scripts', {})
                    if 'build' in scripts:
                        build_required = True
                        build_cmd = f"{pm} run build"
                    if 'dev' in scripts:
                        dev_cmd = f"{pm} run dev"
                    
                    # Output directory heuristics
                    if framework == 'nextjs': output_dir = '.next'
                    elif framework in ['vite-vue', 'vite-react', 'vite-vanilla']: output_dir = 'dist'
                    else: output_dir = 'dist'
                
                # Categorize backend vs library
                is_backend = False
                is_library = False
                if is_pkg:
                    if 'express' in deps and not is_html:
                        is_backend = True
                    if not is_html and not build_cmd and not dev_cmd:
                        is_library = True
                
                source_type_val = source_type
                if is_backend: source_type_val = 'backend-only'
                elif is_library: source_type_val = 'library'
                
                rel_path = os.path.relpath(candidate_root, archive_root)
                base_name = archive_name if rel_path == '.' else f"{archive_name}-{rel_path.replace('/', '-')}"
                project_id = f"glasslab-{sanitize_name(base_name)}"
                display_name = base_name.replace('-', ' ').title()
                
                # Deduplicate project ID (collision detection)
                name_collision = False
                if project_id in project_names:
                    name_collision = True
                    # append a short hash
                    h = hashlib.md5(candidate_root.encode('utf-8')).hexdigest()[:6]
                    project_id = f"{project_id}-{h}"
                project_names[project_id] = candidate_root
                
                entrypoint_type = 'unknown'
                if is_html:
                    entrypoint_type = 'html-document' if html_is_complete else 'html-fragment'
                elif is_pkg:
                    entrypoint_type = 'package-app'
                
                content_hash = hash_directory(candidate_root)
                
                record = {
                    'project_id': project_id,
                    'archive_name': archive_name,
                    'archive_root': archive_root,
                    'candidate_root': candidate_root,
                    'workspace_root': workspace_root,
                    'relative_candidate_path': rel_path,
                    'source_type': source_type_val,
                    'source_url': source_url,
                    'display_name': display_name,
                    'entrypoint_type': entrypoint_type,
                    'framework': framework,
                    'runtime': 'browser',
                    'package_manager': pm,
                    'lockfile': lockfile,
                    'build_required': build_required,
                    'build_command': build_cmd,
                    'dev_command': dev_cmd,
                    'output_directory': output_dir,
                    'html_is_complete_document': html_is_complete,
                    'html_is_fragment': html_is_fragment,
                    'css_files': ','.join(css_files),
                    'script_files': ','.join(script_files),
                    'remote_scripts': ','.join(list(set(candidate_analysis['remote_scripts']))),
                    'remote_stylesheets': ','.join(list(set(candidate_analysis['remote_stylesheets']))),
                    'uses_jsx': candidate_analysis['uses_jsx'],
                    'uses_ts': candidate_analysis['uses_ts'],
                    'uses_tsx': candidate_analysis['uses_tsx'],
                    'uses_react': candidate_analysis['uses_react'],
                    'uses_vue': candidate_analysis['uses_vue'],
                    'uses_svelte': candidate_analysis['uses_svelte'],
                    'uses_scss': candidate_analysis['uses_scss'],
                    'uses_less': candidate_analysis['uses_less'],
                    'uses_pug': candidate_analysis['uses_pug'],
                    'uses_webgl': candidate_analysis['uses_webgl'],
                    'uses_canvas': candidate_analysis['uses_canvas'],
                    'uses_svg_filters': candidate_analysis['uses_svg_filters'],
                    'uses_external_assets': len(candidate_analysis['remote_scripts']) > 0 or len(candidate_analysis['remote_stylesheets']) > 0,
                    'requires_workspace_context': requires_workspace,
                    'license_status': 'unknown',
                    'content_hash': content_hash,
                    'name_collision': name_collision,
                    'notes': ''
                }
                
                # Check if it should be in non-runnable or candidates
                if is_backend or is_library:
                    non_runnable.append(record)
                else:
                    candidates.append(record)
                    
    # Write TSVs
    fields = [
        'project_id', 'archive_name', 'archive_root', 'candidate_root', 'workspace_root',
        'relative_candidate_path', 'source_type', 'source_url', 'display_name',
        'entrypoint_type', 'framework', 'runtime', 'package_manager', 'lockfile',
        'build_required', 'build_command', 'dev_command', 'output_directory',
        'html_is_complete_document', 'html_is_fragment', 'css_files', 'script_files',
        'remote_scripts', 'remote_stylesheets', 'uses_jsx', 'uses_ts', 'uses_tsx',
        'uses_react', 'uses_vue', 'uses_svelte', 'uses_scss', 'uses_less', 'uses_pug',
        'uses_webgl', 'uses_canvas', 'uses_svg_filters', 'uses_external_assets',
        'requires_workspace_context', 'license_status', 'content_hash', 'name_collision',
        'notes'
    ]
    
    with open(os.path.join(REPORTS_DIR, 'project-candidates-v2.tsv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter='\t')
        writer.writeheader()
        for r in candidates:
            writer.writerow(r)
            
    with open(os.path.join(REPORTS_DIR, 'project-candidates-v2.json'), 'w', encoding='utf-8') as f:
        json.dump(candidates, f, indent=2)
        
    print(f"Inventory v2 finished: Found {len(candidates)} active candidates, {len(duplicates)} duplicates, {len(non_runnable)} non-runnable/libraries.")

if __name__ == '__main__':
    main()
