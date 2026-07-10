import os
import json
import hashlib
import csv
import re
import shutil
import sys

ORIGINALS_DIR = "/Users/lekan/Dev/glass-projects-lab/originals"
REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"

def hash_directory(directory):
    # simple hash of filenames and their sizes
    hasher = hashlib.sha256()
    for root, dirs, files in os.walk(directory):
        # Sort to ensure deterministic hash
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

def determine_framework(pkg_json, html_content):
    if not pkg_json:
        if html_content:
            if 'codepen' in html_content.lower(): return 'codepen-export'
            if 'jsfiddle' in html_content.lower(): return 'jsfiddle-export'
            return 'static-html'
        return 'unknown'

    deps = pkg_json.get('dependencies', {})
    dev_deps = pkg_json.get('devDependencies', {})
    all_deps = {**deps, **dev_deps}
    scripts = pkg_json.get('scripts', {})
    
    if 'next' in all_deps: return 'nextjs'
    if 'vite' in all_deps:
        if 'vue' in all_deps or '@vitejs/plugin-vue' in all_deps: return 'vite-vue'
        if 'react' in all_deps or '@vitejs/plugin-react' in all_deps: return 'vite-react'
        return 'vite-vanilla'
    if '@vue/cli-service' in all_deps: return 'vue-cli'
    if 'react-scripts' in all_deps: return 'create-react-app'
    if 'nuxt' in all_deps: return 'nuxt'
    if 'astro' in all_deps: return 'astro'
    if 'svelte' in all_deps: return 'svelte'
    if '@sveltejs/kit' in all_deps: return 'sveltekit'
    if 'parcel' in all_deps: return 'parcel'
    if 'webpack' in all_deps: return 'webpack'
    if 'rollup' in all_deps: return 'rollup'
    
    return 'unknown'

def main():
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    candidates = []
    duplicates = []
    non_runnable = []
    
    archive_hashes = {}
    
    for archive_name in os.listdir(ORIGINALS_DIR):
        archive_root = os.path.join(ORIGINALS_DIR, archive_name)
        if not os.path.isdir(archive_root): continue
        if "glassmorphism-wpf" in archive_name.lower():
            non_runnable.append({
                'archive_name': archive_name,
                'candidate_root': archive_root,
                'candidate_type': 'wpf',
                'reason': 'Intentionally excluded'
            })
            continue

        dir_hash = hash_directory(archive_root)
        if dir_hash in archive_hashes:
            duplicates.append({
                'archive_name': archive_name,
                'duplicate_of': archive_hashes[dir_hash],
                'reason': 'Exact archive directory duplicate'
            })
            continue
        archive_hashes[dir_hash] = archive_name

        # Find candidates within archive
        for root, dirs, files in os.walk(archive_root):
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if '.git' in dirs: dirs.remove('.git')
            if 'dist' in dirs: dirs.remove('dist')
            if 'build' in dirs: dirs.remove('build')
            
            is_pkg = 'package.json' in files
            is_html = 'index.html' in files
            
            if is_pkg or is_html:
                pkg_json = {}
                if is_pkg:
                    try:
                        with open(os.path.join(root, 'package.json'), 'r') as f:
                            pkg_json = json.load(f)
                    except:
                        pass
                
                html_content = ""
                if is_html:
                    try:
                        with open(os.path.join(root, 'index.html'), 'r', encoding='utf-8', errors='ignore') as f:
                            html_content = f.read()
                    except:
                        pass
                
                framework = determine_framework(pkg_json, html_content)
                
                lockfile = None
                if 'pnpm-lock.yaml' in files: lockfile = 'pnpm-lock.yaml'
                elif 'yarn.lock' in files: lockfile = 'yarn.lock'
                elif 'bun.lock' in files or 'bun.lockb' in files: lockfile = 'bun.lock'
                elif 'package-lock.json' in files: lockfile = 'package-lock.json'
                
                pm = 'npm'
                if lockfile == 'pnpm-lock.yaml': pm = 'pnpm'
                elif lockfile == 'yarn.lock': pm = 'yarn'
                elif lockfile == 'bun.lock': pm = 'bun'
                
                # Check backend/library
                is_backend = False
                is_library = False
                
                if is_pkg:
                    main_file = pkg_json.get('main', '')
                    if 'express' in pkg_json.get('dependencies', {}) and not is_html:
                        is_backend = True
                    if not is_html and not pkg_json.get('scripts', {}).get('dev') and not pkg_json.get('scripts', {}).get('build'):
                        is_library = True
                
                candidate_type = framework
                if is_backend: candidate_type = 'backend-only'
                elif is_library: candidate_type = 'library'
                
                rel_path = os.path.relpath(root, archive_root)
                base_name = archive_name if rel_path == '.' else f"{archive_name}-{rel_path.replace('/', '-')}"
                project_name = f"glasslab-{sanitize_name(base_name)}"
                
                if is_backend or is_library:
                    non_runnable.append({
                        'archive_name': archive_name,
                        'candidate_root': root,
                        'candidate_type': candidate_type,
                        'reason': 'Backend or library without demo'
                    })
                else:
                    candidates.append({
                        'archive_name': archive_name,
                        'archive_root': archive_root,
                        'candidate_root': root,
                        'candidate_type': candidate_type,
                        'framework': framework,
                        'package_manager': pm,
                        'lockfile': lockfile or '',
                        'project_name': project_name
                    })

    # write TSVs
    def write_tsv(filename, data, fieldnames):
        with open(os.path.join(REPORTS_DIR, filename), 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter='\t')
            writer.writeheader()
            for row in data:
                # keep only fieldnames
                filtered_row = {k: v for k, v in row.items() if k in fieldnames}
                writer.writerow(filtered_row)

    cand_fields = ['archive_name', 'archive_root', 'candidate_root', 'candidate_type', 'framework', 'package_manager', 'lockfile', 'project_name']
    write_tsv('project-candidates.tsv', candidates, cand_fields)
    
    dup_fields = ['archive_name', 'duplicate_of', 'reason']
    write_tsv('duplicates.tsv', duplicates, dup_fields)
    
    non_fields = ['archive_name', 'candidate_root', 'candidate_type', 'reason']
    write_tsv('non-runnable.tsv', non_runnable, non_fields)

    print(f"Found {len(candidates)} candidates, {len(duplicates)} duplicates, {len(non_runnable)} non-runnable.")

if __name__ == '__main__':
    main()
