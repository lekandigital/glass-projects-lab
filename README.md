# Glass Projects Lab

A comprehensive collection of interactive WebGL, Canvas, CSS, and React-based glassmorphism projects and experiments.

## Deployment Status
**Repaired and Functional**

The automated deployment pipeline has been forensically rebuilt to correctly handle the disparate nature of these experiments. The pipeline now categorizes, reconstructs, locally builds, and verifies all candidates (via Playwright) before pushing them to production.

- **Fragments & CodePens**: Raw HTML fragments have been wrapped in boilerplate. Missing `package.json` dependencies and JSX imports are now bootstrapped into complete Vite projects.
- **Monorepos**: Workspaces like `liquid-dom-master` compile fully at their respective root directories. Isolated sub-packages and libraries are skipped for Vercel deployment, ensuring only proper applications are served.
- **Verification**: All deployments are subjected to zero-tolerance console error checks, 404 asset checks, and canvas interaction visual diffing.

## Tools
- `scripts/inventory-projects-v2.py`: Scans and categorizes raw code candidates.
- `scripts/reconstruct-projects.py`: Builds the missing framework components.
- `scripts/verify-project-functional.py`: Local Playwright validation test.
- `scripts/deploy-and-verify-all.py`: Orchestrator for local build -> test -> Vercel deploy.
