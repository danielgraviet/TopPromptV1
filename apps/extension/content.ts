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

  editor.focus()

  if (editor instanceof HTMLTextAreaElement) {
    // Plain textarea — set value directly and fire native input event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set
    nativeInputValueSetter?.call(editor, text)
    editor.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    // contenteditable (Claude/ProseMirror, ChatGPT, Gemini)
    // Select all existing content then replace via execCommand so the
    // editor's own state manager (ProseMirror, Quill, etc.) sees the change.
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(editor)
    sel?.removeAllRanges()
    sel?.addRange(range)
    // execCommand is deprecated but remains the most reliable way to
    // trigger framework-managed contenteditable editors in Chrome.
    document.execCommand('insertText', false, text)
  }

  return true
}
