import { apiFetch } from '../api';

// Types d'erreur
export interface ApiError {
  detail?: string;
  non_field_errors?: string | string[];
  [key: string]: any;
}

export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string = 'NOTIFICATION_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

// Types de notifications
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type NotificationCategory = 'user' | 'space' | 'reservation' | 'billing' | 'system';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  category: NotificationCategory;
  action: string | null;
  read: boolean;
  timestamp: string;
  created_at: string;
}

export interface NotificationResponse {
  count: number;
  results: Notification[];
}

export class NotificationService {
  /**
   * Récupère toutes les notifications de l'utilisateur connecté
   */
  static async getNotifications(
    showRead: boolean = true
  ): Promise<Notification[]> {
    try {
      const params = new URLSearchParams();
      if (!showRead) {
        params.append('show_read', 'false');
      }

      const result = await apiFetch(
        `/api/notifications/${params.toString() ? `?${params.toString()}` : ''}`
      );

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des notifications';
        throw new NotificationError(errorMessage, 'FETCH_ERROR', errorData);
      }

      const data = result.data as NotificationResponse | Notification[];
      
      // Gérer les deux formats de réponse possibles
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }

      return [];
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des notifications:', error);
      throw new NotificationError(
        'Erreur lors de la récupération des notifications',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Marque une notification comme lue
   */
  static async markAsRead(id: number): Promise<void> {
    try {
      const result = await apiFetch(`/api/notifications/${id}/read/`, {
        method: 'PATCH',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors du marquage de la notification';
        throw new NotificationError(errorMessage, 'MARK_READ_ERROR', errorData);
      }
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error;
      }
      console.error('Erreur lors du marquage de la notification:', error);
      throw new NotificationError(
        'Erreur lors du marquage de la notification',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  static async markAllAsRead(): Promise<void> {
    try {
      const result = await apiFetch('/api/notifications/read-all/', {
        method: 'PATCH',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors du marquage de toutes les notifications';
        throw new NotificationError(errorMessage, 'MARK_ALL_READ_ERROR', errorData);
      }
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error;
      }
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      throw new NotificationError(
        'Erreur lors du marquage de toutes les notifications',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Supprime une notification
   */
  static async deleteNotification(id: number): Promise<void> {
    try {
      const result = await apiFetch(`/api/notifications/${id}/delete/`, {
        method: 'DELETE',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de la suppression de la notification';
        throw new NotificationError(errorMessage, 'DELETE_ERROR', errorData);
      }
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error;
      }
      console.error('Erreur lors de la suppression de la notification:', error);
      throw new NotificationError(
        'Erreur lors de la suppression de la notification',
        'UNKNOWN_ERROR'
      );
    }
  }
}

