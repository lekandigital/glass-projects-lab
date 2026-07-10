import os
import json

def main():
    deployments_file = "reports/aero-import/vercel-deployments.tsv"
    if not os.path.exists(deployments_file):
        print("No deployments file found.")
        return

    with open(deployments_file, "r") as f:
        lines = f.readlines()
        
    if len(lines) <= 1:
        return

    projects = []
    for line in lines[1:]:
        parts = line.strip().split("\t")
        if len(parts) >= 5:
            projects.append({
                "id": parts[0],
                "vercel_project": parts[1],
                "deployment_id": parts[2],
                "created_at": parts[3],
                "prod_url": parts[4]
            })

    # Read recipes
    catalog = []
    for p in projects:
        recipe_path = f"recipes/{p['id']}.json"
        if os.path.exists(recipe_path):
            with open(recipe_path, "r") as rf:
                recipe = json.load(rf)
                catalog.append({
                    "id": p["id"],
                    "source": recipe.get("source_tier", "unknown"),
                    "url": p["prod_url"]
                })

    # Generate Gallery HTML
    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Glass Projects Lab Gallery</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; background: #000; color: #fff; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.card { background: #111; border: 1px solid #333; padding: 1rem; border-radius: 8px; }
.card a { color: #00ff00; text-decoration: none; }
.card a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>Glass Projects Lab Gallery</h1>
<p>Live demonstrations of the preserved glass UI library.</p>
<div class="grid">
"""
    for item in catalog:
        if item["url"] == "blocked-vercel-limit":
            demo_link = f'<span>Vercel Deploy Blocked (Quota)</span>'
        else:
            demo_link = f'<a href="{item["url"]}" target="_blank">View Live Demo</a>'
            
        html += f"""
<div class="card">
  <h2>{item["id"]}</h2>
  <p>Source: {item["source"]}</p>
  {demo_link}<br>
  <a href="https://github.com/lekandigital/glass-projects-lab/tree/main/deployments/{item["id"]}">View Source</a>
</div>
"""
    html += """
</div>
</body>
</html>
"""
    os.makedirs("gallery", exist_ok=True)
    with open("gallery/index.html", "w") as f:
        f.write(html)
        
    print("Gallery generated at gallery/index.html")

if __name__ == "__main__":
    main()
