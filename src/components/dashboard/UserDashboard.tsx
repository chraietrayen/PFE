import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/mysql-direct';
import EmployeeProfileForm from '@/components/employees/EmployeeProfileForm';
import EmployeeDossier from '@/components/employees/EmployeeDossier';

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);
  
  // Check if user has already submitted their profile
  let employeeProfile: any = null;
  
  try {
    const result: any = await query(
      'SELECT * FROM Employe WHERE user_id = ?',
      [session?.user?.id || '']
    );
    
    if (result && result.length > 0) {
      employeeProfile = result[0];
    }
  } catch (error) {
    console.error('Error checking employee profile:', error);
  }
  
  // If profile exists and is pending, show waiting message
  if (employeeProfile && employeeProfile.statut === 'EN_ATTENTE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Statut de votre profil</h1>
                <p className="text-gray-600 text-sm mt-1">Informations sur l'état de validation de votre profil</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 p-8 text-center max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <div className="relative z-10">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Profil en attente de vérification
              </h2>
              <p className="text-gray-600 mb-6 text-base">
                Votre profil a été soumis avec succès et est en attente de validation par le service RH.
              </p>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto shadow-sm">
                <p className="text-sm text-amber-700 font-medium">
                  Vous serez notifié par email une fois votre profil vérifié et approuvé.
                </p>
              </div>
              
              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  En attente de validation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If profile is rejected, allow resubmission
  if (employeeProfile && employeeProfile.statut === 'REJETE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Mise à jour de votre profil</h1>
                <p className="text-gray-600 text-sm mt-1">Corrigez les informations et soumettez à nouveau</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 p-6 mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">Profil refusé</h3>
                    <p className="text-red-600 text-base mt-1">
                      Votre profil a été refusé. Veuillez corriger les informations et soumettre à nouveau.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-4 flex justify-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Besoin de corrections
                </div>
              </div>
              <EmployeeProfileForm />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If profile approved, show regular dashboard (future feature)
  if (employeeProfile && employeeProfile.statut === 'APPROUVE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Votre Dossier Personnel</h1>
                <p className="text-gray-600 text-sm mt-1">Informations complètes de votre profil approuvé</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 p-6 mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <div className="relative z-10">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Profil approuvé</h2>
                    <p className="text-green-600 text-base mt-1">
                      Votre profil a été approuvé. Voici votre dossier complet :
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-4 flex justify-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Validé et approuvé
                </div>
              </div>
              <EmployeeDossier profile={employeeProfile} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no profile, show the form
  let userName = 'Utilisateur';
  let userEmail = session?.user?.email || 'N/A';

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
      // Get user's information
      let userResult: any = [];
      try {
        userResult = await query(
          'SELECT id, name, email FROM User WHERE email = ?',
          [session?.user?.email || '']
        );
      } catch (userError) {
        console.error('Error fetching user:', userError);
      }
      
      if (Array.isArray(userResult) && userResult.length > 0) {
        const user = userResult[0];
        userName = user.name || session?.user?.name || 'Utilisateur';
        userEmail = user.email || session?.user?.email || 'N/A';
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Complétez votre profil</h1>
              <p className="text-gray-600 text-sm mt-1">Remplissez les informations pour créer votre profil employé</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 p-6 mb-6 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-100 rounded-xl">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-violet-800">Informations utilisateur</h2>
                  <p className="text-violet-600 text-base mt-1">Vos détails personnels actuels</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-700 text-sm font-medium">Email:</p>
                  <p className="text-gray-600 text-sm truncate max-w-[200px]">{userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-700 text-sm font-medium">Nom:</p>
                  <p className="text-gray-600 text-sm truncate max-w-[200px]">{userName}</p>
                </div>
              </div>
            </div>

            {/* Employee Profile Form */}
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-100 text-violet-800 text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Compléter votre profil
              </div>
            </div>
            <EmployeeProfileForm />
          </div>
        </div>
      </div>
    </div>
  );
}
