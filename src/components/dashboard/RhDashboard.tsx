import { query } from '@/lib/mysql-direct';
import StatsCard from './cards/StatsCard';
import PendingEmployeesList from '@/components/employees/PendingEmployeesList';
import EmployeeList from '@/components/employees/EmployeeList';
import ClientExportButton from './ClientExportButton';

export default async function RhDashboard() {
  // Fetch real data from MySQL
  let pendingEmployees = 0;
  let approvedEmployees = 0;
  let rejectedEmployees = 0;
  let totalEmployees = 0;

  try {
    // Check if tables exist first
    let tablesExist = true;
    
    try {
      // Test if User table exists (actual table name in DB)
      await query('SELECT 1 FROM User LIMIT 1');
      
      // Test if Employe table exists
      await query('SELECT 1 FROM Employe LIMIT 1');
    } catch (tableError) {
      console.warn('Database tables may not exist yet:', tableError);
      tablesExist = false;
    }
    
    if (tablesExist) {
      // Get total users
      const totalUsersResult: any = await query('SELECT COUNT(*) as count FROM User');
      totalEmployees = Array.isArray(totalUsersResult) && totalUsersResult[0]?.count ? parseInt(totalUsersResult[0].count) : 0;
      
      // Get pending employee profiles
      try {
        const pendingResult: any = await query(
          `SELECT COUNT(*) as count FROM Employe WHERE statut = 'EN_ATTENTE'`
        );
        pendingEmployees = Array.isArray(pendingResult) && pendingResult[0]?.count ? parseInt(pendingResult[0].count) : 0;
      } catch (error) {
        console.error('Error fetching pending employees:', error);
        pendingEmployees = 0;
      }
      
      // Get approved employee profiles
      try {
        const approvedResult: any = await query(
          `SELECT COUNT(*) as count FROM Employe WHERE statut = 'APPROUVE'`
        );
        approvedEmployees = Array.isArray(approvedResult) && approvedResult[0]?.count ? parseInt(approvedResult[0].count) : 0;
      } catch (error) {
        console.error('Error fetching approved employees:', error);
        approvedEmployees = 0;
      }
      
      // Get rejected employee profiles
      try {
        const rejectedResult: any = await query(
          `SELECT COUNT(*) as count FROM Employe WHERE statut = 'REJETE'`
        );
        rejectedEmployees = Array.isArray(rejectedResult) && rejectedResult[0]?.count ? parseInt(rejectedResult[0].count) : 0;
      } catch (error) {
        console.error('Error fetching rejected employees:', error);
        rejectedEmployees = 0;
      }
    } else {
      // Fallback to default values if tables don't exist
      pendingEmployees = 0;
      approvedEmployees = 0;
      rejectedEmployees = 0;
      totalEmployees = 0;
    }
  } catch (error) {
    console.error('Error fetching HR data:', error);
    // Fallback to default values
    pendingEmployees = 0;
    approvedEmployees = 0;
    rejectedEmployees = 0;
    totalEmployees = 0;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Enhanced Design */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Dashboard RH</h1>
                  <p className="text-gray-600 text-sm">Gestion complète des employés et profils</p>
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
              <ClientExportButton />
            </div>
          </div>
        </div>

        {/* Stats Cards Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Employés</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-violet-600 transition-colors duration-200">{totalEmployees}</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>+2.5% ce mois</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">En Attente</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors duration-200">{pendingEmployees}</p>
                <div className="mt-2 flex items-center text-xs text-amber-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{pendingEmployees > 0 ? 'En cours de validation' : 'Tous traités'}</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl text-amber-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Approuvés</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-200">{approvedEmployees}</p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{Math.round((approvedEmployees / Math.max(totalEmployees, 1)) * 100)}% validés</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl text-green-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Rejetés</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-red-600 transition-colors duration-200">{rejectedEmployees}</p>
                <div className="mt-2 flex items-center text-xs text-red-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{rejectedEmployees > 0 ? 'Besoin de correction' : 'Aucun refus'}</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-xl text-red-600 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Employees List with Enhanced Design */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Profils en attente de validation</h2>
                    <p className="text-sm text-gray-600">{pendingEmployees} nouveaux profils à valider</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  {pendingEmployees}
                </span>
              </div>
            </div>
            <div className="p-4">
              <PendingEmployeesList />
            </div>
          </div>

          {/* Validated Employees List with Enhanced Design */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Employés validés</h2>
                    <p className="text-sm text-gray-600">{approvedEmployees} employés approuvés</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {approvedEmployees}
                </span>
              </div>
            </div>
            <div className="p-4">
              <EmployeeList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
