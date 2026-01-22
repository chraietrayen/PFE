import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RHPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || ! ["SUPER_ADMIN", "RH"].includes(session.user. role)) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          👔 Dashboard RH
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Bienvenue, {session.user.name}
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-violet-600 dark:text-violet-400">89</h2>
            <p className="text-gray-500 dark:text-gray-400">Employés</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">12</h2>
            <p className="text-gray-500 dark:text-gray-400">En congé</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</h2>
            <p className="text-gray-500 dark:text-gray-400">Retards</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">5</h2>
            <p className="text-gray-500 dark:text-gray-400">Demandes</p>
          </div>
        </div>
      </div>
    </div>
  )
}