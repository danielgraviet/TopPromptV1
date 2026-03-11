import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { api } from './lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type PromptSummary = {
  id: string
  title: string
  description: string
  category: string
  upvoteCount: number
  saveCount: number
  score: number
  createdAt: Date
  creatorId: string
  creatorName: string | null
  creatorUsername: string | null
  creatorImage: string | null
  tags: string[]
  models: string[]
}

type AuthUser = {
  userId: string
  email: string
  name: string
  image: string
}

type Tab = 'trending' | 'saved'

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Coding', value: 'coding' },
  { label: 'Architecture', value: 'architecture' },
  { label: 'Debugging', value: 'debugging' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Startup', value: 'startup' },
  { label: 'Writing', value: 'writing' },
  { label: 'Automation', value: 'automation' },
  { label: 'Business', value: 'business' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  root: {
    width: '100%',
    height: '100vh',
    background: '#09090b',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 13,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px 10px',
    borderBottom: '1px solid #27272a',
  },
  logo: { fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' },
  logoAccent: { color: '#6366f1' },
  signInBtn: {
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    color: '#a1a1aa',
    fontSize: 12,
    padding: '4px 10px',
    cursor: 'pointer' as const,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: '1px solid #3f3f46',
    cursor: 'pointer' as const,
  },
  tabs: {
    display: 'flex' as const,
    gap: 0,
    borderBottom: '1px solid #27272a',
  },
  tab: (active: boolean) => ({
    flex: 1,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    color: active ? '#fff' : '#71717a',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
    cursor: 'pointer' as const,
    transition: 'color 0.15s',
  }),
  searchWrap: { padding: '10px 14px 0' },
  searchInput: {
    width: '100%',
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    padding: '7px 10px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  pills: {
    display: 'flex' as const,
    gap: 6,
    padding: '8px 14px 0',
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
  },
  pill: (active: boolean) => ({
    flexShrink: 0,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: active ? 600 : 400,
    background: active ? '#4338ca' : '#18181b',
    border: `1px solid ${active ? '#4338ca' : '#3f3f46'}`,
    color: active ? '#fff' : '#a1a1aa',
    cursor: 'pointer' as const,
    transition: 'all 0.15s',
  }),
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 10px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 6,
  },
  card: (focused: boolean) => ({
    background: focused ? '#27272a' : '#18181b',
    border: `1px solid ${focused ? '#4338ca' : '#27272a'}`,
    borderRadius: 10,
    padding: '10px 12px',
    transition: 'border-color 0.1s, background 0.1s',
  }),
  cardTitle: { fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 3 },
  cardDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 6,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    lineHeight: 1.4,
  },
  tags: { display: 'flex' as const, gap: 4, flexWrap: 'wrap' as const, marginBottom: 8 },
  tag: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    background: '#27272a',
    color: '#71717a',
  },
  actions: { display: 'flex' as const, gap: 6, alignItems: 'center' as const },
  insertBtn: {
    flex: 1,
    padding: '5px 0',
    borderRadius: 6,
    border: 'none',
    background: '#4338ca',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer' as const,
    transition: 'background 0.15s',
  },
  copyBtn: {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid #3f3f46',
    background: 'transparent',
    color: '#a1a1aa',
    fontSize: 12,
    cursor: 'pointer' as const,
  },
  hint: {
    fontSize: 10,
    color: '#3f3f46',
    marginLeft: 'auto' as const,
    whiteSpace: 'nowrap' as const,
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: '#52525b',
    fontSize: 13,
  },
  toast: (visible: boolean) => ({
    position: 'fixed' as const,
    bottom: 12,
    left: '50%',
    transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
    opacity: visible ? 1 : 0,
    background: '#27272a',
    color: '#e4e4e7',
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 20,
    pointerEvents: 'none' as const,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  }),
}

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToast() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  function show(msg: string) {
    setMessage(msg)
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 2000)
  }

  return { message, visible, show }
}

// ─── PromptCard imperative handle ─────────────────────────────────────────────

type PromptCardHandle = {
  insert: () => Promise<void>
  copy: () => Promise<void>
}

// ─── Popup component ──────────────────────────────────────────────────────────

