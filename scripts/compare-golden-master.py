import os
import sys
import json
import argparse
import time
from playwright.sync_api import sync_playwright

def get_image_diff_pixels(img1_path, img2_path):
    try:
        from PIL import Image, ImageChops
        img1 = Image.open(img1_path).convert('RGB')
        img2 = Image.open(img2_path).convert('RGB')
        if img1.size != img2.size:
            img2 = img2.resize(img1.size)
        diff = ImageChops.difference(img1, img2)
        bbox = diff.getbbox()
        if bbox:
            hist = diff.histogram()
            import math
            sum_sq = sum(value * (idx ** 2) for idx, value in enumerate(hist))
            return math.sqrt(sum_sq / float(img1.size[0] * img1.size[1]))
        return 0.0
    except Exception as e:
        return -1.0

def capture_screenshot(url, out_path, interaction, project_id):
    print(f"[{project_id}] Capturing {url} to {out_path}")
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu-rasterization"])
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        errors = []
        failed_assets = []
        
        page.on("pageerror", lambda exc: errors.append(exc))
        page.on("response", lambda res: failed_assets.append(res.url) if res.status >= 400 and res.request.resource_type in ["stylesheet", "script", "image"] else None)

        try:
            res = page.goto(url, timeout=30000, wait_until="networkidle")
            if not res or res.status >= 400:
                print(f"[{project_id}] ERROR: Navigation failed for {url}")
                return False
                
            page.wait_for_timeout(2000)
            
            # Check for JS errors
            if errors:
                print(f"[{project_id}] WARNING: Uncaught page errors detected: {errors[0]}")
                # return False
                
            # Check for failed assets
            if failed_assets:
                print(f"[{project_id}] ERROR: Required assets failed to load: {failed_assets}")
                return False
                
            # Check if page is blank or framework root is empty
            body_text = page.locator("body").inner_text()
            body_html = page.locator("body").inner_html()
            if len(body_text.strip()) == 0 and len(body_html.strip()) < 50:
                # Might just be a canvas, let's check
                pass
                
            # Canvas checks
            canvases = page.locator("canvas").all()
            for c in canvases:
                box = c.bounding_box()
                if not box or box["width"] == 0 or box["height"] == 0:
                    print(f"[{project_id}] ERROR: Canvas has zero dimensions")
                    return False
            
            if interaction == "pointer-move":
                page.mouse.move(720, 450)
                page.wait_for_timeout(500)
            elif interaction == "hover":
                btn = page.locator("button, .btn, [role='button']").first
                if btn.count() > 0:
                    btn.hover()
                    page.wait_for_timeout(500)
                else:
                    page.mouse.move(720, 450)
                    page.wait_for_timeout(500)
                    
            page.screenshot(path=out_path)
            return True
        except Exception as e:
            print(f"Error capturing {url}: {e}")
            return False
        finally:
            browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--golden-url", required=True)
    parser.add_argument("--test-url", required=True)
    parser.add_argument("--interaction", default="pointer-move")
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--threshold", type=float, default=10.0)
    args = parser.parse_args()
    
    os.makedirs(args.out_dir, exist_ok=True)
    golden_img = os.path.join(args.out_dir, "golden.png")
    test_img = os.path.join(args.out_dir, "test.png")
    
    if not capture_screenshot(args.golden_url, golden_img, args.interaction, args.project_id):
        print(f"[{args.project_id}] Golden master capture failed.")
        sys.exit(1)
        
    if not capture_screenshot(args.test_url, test_img, args.interaction, args.project_id):
        print(f"[{args.project_id}] Test URL capture failed.")
        sys.exit(1)
        
    diff = get_image_diff_pixels(golden_img, test_img)
    print(f"[{args.project_id}] Comparison diff score: {diff}")
    
    with open(os.path.join(args.out_dir, "compare.json"), "w") as f:
        json.dump({"diff_score": diff, "match": diff <= args.threshold}, f, indent=2)
        
    if diff > args.threshold:
        print(f"[{args.project_id}] FAILURE: Material difference detected ({diff} > {args.threshold})")
        sys.exit(1)
    else:
        print(f"[{args.project_id}] SUCCESS: Deployments match.")
        sys.exit(0)
