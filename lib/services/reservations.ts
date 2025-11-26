import { apiFetch } from '../api';

// Types d'erreur améliorés
export interface ApiError {
  detail?: string;
  non_field_errors?: string | string[];
  [key: string]: any;
}

export class ReservationError extends Error {
  constructor(
    message: string,
    public code: string = 'RESERVATION_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ReservationError';
  }
}

export interface Reservation {
  id: string;
  space_id: string;
  space_name: string;
  event_name: string;
  space_category: string;
  date: string;
  start_time: string;
  end_time: string;
  nbr_nights?: number;
  attendees_count: number;
  space_location: string;
  total_price: number;
  is_active: boolean;
  status?: string; // 'draft', 'paid', 'cancelled'
  is_refunded?: boolean;
  reservation_options?: { id: number; name: string; price: number; icon: string }[];
  invoice?: { id: number; invoice_number: string; status: string } | null;
}

export interface ReservationUpdatePayload {
  space: string;
  date: string;
  event_name: string;
  attendees_count: number;
  is_active: boolean;
  options: number[];
  nbr_nights?: number | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface ReservationCreatePayload {
  space: string | number;
  date: string;
  event_name: string;
  attendees_count: number;
  options: number[];
  option_quantities?: Record<number, number>;
  nbr_nights?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export interface ReservationListResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Reservation[];
  data?: Reservation[];
  total_cost?: number;
  total_hours?: number;
}

export interface ReservationFilters {
  status?: 'draft' | 'paid' | 'cancelled';
  date_from?: string;
  date_to?: string;
  space_id?: string | number;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CalendarSlot {
  start: string | null;
  end: string | null;
  space_name?: string;
  location?: string;
  capacity?: string;
  price?: string;
}

export interface SpaceAvailability {
  occupied_slots: Array<{ start: string; end: string }>;
  available_slots: Array<{ start: string; end: string }>;
}

export interface CalendarReservation {
  id: string;
  space: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'upcoming';
  location: string;
  capacity: string;
  price: string;
}

export interface CalendarResponse {
  reserved_slots: Record<string, CalendarSlot[]>;
}

/**
 * Service pour gérer les réservations
 */
export class ReservationService {
  /**
   * Récupère toutes les réservations de l'utilisateur connecté avec pagination et filtres
   */
  static async getMyReservations(
    filters?: ReservationFilters
  ): Promise<ReservationListResponse> {
    try {
      // Construire les query params
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.space_id) params.append('space_id', String(filters.space_id));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const queryString = params.toString();
      const endpoint = `/api/reservations/my${queryString ? `?${queryString}` : ''}`;

      const result = await apiFetch(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReservationError(
          errorData?.detail || 'Erreur lors du chargement des réservations',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as ReservationListResponse;

      // Normaliser la réponse
      return {
        count: data.count || (Array.isArray(data.results) ? data.results.length : 0),
        next: data.next || null,
        previous: data.previous || null,
        results: data.results || data.data || [],
        total_cost: data.total_cost || 0,
        total_hours: data.total_hours || 0,
      };
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des réservations:', error);
      throw new ReservationError(
        'Erreur lors de la récupération des réservations',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère une réservation par son ID
   */
  static async getReservationById(id: string): Promise<Reservation> {
    try {
      const result = await apiFetch(`/api/reservations/${id}/`, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReservationError(
          errorData?.detail || 'Erreur lors de la récupération de la réservation',
          'NOT_FOUND',
          errorData
        );
      }

      return result.data as Reservation;
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la récupération de la réservation:', error);
      throw new ReservationError(
        'Erreur lors de la récupération de la réservation',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Met à jour une réservation
   */
  static async updateReservation(
    id: string,
    payload: ReservationUpdatePayload,
  ): Promise<Reservation> {
    try {
      const result = await apiFetch(`/api/reservations/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        let errorMessage = 'Erreur lors de la modification';

        if (errorData?.detail) {
          errorMessage = errorData.detail;
        } else if (errorData?.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors;
        } else if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        }

        throw new ReservationError(errorMessage, 'UPDATE_ERROR', errorData);
      }

      return result.data as Reservation;
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour de la réservation:', error);
      throw new ReservationError(
        'Erreur lors de la mise à jour de la réservation',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Met à jour le statut d'une réservation
   */
  static async updateReservationStatus(
    id: string | number,
    status: 'draft' | 'paid' | 'cancelled'
  ): Promise<Reservation> {
    try {
      const result = await apiFetch(`/api/reservations/${id}/status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de la mise à jour du statut';
        throw new ReservationError(errorMessage, 'STATUS_UPDATE_ERROR', errorData);
      }

      return result.data as Reservation;
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw new ReservationError(
        'Erreur lors de la mise à jour du statut',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Supprime/Annule une réservation
   */
  static async deleteReservation(id: string): Promise<void> {
    try {
      const result = await apiFetch(`/api/reservations/${id}/`, {
        method: 'DELETE',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        const errorMessage =
          errorData?.detail || errorData?.message || 'Erreur lors de l\'annulation';
        throw new ReservationError(errorMessage, 'DELETE_ERROR', errorData);
      }
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la suppression de la réservation:', error);
      throw new ReservationError(
        'Erreur lors de la suppression de la réservation',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Crée une nouvelle réservation
   */
  static async createReservation(payload: ReservationCreatePayload): Promise<Reservation> {
    try {
      // Validation côté client
      if (payload.date && new Date(payload.date) < new Date()) {
        throw new ReservationError(
          'Impossible de réserver une date passée',
          'VALIDATION_ERROR'
        );
      }

      if (payload.start_time && payload.end_time) {
        const [startHours, startMinutes] = payload.start_time.split(':').map(Number);
        const [endHours, endMinutes] = payload.end_time.split(':').map(Number);
        const start = startHours * 60 + startMinutes;
        const end = endHours * 60 + endMinutes;
        
        if (start >= end) {
          throw new ReservationError(
            'L\'heure de début doit être antérieure à l\'heure de fin',
            'VALIDATION_ERROR'
          );
        }
      }

      const result = await apiFetch('/api/reservations/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        let errorMessage = 'Erreur lors de la création de la réservation';

        if (errorData?.detail) {
          errorMessage = errorData.detail;
        } else if (errorData?.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors;
        } else if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        }

        throw new ReservationError(errorMessage, 'CREATE_ERROR', errorData);
      }

      return result.data as Reservation;
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la création de la réservation:', error);
      throw new ReservationError(
        'Erreur lors de la création de la réservation',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Télécharge la facture d'une réservation
   */
  static async downloadInvoice(invoiceId: number): Promise<Blob> {
    try {
      // Utiliser apiFetch pour la cohérence, mais avec responseType blob
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' 
          ? window.location.origin.replace(':3000', ':8000')
          : 'http://localhost:8000');

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/download/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Erreur lors du téléchargement de la facture';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Si la réponse n'est pas du JSON, utiliser le message par défaut
        }
        throw new ReservationError(errorMessage, 'DOWNLOAD_ERROR');
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors du téléchargement de la facture:', error);
      throw new ReservationError(
        'Erreur lors du téléchargement de la facture',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère toutes les réservations groupées par jour pour le calendrier
   */
  static async getReservationsByDay(): Promise<CalendarReservation[]> {
    try {
      const result = await apiFetch('/api/reservations/all/by_day/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        throw new Error('Erreur lors du chargement des réservations du calendrier');
      }

      const data = result.data as CalendarResponse;

      if (!data || typeof data !== 'object') {
        throw new Error('Format de données inattendu');
      }

      const loadedReservations: CalendarReservation[] = [];

      for (const [date, slots] of Object.entries(data.reserved_slots || {})) {
        (slots as CalendarSlot[]).forEach((slot, index) => {
          if (slot.start && slot.end) {
            loadedReservations.push({
              id: `${date}-${index}-${slot.start}`,
              space: slot.space_name || 'Espace réservé',
              date,
              startTime: slot.start,
              endTime: slot.end,
              status: 'active',
              location: slot.location || 'N/A',
              capacity: slot.capacity || 'N/A',
              price: slot.price || 'N/A',
            });
          }
        });
      }

      return loadedReservations;
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations par jour:', error);
      throw error;
    }
  }

  /**
   * Récupère les disponibilités d'un espace pour une date donnée
   */
  static async getSpaceAvailability(
    spaceId: string | number,
    date: string
  ): Promise<SpaceAvailability> {
    try {
      const result = await apiFetch<SpaceAvailability>(
        `/api/spaces/${spaceId}/availability/?date=${date}`,
        {
          method: 'GET',
        }
      );

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReservationError(
          errorData?.detail || 'Erreur lors de la récupération des disponibilités',
          'AVAILABILITY_ERROR',
          errorData
        );
      }

      return result.data as SpaceAvailability;
    } catch (error) {
      if (error instanceof ReservationError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des disponibilités:', error);
      throw new ReservationError(
        'Erreur lors de la récupération des disponibilités',
        'UNKNOWN_ERROR'
      );
    }
  }
}

