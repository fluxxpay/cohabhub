/**
 * Configuration centralisée pour les URLs de l'application
 * Utilise les variables d'environnement pour gérer les différents environnements
 */

/**
 * Récupère l'URL de base du frontend
 * En production: https://cohabhub.com
 * En développement: http://localhost:3000
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Côté client : utiliser la variable d'environnement ou l'URL actuelle
    return (
      process.env.NEXT_PUBLIC_BASE_URL ||
      window.location.origin
    );
  }
  // Côté serveur : utiliser la variable d'environnement ou localhost
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Récupère l'URL de l'API backend
 * En production: https://myapi.cohabhub.com
 * En développement: http://localhost:8000
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    // Côté client : utiliser la variable d'environnement ou construire depuis l'origin
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    
    // En développement, essayer de construire depuis l'origin
    const origin = window.location.origin;
    if (origin.includes(':3000')) {
      return origin.replace(':3000', ':8000');
    }
    return 'http://localhost:8000';
  }
  // Côté serveur : utiliser la variable d'environnement ou localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

/**
 * Récupère l'URL WebSocket pour les notifications
 * En production: wss://myapi.cohabhub.com
 * En développement: ws://localhost:8000
 */
export function getWebSocketUrl(): string {
  const apiUrl = getApiUrl();
  // Convertir http/https en ws/wss
  return apiUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
}

// Exporter les URLs pour utilisation directe
export const BASE_URL = getBaseUrl();
export const API_URL = getApiUrl();
export const WS_URL = getWebSocketUrl();

// Log pour déboguer (uniquement en développement)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuration URLs:');
  console.log('  - BASE_URL:', BASE_URL);
  console.log('  - API_URL:', API_URL);
  console.log('  - WS_URL:', WS_URL);
}

