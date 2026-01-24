import { query } from '@/lib/mysql-direct';
import StatsCard from './cards/StatsCard';
import EmployeeList from '@/components/employees/EmployeeList';
import RecentActivities from './RecentActivities';

export default async function AdminDashboard() {
  // Fetch real data from MySQL
  let userCount = 0;
  let employeeCount = 0;
  let rhActiveCount = 0;

  try {
    // Check if tables exist first
    let tablesExist = true;
    
    try {
      // Test if User table exists (actual table name in DB)
      await query('SELECT 1 FROM User LIMIT 1');
    } catch (tableError) {
      console.warn('Database tables may not exist yet:', tableError);
      tablesExist = false;
    }
    
    if (tablesExist) {
      // Get total users
      const userResult: any = await query('SELECT COUNT(*) as count FROM User');
      userCount = Array.isArray(userResult) && userResult[0]?.count ? parseInt(userResult[0].count) : 0;
      
      // Get employees (users with roles) - try different possible role field names
      try {
        const employeeResult: any = await query(
          "SELECT COUNT(*) as count FROM User WHERE role = 'RH' OR role = 'USER' OR role = 'SUPER_ADMIN'"
        );
        employeeCount = Array.isArray(employeeResult) && employeeResult[0]?.count ? parseInt(employeeResult[0].count) : userCount;
      } catch (roleError) {
        // If role column doesn't exist with expected values, assume all users are employees
        employeeCount = userCount;
      }
      
      // Get active RH users - try different possible field names
      try {
        const rhResult: any = await query(
          "SELECT COUNT(*) as count FROM User WHERE role = 'RH'"
        );
        rhActiveCount = Array.isArray(rhResult) && rhResult[0]?.count ? parseInt(rhResult[0].count) : 0;
      } catch (rhError) {
        // If role column doesn't exist, default to 0
        rhActiveCount = 0;
      }
    } else {
      // Fallback to default values if tables don't exist
      userCount = 124;
      employeeCount = 89;
      rhActiveCount = 6;
    }
  } catch (error) {
    console.error('Error fetching admin data:', error);
    // Fallback to default values
    userCount = 124;
    employeeCount = 89;
    rhActiveCount = 6;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Enhanced Design */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Dashboard Super Admin</h1>
                  <p className="text-gray-600 text-sm mt-1">Gestion complète du système et des utilisateurs</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date().toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-violet-600 transition-colors duration-200">{userCount}</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>+5.2% ce mois</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-violet-100 to-purple-200 rounded-xl text-violet-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Employés</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-violet-600 transition-colors duration-200">{employeeCount}</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>+3.8% ce mois</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-100 to-cyan-200 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">RH Actifs</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-violet-600 transition-colors duration-200">{rhActiveCount}</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>{Math.round((rhActiveCount / Math.max(userCount, 1)) * 100)}% RH</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-100 to-orange-200 rounded-xl text-amber-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Système</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-violet-600 transition-colors duration-200">En ligne</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>100% uptime</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-200 rounded-xl text-green-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Statut Système</h2>
                    <p className="text-sm text-gray-600">Informations sur la santé du système</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Stable
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CPU Usage</span>
                  <span className="text-sm font-medium text-green-600">24%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '24%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium text-amber-600">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '67%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Disk Usage</span>
                  <span className="text-sm font-medium text-green-600">32%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '32%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Activités Récentes</h2>
                    <p className="text-sm text-gray-600">Dernières actions du système</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
                  Live
                </span>
              </div>
            </div>
            <div className="p-4">
              <RecentActivities />
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="mt-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Liste des Employés</h2>
                  <p className="text-sm text-gray-600">Gestion des utilisateurs et profils</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <EmployeeList />
          </div>
        </div>
      </div>
    </div>
  );
}
