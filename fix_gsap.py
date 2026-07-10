import os, glob

for project_dir in glob.glob("deployments/*"):
    html_file = os.path.join(project_dir, "index.html")
    js_file = os.path.join(project_dir, "script.js")
    if os.path.exists(html_file) and os.path.exists(js_file):
        with open(js_file, "r") as f:
            js_content = f.read()
        if "gsap" in js_content:
            with open(html_file, "r") as f:
                html_content = f.read()
            if "gsap.min.js" not in html_content:
                print(f"Injecting GSAP into {html_file}")
                # Inject before <script src="./script.js"> or </body>
                injection = '\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>\n'
                if '<script src="./script.js"' in html_content:
                    html_content = html_content.replace('<script src="./script.js"', injection + '  <script src="./script.js"')
                elif '<script type="module" src="./script.js"' in html_content:
                    html_content = html_content.replace('<script type="module" src="./script.js"', injection + '  <script type="module" src="./script.js"')
                else:
                    html_content = html_content.replace('</body>', injection + '</body>')
                with open(html_file, "w") as f:
                    f.write(html_content)
