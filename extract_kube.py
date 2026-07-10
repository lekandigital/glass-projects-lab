import os
from bs4 import BeautifulSoup

source_path = "deployments/glasslab-kube-liquid-glass-css-svg/archive/original-singlefile.html"
target_dir = "deployments/glasslab-kube-liquid-glass-css-svg"

with open(source_path, 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Extract styles
styles = soup.find_all('style')
css_content = ""
for i, style in enumerate(styles):
    css_content += f"/* Style block {i+1} */\n"
    css_content += style.string if style.string else ""
    css_content += "\n\n"
    # Replace the style tag with nothing
    style.extract()

with open(os.path.join(target_dir, 'styles/main.css'), 'w', encoding='utf-8') as f:
    f.write(css_content)

# Extract scripts
scripts = soup.find_all('script')
js_content = ""
for i, script in enumerate(scripts):
    if not script.has_attr('src') and script.string:
        js_content += f"/* Script block {i+1} */\n"
        js_content += script.string
        js_content += "\n\n"
        script.extract()

with open(os.path.join(target_dir, 'scripts/main.js'), 'w', encoding='utf-8') as f:
    f.write(js_content)

# Add links back to the head/body
head = soup.find('head')
if head:
    link = soup.new_tag('link', rel='stylesheet', href='styles/main.css')
    head.append(link)

body = soup.find('body')
if body:
    script_tag = soup.new_tag('script', src='scripts/main.js')
    body.append(script_tag)

with open(os.path.join(target_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(str(soup))

