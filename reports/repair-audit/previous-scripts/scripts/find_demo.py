import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Check for filters
    filters = re.findall(r'<filter\s+[^>]*id=["\']?([^"\'>\s]+)["\']?', content, re.IGNORECASE)
    print("Found filters:", filters)
    
    # Check for displacement map occurrences
    matches = [m.start() for m in re.finditer(r'fedisplacementmap', content, re.IGNORECASE)]
    print(f"Found {len(matches)} occurrences of feDisplacementMap")
    for m in matches:
        # print snippet around match
        start = max(0, m - 200)
        end = min(len(content), m + 200)
        print(content[start:end])
        print("="*40)
