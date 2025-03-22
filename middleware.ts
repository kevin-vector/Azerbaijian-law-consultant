import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path === "/auth/callback"

  // Define protected paths
  const isProtectedPath = path === "/dashboard" || path === "/profile" || path === "/admin"

  // Check if user is authenticated by looking for the user item in localStorage
  // Note: This is a simplified approach. In a real app, you'd use cookies or JWT tokens
  const isAuthenticated = request.cookies.has("user_session")

  // Redirect logic
  if (!isAuthenticated && isProtectedPath) {
    // Redirect to login page if trying to access protected route without authentication
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isAuthenticated && path === "/") {
    // Redirect to dashboard if already authenticated and trying to access login page
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: ["/", "/dashboard", "/profile", "/admin", "/auth/callback"],
}

