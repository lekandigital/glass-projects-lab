import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Find all <script tags
    matches = [m.start() for m in re.finditer(r'<script', content, re.IGNORECASE)]
    print(f"Found {len(matches)} <script occurrences")
    for m in matches:
        print(content[m:m+150])
        print("="*40)
