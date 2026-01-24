import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

import AdminDashboard from "@/components/dashboard/AdminDashboard"
import RhDashboard from "@/components/dashboard/RhDashboard"
import UserDashboard from "@/components/dashboard/UserDashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const role = session.user?.role

  // Sécurité ultime
  if (!["SUPER_ADMIN", "RH", "USER"].includes(role)) {
    redirect("/home")
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {role === "SUPER_ADMIN" && <AdminDashboard />}
      {role === "RH" && <RhDashboard />}
      {role === "USER" && <UserDashboard />}
    </div>
  )
}
