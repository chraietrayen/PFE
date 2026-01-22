import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirection selon le rôle après connexion
    if (path === "/" && token) {
      switch (token.role) {
        case "SUPER_ADMIN":
          return NextResponse.redirect(new URL("/super-admin", req.url))
        case "RH":
          return NextResponse.redirect(new URL("/rh", req.url))
        case "USER":
          return NextResponse.redirect(new URL("/user", req.url))
      }
    }

    // Protection des routes par rôle
    if (path.startsWith("/super-admin") && token?. role !== "SUPER_ADMIN") {
      return NextResponse. redirect(new URL("/login", req.url))
    }

    if (path.startsWith("/rh") && !["SUPER_ADMIN", "RH"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Pages publiques
        if (path.startsWith("/login") || path.startsWith("/forgot-password")) {
          return true
        }
        
        // Autres pages nécessitent une connexion
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/super-admin/:path*",
    "/rh/:path*",
    "/user/:path*",
    "/login",
  ],
}