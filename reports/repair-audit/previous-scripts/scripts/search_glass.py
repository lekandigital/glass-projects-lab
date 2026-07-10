import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Search for url(#...) pattern
    filter_refs = re.findall(r'url\(#([^)]+)\)', content)
    print("Found filter references:", set(filter_refs))
    
    # For each reference, find the elements or style definitions referencing it
    for ref in set(filter_refs):
        matches = [m.start() for m in re.finditer(ref, content)]
        print(f"\nReference '{ref}' found {len(matches)} times")
        for m in matches[:5]:
            start = max(0, m - 150)
            end = min(len(content), m + 150)
            print(content[start:end])
            print("-" * 30)
