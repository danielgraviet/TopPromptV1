// Service worker — handles the OAuth callback, session persistence,
// and opening the side panel when the extension icon is clicked.

export {}

// Open the side panel in the current tab when the user clicks the icon.
// chrome.sidePanel.open() must be called inside a user-gesture handler.
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id })
  }
})

// OAuth callback — when the extension-callback page finishes loading,
// read the user identity from meta tags, save to storage, close the tab.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  if (!tab.url?.includes('/auth/extension-callback')) return

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const getMeta = (name: string) =>
          document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? ''
        return {
          userId: getMeta('toprompt-user-id'),
          email: getMeta('toprompt-email'),
          name: getMeta('toprompt-name'),
          image: getMeta('toprompt-image'),
        }
      },
    })

    const user = results[0]?.result
    if (user?.userId) {
      await chrome.storage.local.set({ toprompt_user: user })
      chrome.tabs.remove(tabId)
    }
  } catch {
    // Tab may not be injectable (e.g., still navigating). Ignore silently.
  }
})
