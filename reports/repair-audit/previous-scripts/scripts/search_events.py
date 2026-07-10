import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Search for common inline handlers: e.g. onmousemove, onpointermove, onpointerdown, etc.
    handlers = re.findall(r'\bon[a-zA-Z]+=["\']?[^"\'>\s]+["\']?', content, re.IGNORECASE)
    print("Found inline handlers:", set(handlers))
    
    # Check for all occurrences of 'onpointermove' or similar in the document
    matches = [m.start() for m in re.finditer(r'pointermove|mousemove|pointerdown', content, re.IGNORECASE)]
    print(f"Found {len(matches)} occurrences of interactive event names.")
    for m in matches[:10]:
        print(content[m-100:m+100])
        print("="*40)
