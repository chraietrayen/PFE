"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session) {
      // Load user data from API
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/users/me`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // If API endpoint doesn't exist, use session data
            setUser({
              id: session.user?.id || '',
              name: session.user?.name || 'Utilisateur',
              email: session.user?.email || '',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              role: { name: session.user?.role || 'USER' }
            });
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          // Use session data as fallback
          setUser({
            id: session.user?.id || '',
            name: session.user?.name || 'Utilisateur',
            email: session.user?.email || '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: { name: session.user?.role || 'USER' }
          });
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirect happens in useEffect
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            Gérer vos informations personnelles et préférences
          </p>
        </div>
        <div>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-bold rounded-full mt-2">
                {user?.role?.name || 'Utilisateur'}
              </span>
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.name || '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.email}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rôle
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.role?.name || 'Aucun rôle'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Statut
                  </label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user?.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {user?.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date de création
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dernière mise à jour
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Voir le profil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Sécurité</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Authentification</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Méthode d'authentification utilisée
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                {session.user?.image ? 'Google' : 'Email/Mot de passe'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Date de création</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compte créé le
                </p>
              </div>
              <span className="text-sm text-gray-900 dark:text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}