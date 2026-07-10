import os
import re
import json
import urllib.request
import urllib.error

# Regex to find markdown links [text](url)
link_regex = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)
deleted_urls = set([p["original_url"] for p in projects if p.get("original_url_status") == "deleted" and p.get("original_url")])

def validate_links_in_file(filepath):
    print(f"Validating {filepath}...")
    with open(filepath, "r") as f:
        content = f.read()
    
    links = link_regex.findall(content)
    errors = 0
    for text, url in links:
        url = url.split('#')[0] # remove anchors
        if not url:
            continue
        if url.startswith("http"):
            try:
                # Basic check
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                urllib.request.urlopen(req, timeout=5)
            except urllib.error.HTTPError as e:
                # 403 or 401 might be valid for some sites, but 404 is definitely broken.
                if e.code == 404:
                    if url in deleted_urls:
                        pass # expected
                    else:
                        print(f"  [HTTPError {e.code}] Broken link: {url}")
                        errors += 1
            except Exception as e:
                if url in deleted_urls:
                    pass
                else:
                    print(f"  [Error {str(e)}] Broken link: {url}")
                    errors += 1
        else:
            # Local file
            # resolve relative to filepath
            base_dir = os.path.dirname(filepath)
            target = os.path.normpath(os.path.join(base_dir, url))
            if not os.path.exists(target):
                print(f"  [Missing File] Broken link: {url} (resolved to {target})")
                errors += 1
    return errors

total_errors = 0
files_to_check = ["README.md", "docs/deployments.md", "docs/references.md", "docs/README.md"]
for root, dirs, files in os.walk("projects"):
    for file in files:
        if file == "PROJECT.md":
            files_to_check.append(os.path.join(root, file))
for root, dirs, files in os.walk("metadata-only"):
    for file in files:
        if file == "PROJECT.md":
            files_to_check.append(os.path.join(root, file))

for f in files_to_check:
    if os.path.exists(f):
        total_errors += validate_links_in_file(f)

if total_errors > 0:
    print(f"Validation failed with {total_errors} broken links.")
    # We shouldn't exit 1 if it's just some external site timing out, but the prompt says:
    # "The command must exit nonzero for unexpected broken links."
    exit(1)
else:
    print("All links validated successfully.")
    exit(0)
