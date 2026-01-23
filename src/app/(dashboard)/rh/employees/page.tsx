"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { EmployeeTable, type Employee } from "@/components/dashboard/EmployeeTable"

export default function EmployeesPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees...")
      const response = await fetch("/api/employees")
      console.log("Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Received data:", data)
        setEmployees(data.employees || [])
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    console.log("Edit employee:", employee)
    alert(`Modifier ${employee.name}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setEmployees(employees.filter((emp) => emp.id !== id))
        alert("Employé supprimé avec succès")
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
      alert("Erreur lors de la suppression")
    }
  }

  const handleView = (employee: Employee) => {
    console.log("View employee:", employee)
    alert(`Voir détails de ${employee.name}`)
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const response = await fetch(`/api/employees/${id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Update local state
        setEmployees(employees.map((emp) => 
          emp.id === id ? { ...emp, role: newRole } : emp
        ))
        alert("Rôle mis à jour avec succès")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Erreur lors de la mise à jour du rôle")
      }
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Erreur lors de la mise à jour du rôle")
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      searchQuery === "" ||
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
        {/* Card Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Header Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              {/* Tab */}
              <div className="border-b-2 border-blue-600 pb-3">
                <h2 className="text-base font-semibold text-blue-600">Users</h2>
              </div>
              
              {/* New User Button */}
              <button
                onClick={() => alert("TODO: Open new employee modal")}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New User
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Recherche"
                className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <kbd className="absolute right-3 top-2.5 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <EmployeeTable
              employees={filteredEmployees}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onRoleChange={handleRoleChange}
            />
          </div>

          {/* Footer with Total */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Total Users : <span className="font-semibold text-gray-900 dark:text-white">{filteredEmployees.length}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
