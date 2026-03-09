import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/submit', '/profile']

export default auth((req) => {
  const isProtected = PROTECTED_PATHS.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
