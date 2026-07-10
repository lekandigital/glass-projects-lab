import os
import csv
import json
import subprocess
import time
import urllib.request
import re

REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"
DEPLOYMENTS_DIR = "/Users/lekan/Dev/glass-projects-lab/deployments"
STATE_FILE = os.path.join(REPORTS_DIR, "deployment-state.json")
LOGS_DIR = os.path.join(REPORTS_DIR, "logs")

os.makedirs(LOGS_DIR, exist_ok=True)

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def run_cmd(cmd, cwd, log_file, env=None):
    with open(log_file, 'w') as out:
        out.write(f"Running: {' '.join(cmd)}\n")
        out.write(f"CWD: {cwd}\n")
        out.write("-" * 40 + "\n")
        out.flush()
        
        full_env = os.environ.copy()
        if env:
            full_env.update(env)
            
        process = subprocess.Popen(
            cmd, cwd=cwd, env=full_env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
        )
        
        output = []
        for line in process.stdout:
            out.write(line)
            out.flush()
            output.append(line)
            
        process.wait()
        return process.returncode, "".join(output)

def verify_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            body = response.read().decode('utf-8', errors='ignore')
            if status == 200 and len(body.strip()) > 0:
                if "<html" in body.lower():
                    return "verified"
                return "verified-with-warnings"
            return "broken-render"
    except urllib.error.URLError as e:
        if hasattr(e, 'code') and e.code == 404:
            return "http-404"
        return "http-only"
    except Exception as e:
        return "deployment-failed"

