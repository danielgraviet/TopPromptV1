import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// The extension opens this URL after GitHub OAuth completes.
// The background service worker watches for this page to load,
// reads the meta tags (set via metadata below) via chrome.scripting.executeScript,
// saves the identity to chrome.storage.local, then closes the tab.

export async function generateMetadata() {
  const session = await auth()
  const user = session?.user

  if (!user) return { title: 'TopPrompt Extension' }

  return {
    title: 'TopPrompt Extension',
    other: {
      'toprompt-user-id': user.id ?? '',
      'toprompt-email': user.email ?? '',
      'toprompt-name': user.name ?? '',
      'toprompt-image': user.image ?? '',
    },
  }
}

export default async function ExtensionCallbackPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/auth/extension-callback')
  }

  const user = session.user

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#09090b',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        gap: '12px',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <p style={{ fontSize: '18px', fontWeight: 600 }}>Signed in as {user.name ?? user.email}</p>
      <p style={{ fontSize: '14px', color: '#71717a' }}>You can close this tab — the extension is ready.</p>
    </main>
  )
}
