from playwright.sync_api import sync_playwright
import os

os.makedirs("docs/images", exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"file://{os.path.abspath('gallery/index.html')}")
    page.screenshot(path="docs/images/gallery-preview.png", full_page=True)
    browser.close()
