import { apiFetch } from '../api';

export interface BillingOverview {
  balance: number;
  month_expenses: number;
  pending_invoices: number;
  total_spent: number;
  total_invoices?: number;
}

export interface PaymentTransaction {
  id: number;
  description: string;
  amount: string;
  date: string;
  status: string;
  type: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  available: boolean;
  description?: string;
}

export interface UserPaymentMethod {
  id: number;
  method: number;
  method_name: string;
  details?: {
    last4?: string;
    expiry?: string;
    [key: string]: any;
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPaymentMethodData {
  method: number;
  method_name: string;
  details?: {
    last4?: string;
    expiry?: string;
    [key: string]: any;
  };
  is_default?: boolean;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export class BillingError extends Error {
  constructor(
    message: string,
    public code: string = 'BILLING_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

/**
 * Service pour gérer la facturation et les paiements
 */
export class BillingService {
  /**
   * Récupère les statistiques de facturation
   */
  static async getBillingOverview(): Promise<BillingOverview> {
    try {
      const result = await apiFetch('/api/billing/overview/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new BillingError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des statistiques',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as BillingOverview;
      return {
        balance: data.balance || 0,
        month_expenses: data.month_expenses || 0,
        pending_invoices: data.pending_invoices || 0,
        total_spent: data.total_spent || 0,
        total_invoices: data.total_invoices || 0,
      };
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new BillingError(
        'Erreur lors de la récupération des statistiques',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère l'historique des paiements
   */
  static async getPaymentHistory(): Promise<PaymentTransaction[]> {
    try {
      const result = await apiFetch('/api/payments/history/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new BillingError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération de l\'historique',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as PaymentTransaction[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw new BillingError(
        'Erreur lors de la récupération de l\'historique',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les méthodes de paiement disponibles
   */
  static async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const result = await apiFetch('/api/payment_methods/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new BillingError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des méthodes disponibles',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as PaymentMethod[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des méthodes disponibles:', error);
      throw new BillingError(
        'Erreur lors de la récupération des méthodes disponibles',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les méthodes de paiement de l'utilisateur
   */
  static async getUserPaymentMethods(): Promise<UserPaymentMethod[]> {
    try {
      const result = await apiFetch('/api/user/payment_methods/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new BillingError(
          errorData?.detail || errorData?.message || 'Erreur lors de la récupération des méthodes de paiement',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as UserPaymentMethod[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des méthodes de paiement:', error);
      throw new BillingError(
        'Erreur lors de la récupération des méthodes de paiement',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Ajoute une méthode de paiement
   */
  static async addUserPaymentMethod(data: CreateUserPaymentMethodData): Promise<UserPaymentMethod> {
    try {
      const result = await apiFetch('/api/user/payment_methods/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new BillingError(
          errorData?.detail || errorData?.message || errorData?.errors || 'Erreur lors de l\'ajout de la méthode',
          'CREATE_ERROR',
          errorData
        );
      }

      return result.data as UserPaymentMethod;
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      console.error('Erreur lors de l\'ajout de la méthode:', error);
      throw new BillingError(
        'Erreur lors de l\'ajout de la méthode',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Supprime une méthode de paiement
   */
  static async deleteUserPaymentMethod(methodId: number): Promise<void> {
    try {
      // L'endpoint DELETE utilise pk comme paramètre dans l'URL
      // L'URL devrait être /api/user/payment_methods/<pk>/ mais n'est pas configurée dans urls.py
      // On utilise l'URL avec pk dans le path
      const result = await apiFetch(`/api/user/payment_methods/${methodId}/`, {
        method: 'DELETE',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new BillingError(
          errorData?.detail || errorData?.message || errorData?.error || 'Erreur lors de la suppression',
          'DELETE_ERROR',
          errorData
        );
      }
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }
      console.error('Erreur lors de la suppression de la méthode:', error);
      throw new BillingError(
        'Erreur lors de la suppression de la méthode',
        'UNKNOWN_ERROR'
      );
    }
  }
}

