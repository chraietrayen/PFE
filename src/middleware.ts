import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirection selon le rôle
    if (path. startsWith("/super-admin") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/home", req.url))
    }

    if (path.startsWith("/rh") && ! ["SUPER_ADMIN", "RH"]. includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/home", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/home/:path*",
    "/super-admin/:path*",
    "/rh/:path*",
    "/parametres/:path*",
    "/chatbot/:path*",
  ],
}