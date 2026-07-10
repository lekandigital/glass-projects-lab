import sys
import urllib.request

def verify(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            body = response.read().decode('utf-8', errors='ignore')
            if status == 200 and len(body.strip()) > 0:
                if "<html" in body.lower():
                    print("Status: verified")
                else:
                    print("Status: verified-with-warnings (no html tag)")
            else:
                print("Status: broken-render")
    except urllib.error.URLError as e:
        if hasattr(e, 'code') and e.code == 404:
            print("Status: http-404")
        else:
            print(f"Status: http-only (error {e})")
    except Exception as e:
        print(f"Status: deployment-failed (error {e})")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python verify-deployment.py <url>")
        sys.exit(1)
    verify(sys.argv[1])
