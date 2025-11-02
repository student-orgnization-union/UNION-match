import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Admin routes require basic auth
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      })
    }

    const credentials = authHeader.split(' ')[1]
    if (!credentials) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      })
    }

    // Edge 互換: atob でデコード（Buffer は使わない）
    const [username, password] = atob(credentials).split(':')

    if (username !== (process.env.ADMIN_USERNAME || process.env.NEXT_PUBLIC_ADMIN_USERNAME) ||
        password !== (process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD)) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
