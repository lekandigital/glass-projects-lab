import os
import sys
import json
import time
import argparse
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

VERIFICATION_DIR = "/Users/lekan/Dev/glass-projects-lab/reports/functional-verification"

# Basic HTML server runner
class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    pass

def start_local_server(directory, port=0):
    handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(*args, directory=directory, **kwargs)
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
    ip, port = server.server_address
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server, f"http://127.0.0.1:{port}"

def get_image_diff_pixels(img1_path, img2_path):
    """Simple image pixel difference using Pillow if available."""
    try:
        from PIL import Image, ImageChops
        img1 = Image.open(img1_path).convert('RGB')
        img2 = Image.open(img2_path).convert('RGB')
        
        # Resize if dimensions differ
        if img1.size != img2.size:
            img2 = img2.resize(img1.size)
            
        diff = ImageChops.difference(img1, img2)
        # Calculate percentage of different pixels
        diff_pixels = 0
        bbox = diff.getbbox()
        if bbox:
            # there is a difference
            # get data and compute RMS or pixel differences
            hist = diff.histogram()
            # simple RMS
            import math
            sum_sq = sum(value * (idx ** 2) for idx, value in enumerate(hist))
            rms = math.sqrt(sum_sq / float(img1.size[0] * img1.size[1]))
            return rms
        return 0.0
    except Exception as e:
        # Fallback if PIL not installed or fails
        return -1.0