function IndexSidePanel() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('trending')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [prompts, setPrompts] = useState<PromptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const toast = useToast()

  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cardHandles = useRef<(PromptCardHandle | null)[]>([])
  const stateRef = useRef({ focusedIndex, prompts })

  // Keep stateRef in sync so keydown handler never captures stale values
  useEffect(() => {
    stateRef.current = { focusedIndex, prompts }
  })

  // ── Auto-focus search on mount ──
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // ── Reset focused card when prompt list changes ──
  useEffect(() => {
    setFocusedIndex(-1)
  }, [prompts])

  // ── Scroll focused card into view ──
  useEffect(() => {
    if (focusedIndex < 0) return
    const listEl = listRef.current
    if (!listEl) return
    const cards = listEl.querySelectorAll<HTMLElement>('[data-card]')
    cards[focusedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  // ── Global keydown handler (stable ref pattern avoids stale closure) ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const { focusedIndex, prompts } = stateRef.current
      const tag = (e.target as HTMLElement).tagName

      // ↓ / ↑ — navigate list (works from anywhere)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, prompts.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((i) => {
          if (i <= 0) {
            searchRef.current?.focus()
            return -1
          }
          return i - 1
        })
        return
      }

      // Esc — clear search and return focus to search box
      if (e.key === 'Escape') {
        e.preventDefault()
        setSearch('')
        setFocusedIndex(-1)
        searchRef.current?.focus()
        return
      }

      // Enter / Cmd+Enter — only when a card is focused
      if (focusedIndex < 0) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.metaKey || e.ctrlKey) {
          void cardHandles.current[focusedIndex]?.copy()
        } else {
          void cardHandles.current[focusedIndex]?.insert()
        }
        return
      }

      // / — jump to search from list
      if (e.key === '/' && tag !== 'INPUT') {
        e.preventDefault()
        setFocusedIndex(-1)
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Load auth state on mount + listen for changes from background ──
  useEffect(() => {
    chrome.storage.local.get('toprompt_user').then((stored) => {
      setAuthUser(stored.toprompt_user ?? null)
    })

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('toprompt_user' in changes) {
        setAuthUser(changes.toprompt_user.newValue ?? null)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // ── Fetch prompts (debounced on search) ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (activeTab === 'saved' && !authUser) {
      setPrompts([])
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    const delay = search ? 300 : 0
    const timer = setTimeout(async () => {
      try {
        let results: PromptSummary[]

        if (activeTab === 'saved') {
          results = (await api.saves.list.query()) as PromptSummary[]
        } else if (search) {
          results = await api.prompts.search.query({ query: search, limit: 20 })
        } else if (category !== 'all') {
          results = await api.prompts.byCategory.query({ category, limit: 20 })
        } else {
          results = await api.prompts.list.query({ limit: 20 })
        }

        if (!cancelled) setPrompts(results)
      } catch {
        if (!cancelled) setPrompts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, category, activeTab, authUser])

  // ── Actions ──

  async function handleSignIn() {
    const base = process.env.PLASMO_PUBLIC_WEB_URL ?? 'https://topprompt.dev'
    chrome.tabs.create({ url: `${base}/auth/extension-callback` })
  }

  async function handleSignOut() {
    await chrome.storage.local.remove('toprompt_user')
    setAuthUser(null)
    setActiveTab('trending')
  }

  async function handleInsert(promptText: string) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        const response = (await chrome.tabs.sendMessage(tab.id, {
          type: 'INSERT_PROMPT',
          text: promptText,
        })) as { ok?: boolean } | undefined
        if (response?.ok) {
          toast.show('Inserted!')
          return
        }
      }
    } catch {
      // Tab not injectable — fall through to clipboard
    }
    await navigator.clipboard.writeText(promptText)
    toast.show('Copied to clipboard (paste manually)')
  }

  async function handleCopy(promptText: string) {
    await navigator.clipboard.writeText(promptText)
    toast.show('Copied!')
  }

  // ── Render ──

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.logo}>
          Top<span style={s.logoAccent}>Prompt</span>
        </span>
        {authUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#71717a' }}>{authUser.name || authUser.email}</span>
            {authUser.image ? (
              <img
                src={authUser.image}
                alt="avatar"
                style={s.avatar}
                onClick={handleSignOut}
                title="Sign out"
              />
            ) : (
              <button style={s.signInBtn} onClick={handleSignOut}>
                Sign out
              </button>
            )}
          </div>
        ) : (
          <button style={s.signInBtn} onClick={handleSignIn}>
            Sign in
          </button>
        )}
      </div>

      {/* Tabs (only show Saved when signed in) */}
      {authUser && (
        <div style={s.tabs}>
          <button style={s.tab(activeTab === 'trending')} onClick={() => setActiveTab('trending')}>
            Trending
          </button>
          <button style={s.tab(activeTab === 'saved')} onClick={() => setActiveTab('saved')}>
            Saved
          </button>
        </div>
      )}

      {/* Search */}
      {activeTab === 'trending' && (
        <div style={s.searchWrap}>
          <input
            ref={searchRef}
            style={s.searchInput}
            placeholder="Search prompts… (/ to focus)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCategory('all')
            }}
            onKeyDown={(e) => {
              // Let ↓ from the search box move focus to first card
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setFocusedIndex(0)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
          />
        </div>
      )}

      {/* Category pills */}
      {activeTab === 'trending' && !search && (
        <div style={s.pills}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              style={s.pill(category === c.value)}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <div style={{ padding: '4px 14px 0', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 10, color: '#3f3f46' }}>↓↑ navigate · Enter insert · ⌘Enter copy · Esc clear</span>
      </div>

      {/* Prompt list */}
      <div ref={listRef} style={s.list}>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : prompts.length === 0 ? (
          <div style={s.empty}>
            {activeTab === 'saved' ? 'No saved prompts yet.' : 'No prompts found.'}
          </div>
        ) : (
          prompts.map((prompt, i) => (
            <PromptCard
              key={prompt.id}
              ref={(el) => { cardHandles.current[i] = el }}
              prompt={prompt}
              focused={focusedIndex === i}
              onInsert={handleInsert}
              onCopy={handleCopy}
              onFocus={() => setFocusedIndex(i)}
            />
          ))
        )}
      </div>

      {/* Toast */}
      <div style={s.toast(toast.visible)}>{toast.message}</div>
    </div>
  )
}

