import os
import csv
import subprocess

REPORTS_DIR = "/Users/lekan/Dev/glass-projects-lab/reports"
DEPLOYMENTS_DIR = "/Users/lekan/Dev/glass-projects-lab/deployments"

def prepare_projects():
    os.makedirs(DEPLOYMENTS_DIR, exist_ok=True)
    
    with open(os.path.join(REPORTS_DIR, 'project-candidates.tsv'), 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        candidates = list(reader)
        
    for cand in candidates:
        project_name = cand['project_name']
        archive_root = cand['archive_root']
        dest_dir = os.path.join(DEPLOYMENTS_DIR, project_name)
        
        if os.path.exists(dest_dir):
            print(f"Skipping {project_name}, already exists.")
            continue
            
        print(f"Preparing {project_name}...")
        
        cmd = [
            'rsync', '-a',
            '--exclude=.git',
            '--exclude=.vercel',
            '--exclude=node_modules',
            '--exclude=dist',
            '--exclude=build',
            '--exclude=.next',
            '--exclude=coverage',
            f"{archive_root}/",
            f"{dest_dir}/"
        ]
        
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(f"Failed to copy {project_name}")

if __name__ == '__main__':
    prepare_projects()
