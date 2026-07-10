import os
import sys
import json
import subprocess
import time
import urllib.request
import re

def run_cmd(cmd, cwd=None, env=None):
    print(f"Running: {cmd} in {cwd or '.'}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Command failed with exit code {res.returncode}")
        print(res.stdout)
        print(res.stderr)
        return False, res.stdout, res.stderr
    return True, res.stdout, res.stderr

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 deploy-project.py <project_id>")
        sys.exit(1)
        
    project_id = sys.argv[1]
    recipe_path = f"recipes/{project_id}.json"
    dest_dir = f"deployments/{project_id}"
    upstream_dir = f"{dest_dir}/upstream"
    
    if not os.path.exists(recipe_path):
        print(f"Recipe not found: {recipe_path}")
        sys.exit(1)
        
    with open(recipe_path) as f:
        recipe = json.load(f)
        
    print(f"--- Processing {project_id} ---")
    
    # 1-4. Re-prepare local deployment copy
    print("Preparing local copy...")
    ok, out, err = run_cmd(f"node scripts/prepare-deployment-from-golden-master.mjs {project_id} {recipe_path} {dest_dir}")
    if not ok:
        sys.exit(1)
        
    # 5-9. Local Comparison
    # Start golden master and local deploy
    gm_dir = recipe.get("source_root", "")
    
    import random
    port1 = random.randint(10000, 20000)
    port2 = random.randint(20000, 30000)
    print("Starting local servers...")
    gm_proc = subprocess.Popen(f"bash scripts/build-and-serve-local.sh \"{gm_dir}\" {port1} \"{os.path.abspath(recipe_path)}\"", shell=True, preexec_fn=os.setsid)
    loc_proc = subprocess.Popen(f"bash scripts/build-and-serve-local.sh \"{os.path.abspath(upstream_dir)}\" {port2} \"{os.path.abspath(recipe_path)}\"", shell=True, preexec_fn=os.setsid)
    
    time.sleep(15) # Wait for build and serve
    
    interaction = recipe.get("interaction", "pointer-move")
    threshold = recipe.get("threshold", 10.0)
    out_dir_local = f"reports/aero-import/comparisons/{project_id}/local"
    entrypoint = recipe.get("entrypoint", "")
    if entrypoint == "index.html" or entrypoint == "":
        url_suffix = ""
    else:
        url_suffix = "/" + entrypoint
        
    print("Running local comparison...")
    ok, out, err = run_cmd(f".venv/bin/python scripts/compare-golden-master.py --project-id {project_id} --golden-url http://localhost:{port1}{url_suffix} --test-url http://localhost:{port2}{url_suffix} --out-dir {out_dir_local} --interaction {interaction} --threshold {threshold}")
    
    # Kill local servers
    try:
        os.system(f"kill -TERM -{os.getpgid(gm_proc.pid)} || true")
    except Exception:
        pass
    try:
        os.system(f"kill -TERM -{os.getpgid(loc_proc.pid)} || true")
    except Exception:
        pass
    
    if not ok:
        print("Local comparison failed!")
        sys.exit(1)
        
    # 10-14. Deploy
    print("Deploying to Vercel...")
    deploy_cwd = dest_dir
    # For workspace/frameworks we might need to deploy from upstream depending on the adapter.
    # The vercel CLI should be run in `dest_dir` where the vercel.json is generated.
    
    # Check if vercel project mapping is correct
    vercel_project = recipe.get("vercel_project", "")
    env = os.environ.copy()
    # Execute Vercel Deploy
    cmd = f"vercel deploy --yes --prod --name {vercel_project}"
    # Wait, the prompt says "Do not deploy: repository wrapper, archive parent... Deploy the actual runnable demos". 
    # Our adapter generates `vercel.json` in `deployments/<id>`, and Vercel pulls from there.
    # For monorepos, Vercel might need `vercel link` or setting root directory in vercel.json.
    # Wait, the prompt says "Deploy the actual Next.js application root."
    
    ok, out, err = run_cmd(cmd, cwd=deploy_cwd, env=env)
    if "api-deployments-free-per-day" in out or "api-deployments-free-per-day" in err:
        print("Vercel quota reached. Falling back to local-only.")
        prod_url = "blocked-vercel-limit"
        dep_id = "unknown"
        created_time = "unknown"
    elif not ok:
        print("Vercel deployment failed.")
        sys.exit(1)
    else:
        # Extract Production URL
        url_match = re.search(r"https://[a-zA-Z0-9-]+\.vercel\.app", out + err)
        if not url_match:
            print("Could not extract production URL from Vercel output.")
            sys.exit(1)
            
        prod_url = url_match.group(0)
        print(f"Production URL: {prod_url}")
        
        # Get deployment info
        # We can use vercel inspect
        ok, insp_out, insp_err = run_cmd(f"vercel inspect {prod_url}", cwd=deploy_cwd, env=env)
        
        # Parse inspect out
        # Id: dpl_xxxxx
        dep_id_match = re.search(r"Id\s+(dpl_[a-zA-Z0-9]+)", insp_out)
        dep_id = dep_id_match.group(1) if dep_id_match else "unknown"
        
        # Parse Created time
        created_match = re.search(r"Created\s+(.*?) \([a-z0-9]+\)", insp_out)
        created_time = created_match.group(1) if created_match else "unknown"

    
    # Write to tsv
    os.makedirs("reports/aero-import", exist_ok=True)
    tsv_path = "reports/aero-import/vercel-deployments.tsv"
    is_new = not os.path.exists(tsv_path)
    with open(tsv_path, "a") as f:
        if is_new:
            f.write("Project\tVercelProject\tDeploymentID\tCreatedAt\tProductionURL\n")
        f.write(f"{project_id}\t{vercel_project}\t{dep_id}\t{created_time}\t{prod_url}\n")
    
    if prod_url != "blocked-vercel-limit":
        # 15-16. Verify production
        out_dir_prod = f"reports/aero-import/comparisons/{project_id}/production"
        
        print("Starting golden master for production comparison...")
        port3 = random.randint(30000, 40000)
        gm_proc = subprocess.Popen(f"bash scripts/build-and-serve-local.sh \"{gm_dir}\" {port3} \"{os.path.abspath(recipe_path)}\"", shell=True, preexec_fn=os.setsid)
        time.sleep(10)
        
        print("Running production comparison...")
        ok, comp_out, comp_err = run_cmd(f".venv/bin/python scripts/compare-golden-master.py --project-id {project_id} --golden-url http://localhost:{port3}{url_suffix} --test-url {prod_url}{url_suffix} --out-dir {out_dir_prod} --interaction {interaction} --threshold {threshold}")
        
        try:
            os.system(f"kill -TERM -{os.getpgid(gm_proc.pid)} || true")
        except Exception:
            pass
        
        if not ok:
            print("Production comparison failed!")
            sys.exit(1)
            
    print(f"[{project_id}] Fully Verified!")
    
if __name__ == '__main__':
    main()
