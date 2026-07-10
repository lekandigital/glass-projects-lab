import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

const [, , projectId, recipePath, destPath] = process.argv;

if (!projectId || !recipePath || !destPath) {
  console.error("Usage: node prepare-deployment-from-golden-master.mjs <projectId> <recipe.json> <destPath>");
  process.exit(1);
}

const recipe = JSON.parse(fs.readFileSync(recipePath, 'utf8'));
const sourceRoot = path.resolve(recipe.source_root);
const absoluteDest = path.resolve(destPath);

// 1. Validate source exists
if (!fs.existsSync(sourceRoot)) {
  console.error(`Source does not exist: ${sourceRoot}`);
  process.exit(1);
}

// 2. Refuse protected directories as destinations
const protectedDirs = [
  '/Users/lekan/Dev/aero-twitter-glass-lab/_reference_vault',
  '/Users/lekan/Dev/aero-twitter-glass-lab/.raw-reference-runners/repos',
  '/Users/lekan/Dev/aero-twitter-glass-lab/public/raw-reference-lab',
  '/Users/lekan/Dev/glass-projects-lab/originals',
  '/Users/lekan/Downloads/projects-glass'
];

if (protectedDirs.some(dir => absoluteDest.startsWith(path.resolve(dir)))) {
  console.error(`Cannot use protected directory as destination: ${absoluteDest}`);
  process.exit(1);
}

// 3. Copy the functional boundary
fs.mkdirSync(absoluteDest, { recursive: true });

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  
  const basename = path.basename(src);
  if (['.git', '.vercel', 'node_modules', 'logs'].includes(basename) || basename.endsWith('.pid') || basename.endsWith('.log')) {
    return;
  }

  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const upstreamDir = path.join(absoluteDest, 'upstream');
fs.mkdirSync(upstreamDir, { recursive: true });
console.log(`Copying from ${sourceRoot} to ${upstreamDir}`);
copyRecursive(sourceRoot, upstreamDir);

// Checksums
function hashDirectory(dir) {
  const hash = crypto.createHash('sha256');
  const files = [];
  function readDir(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        readDir(full);
      } else {
        files.push(full);
      }
    }
  }
  readDir(dir);
  files.sort();
  for (const f of files) {
    hash.update(f.replace(dir, ''));
    hash.update(fs.readFileSync(f));
  }
  return hash.digest('hex');
}

const checksum = hashDirectory(upstreamDir);
console.log(`Upstream checksum: ${checksum}`);

// 9. Apply explicitly declared adapter
const adapter = recipe.adapter;

if (adapter === 'none') {
  // Just serve the upstream directly from root or do a root rewrite
  console.log('Adapter: none. Using upstream directly.');
  // Copy upstream content to root of absoluteDest or generate a vercel.json that points to upstream
  fs.writeFileSync(path.join(absoluteDest, 'vercel.json'), JSON.stringify({
    "rewrites": [{ "source": "/(.*)", "destination": "/upstream/$1" }]
  }, null, 2));
} else if (adapter === 'root-rewrite') {
  fs.writeFileSync(path.join(absoluteDest, 'vercel.json'), JSON.stringify({
    "rewrites": [{ "source": "/(.*)", "destination": `/upstream/${recipe.entrypoint}` }]
  }, null, 2));
} else if (adapter === 'codepen-fragment-wrapper') {
  const htmlWrapper = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preserved demo</title>
  <link rel="stylesheet" href="./upstream/${recipe.css_file || 'style.css'}">
</head>
<body>
  <!-- Embedded from CodePen -->
  ${fs.existsSync(path.join(upstreamDir, recipe.html_file || 'index.html')) ? fs.readFileSync(path.join(upstreamDir, recipe.html_file || 'index.html'), 'utf8') : ''}
  <script src="./upstream/${recipe.js_file || 'script.js'}"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(absoluteDest, 'index.html'), htmlWrapper);
} else if (adapter === 'framework-build' || adapter === 'workspace-demo') {
  // Add a deployment vercel.json or just configure Vercel settings remotely
  // We will leave the source untouched, vercel will build it.
  fs.writeFileSync(path.join(absoluteDest, 'vercel.json'), JSON.stringify({
    "buildCommand": `cd upstream && ${recipe.build_command}`,
    "outputDirectory": `upstream/${recipe.output_directory}`
  }, null, 2));
} else if (adapter === 'codepen-generated-entry') {
  fs.writeFileSync(path.join(absoluteDest, 'vercel.json'), JSON.stringify({
    "rewrites": [{ "source": "/(.*)", "destination": "/upstream/entry.html" }]
  }, null, 2));
} else {
  console.error(`Unknown adapter: ${adapter}`);
  process.exit(1);
}

// 11. Produce IMPORT.md
const importContent = `# Import Record for ${projectId}
- Adapter: ${adapter}
- Source Checksum: ${checksum}
- Timestamp: ${new Date().toISOString()}
- Golden Master JSON:
\`\`\`json
${JSON.stringify(recipe, null, 2)}
\`\`\`
`;
fs.writeFileSync(path.join(absoluteDest, 'IMPORT.md'), importContent);

console.log("Preparation complete.");
