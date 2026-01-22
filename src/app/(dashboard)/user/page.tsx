import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function UserPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          👋 Bonjour, {session.user.name}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Bienvenue sur votre espace personnel
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pointage */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">⏰ Mon Pointage</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Ce mois:  18/22 jours</p>
            <div className="mt-4 flex gap-2">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                ✅ Présent aujourd'hui
              </span>
            </div>
          </div>
          
          {/* Congés */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🏖️ Mes Congés</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Solde: 12 jours restants</p>
            <button className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
              Demander un congé
            </button>
          </div>
          
          {/* Demandes */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📝 Mes Demandes</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">1 demande en attente</p>
          </div>
          
          {/* Documents */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📄 Mes Documents</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Fiches de paie, attestations... </p>
          </div>
        </div>
      </div>
    </div>
  )
}