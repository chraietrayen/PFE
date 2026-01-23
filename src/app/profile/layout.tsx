import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PermissionsProvider } from "@/contexts/PermissionsContext"
import { SessionProvider } from "@/components/providers/SessionProvider"

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <SessionProvider session={session}>
      <PermissionsProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
            </div>
            <main>{children}</main>
          </div>
        </div>
      </PermissionsProvider>
    </SessionProvider>
  )
}