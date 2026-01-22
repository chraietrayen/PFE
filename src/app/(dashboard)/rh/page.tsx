import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RHPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || ! ["SUPER_ADMIN", "RH"].includes(session.user. role)) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">
          👔 Dashboard RH
        </h1>
        <p className="mt-2 text-gray-600">
          Bienvenue, {session.user.name}
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-2xl font-bold text-violet-600">89</h2>
            <p className="text-gray-500">Employés</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-2xl font-bold text-green-600">12</h2>
            <p className="text-gray-500">En congé</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-2xl font-bold text-orange-600">3</h2>
            <p className="text-gray-500">Retards</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-2xl font-bold text-blue-600">5</h2>
            <p className="text-gray-500">Demandes</p>
          </div>
        </div>
      </div>
    </div>
  )
}