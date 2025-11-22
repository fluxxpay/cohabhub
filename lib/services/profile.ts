import { apiFetch } from '../api';

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  role: string;
  date_joined: string;
  total_reservations?: number;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ProfileStats {
  totalReservations: number;
  totalCost: number;
  memberSince: string;
  level: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export class ProfileError extends Error {
  constructor(
    message: string,
    public code: string = 'PROFILE_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ProfileError';
  }
}

/**
 * Service pour gérer le profil utilisateur
 */
export class ProfileService {
  /**
   * Récupère le profil de l'utilisateur connecté
   */
  static async getMyProfile(): Promise<UserProfile> {
    try {
      const result = await apiFetch('/api/auth/profile/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ProfileError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération du profil',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as { success?: boolean; data?: UserProfile; [key: string]: any };
      
      // Gérer les différents formats de réponse
      if (data.success && data.data) {
        return data.data;
      } else if (data.id) {
        // Si la réponse est directement le profil
        return data as UserProfile;
      } else {
        throw new ProfileError('Format de réponse invalide', 'INVALID_FORMAT');
      }
    } catch (error) {
      if (error instanceof ProfileError) {
        throw error;
      }
      console.error('Erreur lors de la récupération du profil:', error);
      throw new ProfileError(
        'Erreur lors de la récupération du profil',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  static async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const result = await apiFetch('/api/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ProfileError(
          errorData?.detail || errorData?.message || 'Erreur lors de la mise à jour du profil',
          'UPDATE_ERROR',
          errorData
        );
      }

      const responseData = result.data as { success?: boolean; data?: UserProfile; [key: string]: any };
      
      // Gérer les différents formats de réponse
      if (responseData.success && responseData.data) {
        return responseData.data;
      } else if (responseData.id) {
        return responseData as UserProfile;
      } else {
        throw new ProfileError('Format de réponse invalide', 'INVALID_FORMAT');
      }
    } catch (error) {
      if (error instanceof ProfileError) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw new ProfileError(
        'Erreur lors de la mise à jour du profil',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les statistiques du profil (réservations, coûts, etc.)
   */
  static async getProfileStats(): Promise<ProfileStats> {
    try {
      // Récupérer les réservations pour calculer les stats
      const reservationsResult = await apiFetch('/api/reservations/my/', {
        method: 'GET',
      });

      if (!reservationsResult.response?.ok) {
        throw new ProfileError('Erreur lors de la récupération des statistiques');
      }

      const reservationsData = reservationsResult.data as {
        results?: any[];
        total_cost?: number;
        count?: number;
        [key: string]: any;
      };

      const reservations = Array.isArray(reservationsData.results)
        ? reservationsData.results
        : Array.isArray(reservationsData)
        ? reservationsData
        : [];

      const totalReservations = reservationsData.count || reservations.length;
      const totalCost = reservationsData.total_cost || 0;

      // Récupérer le profil pour la date d'adhésion
      const profile = await this.getMyProfile();
      const memberSince = profile.date_joined
        ? new Date(profile.date_joined).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '';

      // Calculer le niveau
      const dateJoined = profile.date_joined ? new Date(profile.date_joined) : new Date();
      const now = new Date();
      const diffYears = (now.getTime() - dateJoined.getTime()) / (1000 * 3600 * 24 * 365);
      const level = diffYears >= 1 ? 'Premium' : 'Standard';

      return {
        totalReservations,
        totalCost,
        memberSince,
        level,
      };
    } catch (error) {
      if (error instanceof ProfileError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new ProfileError(
        'Erreur lors de la récupération des statistiques',
        'UNKNOWN_ERROR'
      );
    }
  }
}

