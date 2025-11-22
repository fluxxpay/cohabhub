'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, parseJwt, getTokenExpiration } from '@/lib/api';

interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'manager';
  avatar?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; role?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  tokenExpiringSoon: boolean;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpiringSoon, setTokenExpiringSoon] = useState(false);

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh-token');
    
    // Appeler l'endpoint Django pour blacklister le refresh token (optionnel)
    if (refreshToken) {
      try {
        await apiFetch('/api/auth/logout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        // Si l'appel échoue, on continue quand même avec le nettoyage côté client
        console.warn('⚠️ Erreur lors de la déconnexion côté serveur:', error);
      }
    }
    
    // Nettoyer le localStorage et l'état
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    setUser(null);
    setTokenExpiringSoon(false);
  };

  async function refreshAccessToken(): Promise<boolean> {
    const refresh = localStorage.getItem('refresh-token');
    if (!refresh) {
      // Nettoyer directement sans appeler logout() pour éviter la récursion
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      setUser(null);
      setTokenExpiringSoon(false);
      return false;
    }
    try {
      const result = await apiFetch('/api/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      // Vérifiez le type de réponse
      if (typeof result.data === 'string') {
        console.error('❌ Erreur Django lors du refresh:', result.data);
        // Nettoyer directement sans appeler logout() pour éviter la récursion
        localStorage.removeItem('auth-user');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        setUser(null);
        setTokenExpiringSoon(false);
        return false;
      }

      const { response, data } = result;

      // Le backend Django retourne {'success': True, 'access': access_token}
      if (response?.ok && data.success && data.access) {
        localStorage.setItem('auth-token', data.access);
        // Le refresh token n'est pas renvoyé, on garde l'ancien
        setTokenExpiringSoon(false);
        return true;
      } else {
        // Nettoyer directement sans appeler logout() pour éviter la récursion
        localStorage.removeItem('auth-user');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        setUser(null);
        setTokenExpiringSoon(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur refresh token:', error);
      // Nettoyer directement sans appeler logout() pour éviter la récursion
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      setUser(null);
      setTokenExpiringSoon(false);
      return false;
    }
  }

  // Vérifier si user est déjà connecté au chargement
  useEffect(() => {
    const savedUser = localStorage.getItem('auth-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('auth-user');
      }
    }
    setIsLoading(false);
  }, []);

  // Intervalle qui vérifie l'expiration du token et met à jour tokenExpiringSoon
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const exp = getTokenExpiration(token);
      const now = Date.now();

      if (!exp) {
        logout();
        return;
      }

      if (exp <= now) {
        logout();
        return;
      }

      const timeLeft = exp - now;

      if (timeLeft < 120000) {
        // moins de 2 minutes
        if (!tokenExpiringSoon) setTokenExpiringSoon(true);
      } else {
        if (tokenExpiringSoon) setTokenExpiringSoon(false);
      }
    }, 10000); // toutes les 10s

    return () => clearInterval(interval);
  }, [user, tokenExpiringSoon]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; role?: string }> => {
    setIsLoading(true);

    try {
      const result = await apiFetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("🔐 Résultat du login:", result);

      // Vérifiez si c'est une erreur HTML (string) ou une réponse JSON
      if (typeof result.data === 'string') {
        // C'est une erreur HTML (probablement ALLOWED_HOSTS)
        console.error('❌ Erreur Django:', result.data);
        return {
          success: false,
          message:
            'Problème de configuration serveur. Contactez l\'administrateur.',
        };
      }

      // C'est une réponse JSON normale
      const { response, data } = result;

      if (response?.ok && data.success) {
        const { access, refresh } = data.data;
        const { role, email: userEmail } = data.datas || {};

        const tokenPayload = parseJwt(access);
        const userId = tokenPayload?.user_id || tokenPayload?.id || '';

        // Récupérer le profil complet de l'utilisateur pour obtenir first_name, last_name, phone
        let userProfile = null;
        try {
          const profileResult = await apiFetch('/api/auth/profile/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access}`,
            },
          });

          if (profileResult.response?.ok && profileResult.data) {
            // Le backend retourne { success: true, data: {...} }
            const profileData = profileResult.data as any;
            userProfile = profileData.data || profileData;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de récupérer le profil utilisateur:', error);
        }

        // Construire le nom à partir du profil ou utiliser l'email
        const firstName = userProfile?.first_name || '';
        const lastName = userProfile?.last_name || '';
        const userName =
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || userEmail || 'Utilisateur';

        // Récupérer le rôle depuis le profil si disponible (peut être roleName ou role)
        const profileRole = userProfile?.role || userProfile?.roleName || userProfile?.role?.name;
        const finalRole = profileRole || role || 'user';
        // Normaliser le rôle (convertir "Administrateur" en "admin", etc.)
        const normalizedRole = finalRole.toLowerCase() === 'administrateur' || finalRole.toLowerCase() === 'admin' 
          ? 'admin' 
          : finalRole.toLowerCase() === 'manager' || finalRole.toLowerCase() === 'gestionnaire'
          ? 'manager'
          : 'user';

        const userData: User = {
          id: userId,
          email: userEmail || email,
          name: userName,
          role: normalizedRole as 'user' | 'admin' | 'manager',
          avatar: userName[0]?.toUpperCase() || 'U',
          phone: userProfile?.phone || '',
          first_name: firstName,
          last_name: lastName,
        };

        localStorage.setItem('auth-token', access);
        localStorage.setItem('refresh-token', refresh);
        localStorage.setItem('auth-user', JSON.stringify(userData));
        setUser(userData);

        return {
          success: true,
          message:
            data.message || `Connexion réussie! Bienvenue ${userData.name}`,
          role: userData.role,
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Échec de la connexion',
        };
      }
    } catch (error) {
      console.error("❌ Erreur lors de la connexion :", error);
      return {
        success: false,
        message: 'Erreur réseau. Veuillez réessayer.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    tokenExpiringSoon,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
