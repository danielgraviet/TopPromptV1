// Content script — injected into supported AI tool pages.
// Receives INSERT_PROMPT messages from the popup and inserts
// the prompt text into the active input field.
//
// Selector verification status (update when confirmed working):
//   claude.ai         — verified 2026-03-10  [contenteditable="true"]
//   chatgpt.com       — verified 2026-03-10  [contenteditable="true"]
//   gemini.google.com — verified 2026-03-10  [contenteditable="true"]

// Plasmo reads this config to set content_scripts.matches in the manifest.
export const config = {
  matches: [
    'https://claude.ai/*',
    'https://chat.openai.com/*',
    'https://chatgpt.com/*',
    'https://gemini.google.com/*',
  ],
}

chrome.runtime.onMessage.addListener((message: { type: string; text: string }, _sender, sendResponse) => {
  if (message.type === 'INSERT_PROMPT') {
    const ok = insertPrompt(message.text)
    sendResponse({ ok })
  }
  return true
})

function insertPrompt(text: string): boolean {
  const editor =
    document.querySelector<HTMLElement>('[contenteditable="true"]') ??
    document.querySelector<HTMLTextAreaElement>('textarea')

  if (!editor) return false

  if (editor instanceof HTMLTextAreaElement) {
    editor.value = text
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    editor.focus()
  } else {
    // contenteditable div (Claude, ChatGPT, Gemini)
    editor.textContent = text
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }))

    // Move cursor to end so the user can keep typing
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    editor.focus()
  }

  return true
}
