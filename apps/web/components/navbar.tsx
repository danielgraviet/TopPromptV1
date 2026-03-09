import Link from 'next/link'
import { auth, signOut } from '@/auth'
import { SearchBar } from './search-bar'

export async function Navbar() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 text-lg font-bold text-white">
          TopPrompt
        </Link>

        <SearchBar />

        <div className="flex shrink-0 items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/submit"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Submit
              </Link>

              <Link href={`/user/${session.user.id}`} className="flex items-center gap-2">
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? 'User avatar'}
                    className="h-8 w-8 rounded-full"
                  />
                )}
              </Link>

              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/' })
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
