/**
 * Service pour la gestion du check-in et décompte
 */
import { apiFetch } from '../api';
import type {
  ReservationSession,
  SessionStatus,
  ReservationVerification,
  CheckInRequest,
  CheckOutRequest,
  ActiveSessionsResponse,
  SessionHistoryResponse,
  CheckInResponse,
  CheckOutResponse,
  ApiError,
} from '@/types/checkin';


export class CheckInService {
  /**
   * Vérifie une réservation avant check-in
   */
  static async verifyReservation(
    reservationId: number,
    email?: string,
    eventName?: string
  ): Promise<ReservationVerification> {
    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (eventName) params.append('event_name', eventName);

      const queryString = params.toString();
      const endpoint = `/api/admin/reservations/verify/${reservationId}/${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<ReservationVerification>(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors de la vérification');
      }

      return result.data as ReservationVerification;
    } catch (error: any) {
      console.error('Erreur lors de la vérification de la réservation:', error);
      throw new Error(error.message || 'Erreur lors de la vérification de la réservation');
    }
  }

  /**
   * Effectue un check-in
   */
  static async checkIn(
    reservationId: number,
    data: CheckInRequest
  ): Promise<CheckInResponse> {
    try {
      const endpoint = `/api/admin/reservations/${reservationId}/check-in/`;
      const result = await apiFetch<CheckInResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors du check-in');
      }

      return result.data as CheckInResponse;
    } catch (error: any) {
      console.error('Erreur lors du check-in:', error);
      throw new Error(error.message || 'Erreur lors du check-in');
    }
  }

  /**
   * Récupère le statut en temps réel d'une session
   */
  static async getSessionStatus(sessionId: number): Promise<SessionStatus> {
    try {
      const endpoint = `/api/admin/sessions/${sessionId}/status/`;
      const result = await apiFetch<SessionStatus>(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors de la récupération du statut');
      }

      return result.data as SessionStatus;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du statut:', error);
      throw new Error(error.message || 'Erreur lors de la récupération du statut');
    }
  }

  /**
   * Effectue un check-out
   */
  static async checkOut(
    sessionId: number,
    data: CheckOutRequest
  ): Promise<CheckOutResponse> {
    try {
      const endpoint = `/api/admin/sessions/${sessionId}/check-out/`;
      const result = await apiFetch<CheckOutResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors du check-out');
      }

      return result.data as CheckOutResponse;
    } catch (error: any) {
      console.error('Erreur lors du check-out:', error);
      throw new Error(error.message || 'Erreur lors du check-out');
    }
  }

  /**
   * Récupère les sessions actives
   */
  static async getActiveSessions(spaceId?: number): Promise<ActiveSessionsResponse> {
    try {
      const params = new URLSearchParams();
      if (spaceId) params.append('space_id', String(spaceId));

      const queryString = params.toString();
      const endpoint = `/api/admin/sessions/active/${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<ActiveSessionsResponse>(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors de la récupération des sessions actives');
      }

      return result.data as ActiveSessionsResponse;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des sessions actives:', error);
      throw new Error(error.message || 'Erreur lors de la récupération des sessions actives');
    }
  }

  /**
   * Récupère l'historique des sessions
   */
  static async getSessionHistory(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    space_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<SessionHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.space_id) params.append('space_id', String(filters.space_id));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const queryString = params.toString();
      const endpoint = `/api/admin/sessions/${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch<SessionHistoryResponse>(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors de la récupération de l\'historique');
      }

      return result.data as SessionHistoryResponse;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw new Error(error.message || 'Erreur lors de la récupération de l\'historique');
    }
  }

  /**
   * Récupère les détails d'une session
   */
  static async getSessionDetail(sessionId: number): Promise<ReservationSession> {
    try {
      const endpoint = `/api/admin/sessions/${sessionId}/`;
      const result = await apiFetch<ReservationSession>(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors de la récupération de la session');
      }

      return result.data as ReservationSession;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la session:', error);
      throw new Error(error.message || 'Erreur lors de la récupération de la session');
    }
  }

  /**
   * Récupère la session d'un utilisateur pour une réservation
   */
  static async getUserSession(reservationId: number): Promise<{ session: ReservationSession | null; message?: string }> {
    try {
      const endpoint = `/api/reservations/${reservationId}/session/`;
      const result = await apiFetch<{ session: ReservationSession | null; message?: string }>(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const error: ApiError = result.data as ApiError;
        throw new Error(error.error || error.detail || error.message || 'Erreur lors de la récupération de la session');
      }

      return result.data as { session: ReservationSession | null; message?: string };
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la session utilisateur:', error);
      throw new Error(error.message || 'Erreur lors de la récupération de la session');
    }
  }
}

