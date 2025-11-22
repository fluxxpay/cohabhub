/**
 * API Service for Django Backend
 * Handles all API calls to the Django REST API with JWT authentication
 */

import { getApiUrl } from './config';

// Utiliser la configuration centralisée pour l'URL de l'API
const API_URL = getApiUrl();

// Variable pour éviter les boucles infinies de refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Rafraîchit le token d'accès automatiquement
 */
async function refreshToken(): Promise<string | null> {
  // Si un refresh est déjà en cours, attendre qu'il se termine
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh-token');
      if (!refreshTokenValue) {
        console.warn("⚠️ Aucun refresh token disponible");
        return null;
      }

      // Utiliser la configuration centralisée
      const apiUrl = getApiUrl();
      console.log("🔄 Rafraîchissement automatique du token...");
      const response = await fetch(`${apiUrl}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshTokenValue }),
      });

      if (!response.ok) {
        console.error("❌ Échec du rafraîchissement du token");
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        localStorage.removeItem('auth-user');
        return null;
      }

      const data = await response.json();
      if (data.access) {
        localStorage.setItem('auth-token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh-token', data.refresh);
        }
        console.log("✅ Token rafraîchi automatiquement avec succès");
        return data.access;
      }
      return null;
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement automatique:", error);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('auth-user');
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Ajoute le token d'authentification aux headers si disponible
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth-token');
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export interface ApiResponse<T = any> {
  response: Response | null;
  data: T | { error: string };
}

/**
 * Fetch wrapper pour les appels API Django avec gestion automatique du JWT
 * 
 * @param endpoint - Endpoint API (ex: '/api/auth/login/')
 * @param options - Options fetch standard
 * @returns Promise avec response et data parsée
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Utiliser la configuration centralisée pour l'URL de l'API
  // IMPORTANT: Toujours utiliser une URL absolue pour éviter que Next.js intercepte la requête
  const apiUrl = getApiUrl();
  // S'assurer que l'endpoint commence par / et construire l'URL complète
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${apiUrl}${cleanEndpoint}`;

  // Ne pas logger les requêtes de refresh pour éviter le spam
  if (!endpoint.includes('/token/refresh/')) {
    console.log("🌐 API Request - URL complète:", url);
    console.log("🌐 API_URL utilisé:", apiUrl);
    console.log("🌐 Endpoint:", cleanEndpoint);
  }

  // Ajouter le token d'authentification si disponible
  const authHeaders = getAuthHeaders();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers || {}),
  };

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Si 401 (non autorisé), essayer de rafraîchir le token et réessayer une fois
    if (
      response.status === 401 &&
      !endpoint.includes('/token/refresh/') &&
      !endpoint.includes('/login/') &&
      !endpoint.includes('/register/')
    ) {
      console.log("🔄 Token expiré, tentative de rafraîchissement automatique...");
      const newToken = await refreshToken();

      if (newToken) {
        // Réessayer la requête avec le nouveau token
        const newHeaders = {
          'Content-Type': 'application/json',
          ...authHeaders,
          Authorization: `Bearer ${newToken}`,
          ...(options.headers || {}),
        };

        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
      } else {
        // Si le refresh échoue, rediriger vers la page de login
        if (typeof window !== 'undefined') {
          window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.pathname);
        }
        return {
          response,
          data: { error: "Session expirée. Veuillez vous reconnecter." },
        };
      }
    }

    const text = await response.text();

    // Détecter les réponses HTML inattendues (erreurs Django)
    // Vérifier d'abord si c'est du JSON valide avant de vérifier HTML
    let isJson = false;
    try {
      JSON.parse(text);
      isJson = true;
    } catch {
      // Ce n'est pas du JSON valide
    }
    
    // Si ce n'est pas du JSON et que ça ressemble à du HTML, alors c'est une erreur
    if (!isJson && (
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html") ||
      (text.includes("<html") && text.includes("</html>"))
    )) {
      console.error("❌ Réponse HTML inattendue :", text.substring(0, 200));
      return {
        response,
        data: { error: "Réponse HTML inattendue du serveur" },
      };
    }

    let data: T | { error: string };
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as any;
    }

    return { response, data };
  } catch (error: any) {
    // Gérer spécifiquement l'AbortError (timeout)
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      console.error("❌ Requête annulée (timeout ou interruption):", error);
      return {
        response: null,
        data: {
          error:
            "La requête a pris trop de temps ou a été interrompue. Vérifiez que le serveur Django est démarré.",
        },
      };
    }

    console.error("❌ Erreur apiFetch:", error);
    return {
      response: null,
      data: { error: error.message || "Erreur de connexion au serveur" },
    };
  }
}

/**
 * Parse JWT token to extract payload
 */
export function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/**
 * Get token expiration timestamp
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;
  try {
    const decoded = parseJwt(token);
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('auth-token') !== null;
}

/**
 * Get client IP from NextRequest (server-side only)
 * Note: This function is only used in Next.js API routes
 */
export function getClientIP(request: {
  headers: {
    get: (name: string) => string | null;
  };
}): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
