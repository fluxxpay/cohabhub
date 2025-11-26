import { apiFetch } from '../api';
import { getApiUrl } from '../config';
import type {
  Review,
  ReviewStats,
  ReviewCreatePayload,
  ReviewUpdatePayload,
  ReviewListResponse,
  ReviewFilters,
  ApiError,
} from '@/types/reviews';
import { ReviewError } from '@/types/reviews';

/**
 * Service pour gérer les avis (reviews)
 */
export class ReviewService {
  /**
   * Crée un nouvel avis
   */
  static async createReview(payload: ReviewCreatePayload): Promise<Review> {
    try {
      const result = await apiFetch('/api/reviews/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReviewError(
          errorData?.detail || errorData?.non_field_errors?.[0] || 'Erreur lors de la création de l\'avis',
          'CREATE_ERROR',
          errorData
        );
      }

      return result.data as Review;
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors de la création de l\'avis',
        'CREATE_ERROR'
      );
    }
  }

  /**
   * Récupère les avis de l'utilisateur connecté
   */
  static async getMyReviews(filters?: ReviewFilters): Promise<ReviewListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const queryString = params.toString();
      const endpoint = `/api/reviews/my/${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReviewError(
          errorData?.detail || 'Erreur lors du chargement de vos avis',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as ReviewListResponse | { results: Review[] } | Review[];

      // Normaliser la réponse
      if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data,
        };
      } else if ('results' in data) {
        return data as ReviewListResponse;
      } else if ('data' in data && Array.isArray((data as any).data)) {
        return {
          count: (data as any).count || (data as any).data.length,
          next: (data as any).next || null,
          previous: (data as any).previous || null,
          results: (data as any).data,
        };
      }

      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors du chargement de vos avis',
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère les avis d'un espace spécifique
   */
  static async getSpaceReviews(
    spaceId: number,
    filters?: ReviewFilters
  ): Promise<ReviewListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.rating) params.append('rating', String(filters.rating));
      if (filters?.sort) params.append('sort', filters.sort);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const queryString = params.toString();
      const endpoint = `/api/spaces/${spaceId}/reviews/${queryString ? `?${queryString}` : ''}`;

      // Pour les endpoints publics, utiliser fetch directement
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ReviewError(
          errorData?.detail || 'Erreur lors du chargement des avis',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = await response.json();
      
      // Normaliser la réponse
      if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data,
        };
      } else if ('results' in data) {
        return data as ReviewListResponse;
      } else if ('data' in data && Array.isArray((data as any).data)) {
        return {
          count: (data as any).count || (data as any).data.length,
          next: (data as any).next || null,
          previous: (data as any).previous || null,
          results: (data as any).data,
        };
      }

      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors du chargement des avis',
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère les statistiques d'avis d'un espace
   */
  static async getSpaceReviewStats(spaceId: number): Promise<ReviewStats> {
    try {
      const apiUrl = getApiUrl();
      const endpoint = `/api/spaces/${spaceId}/reviews/stats/`;

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ReviewError(
          errorData?.detail || 'Erreur lors du chargement des statistiques',
          'FETCH_ERROR',
          errorData
        );
      }

      return await response.json() as ReviewStats;
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors du chargement des statistiques',
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Récupère les meilleurs avis globaux (pour la section testimonials)
   */
  static async getTopReviews(limit: number = 6): Promise<Review[]> {
    try {
      const apiUrl = getApiUrl();
      const endpoint = `/api/reviews/list/?status=approved&sort=-overall_rating&page_size=${limit}`;

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Si l'endpoint nécessite une authentification, retourner un tableau vide
        return [];
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data.slice(0, limit);
      } else if ('results' in data && Array.isArray(data.results)) {
        return data.results.slice(0, limit);
      } else if ('data' in data && Array.isArray((data as any).data)) {
        return (data as any).data.slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des meilleurs avis:', error);
      return [];
    }
  }

  /**
   * Modifie un avis existant
   */
  static async updateReview(
    reviewId: number,
    payload: ReviewUpdatePayload
  ): Promise<Review> {
    try {
      const result = await apiFetch(`/api/reviews/${reviewId}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReviewError(
          errorData?.detail || errorData?.non_field_errors?.[0] || 'Erreur lors de la modification de l\'avis',
          'UPDATE_ERROR',
          errorData
        );
      }

      return result.data as Review;
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors de la modification de l\'avis',
        'UPDATE_ERROR'
      );
    }
  }

  /**
   * Supprime un avis
   */
  static async deleteReview(reviewId: number): Promise<void> {
    try {
      const result = await apiFetch(`/api/reviews/${reviewId}/`, {
        method: 'DELETE',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReviewError(
          errorData?.detail || 'Erreur lors de la suppression de l\'avis',
          'DELETE_ERROR',
          errorData
        );
      }
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors de la suppression de l\'avis',
        'DELETE_ERROR'
      );
    }
  }

  /**
   * Marque un avis comme utile
   */
  static async markHelpful(reviewId: number): Promise<{ helpful_count: number }> {
    try {
      const result = await apiFetch(`/api/reviews/${reviewId}/helpful/`, {
        method: 'POST',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReviewError(
          errorData?.detail || 'Erreur lors de l\'action',
          'HELPFUL_ERROR',
          errorData
        );
      }

      return result.data as { helpful_count: number };
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors de l\'action',
        'HELPFUL_ERROR'
      );
    }
  }

  /**
   * Récupère un avis spécifique
   */
  static async getReview(reviewId: number): Promise<Review> {
    try {
      const result = await apiFetch(`/api/reviews/${reviewId}/`, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReviewError(
          errorData?.detail || 'Avis non trouvé',
          'FETCH_ERROR',
          errorData
        );
      }

      return result.data as Review;
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Erreur lors du chargement de l\'avis',
        'FETCH_ERROR'
      );
    }
  }
}