// ─── Prompt card ──────────────────────────────────────────────────────────────

const PromptCard = forwardRef<
  PromptCardHandle,
  {
    prompt: PromptSummary
    focused: boolean
    onInsert: (text: string) => void
    onCopy: (text: string) => void
    onFocus: () => void
  }
>(function PromptCard({ prompt, focused, onInsert, onCopy, onFocus }, ref) {
  const [promptText, setPromptText] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  async function getPromptText(): Promise<string> {
    if (promptText) return promptText
    setFetching(true)
    try {
      const detail = await api.prompts.byId.query({ id: prompt.id })
      const text = detail?.promptText ?? ''
      setPromptText(text)
      return text
    } finally {
      setFetching(false)
    }
  }

  useImperativeHandle(ref, () => ({
    insert: async () => {
      const text = await getPromptText()
      if (text) onInsert(text)
    },
    copy: async () => {
      const text = await getPromptText()
      if (text) onCopy(text)
    },
  }))

  return (
    <div data-card style={s.card(focused)} onMouseEnter={onFocus}>
      <div style={s.cardTitle}>{prompt.title}</div>
      <div style={s.cardDesc}>{prompt.description}</div>

      {prompt.models.length > 0 && (
        <div style={s.tags}>
          {prompt.models.map((m) => (
            <span key={m} style={s.tag}>
              {m}
            </span>
          ))}
        </div>
      )}

      <div style={s.actions}>
        <button
          style={s.insertBtn}
          disabled={fetching}
          onClick={async () => {
            const text = await getPromptText()
            if (text) onInsert(text)
          }}
        >
          {fetching ? '…' : 'Insert'}
        </button>
        <button
          style={s.copyBtn}
          disabled={fetching}
          onClick={async () => {
            const text = await getPromptText()
            if (text) onCopy(text)
          }}
        >
          Copy
        </button>
        {focused && <span style={s.hint}>↵ insert · ⌘↵ copy</span>}
      </div>
    </div>
  )
})

export default IndexSidePanel
