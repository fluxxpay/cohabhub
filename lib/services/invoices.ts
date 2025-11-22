import { apiFetch } from '../api';

export interface InvoiceItem {
  id: number;
  name: string;
  description: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  reservation: number;
  reservation_details: {
    event_name: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    attendees_count: number;
  };
  issue_date: string;
  due_date: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  status: 'paid' | 'pending' | 'upcoming' | 'draft';
  description: string;
  items: InvoiceItem[];
  user_details: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
  };
  space_details: {
    id: number;
    name: string;
    category: string;
    price_hour: number;
  };
  created_at: string;
  updated_at: string;
}

export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  paid_count: number;
  pending_count: number;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export class InvoiceError extends Error {
  constructor(
    message: string,
    public code: string = 'INVOICE_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'InvoiceError';
  }
}

/**
 * Service pour gérer les factures
 */
export class InvoiceService {
  /**
   * Récupère toutes les factures de l'utilisateur
   */
  static async getMyInvoices(): Promise<Invoice[]> {
    try {
      const result = await apiFetch('/api/invoices/my/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new InvoiceError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des factures',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as Invoice[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof InvoiceError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des factures:', error);
      throw new InvoiceError(
        'Erreur lors de la récupération des factures',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les détails d'une facture
   */
  static async getInvoiceById(invoiceId: number): Promise<Invoice> {
    try {
      const result = await apiFetch(`/api/invoices/${invoiceId}/`, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new InvoiceError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération de la facture',
          'FETCH_ERROR',
          errorData
        );
      }

      return result.data as Invoice;
    } catch (error) {
      if (error instanceof InvoiceError) {
        throw error;
      }
      console.error('Erreur lors de la récupération de la facture:', error);
      throw new InvoiceError(
        'Erreur lors de la récupération de la facture',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Télécharge une facture en PDF
   */
  static async downloadInvoice(invoiceId: number): Promise<Blob> {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new InvoiceError('Token d\'authentification manquant', 'AUTH_ERROR');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/download/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: ApiError;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Erreur lors du téléchargement' };
        }
        throw new InvoiceError(
          errorData?.message || errorData?.detail || 'Erreur lors du téléchargement de la facture',
          'DOWNLOAD_ERROR',
          errorData
        );
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof InvoiceError) {
        throw error;
      }
      console.error('Erreur lors du téléchargement de la facture:', error);
      throw new InvoiceError(
        'Erreur lors du téléchargement de la facture',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les statistiques des factures
   */
  static async getInvoiceStats(): Promise<InvoiceStats> {
    try {
      const result = await apiFetch('/api/invoices/stats/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new InvoiceError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des statistiques',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as InvoiceStats;
      return {
        total_invoices: data.total_invoices || 0,
        total_amount: data.total_amount || 0,
        paid_amount: data.paid_amount || 0,
        pending_amount: data.pending_amount || 0,
        paid_count: data.paid_count || 0,
        pending_count: data.pending_count || 0,
      };
    } catch (error) {
      if (error instanceof InvoiceError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new InvoiceError(
        'Erreur lors de la récupération des statistiques',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Demande une facture normalisée
   */
  static async requestNormalizedInvoice(
    invoiceId: number,
    data: {
      first_name: string;
      last_name: string;
      ifu: string;
      email: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; message: string; reference?: string }> {
    try {
      const result = await apiFetch(`/api/normalized_invoices/${invoiceId}/request-normalized/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new InvoiceError(
          errorData?.detail || errorData?.message || errorData?.error || 'Erreur lors de la demande de facture normalisée',
          'REQUEST_ERROR',
          errorData
        );
      }

      return result.data as { success: boolean; message: string; reference?: string };
    } catch (error) {
      if (error instanceof InvoiceError) {
        throw error;
      }
      console.error('Erreur lors de la demande de facture normalisée:', error);
      throw new InvoiceError(
        'Erreur lors de la demande de facture normalisée',
        'UNKNOWN_ERROR'
      );
    }
  }
}

