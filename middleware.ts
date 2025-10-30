import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('authorization') ?? ''
    if (!/^Bearer\s+/.test(authHeader)) {
      // APIs always demand a bearer token; UI handles session-based states client side.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (pathname.startsWith('/admin')) {
    const isAssetRequest = pathname.startsWith('/admin/_next')
    const hasSessionFlag = request.cookies.has('um-admin-session')
    if (!isAssetRequest && !hasSessionFlag) {
      // Redirect browsers without our session marker to the shared login screen.
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
