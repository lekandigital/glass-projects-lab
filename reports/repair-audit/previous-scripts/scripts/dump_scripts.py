import re
import os

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"
output_dir = "deployments/glasslab-kube-liquid-glass-css-svg/extracted_scripts"
os.makedirs(output_dir, exist_ok=True)

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Extract scripts
    # Look for both inline scripts (<script>...</script>) and external scripts if any
    scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL | re.IGNORECASE)
    print(f"Extracted {len(scripts)} script blocks.")
    
    for idx, s in enumerate(scripts):
        filename = f"script_{idx}.js"
        # Determine script info by attributes of script tag if possible
        # Let's search for the script tag itself to see if it has type=module or other attributes
        # We can find script tags using a regex:
        tag_match = re.search(r'<script\b[^>]*>(?:(?!</script>).)*?</script>', content, re.DOTALL | re.IGNORECASE)
        # Actually, let's just write the contents
        out_path = os.path.join(output_dir, filename)
        with open(out_path, 'w', encoding='utf-8') as out_f:
            out_f.write(s)
        print(f"Wrote {filename} (size: {len(s)} chars)")
