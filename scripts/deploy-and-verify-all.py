import os
import sys
import json
import csv
import subprocess
import re

REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"
DEPLOYMENTS_DIR = "/Users/lekan/Dev/glass-projects-lab/deployments"
STATE_FILE = os.path.join(REPORTS_DIR, "functional-deployment-state.json")
BEFORE_STATE_FILE = os.path.join(REPORTS_DIR, "repair-audit/deployment-state-before-repair.json")
LOGS_DIR = os.path.join(REPORTS_DIR, "logs")

os.makedirs(LOGS_DIR, exist_ok=True)

def load_json(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            try: return json.load(f)
            except: return {}
    return {}

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def run_cmd(cmd, cwd, log_file=None):
    if log_file:
        with open(log_file, 'a') as out:
            out.write(f"\nRunning: {' '.join(cmd)}\n")
            out.write(f"CWD: {cwd}\n")
            out.write("-" * 40 + "\n")
            out.flush()
            process = subprocess.Popen(
                cmd, cwd=cwd,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
            )
            output = []
            for line in process.stdout:
                out.write(line)
                out.flush()
                output.append(line)
            process.wait()
            return process.returncode, "".join(output)
    else:
        process = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return process.returncode, process.stdout + "\n" + process.stderr

def main(args):
    # Load old state for previous_state retention
    old_state = load_json(BEFORE_STATE_FILE)
    
    # Load candidates
    with open(os.path.join(REPORTS_DIR, 'project-candidates-v2.json'), 'r') as f:
        candidates = json.load(f)
        
    # Initialize or load current state
    state = load_json(STATE_FILE)
    
    # Pre-populate state for all candidates
    for cand in candidates:
        project_id = cand['project_id']
        if project_id not in state:
            # Get old state if it existed
            old_p_state = old_state.get(project_id, {})
            # Also support finding it if project_id was named differently in old state
            # (e.g. without md5 hash)
            if not old_p_state:
                # search for partial match
                for k, v in old_state.items():
                    if project_id.startswith(k):
                        old_p_state = v
                        break
            
            state[project_id] = {
                'local_build': 'pending',
                'local_render': 'pending',
                'production_deploy': 'pending',
                'production_render': 'pending',
                'interaction': 'pending',
                'final_status': 'pending',
                'previous_state': old_p_state
            }

    save_json(STATE_FILE, state)

    for cand in candidates:
        project_id = cand['project_id']
        p_state = state[project_id]
        
        # Skip if already fully verified-functional in this run
        if p_state['final_status'] in ['verified-functional', 'verified-functional-with-minor-warnings']:
            print(f"[{project_id}] Already verified functional in this run. Skipping.")
            continue
            
        print(f"\n==================================================")
        print(f"[{project_id}] Starting repair and verification process...")
        print(f"==================================================")
        
        cwd = os.path.join(DEPLOYMENTS_DIR, project_id)
        if not os.path.exists(cwd):
            print(f"[{project_id}] Deployment directory does not exist! Skipping.")
            p_state['final_status'] = 'broken-local-build'
            save_json(STATE_FILE, state)
            continue
            
        pm = cand['package_manager']
        framework = cand['framework']
        build_required = cand['build_required']
        
        is_library = not cand['html_is_complete_document'] and not cand['html_is_fragment'] and framework != 'nextjs'
        if is_library:
            print(f"[{project_id}] Library package detected (no HTML). Marking as library-skipped.")
            p_state['local_build'] = 'success'
            p_state['local_render'] = 'skipped'
            p_state['final_status'] = 'library-skipped'
            save_json(STATE_FILE, state)
            continue
            
        # Override build_required if a package.json was created by reconstruction
        pkg_json_path = os.path.join(cwd, 'package.json')
        if os.path.exists(pkg_json_path):
            with open(pkg_json_path, 'r') as f:
                try:
                    pkg_data = json.load(f)
                    if 'scripts' in pkg_data and 'build' in pkg_data['scripts']:
                        build_required = True
                        pm = 'npm' # Default for reconstructed
                except:
                    pass
        
        # --- 1. LOCAL BUILD STEP ---
        if build_required:
            print(f"[{project_id}] Running local build...")
            p_state['local_build'] = 'running'
            save_json(STATE_FILE, state)
            
            build_success = False
            log_path = os.path.join(LOGS_DIR, f"{project_id}-local-build.log")
            if os.path.exists(log_path): os.remove(log_path)
            
            # Determine commands based on package manager and workspace context
            is_monorepo = cand['requires_workspace_context']
            
            # Monorepos: pnpm install & build in root
            if is_monorepo:
                print(f"[{project_id}] Monorepo workspace build...")
                # Try 1: pnpm install & pnpm run build
                ret, out = run_cmd(['pnpm', 'install'], cwd, log_path)
                if ret == 0:
                    ret, out = run_cmd(['pnpm', 'run', 'build'], cwd, log_path)
                    if ret == 0:
                        build_success = True
            else:
                # Standalone package build
                install_cmd = ['npm', 'install']
                if pm == 'pnpm': install_cmd = ['pnpm', 'install']
                
                # Retry loop up to 4 attempts
                for attempt in range(1, 5):
                    print(f"[{project_id}] Build attempt {attempt}...")
                    if attempt == 2:
                        # Clean reinstall
                        run_cmd(['rm', '-rf', 'node_modules'], cwd, log_path)
                    elif attempt == 3:
                        # Legacy peer deps
                        install_cmd = ['npm', 'install', '--legacy-peer-deps']
                    elif attempt == 4:
                        # Clean install
                        install_cmd = ['npm', 'ci']
                        
                    ret, out = run_cmd(install_cmd, cwd, log_path)
                    if ret == 0:
                        ret, out = run_cmd(['npm', 'run', 'build'], cwd, log_path)
                        if ret == 0:
                            build_success = True
                            break
                            
            if build_success:
                p_state['local_build'] = 'success'
                print(f"[{project_id}] Local build SUCCESS.")
            else:
                p_state['local_build'] = 'failed'
                p_state['final_status'] = 'broken-local-build'
                print(f"[{project_id}] Local build FAILED.")
                save_json(STATE_FILE, state)
                continue
        else:
            p_state['local_build'] = 'success'
            
        save_json(STATE_FILE, state)
        
        # --- 2. LOCAL RENDER (VERIFICATION) STEP ---
        # Determine the directory to serve
        dir_to_serve = cwd
        if build_required:
            output_dir = cand['output_directory'] or 'dist'
            if cand['requires_workspace_context']:
                # Monorepo app path
                dir_to_serve = os.path.join(cwd, cand['relative_candidate_path'], output_dir)
            else:
                dir_to_serve = os.path.join(cwd, output_dir)
                
        # If output dir doesn't exist, fallback to root or fail
        if not os.path.exists(dir_to_serve):
            # Try lowercase dist
            if os.path.exists(os.path.join(os.path.dirname(dir_to_serve), 'dist')):
                dir_to_serve = os.path.join(os.path.dirname(dir_to_serve), 'dist')
            elif os.path.exists(os.path.join(os.path.dirname(dir_to_serve), 'build')):
                dir_to_serve = os.path.join(os.path.dirname(dir_to_serve), 'build')
            else:
                # If Next.js, it might not have standard static dist unless exported, but let's serve cwd
                if framework == 'nextjs':
                    dir_to_serve = cwd
                else:
                    print(f"[{project_id}] Output directory {dir_to_serve} not found!")
                    p_state['local_render'] = 'failed'
                    p_state['final_status'] = 'broken-local-render'
                    save_json(STATE_FILE, state)
                    continue

        is_canvas = cand['uses_canvas'] or cand['uses_webgl'] or cand['uses_svg_filters']
        
        # Run Playwright verify locally
        verify_cmd = [
            '/Users/lekan/Dev/glass-projects-lab/.venv/bin/python',
            '/Users/lekan/Dev/glass-projects-lab/scripts/verify-project-functional.py',
            '--project-id', project_id,
            '--dir', dir_to_serve,
            '--canvas', str(is_canvas)
        ]
        
        ret, out = run_cmd(verify_cmd, '/Users/lekan/Dev/glass-projects-lab')
        
        # Read Playwright results
        res_path = os.path.join(VERIFICATION_DIR := "/Users/lekan/Dev/glass-projects-lab/reports/functional-verification", project_id, "result.json")
        res_data = load_json(res_path)
        
        local_status = res_data.get('final_status', 'broken-local-render')
        p_state['local_render'] = 'success' if 'verified' in local_status else 'failed'
        p_state['interaction'] = 'success' if local_status == 'verified-functional' else 'failed'
        
        if p_state['local_render'] == 'failed':
            p_state['final_status'] = local_status
            print(f"[{project_id}] Local verification FAILED: {local_status}")
            save_json(STATE_FILE, state)
            continue
            
        print(f"[{project_id}] Local verification SUCCESS: {local_status}")
        save_json(STATE_FILE, state)
        
        if args.local_only:
            continue
            
        # Determine VERCEL runnable root.
        deploy_root = cwd
        if cand['requires_workspace_context']:
            deploy_root = cand['workspace_root']
            # Create vercel.json in the workspace root to define build command and output directory
            vercel_json = {
                "buildCommand": cand['build_command'] or "pnpm run build",
                "outputDirectory": os.path.join(cand['relative_candidate_path'], cand['output_directory'] or "dist")
            }
            if framework == 'static-html' or framework == 'html-fragment':
                 vercel_json = {
                    "buildCommand": "echo 'Static Site'",
                    "outputDirectory": cand['relative_candidate_path']
                 }
            with open(os.path.join(deploy_root, 'vercel.json'), 'w') as f:
                json.dump(vercel_json, f, indent=2)
                
        print(f"[{project_id}] Deploying to Vercel from: {deploy_root}")
        p_state['production_deploy'] = 'running'
        save_json(STATE_FILE, state)
        
        # Determine deployment project name (shortened and sanitized)
        short_name = project_id[:95]
        if short_name.endswith('-'): short_name = short_name[:-1]
        
        deploy_success = False
        prod_url = None
        
        # Try up to 3 remote deploy attempts
        for attempt in range(1, 4):
            print(f"[{project_id}] Vercel deploy attempt {attempt}...")
            deploy_log = os.path.join(LOGS_DIR, f"{project_id}-vercel-deploy.log")
            if os.path.exists(deploy_log): os.remove(deploy_log)
            
            ret, out = run_cmd(['vercel', 'deploy', '--prod', '--yes', '--cwd', deploy_root, '--name', short_name], deploy_root, deploy_log)
            
            # Extract URL
            for line in out.splitlines():
                m = re.search(r'(https://[a-zA-Z0-9-]+\.vercel\.app)', line)
                if m:
                    prod_url = m.group(1)
                    # Vercel prints multiple URLs; the deployment URL is usually printed last
                    
            if ret == 0 and prod_url:
                deploy_success = True
                break
                
        if deploy_success:
            p_state['production_deploy'] = 'success'
            p_state['prod_url'] = prod_url
            print(f"[{project_id}] Vercel deploy SUCCESS: {prod_url}")
        else:
            p_state['production_deploy'] = 'failed'
            p_state['final_status'] = 'broken-production-build'
            print(f"[{project_id}] Vercel deploy FAILED.")
            save_json(STATE_FILE, state)
            continue
            
        save_json(STATE_FILE, state)
        
        # --- 4. PRODUCTION VERIFICATION STEP ---
        print(f"[{project_id}] Verifying production deployment at: {prod_url}")
        
        prod_verify_cmd = [
            '/Users/lekan/Dev/glass-projects-lab/.venv/bin/python',
            '/Users/lekan/Dev/glass-projects-lab/scripts/verify-project-functional.py',
            '--project-id', project_id,
            '--dir', dir_to_serve,
            '--url', prod_url,
            '--canvas', str(is_canvas)
        ]
        
        ret, out = run_cmd(prod_verify_cmd, '/Users/lekan/Dev/glass-projects-lab')
        res_data = load_json(res_path)
        
        prod_status = res_data.get('final_status', 'broken-production-render')
        p_state['production_render'] = 'success' if 'verified' in prod_status else 'failed'
        p_state['interaction'] = 'success' if prod_status == 'verified-functional' else 'failed'
        p_state['final_status'] = prod_status
        
        print(f"[{project_id}] Production verification finished: {prod_status}")
        save_json(STATE_FILE, state)
        
    print("\nAll deployments and verifications finished.")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--local-only', action='store_true')
    args = parser.parse_args()
    main(args)
