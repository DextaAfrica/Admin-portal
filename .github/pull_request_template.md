## 📋 Summary of Changes
<!-- Provide a concise description of the changes introduced in this PR -->

## 🎯 Target Branch & Workflow Alignment
- [ ] This PR targets **`develop`** (for all standard features/fixes), OR
- [ ] This PR targets **`main`** (strictly for staging release promotions from `develop` or critical `hotfix/*`)

## 🏷️ Change Category
- [ ] `feat`: New feature or capability
- [ ] `fix`: Bug fix
- [ ] `refactor`: Code refactoring without behavior change
- [ ] `perf`: Performance improvement
- [ ] `ci` / `devops`: Docker, GitHub Actions, or deployment configuration
- [ ] `docs`: Documentation updates

## 🧪 Verification & Testing
- [ ] `npm run typecheck` passes with zero TypeScript errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds in standalone mode
- [ ] Docker build verified locally (`docker build .`) or via Docker Compose
- [ ] Healthcheck endpoint (`/api/health`) verified

## 🔒 Security & Quality Checklist
- [ ] No secrets, keys, or passwords committed in plaintext
- [ ] Database migrations or schema updates are backward-compatible
- [ ] Responsive UI verified on mobile and desktop

