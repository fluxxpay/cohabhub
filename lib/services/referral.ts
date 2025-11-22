import { apiFetch } from '../api';

export interface ReferralData {
  referral_code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  availableBalance: number;
  referrals: Referral[];
  total_gains?: number;
  filleuls?: FilleulDetail[];
  referrer?: {
    bonus_balance: number;
  };
}

export interface Referral {
  id: string;
  name: string;
  email: string;
  date: string;
  status: 'pending' | 'completed' | 'expired';
  reward: number;
  referrer_reward?: number;
  referred_reward?: number;
  reward_amount?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface FilleulDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  referrer_reward: number;
  referred_reward: number;
  reward_amount: number;
  date: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export class ReferralError extends Error {
  constructor(
    message: string,
    public code: string = 'REFERRAL_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ReferralError';
  }
}

/**
 * Service pour gérer le parrainage
 */
export class ReferralService {
  /**
   * Récupère le code de parrainage de l'utilisateur
   */
  static async getMyReferralCode(): Promise<string> {
    try {
      const result = await apiFetch('/api/referral/my_code/', {
        method: 'GET',
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReferralError(
          errorData?.message || 'Erreur lors de la récupération du code de parrainage',
          'FETCH_ERROR',
          errorData
        );
      }

      const data = result.data as { success: boolean; referral_code: string };
      return data.success ? data.referral_code : '';
    } catch (error) {
      if (error instanceof ReferralError) {
        throw error;
      }
      console.error('Erreur lors de la récupération du code de parrainage:', error);
      throw new ReferralError(
        'Erreur lors de la récupération du code de parrainage',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Récupère les détails des parrainages de l'utilisateur
   */
  static async getMyReferralDetails(): Promise<ReferralData> {
    try {
      const [codeResult, detailsResult] = await Promise.all([
        apiFetch('/api/referral/my_code/', { method: 'GET' }),
        apiFetch('/api/referral/my_details/', { method: 'GET' }),
      ]);

      if (!codeResult.response?.ok || !detailsResult.response?.ok) {
        const errorData = (codeResult.response?.ok ? detailsResult.data : codeResult.data) as ApiError;
        throw new ReferralError(
          errorData?.message || 'Erreur lors de la récupération des données de parrainage',
          'FETCH_ERROR',
          errorData
        );
      }

      const codeData = codeResult.data as { success: boolean; referral_code: string };
      const referralCode = codeData.success ? codeData.referral_code : '';

      const detailsData = detailsResult.data as { success: boolean; data?: any };

      if (!detailsData.success || !detailsData.data) {
        return {
          referral_code: referralCode,
          totalReferrals: 0,
          successfulReferrals: 0,
          pendingReferrals: 0,
          totalEarnings: 0,
          availableBalance: 0,
          referrals: [],
        };
      }

      const data = detailsData.data;

      // Transformer les données des filleuls
      const referrals: Referral[] = (data.filleuls || []).map((filleul: any) => ({
        id: filleul.id.toString(),
        name: `${filleul.first_name} ${filleul.last_name}`,
        first_name: filleul.first_name,
        last_name: filleul.last_name,
        email: filleul.email,
        phone: filleul.phone || '',
        date: filleul.date,
        status: (filleul.status === 'completed' ? 'completed' : 'pending') as 'pending' | 'completed' | 'expired',
        reward: filleul.referrer_reward || 0,
        referrer_reward: filleul.referrer_reward || 0,
        referred_reward: filleul.referred_reward || 0,
        reward_amount: filleul.reward_amount || filleul.referrer_reward || 0,
      }));

      // Calculer les statistiques
      const totalReferrals = data.total_filleuls || 0;
      const successfulReferrals = data.filleuls?.filter((f: any) => f.status === 'completed').length || 0;
      const pendingReferrals = totalReferrals - successfulReferrals;
      const totalEarnings = data.total_gains || 0;
      const availableBalance = data.referrer?.bonus_balance || 0;

      return {
        referral_code: referralCode,
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        totalEarnings,
        availableBalance,
        referrals,
        total_gains: data.total_gains,
        filleuls: data.filleuls,
        referrer: data.referrer,
      };
    } catch (error) {
      if (error instanceof ReferralError) {
        throw error;
      }
      console.error('Erreur lors de la récupération des données de parrainage:', error);
      throw new ReferralError(
        'Erreur lors de la récupération des données de parrainage',
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Envoie un email de parrainage
   */
  static async sendReferralEmail(email: string, code: string): Promise<void> {
    try {
      const result = await apiFetch('/api/referral/send_email/', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReferralError(
          errorData?.message || "Erreur lors de l'envoi de l'email",
          'SEND_ERROR',
          errorData
        );
      }
    } catch (error) {
      if (error instanceof ReferralError) {
        throw error;
      }
      console.error("Erreur lors de l'envoi de l'email:", error);
      throw new ReferralError(
        "Erreur lors de l'envoi de l'email",
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Envoie un SMS de parrainage
   */
  static async sendReferralSMS(phone: string, code: string): Promise<void> {
    try {
      const result = await apiFetch('/api/referral/send_sms/', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });

      if (!result.response?.ok) {
        const errorData = result.data as ApiError;
        throw new ReferralError(
          errorData?.message || "Erreur lors de l'envoi du SMS",
          'SEND_ERROR',
          errorData
        );
      }
    } catch (error) {
      if (error instanceof ReferralError) {
        throw error;
      }
      console.error("Erreur lors de l'envoi du SMS:", error);
      throw new ReferralError(
        "Erreur lors de l'envoi du SMS",
        'UNKNOWN_ERROR'
      );
    }
  }
}

