# Phase 05 — Chrome Extension
**Status:** Not started
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
@tanstack/react-query
@toprompt/types
webextension-polyfill
```

---

## Tasks

### 1. Extension Architecture

Plasmo entry points:

```
apps/extension/
  popup.tsx           ← main extension popup UI
  content.ts          ← content script injected into AI tool pages
  background.ts       ← service worker (session management)
  options.tsx         ← settings page (optional, post-MVP)
```

**Communication flow:**
1. User clicks extension icon → popup opens
2. Popup fetches prompts from TopPrompt API
3. User clicks "Insert" → popup sends message to content script
4. Content script inserts prompt text into the active input

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
- On open: fetch trending prompts (cached, instant)
- Search input: debounced 300ms, queries tRPC `prompts.search`
- Category pills: filter the prompt list client-side or via API
- "Insert" button: injects the prompt into the active input on the current tab
- "Copy" button: copies to clipboard (fallback when injection is not supported)

**State management:**
- Use React Query to cache prompt responses
- Store auth session in `chrome.storage.local`

### 3. Content Script (`content.ts`)

The content script runs on supported pages and handles prompt injection.

**Supported sites:**
```typescript
const SUPPORTED_HOSTS = [
  'claude.ai',
  'chat.openai.com',
  'chatgpt.com',
  'gemini.google.com',
  'poe.com',
]
```

Declare in `package.json` manifest override:
```json
{
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

**Injection logic:**
```typescript
// Listen for message from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'INSERT_PROMPT') {
    insertPrompt(message.text)
  }
})

function insertPrompt(text: string) {
  // Try contenteditable divs (Claude, ChatGPT)
  const editor =
    document.querySelector('[contenteditable="true"]') ||
    document.querySelector('textarea')

  if (!editor) return

  if (editor.tagName === 'TEXTAREA') {
    (editor as HTMLTextAreaElement).value = text
    editor.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    // contenteditable
    editor.textContent = text
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }))
    // Move cursor to end
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }
}
```

Note: AI tool UIs update frequently. The selector logic will need maintenance. Add a `LAST_VERIFIED` comment per host so it is easy to track which selectors are stale.

### 4. Auth in the Extension

Users should stay signed in to TopPrompt within the extension.

**Flow:**
1. Popup checks `chrome.storage.local` for a stored session token
2. If none, show "Sign in with GitHub" button
3. On click, open a new tab to `https://topprompt.dev/auth/extension-callback`
4. After OAuth completes, the web app writes the session token to a URL param
5. Extension background script catches the callback URL and saves the token to `chrome.storage.local`
6. Popup re-renders with the authenticated state

This avoids needing OAuth inside the extension itself (complex) and reuses the web app's existing Auth.js flow.

**Web app change needed:**
- Add `/auth/extension-callback` route that reads the session and passes it back to the extension via a postMessage or URL param

### 5. API Client in Extension

The extension calls the same tRPC API as the web app.

```typescript
// apps/extension/lib/api.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../apps/web/server/routers'

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://topprompt.dev/api/trpc',
      headers: async () => {
        const token = await chrome.storage.local.get('session_token')
        return token ? { Authorization: `Bearer ${token.session_token}` } : {}
      },
    }),
  ],
})
```

### 6. Plasmo Manifest Configuration

```json
{
  "permissions": ["activeTab", "storage", "scripting"],
  "host_permissions": [
    "https://claude.ai/*",
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://gemini.google.com/*",
    "https://topprompt.dev/*"
  ]
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
- [ ] Auth flow completes end-to-end (sign in from popup, session persists)
- [ ] Signed-in users see their saved prompts in the popup
- [ ] Extension builds cleanly with `pnpm build`

---

## Deliverables

- Working Chrome extension in `apps/extension/`
- Content script with injection support for Claude.ai and ChatGPT
- Auth flow via web app callback
- Production build ready for Chrome Web Store submission

---

## Known Fragility

AI tool UIs change without warning. The content script selectors (`[contenteditable="true"]`, etc.) will break when target sites update their DOM. Plan for:
- A lightweight monitoring job (Phase 06) that pings a test injection weekly
- A "Copy" fallback that always works regardless of injection status
- Community reporting: "Is the extension broken on Claude?" issue template
