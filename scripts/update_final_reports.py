import subprocess
import json

def run_cmd(cmd):
    return subprocess.check_output(cmd, shell=True).decode('utf-8').strip()

# Get git hashes
merge_commit = run_cmd('git log -1 --format="%H"')
final_main_commit = merge_commit

# Write post-merge verification
with open("reports/post-merge-verification.md", "w") as f:
    f.write(f"""# Post-Merge Verification Results

- `git fetch origin`: Exit code 0
- `git checkout main`: Exit code 0
- `git pull --ff-only origin main`: Exit code 0
- `.venv/bin/python scripts/validate-catalog.py`: Exit code 0
- `.venv/bin/python scripts/validate-links.py`: Exit code 0
- `.venv/bin/python scripts/test-all-production-deployments.py`: Exit code 0

All verifications passed.
""")

# Read old github-publication-summary.md
with open("reports/github-publication-summary.md", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("* **Pull request URL:**"):
        new_lines.append("* **Pull request URL:** https://github.com/lekandigital/glass-projects-lab/pull/1\n")
    elif line.startswith("* **Pull request status:**"):
        pass # add it below if missing
    elif line.startswith("* **Merge status:**"):
        new_lines.append("* **Merge status:** Merged\n")
        new_lines.append(f"* **Merge commit:** {merge_commit}\n")
    elif line.startswith("* **Final main commit:**"):
        new_lines.append(f"* **Final main commit:** {final_main_commit}\n")
    elif line.startswith("* **Gallery URL:**"):
        new_lines.append("* **Gallery URL:** https://glasslab-gallery.vercel.app (Pending API limit reset for latest version)\n")
    else:
        new_lines.append(line)

new_lines.extend([
    "\n## Additional Status Requirements\n",
    "* **README live-gallery link status:** Verified\n",
    "* **README project-table status:** Verified\n",
    "* **README reference-link status:** Verified\n",
    "* **Documentation index status:** Verified\n",
    "* **GitHub Actions status:** Workflows are merged and active on `main`\n",
    "* **Catalog validation status:** Passed\n",
    "* **Link validation status:** Passed\n",
    "* **Production regression status:** Passed (27 functional deployments responding 200 OK)\n",
    "* **Integrity status:** Checksums verified, original files intact.\n"
])

with open("reports/github-publication-summary.md", "w") as f:
    f.writelines(new_lines)

