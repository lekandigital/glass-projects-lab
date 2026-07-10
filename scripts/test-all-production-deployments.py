import json
import subprocess
import sys

with open("catalog/projects.json", "r") as f:
    projects = json.load(f)

errors = 0

for p in projects:
    if p.get("verified", False) and p.get("live_url"):
        url = p["live_url"]
        print(f"Testing {url}...")
        
        script = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let hasErrors = false;
  
  page.on('pageerror', err => {{
    console.error('Page error: ' + err.message);
    hasErrors = true;
  }});
  
  page.on('response', resp => {{
    if (resp.status() >= 400 && 
        !resp.url().includes('favicon') &&
        !resp.url().includes('vercel.com') &&
        !resp.url().includes('sentry.io') &&
        !resp.url().includes('google-analytics')) {{
      console.error('Failed asset: ' + resp.url());
      hasErrors = true;
    }}
  }});
  
  try {{
    await page.goto('{url}', {{ waitUntil: 'networkidle', timeout: 15000 }});
    const bodyText = await page.evaluate(() => document.body.innerText);
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    if (bodyHTML.length < 50 && bodyText.trim().length === 0) {{
      console.error('Page seems empty');
      hasErrors = true;
    }}
  }} catch (err) {{
    console.error('Navigation failed: ' + err.message);
    hasErrors = true;
  }}
  
  await browser.close();
  if (hasErrors) process.exit(1);
}})();
"""
        with open("temp_test.js", "w") as tf:
            tf.write(script)
            
        res = subprocess.run(["node", "temp_test.js"], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"FAIL: {url}\\n{{res.stderr}}")
            errors += 1
        else:
            print(f"PASS: {url}")

if errors > 0:
    print(f"Validation failed with {{errors}} errors.")
    sys.exit(1)
else:
    print("All production deployments passed.")
    sys.exit(0)
