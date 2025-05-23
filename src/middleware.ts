import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// TODO: This package is deprecated, update to @supabase/ssr in the future
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { type Database } from "@/database/database.types"

export async function middleware(req: NextRequest) {
  // Skip middleware for API routes entirely
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow public access to interview invite links and the app page used for interview sessions
  const isPublicInviteRoute = req.nextUrl.pathname.startsWith('/i');
  const isPublicAppRoute = req.nextUrl.pathname.startsWith('/app');
  const isAuthCallbackRoute = req.nextUrl.pathname.startsWith('/auth/callback')

  if (!session && !req.nextUrl.pathname.startsWith('/login') && !isPublicInviteRoute && !isPublicAppRoute && !isAuthCallbackRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access login page, redirect to home
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
} 