import { apiFetch } from '../api';
import { Reservation } from './reservations';
import { Invoice } from './invoices';
import { Space } from './spaces';

// Types d'erreur
export interface ApiError {
  detail?: string;
  non_field_errors?: string | string[];
  [key: string]: any;
}

export class SearchError extends Error {
  constructor(
    message: string,
    public code: string = 'SEARCH_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

export interface SearchResult {
  reservations: Reservation[];
  spaces: Space[];
  invoices: Invoice[];
}

export interface SearchResponse {
  results: SearchResult;
  count: number;
}

export class SearchService {
  /**
   * Recherche globale dans les réservations, espaces et factures
   */
  static async globalSearch(query: string): Promise<SearchResult> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          reservations: [],
          spaces: [],
          invoices: [],
        };
      }

      const [reservations, spaces, invoices] = await Promise.all([
        this.searchReservations(query),
        this.searchSpaces(query),
        this.searchInvoices(query),
      ]);

      return {
        reservations,
        spaces,
        invoices,
      };
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }
      console.error('Erreur lors de la recherche globale:', error);
      throw new SearchError(
        'Erreur lors de la recherche globale',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Recherche dans les réservations
   */
  static async searchReservations(query: string, limit: number = 5): Promise<Reservation[]> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      params.append('page_size', limit.toString());

      const result = await apiFetch(`/api/reservations/my/?${params.toString()}`);

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de la recherche de réservations';
        throw new SearchError(errorMessage, 'RESERVATION_SEARCH_ERROR', errorData);
      }

      const data = result.data;
      
      console.log('🔍 Données brutes reçues pour les réservations:', data);
      
      // Gérer les différents formats de réponse possibles
      if (Array.isArray(data)) {
        console.log('✅ Format array détecté, nombre de réservations:', data.length);
        return data.slice(0, limit);
      }
      
      if (data && typeof data === 'object') {
        // Format avec results
        if ('results' in data && Array.isArray(data.results)) {
          console.log('✅ Format results détecté, nombre de réservations:', data.results.length);
          return data.results.slice(0, limit);
        }
        // Format avec data
        if ('data' in data && Array.isArray(data.data)) {
          console.log('✅ Format data détecté, nombre de réservations:', data.data.length);
          return data.data.slice(0, limit);
        }
        // Format direct avec count et results
        if ('count' in data && 'results' in data && Array.isArray(data.results)) {
          console.log('✅ Format count+results détecté, nombre de réservations:', data.results.length);
          return data.results.slice(0, limit);
        }
      }

      console.warn('⚠️ Format de réponse inattendu pour les réservations:', data);
      return [];
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }
      console.error('Erreur lors de la recherche de réservations:', error);
      return [];
    }
  }

  /**
   * Recherche dans les espaces
   */
  static async searchSpaces(query: string, limit: number = 5): Promise<Space[]> {
    try {
      const result = await apiFetch('/api/spaces/');

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de la recherche d\'espaces';
        throw new SearchError(errorMessage, 'SPACE_SEARCH_ERROR', errorData);
      }

      const data = result.data as Space[] | { results: Space[] };
      
      // Gérer les deux formats de réponse possibles
      let spaces: Space[] = [];
      if (Array.isArray(data)) {
        spaces = data;
      } else if (data && typeof data === 'object' && 'results' in data) {
        spaces = data.results;
      }

      // Filtrer localement par nom (car l'endpoint ne supporte pas la recherche)
      const filtered = spaces.filter((space) =>
        space.name.toLowerCase().includes(query.toLowerCase()) ||
        space.description?.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, limit);
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }
      console.error('Erreur lors de la recherche d\'espaces:', error);
      return [];
    }
  }

  /**
   * Recherche dans les factures
   */
  static async searchInvoices(query: string, limit: number = 5): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);

      const result = await apiFetch(`/api/invoices/my/?${params.toString()}`);

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de la recherche de factures';
        throw new SearchError(errorMessage, 'INVOICE_SEARCH_ERROR', errorData);
      }

      const data = result.data as Invoice[] | { results: Invoice[] };
      
      // Gérer les deux formats de réponse possibles
      if (Array.isArray(data)) {
        return data.slice(0, limit);
      }
      
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results.slice(0, limit);
      }

      return [];
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }
      console.error('Erreur lors de la recherche de factures:', error);
      return [];
    }
  }
}

