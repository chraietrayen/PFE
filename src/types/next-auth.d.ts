import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "SUPER_ADMIN" | "RH" | "USER"
    } & DefaultSession["user"]
  }

  interface User {
    role: "SUPER_ADMIN" | "RH" | "USER"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "SUPER_ADMIN" | "RH" | "USER"
    id: string
  }
}