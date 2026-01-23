"use client"

interface Permission {
  label: string
  checked: boolean
}

interface PermissionModule {
  title: string
  badge?: string
  permissions: {
    base: Permission[]
    advanced?: Permission[]
  }
}

interface RoleCardProps {
  roleName: string
  description: string
  modules: PermissionModule[]
  onEdit?: () => void
}

export function RoleCard({ roleName, description, modules, onEdit }: RoleCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:shadow-violet-100/20 dark:hover:shadow-violet-900/10 transition-all duration-300 group">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {roleName}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 pl-5">{description}</p>
        </div>
        {onEdit && (
          <button
            onClick={(e) => {
              console.log('Edit button clicked in RoleCard');
              e.stopPropagation();
              onEdit();
            }}
            className="text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/20 p-2 rounded-lg transition-all duration-200 transform hover:scale-105 hover:rotate-6"
            aria-label="Modifier le rôle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-2 gap-3">
        {modules.map((module, idx) => (
          <div 
            key={idx} 
            className={`rounded-xl p-3 transition-all duration-200 ${
              module.badge 
                ? 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border border-violet-200 dark:border-violet-800/50' 
                : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
            } hover:shadow-md`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{module.title}</span>
              {module.badge && (
                <span className="px-2 py-0.5 bg-violet-200 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs rounded-full font-medium">
                  {module.badge}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {module.permissions.base.map((perm, pidx) => (
                <div key={pidx} className="flex items-center gap-2 group/perm">
                  <div className={`w-3 h-3 rounded flex items-center justify-center ${perm.checked ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    {perm.checked && (
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs transition-colors ${perm.checked ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-500'}`}>
                    {perm.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
