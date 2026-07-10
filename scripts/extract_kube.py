import re

raw_path = "deployments/glasslab-kube-liquid-glass-css-svg/upstream/kube-raw.html"

with open(raw_path, 'r', encoding='utf-8') as f:
    # Read block by block or find patterns
    content = f.read()
    print(f"File size: {len(content)} chars")
    
    # 1. Find all <style> blocks
    styles = re.findall(r'<style>(.*?)</style>', content, re.DOTALL)
    print(f"Found {len(styles)} style blocks")
    for idx, s in enumerate(styles):
        print(f"Style block {idx}: size {len(s)}")
        # print first 200 chars
        print(s[:200].strip())
        print("...")
        
    # 2. Find all <script> blocks
    scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
    print(f"Found {len(scripts)} script blocks")
    for idx, s in enumerate(scripts):
        print(f"Script block {idx}: size {len(s)}")
        print(s[:200].strip())
        print("...")
        
    # 3. Find any inline SVG
    svgs = re.findall(r'<svg (.*?)</svg>', content, re.DOTALL)
    print(f"Found {len(svgs)} SVG blocks")
    for idx, s in enumerate(svgs):
        print(f"SVG block {idx}: size {len(s)}")
        print(s[:300].strip())
        print("...")
