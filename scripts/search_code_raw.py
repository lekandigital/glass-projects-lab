import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    keywords = ['addEventListener', 'requestAnimationFrame', 'getContext', 'Math.cos', 'displacementMapDataUrl', 'maximumDisplacement']
    for kw in keywords:
        matches = [m.start() for m in re.finditer(kw, content, re.IGNORECASE)]
        print(f"Keyword '{kw}' found {len(matches)} times")
        for m in matches[:3]:
            start = max(0, m - 100)
            end = min(len(content), m + 100)
            print(content[start:end])
            print("-" * 30)
