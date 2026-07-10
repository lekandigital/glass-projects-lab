import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Let's search for sections containing code styling or pre blocks
    # E.g. <pre> or <code> blocks
    code_blocks = re.findall(r'<pre\b[^>]*>(.*?)</pre>', content, re.DOTALL | re.IGNORECASE)
    print(f"Found {len(code_blocks)} code blocks in the article text")
    
    # Print the first few characters of each code block to see what it is
    for idx, cb in enumerate(code_blocks):
        # strip HTML tags to get pure text if it contains syntax highlighting
        clean_cb = re.sub(r'<[^>]+>', '', cb)
        print(f"\n--- Code Block {idx} (size: {len(clean_cb)} chars) ---")
        print(clean_cb[:300].strip())
        print("...")