def verify_project(project_id, directory_to_serve, production_url=None, is_canvas_project=True):
    print(f"[{project_id}] Starting functional verification...")
    output_dir = os.path.join(VERIFICATION_DIR, project_id)
    os.makedirs(output_dir, exist_ok=True)
    
    server = None
    url = production_url
    
    if not url:
        # Start local server
        print(f"[{project_id}] Starting local server for: {directory_to_serve}")
        server, url = start_local_server(directory_to_serve)
        print(f"[{project_id}] Local server running at: {url}")
        
    console_logs = []
    network_requests = []
    failed_requests = []
    page_errors = []
    
    # Run Playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu-rasterization"])
        # Setup context with large viewport
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        # Event listeners
        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text,
            "location": msg.location
        }))
        
        page.on("requestfailed", lambda req: failed_requests.append({
            "url": req.url,
            "error_text": req.failure.error_text if req.failure else "unknown"
        }))
        
        def handle_response(res):
            network_requests.append({
                "url": res.url,
                "status": res.status,
                "headers": res.headers,
                "content_type": res.headers.get("content-type", "")
            })
        page.on("response", handle_response)
        
        page.on("pageerror", lambda err: page_errors.append({
            "message": err.message,
            "stack": err.stack
        }))
        
        try:
            # Navigate to page
            print(f"[{project_id}] Navigating to: {url}")
            response = page.goto(url, timeout=30000, wait_until="load")
            
            # Wait a small bit for any lazy resources
            page.wait_for_timeout(2000)
            
            # Record initial screenshots
            initial_path = os.path.join(output_dir, "initial.png")
            page.screenshot(path=initial_path)
            
            # Mobile viewport screenshot
            mobile_path = os.path.join(output_dir, "mobile.png")
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(500)
            page.screenshot(path=mobile_path)
            
            # Restore desktop viewport
            page.set_viewport_size({"width": 1440, "height": 900})
            page.wait_for_timeout(500)
            
            # Check basic rendering metrics
            title = page.title()
            html_content = page.content()
            html_len = len(html_content)
            body_text = page.locator("body").inner_text()
            body_text_len = len(body_text)
            
            # Check dimensions and elements
            visible_elements = page.locator("*:visible").count()
            canvas_count = page.locator("canvas").count()
            svg_count = page.locator("svg").count()
            
            # Check stylesheets count
            stylesheets_count = page.evaluate("document.styleSheets.length")
            
            # Check body styles
            body_style = page.evaluate("""() => {
                const el = document.body;
                if (!el) return {};
                const style = window.getComputedStyle(el);
                return {
                    backgroundColor: style.backgroundColor,
                    fontFamily: style.fontFamily,
                    backgroundImage: style.backgroundImage,
                    margin: style.margin,
                    display: style.display
                };
            }""")
            
            # Primary element style evaluation (first visible child or specific primary elements)
            primary_style = page.evaluate("""() => {
                const canvas = document.querySelector('canvas');
                const button = document.querySelector('button');
                const primary = canvas || button || document.querySelector('.container') || document.body.firstElementChild;
                if (!primary) return {};
                const style = window.getComputedStyle(primary);
                return {
                    tagName: primary.tagName,
                    id: primary.id,
                    className: primary.className,
                    width: style.width,
                    height: style.height,
                    position: style.position,
                    filter: style.filter,
                    backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
                    borderRadius: style.borderRadius
                };
            }""")
            
            # Interaction
            interaction_passed = True
            diff_score = 0.0
            
            if is_canvas_project:
                # Interaction: Move pointer across screen
                print(f"[{project_id}] Simulating pointer movement on canvas...")
                # Move to center
                page.mouse.move(720, 450)
                page.wait_for_timeout(100)
                
                # Capture current snapshot for diffing
                pre_interaction_path = os.path.join(output_dir, "pre_interaction.png")
                page.screenshot(path=pre_interaction_path)
                
                # Move to corner
                page.mouse.move(100, 100)
                page.wait_for_timeout(500)
                page.mouse.move(1300, 800)
                page.wait_for_timeout(500)
                
                # Capture after-interaction
                after_path = os.path.join(output_dir, "after-interaction.png")
                page.screenshot(path=after_path)
                
                # Diff screenshots
                diff_score = get_image_diff_pixels(pre_interaction_path, after_path)
                print(f"[{project_id}] Interaction visual diff score: {diff_score}")
                
                # Cleanup temporary pre-interaction screenshot
                if os.path.exists(pre_interaction_path):
                    try: os.remove(pre_interaction_path)
                    except: pass
            else:
                # Hover CSS button
                button_locator = page.locator("button, .btn, [role='button']").first
                if button_locator.count() > 0:
                    print(f"[{project_id}] Simulating hover on button...")
                    pre_interaction_path = os.path.join(output_dir, "pre_interaction.png")
                    page.screenshot(path=pre_interaction_path)
                    
                    button_locator.hover()
                    page.wait_for_timeout(500)
                    
                    after_path = os.path.join(output_dir, "after-interaction.png")
                    page.screenshot(path=after_path)
                    
                    diff_score = get_image_diff_pixels(pre_interaction_path, after_path)
                    print(f"[{project_id}] Button hover visual diff score: {diff_score}")
                    
                    if os.path.exists(pre_interaction_path):
                        try: os.remove(pre_interaction_path)
                        except: pass
                else:
                    # Hover body
                    print(f"[{project_id}] No button found, simulating pointer movement...")
                    page.mouse.move(720, 450)
                    page.wait_for_timeout(500)
                    after_path = os.path.join(output_dir, "after-interaction.png")
                    page.screenshot(path=after_path)
            
            # Asset closure verification
            # Filter assets that belong to same origin
            asset_results = []
            for req in network_requests:
                # record status code and content-type
                # check if local asset failed
                is_failed = False
                for f in failed_requests:
                    if f["url"] == req["url"]:
                        is_failed = True
                        break
                
                # A request fails when it returns 404
                if req["status"] >= 400:
                    is_failed = True
                    
                asset_results.append({
                    "url": req["url"],
                    "status": req["status"],
                    "content_type": req["content_type"],
                    "failed": is_failed
                })
            
            # Check 404s
            assets_failed_count = sum(1 for a in asset_results if a["failed"])
            
            # Assess warnings or failures
            has_unhandled_js_errors = len(page_errors) > 0
            has_console_errors = sum(1 for c in console_logs if c["type"] == "error") > 0
            
            # CSS Apply verification
            css_applied = stylesheets_count > 0 or "style" in body_style.get("display", "")
            
            # Status resolution
            final_status = "verified-functional"
            if has_unhandled_js_errors or assets_failed_count > 0:
                final_status = "broken-local-render" if not production_url else "broken-production-render"
            elif has_console_errors:
                final_status = "verified-functional-with-minor-warnings"
            
            # Check for blank screenshots (near-empty DOM / zero size elements)
            # if visible elements is tiny and HTML length is small, it's likely broken
            if visible_elements <= 2 or html_len < 100:
                final_status = "broken-local-render" if not production_url else "broken-production-render"
                
            # If interaction did not trigger visual change in a canvas shader project
            if is_canvas_project and canvas_count > 0 and diff_score == 0.0:
                # Canvas exists but shader didn't animate
                final_status = "broken-production-interaction" if production_url else "broken-local-render"
            
            result = {
                "project_id": project_id,
                "url": url,
                "status_code": response.status if response else 0,
                "title": title,
                "html_length": html_len,
                "body_text_length": body_text_len,
                "visible_element_count": visible_elements,
                "canvas_count": canvas_count,
                "svg_count": svg_count,
                "stylesheets_count": stylesheets_count,
                "body_style": body_style,
                "primary_style": primary_style,
                "css_applied": css_applied,
                "assets_failed_count": assets_failed_count,
                "console_errors_count": sum(1 for c in console_logs if c["type"] == "error"),
                "page_errors_count": len(page_errors),
                "interaction_diff_score": diff_score,
                "final_status": final_status
            }
            
            # Save files
            with open(os.path.join(output_dir, "result.json"), "w") as f:
                json.dump(result, f, indent=2)
            with open(os.path.join(output_dir, "console.json"), "w") as f:
                json.dump(console_logs, f, indent=2)
            with open(os.path.join(output_dir, "network.json"), "w") as f:
                json.dump(network_requests, f, indent=2)
            with open(os.path.join(output_dir, "assets.json"), "w") as f:
                json.dump(asset_results, f, indent=2)
            with open(os.path.join(output_dir, "page_errors.json"), "w") as f:
                json.dump(page_errors, f, indent=2)
            with open(os.path.join(output_dir, "interaction.json"), "w") as f:
                json.dump({"diff_score": diff_score, "is_canvas_project": is_canvas_project}, f, indent=2)
                
            print(f"[{project_id}] Verification finished with status: {final_status}")
            return result
            
        except Exception as e:
            print(f"[{project_id}] Playwright error: {e}")
            err_result = {
                "project_id": project_id,
                "url": url,
                "final_status": "broken-local-render" if not production_url else "broken-production-render",
                "error": str(e)
            }
            with open(os.path.join(output_dir, "result.json"), "w") as f:
                json.dump(err_result, f, indent=2)
            return err_result
        finally:
            browser.close()
            if server:
                server.shutdown()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Functional Project Verifier using Playwright")
    parser.add_argument("--project-id", required=True, help="Unique ID of project")
    parser.add_argument("--dir", required=True, help="Directory to serve locally")
    parser.add_argument("--url", help="Optional production URL to verify directly")
    parser.add_argument("--canvas", type=bool, default=True, help="Is canvas / shader interaction expected")
    args = parser.parse_args()
    
    verify_project(args.project_id, args.dir, args.url, args.canvas)
