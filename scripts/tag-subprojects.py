#!/usr/bin/env python3
"""Put the "Follow on GitHub" tab (gh-follow.js) on every glass-projects-lab-* sub-project.

The sub-projects are CLI deploys, and their live production uploads already carry PostHog:
mostly static uploads (vercel.json + public/), one prebuilt Next.js output (.vercel/output) and
one Next.js pages-router source (PostHog in pages/_document). Rebuilding them from this repo
would drop PostHog, so instead this downloads the live upload, adds FOLLOW_TAG to every HTML
page (or the _document <Head>) and, with --deploy, ships it back to production with the Vercel
CLI. A tag pointing at an older FOLLOW_SRC is repointed, pages already on FOLLOW_SRC are left
alone, and a project with nothing to change is not redeployed, so re-running is safe.

usage: python3 scripts/tag-subprojects.py [--deploy] [--work DIR] [NAME ...]
       no NAME = every glass-projects-lab-* project with a production deployment, plus EXTRA.
"""
import base64, hashlib, json, os, re, shutil, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

# Served from the public repo by jsDelivr, not from glass-projects-lab.vercel.app: when Vercel's
# DDoS mitigation challenges that host, a browser can solve the challenge for a page but not for a
# cross-site <script> (each *.vercel.app is its own site, so the challenge cookie isn't sent), and
# the tab would vanish from every sub-project. After changing gh-follow.js, push main, wait a
# minute (a purge sent right after the push can re-cache the old commit), then purge:
#   curl https://purge.jsdelivr.net/gh/lekandigital/glass-projects-lab@main/gh-follow.js
FOLLOW_SRC = 'https://cdn.jsdelivr.net/gh/lekandigital/glass-projects-lab@main/gh-follow.js'
FOLLOW_TAG = f'<script src="{FOLLOW_SRC}" defer></script>'
OLD_SRC = re.compile(r'https?://[^"\']*?/gh-follow\.js')
DOCUMENT = re.compile(r'(^|/)pages/_document\.[jt]sx?$')
EXTRA = ['liquid-glass-web-react']  # serves glass-projects-lab-liquid-glass-web-react.vercel.app
HERE = os.path.dirname(os.path.abspath(__file__))
TEAM = json.load(open(os.path.join(HERE, '..', '.vercel', 'project.json')))['orgId']
TOKEN = json.load(open(os.path.expanduser('~/Library/Application Support/com.vercel.cli/auth.json')))['token']


def api(path, **params):
    url = f'https://api.vercel.com{path}?' + urllib.parse.urlencode({**params, 'teamId': TEAM})
    for attempt in range(8):
        try:
            req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == 7: raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 7: raise
        time.sleep(3 * (attempt + 1))


def flatten(nodes, prefix=''):
    for n in nodes:
        if n['type'] == 'directory': yield from flatten(n.get('children', []), prefix + n['name'] + '/')
        else: yield prefix + n['name'], n


def taggable(path):
    return '/node_modules/' not in '/' + path and (path.lower().endswith(('.html', '.htm')) or DOCUMENT.search(path))


def inject(path, html):
    if FOLLOW_SRC in html: return None
    if 'gh-follow.js' in html: return OLD_SRC.sub(FOLLOW_SRC, html)
    if DOCUMENT.search(path):
        m = re.search(r'<Head[^>]*>', html)
        return m and html[:m.end()] + f'\n        <script src="{FOLLOW_SRC}" defer />' + html[m.end():]
    for pat in (r'</head\s*>', r'<head[^>]*>', r'<html[^>]*>'):
        m = re.search(pat, html, re.I)
        if m:
            at = m.start() if pat.startswith('</') else m.end()
            return html[:at] + FOLLOW_TAG + html[at:]
    m = re.match(r'\s*<!doctype[^>]*>', html, re.I)
    at = m.end() if m else 0
    return html[:at] + FOLLOW_TAG + html[at:]


def pull(name, work):
    """Download the live upload into work/NAME and tag it. Returns (dest, pages tagged) or (None, reason)."""
    proj = api(f'/v9/projects/{name}')
    prod = (proj.get('targets') or {}).get('production')
    if not prod: return None, 'no production deployment'
    dep = prod['id']
    tree = api(f'/v6/deployments/{dep}/files')
    src = next((n for n in tree if n['name'] == 'src'), None)
    files = dict(flatten(src['children'])) if src else {}
    if not any(taggable(p) for p in files): return None, 'no HTML page or pages/_document in the upload'
    dest = os.path.join(work, name)
    shutil.rmtree(dest, ignore_errors=True)

    def get(item):
        path, node = item
        p = os.path.join(dest, path)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        data = base64.b64decode(api(f'/v7/deployments/{dep}/files/{node["uid"]}')['data'])
        if hashlib.sha1(data).hexdigest() != node['uid']: raise RuntimeError(f'{name}: {path} does not match its sha')
        if node['type'] == 'symlink': os.symlink(data.decode(), p)
        else:
            with open(p, 'wb') as f: f.write(data)
            os.chmod(p, node['mode'] & 0o777)
    with ThreadPoolExecutor(8) as ex: list(ex.map(get, files.items()))

    pages = 0
    for path in files:
        if not taggable(path) or files[path]['type'] == 'symlink': continue
        p = os.path.join(dest, path)
        html = open(p, 'rb').read().decode('utf-8', 'surrogateescape')
        out = inject(path, html)
        if out is not None:
            with open(p, 'wb') as f: f.write(out.encode('utf-8', 'surrogateescape'))
            pages += 1
    os.makedirs(os.path.join(dest, '.vercel'), exist_ok=True)
    json.dump({'projectId': proj['id'], 'orgId': TEAM, 'projectName': name}, open(os.path.join(dest, '.vercel', 'project.json'), 'w'))
    return dest, pages


def main():
    args = sys.argv[1:]
    deploy = '--deploy' in args
    work = os.path.expanduser('~/.cache/glass-projects-lab/subprojects')
    if '--work' in args: work = args[args.index('--work') + 1]
    names = [a for a in args if not a.startswith('--') and a != work]
    if not names:
        found = api('/v9/projects', search='glass-projects-lab', limit=100)['projects']
        names = sorted(p['name'] for p in found if p['name'].startswith('glass-projects-lab-')) + EXTRA
    with ThreadPoolExecutor(4) as ex:
        pulled = list(ex.map(lambda n: (n, *pull(n, work)), names))
    failed = 0
    for name, dest, pages in pulled:
        if dest is None:
            print(f'{name:45} skip: {pages}')
            continue
        if not pages:
            print(f'{name:45} already tagged')
            continue
        if not deploy:
            print(f'{name:45} {pages} pages tagged in {dest}')
            continue
        prebuilt = ['--prebuilt'] if os.path.exists(os.path.join(dest, '.vercel', 'output', 'config.json')) else []
        r = subprocess.run(['vercel', 'deploy', '--prod', '--yes', *prebuilt], cwd=dest, capture_output=True, text=True)
        url = (r.stdout.strip().splitlines() or [''])[-1]
        print(f'{name:45} {pages} pages tagged, deploy rc={r.returncode} {url}', flush=True)
        if r.returncode:
            failed += 1
            print(r.stderr[-1500:])
    sys.exit(1 if failed else 0)


main()
