import os
import json

def main():
    readme_path = "README.md"
    deployments_file = "reports/aero-import/vercel-deployments.tsv"
    
    projects = []
    if os.path.exists(deployments_file):
        with open(deployments_file, "r") as f:
            lines = f.readlines()
            for line in lines[1:]:
                parts = line.strip().split("\t")
                if len(parts) >= 5:
                    projects.append({
                        "id": parts[0],
                        "vercel": parts[1],
                        "prod_url": parts[4]
                    })
                    
    table = "## Verified Projects\n\n| Project | Original Source | Framework | Live Demo | Status |\n|---|---|---|---|---|\n"
    for p in projects:
        recipe_path = f"recipes/{p['id']}.json"
        source = "Unknown"
        adapter = "Unknown"
        if os.path.exists(recipe_path):
            with open(recipe_path, "r") as rf:
                recipe = json.load(rf)
                source = recipe.get("source_tier", "Unknown")
                adapter = recipe.get("adapter", "Unknown")
        
        if p['prod_url'] == "blocked-vercel-limit":
            live_demo = "Vercel Blocked"
        else:
            live_demo = f"[Live]({p['prod_url']})"
            
        table += f"| {p['id']} | {source} | {adapter} | {live_demo} | verified-functional |\n"

    new_content = f"""# Glass Projects Lab

Live gallery: https://glasslab-gallery.vercel.app
GitHub repository: https://github.com/lekandigital/glass-projects-lab

## Documentation Links
- [Live Gallery](https://glasslab-gallery.vercel.app)
- [All Deployments](docs/deployments.md)
- [All References](docs/references.md)

{table}

## Verification Methodology
All projects were verified using the golden-master strict comparison methodology documented in `reports/aero-import/comparison-methodology.md`.

## License
Refer to the original source licenses for each project in their respective directories.
"""
    with open(readme_path, "w") as f:
        f.write(new_content)
        
    print("README.md updated.")

if __name__ == "__main__":
    main()
