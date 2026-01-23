"use client"
import { useState, useEffect } from "react"
import { RoleCard } from "@/components/roles/RoleCard"
import RoleEditModal from "@/components/roles/RoleEditModal"
import { usePermissions } from "@/contexts/PermissionsContext"

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { hasPermission } = usePermissions()

  const canEdit = hasPermission('parametres', 'EDIT')

  // Fetch roles from database
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles-db')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        console.error('Failed to fetch roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleUpdated = () => {
    // Refresh roles list after update
    fetchRoles()
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des rôles</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-11">Configurez les permissions et accès pour chaque rôle</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                {roles.length} rôles
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-900/30 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-600 dark:border-violet-400 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-400">Chargement des rôles...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Veuillez patienter quelques instants</p>
          </div>
        ) : (
          /* Roles Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <div 
                key={role.id}
                className="transform transition-all duration-300 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <RoleCard
                  roleName={role.name}
                  description={role.description}
                  modules={role.modules}
                  onEdit={canEdit ? () => {
                    console.log('Edit button clicked for role:', role);
                    setSelectedRole(role);
                    setModalOpen(true);
                    console.log('Modal state set to open');
                  } : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale éditer */}
      {modalOpen && selectedRole && (
        <>
          {console.log('Rendering RoleEditModal with role:', selectedRole)}
          <RoleEditModal
            role={selectedRole}
            onClose={() => {
              console.log('Closing modal');
              setModalOpen(false);
              setSelectedRole(null);
            }}
            onSave={handleRoleUpdated}
          />
        </>
      )}
    </div>
  )
}