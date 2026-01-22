import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">
          👑 Dashboard Super Admin
        </h1>
        <p className="mt-2 text-gray-600">
          Bienvenue, {session.user.name}
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module Paramètres */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold">⚙️ Paramètres</h2>
            <p className="text-gray-500 mt-2">Gérer les utilisateurs et rôles</p>
          </div>
          
          {/* Module RH */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold">👔 RH</h2>
            <p className="text-gray-500 mt-2">Gestion des employés</p>
          </div>
          
          {/* Module Chatbot */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold">🤖 Chatbot</h2>
            <p className="text-gray-500 mt-2">Analyse comportementale</p>
          </div>
        </div>
      </div>
    </div>
  )
}