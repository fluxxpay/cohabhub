import { apiFetch } from '../api';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  reservation_notifications?: boolean;
  payment_notifications?: boolean;
  event_notifications?: boolean;
  public_profile?: boolean;
  share_statistics?: boolean;
  marketing_emails?: boolean;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ActiveSession {
  browser: string;
  location: string;
  status: string;
  current: boolean;
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
  [key: string]: any;
}

export class SettingsError extends Error {
  constructor(
    message: string,
    public code: string = 'SETTINGS_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

/**
 * Service pour gérer les paramètres utilisateur
 */
export class SettingsService {
  /**
   * Récupère les préférences utilisateur
   */
  static async getPreferences(): Promise<UserPreferences> {
    try {
      const result = await apiFetch('/api/auth/preferences/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new SettingsError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des préférences',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as UserPreferences;
      return {
        theme: data.theme || 'light',
        language: data.language || 'fr',
        email_notifications: data.email_notifications ?? true,
        push_notifications: data.push_notifications ?? true,
        reservation_notifications: data.reservation_notifications ?? true,
        payment_notifications: data.payment_notifications ?? false,
        event_notifications: data.event_notifications ?? true,
        public_profile: data.public_profile ?? false,
        share_statistics: data.share_statistics ?? false,
        marketing_emails: data.marketing_emails ?? false,
      };
    } catch (error) {
      if (error instanceof SettingsError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des préférences:', error);
      throw new SettingsError(
        'Erreur lors de la récupération des préférences',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Met à jour les préférences utilisateur
   * Note: Le backend ne supporte actuellement que 'theme' et 'language'
   */
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // Le backend ne supporte que theme et language pour l'instant
      const payload: { theme?: string; language?: string } = {};
      if (preferences.theme) {
        payload.theme = preferences.theme;
      }
      if (preferences.language) {
        payload.language = preferences.language;
      }

      const result = await apiFetch('/api/auth/preferences/', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new SettingsError(
          errorData?.detail || errorData?.message || 'Erreur lors de la mise à jour des préférences',
          'UPDATE_ERROR',
          errorData
        );
      }

      const data = result.data as UserPreferences;
      return {
        theme: data.theme || 'light',
        language: data.language || 'fr',
        email_notifications: preferences.email_notifications ?? true,
        push_notifications: preferences.push_notifications ?? true,
        reservation_notifications: preferences.reservation_notifications ?? true,
        payment_notifications: preferences.payment_notifications ?? false,
        event_notifications: preferences.event_notifications ?? true,
        public_profile: preferences.public_profile ?? false,
        share_statistics: preferences.share_statistics ?? false,
        marketing_emails: preferences.marketing_emails ?? false,
      };
    } catch (error) {
      if (error instanceof SettingsError) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw new SettingsError(
        'Erreur lors de la mise à jour des préférences',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  static async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiFetch('/api/auth/change_password/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.errors?.new_password?.join('\n') ||
          errorData?.message ||
          errorData?.detail ||
          'Erreur lors du changement de mot de passe';
        throw new SettingsError(errorMessage, 'PASSWORD_ERROR', errorData);
      }

      const responseData = result.data as { success: boolean; message: string };
      return {
        success: responseData.success ?? true,
        message: responseData.message || 'Mot de passe changé avec succès',
      };
    } catch (error) {
      if (error instanceof SettingsError) {
        throw error;
      }
      console.error('Erreur lors du changement de mot de passe:', error);
      throw new SettingsError(
        'Erreur lors du changement de mot de passe',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les sessions actives de l'utilisateur
   */
  static async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const result = await apiFetch('/api/auth/active_sessions/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new SettingsError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des sessions',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as { success?: boolean; sessions?: ActiveSession[] };
      if (data.success && data.sessions) {
        return data.sessions;
      }
      return [];
    } catch (error) {
      if (error instanceof SettingsError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des sessions:', error);
      throw new SettingsError(
        'Erreur lors de la récupération des sessions',
        'UNKNOWN_ERROR'
      );
    }
  }
}

