# Session 004 — Phase 01 Scaffold Learnings
**Date:** March 8, 2026
**Status:** Complete — Phase 01 stabilized

---

## Tools Used in Phase 01

### Monorepo and Package Management
- **pnpm**: workspace package manager for `apps/*` and `packages/*`
- **Turborepo**: orchestration for `dev`, `build`, `lint`, `typecheck`

### App Frameworks
- **Next.js 14 (App Router)** for `apps/web`
- **Plasmo** (Manifest V3) for `apps/extension`

### Language and Build
- **TypeScript 5** across all apps/packages
- **Tailwind CSS 3** in `apps/web`

### Shared Packages
- `@toprompt/types`: shared domain types (`Prompt`, `PromptCategory`, `User`)
- `@toprompt/db`: Drizzle placeholder schema/config/client export
- `@toprompt/ui`: shared reusable UI components

### Quality Tooling
- **ESLint** at root with shared config
- **Prettier** at root with shared formatting rules

---

## Problems We Ran Into (and Fixes)

### 1. `pnpm` was not installed
**Symptom:** `pnpm: command not found`

**Fix:** Installed pnpm via Homebrew.

---

### 2. Corepack permission error on macOS
**Symptom:**
`corepack enable` failed with:
`EACCES: permission denied ... -> /usr/local/bin/pnpm`

**Fix:** Use Homebrew pnpm install instead of relying on Corepack in this environment.

---

### 3. Wrong Plasmo package name
**Symptom:**
`ERR_PNPM_FETCH_404` for `@plasmohq/sdk`

**Root Cause:** `@plasmohq/sdk` is not the install target for this setup.

**Fix:** Switched dependency to `plasmo` in `apps/extension/package.json`.

---

### 4. Plasmo dev failed due to missing icons
**Symptom:**
Failed to resolve generated icon files in `.plasmo` (e.g. `icon16.plasmo.png`).

**Fix:** Added `apps/extension/assets/icon.png` placeholder asset so Plasmo can generate required icon sizes.

---

### 5. Lint failed with huge error count in extension
**Symptom:**
`pnpm lint` reported ~1,300+ errors from generated files.

**Root Cause:** ESLint was linting generated extension artifacts (`.plasmo`, parcel cache/build outputs).

**Fix:** Updated root ESLint `ignorePatterns` to exclude generated folders:
- `**/.plasmo/**`
- `**/.parcel-cache/**`
- `**/build/**`

---

### 6. Extension typecheck failed on manifest import
**Symptom:**
`Cannot find module '@plasmohq/config'` in `manifest.ts`

**Fix:** Removed `manifest.ts` and moved manifest config into `apps/extension/package.json` under `manifest`.

---

### 7. Non-blocking warnings during install/build
- Node deprecation warning (`url.parse`) during install
- Plasmo transitive peer dependency warnings (`svgo`, `srcset`)
- Next.js warning about ESLint plugin detection

**Outcome:** These did not block `dev`, `build`, `lint`, or `typecheck` after the above fixes.

---

## Final Phase 01 Validation

Confirmed working:
- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

---

## Recommendations for Next Sessions

1. Keep extension assets (`apps/extension/assets/icon.png`) in place to avoid Plasmo manifest failures.
2. Keep generated directories excluded in ESLint to prevent noise.
3. Prefer static manifest in `package.json` unless `@plasmohq/config` is explicitly installed and version-verified.
4. Continue using root scripts (`pnpm dev/build/lint/typecheck`) so Turbo enforces workspace consistency.
