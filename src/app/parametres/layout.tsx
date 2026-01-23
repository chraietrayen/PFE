import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PermissionsProvider } from "@/contexts/PermissionsContext"

export default async function ParametresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Check if user has VIEW permission for parametres module
  // SUPER_ADMIN always has access
  if (session.user.role !== "SUPER_ADMIN") {
    // For now, redirect non-SUPER_ADMIN users
    // The permission check will be handled in the PermissionsProvider
    // redirect("/home")
  }

  return (
    <PermissionsProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col py-8 px-4 shadow-lg">
        <div className="flex items-center gap-3 mb-10 px-4">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-violet-600 dark:text-violet-400">Santec AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paramètres système</p>
          </div>
        </div>
        
        <nav className="flex-1">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 px-4">
              <div className="w-1.5 h-6 bg-violet-600 rounded-full"></div>
              <span className="uppercase text-violet-600 dark:text-violet-400 text-xs font-bold tracking-wider">PARAMÈTRES</span>
            </div>
            
            <Link 
              href="/parametres/users"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 group hover:shadow-md hover:shadow-violet-100/30 dark:hover:shadow-violet-900/20 hover:-translate-y-0.5 bg-gradient-to-r from-violet-50/50 to-white dark:from-violet-900/10 dark:to-gray-800 border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300"
            >
              <div className="p-1.5 bg-violet-200 dark:bg-violet-900/30 rounded-lg group-hover:bg-violet-300 dark:group-hover:bg-violet-800/50 transition-colors">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="font-bold">Utilisateurs</span>
            </Link>
            
            <Link 
              href="/parametres/roles"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 group hover:shadow-md hover:shadow-violet-100/30 dark:hover:shadow-violet-900/20 hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-400"
            >
              <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg group-hover:bg-violet-200 dark:group-hover:bg-violet-900/30 transition-colors">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span>Rôles</span>
            </Link>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
            <Link 
              href="/home"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span>Retour au tableau de bord</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
    </PermissionsProvider>
  )
}
