import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (! session) {
    redirect("/login")
  }

  // Redirection selon le rôle
  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/super-admin")
    case "RH":
      redirect("/rh")
    default:
      redirect("/user")
  }
}