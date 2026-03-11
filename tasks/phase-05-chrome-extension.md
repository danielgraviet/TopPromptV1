# Phase 05 — Chrome Extension
**Status:** In progress
**Depends on:** Phase 03 (core web app — tRPC API must be live)
**Blocks:** Nothing (can run in parallel with Phase 06+)

---

## Goal

Build the Chrome extension using Plasmo. The extension is the primary distribution moat — it embeds TopPrompt into the developer's existing AI workflow. A user on Claude.ai, ChatGPT, or any text-based AI tool can open the extension, search for a prompt, and insert it into the active input field with one click.

---

## Context

See `learnings/session-001-product-direction.md`:
> Chrome extension — insert prompts directly into Claude.ai / ChatGPT from a sidebar. Habit-forming, embedded in existing workflow. This is the core distribution mechanism.

The extension lives in `apps/extension/` (scaffolded in Phase 01 with Plasmo).

It shares:
- `@toprompt/types` — Prompt and User types
- Calls the live web app tRPC API (not a separate extension API)

---

## Packages

```
plasmo (already installed)
@trpc/client
@tanstack/react-query  (listed but see design decision below)
@toprompt/types
webextension-polyfill  (listed but see design decision below)
```

---

## Design Decisions

These decisions were made during implementation planning. Each one is a deliberate tradeoff, documented here so future engineers understand why the code looks the way it does.

### 1. AppRouter type import via relative path

**Decision:** Import `AppRouter` from `'../../../apps/web/server/routers'` (relative cross-workspace path, type-only).

**Reasoning:** The extension needs full type-safety for every tRPC procedure — argument shapes, return types, errors — without duplicating the router definition. Since this is a `type`-only import, TypeScript erases it at compile time and nothing is bundled into the extension at runtime. The extension's `tsconfig.json` already inherits `../../tsconfig.base.json`, so the path resolves correctly in the monorepo. The alternative (publishing `AppRouter` as a separate package) adds unnecessary overhead for an internal tool.

**Tradeoff:** The path is fragile — if `apps/web/server/routers/index.ts` moves, this breaks. Acceptable for an internal monorepo; add a comment in `lib/api.ts` pointing to this file.

### 2. Vanilla tRPC client instead of React Query + tRPC provider

**Decision:** Use `createTRPCClient` from `@trpc/client` with plain `useState`/`useEffect` in the popup. Do NOT set up the full `@trpc/react-query` + `QueryClientProvider` stack.

**Reasoning:** The Plasmo popup is a plain React app with a small surface area — a search input, a list of prompts, and two buttons. The full React Query provider stack (QueryClient, TRPCProvider, dehydration, etc.) adds significant boilerplate for minimal benefit at this scale. `useState` + `useEffect` is simpler, easier to debug, and sufficient. `@tanstack/react-query` is still listed as a dependency in case a future engineer wants to upgrade, but it is not wired up in the initial implementation.

**Tradeoff:** No automatic cache invalidation, background refetching, or request deduplication. Acceptable for MVP; the popup is short-lived (opens, does one fetch, closes).

### 3. Auth via simplified session token, not raw JWT

**Decision:** The extension-callback page reads the Next-auth session server-side and writes `userId` + `email` to `chrome.storage.local` via postMessage. The extension sends `userId` as a header on API requests. tRPC procedures trust it as an identity signal (not a cryptographic proof).

**Reasoning:** Getting a raw JWT or session token out of Next-auth v5 (beta) requires non-trivial configuration and exposes sensitive tokens in URL params (a security risk). The simplified approach reuses the existing Auth.js session check on the server, which is already secure. For MVP, the API surface is low-risk (fetching public prompts, saving prompts for a known user). A production hardening pass (Phase 08) can add signed tokens if needed.

**Tradeoff:** The extension identity is not cryptographically verified end-to-end. A user could spoof a `userId` header. Mitigated by the fact that tRPC protected procedures verify the session server-side — the header is only used to pass an already-authenticated identity, not to authenticate.

**Web app change required:** Add `apps/web/app/auth/extension-callback/page.tsx` — a server component that reads the session and emits a `postMessage` with `{ type: 'TOPROMPT_AUTH', userId, email, name, image }` to the extension.

### 4. Insert falls back to clipboard copy on unsupported tabs

**Decision:** If `chrome.tabs.sendMessage` fails (tab is not a supported site, or content script is not injected), the Insert button silently falls back to copying the prompt text to the clipboard and shows a toast.

**Reasoning:** The content script only runs on the declared `matches` hosts (Claude, ChatGPT, etc.). If a user clicks Insert while on a different tab, the message will throw. Rather than showing an error that confuses users, copy to clipboard is always a safe fallback — the user can paste manually. This also handles the fragility noted in the spec: when AI tool UIs change and injection breaks, users are not left with a broken button.

### 5. `webextension-polyfill` omitted

**Decision:** Do not add `webextension-polyfill`.

**Reasoning:** Plasmo targets Chrome MV3 exclusively. Chrome MV3 ships the `chrome.*` namespace natively, and `@types/chrome` provides full TypeScript types. The polyfill is needed when targeting Firefox (which uses `browser.*`) or older MV2 APIs. Adding it now would be unused weight. Revisit if Firefox support is added in a future phase.

---

## Tasks

### 1. Extension Architecture

Files to create:

```
apps/extension/
  popup.tsx           ← main extension popup UI (replace scaffold)
  content.ts          ← content script injected into AI tool pages
  background.ts       ← service worker (OAuth callback + session save)
  lib/api.ts          ← vanilla tRPC client
```

