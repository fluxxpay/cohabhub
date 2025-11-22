import { apiFetch } from '../api';

export interface ApiError {
  detail?: string;
  non_field_errors?: string | string[];
  [key: string]: any;
}

export class FeexPayError extends Error {
  constructor(
    message: string,
    public code: string = 'FEEXPAY_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'FeexPayError';
  }
}

export interface FeexPayPaymentConfig {
  id: string;
  token: string;
  amount: number;
  mode: 'LIVE' | 'TEST';
  case?: string;
  currency: string;
  custom_id?: string;
  callback_url?: string;
  error_callback_url?: string;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_type?: string;
}

export interface FeexPayPaymentResponse {
  transaction_id: string;
  payment_url: string;
  payment_config: FeexPayPaymentConfig;
  status: string;
  amount: number;
  currency: string;
  custom_id: string;
  method: string;
}

export interface FeexPayInitiateRequest {
  reservation_id?: string | number;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  payment_type?: 'MOBILE' | 'CARD' | 'WALLET';
  description?: string;
}

export interface FeexPayWalletRechargeRequest {
  amount: number;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_type?: 'MOBILE' | 'CARD' | 'WALLET';
}

export interface FeexPayInitiateResponse {
  success: boolean;
  message: string;
  payment_id: number;
  payment: FeexPayPaymentResponse;
}

export interface FeexPayStatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  message?: string;
}

class FeexPayService {
  /**
   * Initie un paiement FeexPay pour une réservation
   */
  async initiatePayment(
    request: FeexPayInitiateRequest
  ): Promise<FeexPayInitiateResponse> {
    try {
      const result = await apiFetch('/api/feexpay/payment/initiate/', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new FeexPayError(
          errorData.detail ||
            errorData.message ||
            errorData.error ||
            "Erreur lors de l'initiation du paiement",
          'INITIATE_ERROR',
          errorData
        );
      }

      const data = result.data as FeexPayInitiateResponse;

      if (!data.success) {
        throw new FeexPayError(
          data.message || "Échec de l'initiation du paiement",
          'INITIATE_FAILED'
        );
      }

      if (!data.payment?.payment_config) {
        throw new FeexPayError(
          'Configuration de paiement incomplète',
          'INCOMPLETE_CONFIG'
        );
      }

      return data;
    } catch (error) {
      if (error instanceof FeexPayError) {
        throw error;
      }
      throw new FeexPayError(
        error instanceof Error ? error.message : 'Erreur inconnue',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Vérifie le statut d'un paiement FeexPay
   */
  async checkPaymentStatus(
    paymentId: string | number
  ): Promise<FeexPayStatusResponse> {
    try {
      const result = await apiFetch(
        `/api/feexpay/payment/${paymentId}/status/`,
        {
          method: 'GET',
        }
      );

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new FeexPayError(
          errorData.detail ||
            errorData.message ||
            errorData.error ||
            "Erreur lors de la vérification du statut",
          'STATUS_CHECK_ERROR',
          errorData
        );
      }

      return result.data as FeexPayStatusResponse;
    } catch (error) {
      if (error instanceof FeexPayError) {
        throw error;
      }
      throw new FeexPayError(
        error instanceof Error ? error.message : 'Erreur inconnue',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Initie un paiement FeexPay pour la recharge du portefeuille
   */
  async initiateWalletRecharge(
    request: FeexPayWalletRechargeRequest
  ): Promise<FeexPayInitiateResponse> {
    try {
      const result = await apiFetch('/api/feexpay/wallet-recharge/initiate/', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new FeexPayError(
          errorData.detail ||
            errorData.message ||
            errorData.error ||
            "Erreur lors de l'initiation de la recharge",
          'RECHARGE_INITIATE_ERROR',
          errorData
        );
      }

      const data = result.data as FeexPayInitiateResponse;

      if (!data.success) {
        throw new FeexPayError(
          data.message || "Échec de l'initiation de la recharge",
          'RECHARGE_INITIATE_FAILED'
        );
      }

      if (!data.payment?.payment_config) {
        throw new FeexPayError(
          'Configuration de paiement incomplète',
          'INCOMPLETE_CONFIG'
        );
      }

      return data;
    } catch (error) {
      if (error instanceof FeexPayError) {
        throw error;
      }
      throw new FeexPayError(
        error instanceof Error ? error.message : 'Erreur inconnue',
        'UNKNOWN_ERROR'
      );
    }
  }
}

export const feexPayService = new FeexPayService();