def main():
    state = load_state()
    
    with open(os.path.join(REPORTS_DIR, 'project-candidates.tsv'), 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        candidates = list(reader)
        
    for cand in candidates:
        project_name = cand['project_name']
        if project_name not in state:
            state[project_name] = {
                'local_build': 'pending',
                'remote_deploy': 'pending',
                'verification': 'pending'
            }
            
        p_state = state[project_name]
        
        # Skip fully verified
        if p_state.get('verification') in ['verified', 'verified-with-warnings'] and p_state.get('remote_deploy') == 'success':
            continue
            
        print(f"\n[{project_name}] Starting processing...")
        cwd = os.path.join(DEPLOYMENTS_DIR, project_name)
        
        # Determine paths
        # cand['candidate_root'] is the original path.
        # cand['archive_root'] is the original archive root.
        # So inside DEPLOYMENTS_DIR/project_name, the candidate relative path is:
        rel_path = os.path.relpath(cand['candidate_root'], cand['archive_root'])
        work_dir = cwd if rel_path == '.' else os.path.join(cwd, rel_path)
        
        pm = cand['package_manager']
        framework = cand['framework']
        
        # Local Build
        if p_state['local_build'] != 'success' and p_state['local_build'] != 'non-runnable-monorepo' and framework != 'static-html' and framework != 'codepen-export' and framework != 'jsfiddle-export':
            print(f"[{project_name}] Running local builds...")
            attempts = 0
            
            # Attempt 1: standard install and build
            attempts += 1
            log_path = os.path.join(LOGS_DIR, f"{project_name}-local-attempt-{attempts}.log")
            
            # Determine install command
            install_cmd = ['npm', 'ci']
            if pm == 'pnpm': install_cmd = ['npx', '--yes', 'pnpm', 'install']
            elif pm == 'yarn': install_cmd = ['npx', '--yes', 'yarn', 'install']
            elif pm == 'bun': install_cmd = ['npx', '--yes', 'bun', 'install']
            elif not cand['lockfile']: install_cmd = ['npm', 'install']
            
            ret, out = run_cmd(install_cmd, work_dir, log_path)
            
            if ret == 0:
                # Try build
                build_cmd = ['npm', 'run', 'build']
                if pm == 'pnpm': build_cmd = ['npx', '--yes', 'pnpm', 'run', 'build']
                elif pm == 'yarn': build_cmd = ['npx', '--yes', 'yarn', 'build']
                elif pm == 'bun': build_cmd = ['npx', '--yes', 'bun', 'run', 'build']
                
                ret, out = run_cmd(build_cmd, work_dir, log_path)
                
            if ret != 0:
                # Attempt 2: clean reinstall
                attempts += 1
                log_path = os.path.join(LOGS_DIR, f"{project_name}-local-attempt-{attempts}.log")
                print(f"[{project_name}] Attempt 1 failed. Trying clean reinstall...")
                run_cmd(['rm', '-rf', 'node_modules'], work_dir, log_path)
                
                ret, out = run_cmd(install_cmd, work_dir, log_path)
                if ret == 0:
                    ret, out = run_cmd(build_cmd, work_dir, log_path)
            
            if ret != 0 and 'ERESOLVE' in out:
                # Attempt 3: legacy peer deps
                attempts += 1
                log_path = os.path.join(LOGS_DIR, f"{project_name}-local-attempt-{attempts}.log")
                print(f"[{project_name}] Attempt 2 failed with peer deps. Trying legacy peer deps...")
                run_cmd(['rm', '-rf', 'node_modules'], work_dir, log_path)
                
                install_legacy = ['npm', 'install', '--legacy-peer-deps']
                ret, out = run_cmd(install_legacy, work_dir, log_path)
                if ret == 0:
                    ret, out = run_cmd(build_cmd, work_dir, log_path)
                    
            if ret == 0:
                p_state['local_build'] = 'success'
                print(f"[{project_name}] Local build SUCCESS.")
            else:
                p_state['local_build'] = 'failed'
                print(f"[{project_name}] Local build FAILED after {attempts} attempts.")
        elif framework in ['static-html', 'codepen-export', 'jsfiddle-export']:
            p_state['local_build'] = 'success'
        
        save_state(state)
        
        if p_state['local_build'] == 'failed':
            continue
            
        # Remote Deploy
        if p_state['remote_deploy'] != 'success':
            print(f"[{project_name}] Running Vercel deploy...")
            # We deploy from cwd, but if it's a monorepo we should ideally set the root directory in vercel
            # For simplicity in CLI, we deploy the `cwd` but the output is inside work_dir.
            # Vercel handles this best if we just deploy from work_dir!
            
            # actually if we deploy from work_dir, it isolates the project.
            # If it needs monorepo context, vercel CLI has --cwd, but vercel detects workspaces automatically.
            short_name = project_name[:95]
            if short_name.endswith('-'): short_name = short_name[:-1]
            deploy_cmd = ['vercel', 'deploy', '--prod', '--yes', '--cwd', cwd, '--name', short_name]
            log_path = os.path.join(LOGS_DIR, f"{project_name}-vercel-attempt-1.log")
            
            ret, out = run_cmd(deploy_cmd, cwd, log_path)
            
            # The CLI usually prints the production URL to stdout on success.
            # E.g. https://glasslab-something.vercel.app
            prod_url = None
            for line in out.splitlines():
                if line.startswith('https://') and 'vercel.app' in line and not '.vercel.app' in line:
                    # Wait, vercel might print multiple URLs. The last one is usually the prod URL.
                    pass
                # A robust way is to use regex
                m = re.search(r'(https://[^ \n\r]+)', line)
                if m and 'vercel' in m.group(1):
                    prod_url = m.group(1)
            
            if ret == 0 and prod_url:
                p_state['remote_deploy'] = 'success'
                p_state['prod_url'] = prod_url
                print(f"[{project_name}] Vercel deploy SUCCESS: {prod_url}")
            else:
                p_state['remote_deploy'] = 'failed'
                print(f"[{project_name}] Vercel deploy FAILED.")
                
        save_state(state)
        
        if p_state['remote_deploy'] == 'success' and p_state['verification'] == 'pending':
            url = p_state['prod_url']
            # if rel_path != '.', we might need to append it to the URL if we deployed the monorepo root.
            # Actually, Vercel deploy defaults to root. Let's see if we should append the path for verification.
            if rel_path != '.':
                url = f"{url}/{rel_path}"
                
            print(f"[{project_name}] Verifying {url}...")
            status = verify_url(url)
            p_state['verification'] = status
            p_state['verify_url'] = url
            print(f"[{project_name}] Verification result: {status}")
            
        save_state(state)

if __name__ == '__main__':
    main()