Web app file to create:

```
apps/web/app/auth/extension-callback/page.tsx
```

**Communication flow:**
1. User clicks extension icon → popup opens
2. Popup fetches trending prompts from TopPrompt API via `lib/api.ts`
3. User clicks "Insert" → popup sends `chrome.tabs.sendMessage` to content script
4. Content script inserts prompt text into the active input
5. If tab is unsupported → popup falls back to clipboard copy

### 2. Popup UI

The popup is the main interface. It opens as a small panel (400px wide).

**Layout:**
```
[TopPrompt logo]  [Sign in / Avatar]
[Search input]
[Category filter pills: All | Coding | Debugging | DevOps ...]
[Prompt list]
  [Prompt card]
    [Title]
    [Description — 1 line truncated]
    [Model tags]
    [Insert button]  [Copy button]
[Load more]
```

**Behavior:**
- On open: fetch trending prompts (no auth required)
- Search input: debounced 300ms, queries tRPC `prompts.search`
- Category pills: filter via tRPC `prompts.byCategory`
- "Insert" button: sends message to content script; falls back to clipboard
- "Copy" button: always copies to clipboard

**State management:**
- Plain `useState`/`useEffect` with the vanilla tRPC client
- Auth state read from `chrome.storage.local` on mount

### 3. Content Script (`content.ts`)

The content script runs on supported pages and handles prompt injection.

**Supported sites:**
```typescript
// LAST_VERIFIED per host — update this comment when selectors are confirmed working
// claude.ai       — verified 2026-03-10
// chatgpt.com     — verified 2026-03-10
// gemini.google.com — verified 2026-03-10
```

Manifest matches declared in `package.json` `manifest.content_scripts`.

**Injection logic:**
```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'INSERT_PROMPT') {
    insertPrompt(message.text)
  }
})

function insertPrompt(text: string) {
  const editor =
    document.querySelector('[contenteditable="true"]') ||
    document.querySelector('textarea')

  if (!editor) return

  if (editor.tagName === 'TEXTAREA') {
    (editor as HTMLTextAreaElement).value = text
    editor.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    editor.textContent = text
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }))
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }
}
```

### 4. Auth in the Extension

**Flow:**
1. Popup checks `chrome.storage.local` for `{ userId, email, name, image }`
2. If absent, show "Sign in with GitHub" button
3. On click, open a new tab to `https://topprompt.dev/auth/extension-callback`
4. User signs in via GitHub OAuth (existing Auth.js flow)
5. Extension-callback page reads the Next-auth session server-side, then calls `window.postMessage({ type: 'TOPROMPT_AUTH', userId, email, name, image })`
6. Background service worker has a content script on the callback page that forwards the postMessage to `chrome.runtime.sendMessage`
7. Background script saves the identity to `chrome.storage.local`
8. Popup polls `chrome.storage.local` and re-renders with the authenticated state

**Web app change:**
- `apps/web/app/auth/extension-callback/page.tsx` — reads session, emits postMessage, then closes the tab

### 5. API Client in Extension

```typescript
// apps/extension/lib/api.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../apps/web/server/routers'

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://topprompt.dev/api/trpc',
      headers: async () => {
        const stored = await chrome.storage.local.get('toprompt_user')
        const user = stored.toprompt_user as { userId: string } | undefined
        return user ? { 'x-extension-user-id': user.userId } : {}
      },
    }),
  ],
})
```

### 6. Plasmo Manifest Configuration

Update `apps/extension/package.json`:

```json
{
  "permissions": ["activeTab", "storage", "scripting"],
  "host_permissions": [
    "https://claude.ai/*",
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://gemini.google.com/*",
    "https://topprompt.dev/*"
  ],
  "content_scripts": [{
    "matches": [
      "https://claude.ai/*",
      "https://chat.openai.com/*",
      "https://chatgpt.com/*",
      "https://gemini.google.com/*"
    ]
  }]
}
```

### 7. Build & Publish

- `pnpm build` in `apps/extension` produces a `build/chrome-mv3-prod` folder
- Zip the folder and upload to the Chrome Web Store
- Required assets: 128x128 icon, screenshots, description
- Store listing category: "Productivity"

---

## Acceptance Criteria

- [ ] Extension installs in Chrome from the `build/` folder without errors
- [ ] Popup opens and displays trending prompts without requiring sign-in
- [ ] Search works in the popup with debounced input
- [ ] "Copy" button copies prompt text to clipboard
- [ ] "Insert" button injects text into the Claude.ai input field
- [ ] "Insert" button injects text into the ChatGPT input field
- [ ] "Insert" on an unsupported tab falls back to clipboard copy (no error shown)
- [ ] Auth flow completes end-to-end (sign in from popup, session persists across popup open/close)
- [ ] Signed-in users see their saved prompts in the popup
- [ ] Extension builds cleanly with `pnpm build`

---

## Deliverables

- Working Chrome extension in `apps/extension/`
- Content script with injection support for Claude.ai and ChatGPT
- Auth flow via web app callback page
- Production build ready for Chrome Web Store submission

---

## Known Fragility

AI tool UIs change without warning. The content script selectors (`[contenteditable="true"]`, etc.) will break when target sites update their DOM. Plan for:
- `LAST_VERIFIED` comments per host in `content.ts` so staleness is visible at a glance
- The "Copy" fallback that always works regardless of injection status
- Community reporting: "Is the extension broken on Claude?" issue template
- A lightweight monitoring job (Phase 06) that pings a test injection weekly
