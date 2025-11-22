'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Users, 
  CurrencyEur, 
  TrendUp,
  MagnifyingGlass, 
  Eye, 
  CheckCircle,
  Warning,
  Clock,
  Gift,
  X
} from '@phosphor-icons/react';

interface ReferralProgram {
  id: string | number;
  referrerId: number | null;
  referrer: string;
  referred: string;
  referrerEmail: string;
  referredEmail: string;
  code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  date: string;
  rewardAmount: number;
  referrerReward: number;
  referredReward: number;
  total_filleuls?: number;
  filleuls?: any[];
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewardsPaid: number;
  conversionRate: number;
  averageReward: number;
}

interface ReferrerDetails {
  referrer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  referral_code?: string;
  total_filleuls?: number;
  bonus_balance?: number;
  total_gains?: number;
  filleuls?: any[];
}

export default function ReferralManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [referralPrograms, setReferralPrograms] = useState<ReferralProgram[]>([]);
  const [allReferralProgram, setAllReferralProgram] = useState<ReferralProgram[]>([]);
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchReferrerDetails = async (referrerId: number) => {
    try {
      const { response, data } = await apiFetch(`/api/referral/users/${referrerId}/details/`, {
        method: "GET",
      });

      if (!response || !response.ok) {
        throw new Error('Erreur lors de la récupération des détails');
      }

      const refData = (data as any)?.data || data;
      if ((data as any)?.success && refData) {
        setSelectedReferrer(refData);
        setIsModalOpen(true);
      } else {
        console.warn("Aucune donnée de parrain trouvée");
        toast.error('Aucune donnée trouvée');
      }
    } catch (err) {
      console.error("Erreur API détails parrain", err);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { response, data } = await apiFetch('/api/referral/users/all2/', {
          method: 'GET',
        });

        if (!response || !response.ok) {
          throw new Error('Erreur lors de la récupération');
        }

        const responseData = data as any;
        console.log('All Referrals:', responseData);

        if (responseData && Array.isArray(responseData.referrals)) {
          const mappedReferralPrograms: ReferralProgram[] = responseData.referrals.map((r: any) => {
            const firstFilleul = r.filleuls?.length > 0 ? r.filleuls[0] : null;

            return {
              id: r.id,
              referrerId: r.referrer?.id ?? null,
              referrer: `${r.referrer?.first_name ?? ''} ${r.referrer?.last_name ?? ''}`.trim(),
              referred: firstFilleul ? `${firstFilleul.first_name ?? ''} ${firstFilleul.last_name ?? ''}`.trim() : '',
              referrerEmail: r.referrer?.email ?? '',
              referredEmail: firstFilleul?.email ?? '',
              code: r.referral_code ?? '',
              status: r.status ?? 'pending',
              date: r.date ?? '',
              rewardAmount: firstFilleul?.reward_amount ?? 0,
              referrerReward: firstFilleul?.referrer_reward ?? 0,
              referredReward: firstFilleul?.referred_reward ?? 0,
              total_filleuls: r.total_filleuls ?? 0,
              filleuls: r.filleuls ?? []
            };
          });

          setReferralPrograms(mappedReferralPrograms);
        } else {
          console.warn('La réponse API ne contient pas de "referrals" valide');
        }
      } catch (err) {
        console.error('Erreur API parrainages', err);
        toast.error('Erreur lors du chargement des parrainages');
      }
    };

    fetchReferrals();
  }, []);

  useEffect(() => {
    const fetchAllReferrals = async () => {
      try {
        const { response, data } = await apiFetch('/api/referral/users/all/', {
          method: 'GET',
        });

        if (!response || !response.ok) {
          throw new Error('Erreur lors de la récupération');
        }

        const responseData = data as any;
        console.log('All Referrals API Response:', responseData);

        if (responseData && Array.isArray(responseData.referrals)) {
          const mapped: ReferralProgram[] = responseData.referrals.map((r: any) => ({
            id: r.id,
            referrerId: r.referrer?.id ?? null,
            referrer: `${r.referrer?.first_name ?? ''} ${r.referrer?.last_name ?? ''}`.trim(),
            referred: r.filleuls?.length > 0
              ? `${r.filleuls[0]?.first_name ?? ''} ${r.filleuls[0]?.last_name ?? ''}`.trim()
              : '',
            referrerEmail: r.referrer?.email ?? '',
            referredEmail: r.filleuls?.length > 0 ? r.filleuls[0]?.email ?? '' : '',
            code: r.referral_code ?? '',
            status: r.status ?? 'pending',
            date: r.date ?? '',
            rewardAmount: r.filleuls?.length > 0 ? r.filleuls[0]?.reward_amount ?? 0 : 0,
            referrerReward: r.filleuls?.length > 0 ? r.filleuls[0]?.reward_amount ?? 0 : 0,
            referredReward: 0,
            total_filleuls: r.total_filleuls ?? 0,
            filleuls: r.filleuls ?? []
          }));

          setAllReferralProgram(mapped);
        } else {
          console.warn('La réponse API ne contient pas de "referrals" valide');
        }
      } catch (err) {
        console.error('Erreur API parrainages', err);
        toast.error('Erreur lors du chargement');
      }
    };

    fetchAllReferrals();
  }, []);

  const stats: ReferralStats = {
    totalReferrals: referralPrograms.length,
    successfulReferrals: referralPrograms.filter(r => r.status === 'completed').length,
    pendingReferrals: referralPrograms.filter(r => r.status === 'pending').length,
    totalRewardsPaid: referralPrograms.reduce((sum, r) => sum + r.referrerReward + r.referredReward, 0),
    conversionRate:
      referralPrograms.length > 0
        ? (referralPrograms.filter(r => r.status === 'completed').length / referralPrograms.length) * 100
        : 0,
    averageReward:
      referralPrograms.length > 0
        ? referralPrograms.reduce((sum, r) => sum + r.referrerReward + r.referredReward, 0) / referralPrograms.length
        : 0
  };

  const topReferrers = Object.values(
    allReferralProgram
      .filter(r => r.status === 'completed')
      .reduce((acc: Record<string, any>, r) => {
        const key = r.referrerEmail;
        if (!acc[key]) {
          acc[key] = {
            first_name: r.referrer.split(' ')[0],
            last_name: r.referrer.split(' ')[1] || '',
            referrals: 0,
            earnings: 0,
          };
        }
        acc[key].referrals += (r.filleuls?.length || 0);
        acc[key].earnings += (r.filleuls?.reduce((sum: number, f: any) => sum + (f.referrer_reward || 0), 0) || 0);
        return acc;
      }, {})
  )
  .filter((r: any) => r.referrals >= 1)
  .sort((a: any, b: any) => b.referrals - a.referrals);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'expired':
        return Warning;
      case 'cancelled':
        return Warning;
      default:
        return Clock;
    }
  };

  const filteredReferrals = referralPrograms.filter(referral => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (referral.referrer || '').toLowerCase().includes(search) ||
      (referral.referred || '').toLowerCase().includes(search) ||
      (referral.referrerEmail || '').toLowerCase().includes(search) ||
      (referral.referredEmail || '').toLowerCase().includes(search) ||
      (referral.code || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReferrals = filteredReferrals.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="space-y-8">
      {/* Modal de détails amélioré */}
      {isModalOpen && selectedReferrer && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 lg:p-8 overflow-y-auto max-h-[90vh] border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-primary-100">
              <h2 className="text-2xl font-light text-primary-900">
                Détails du parrain : {selectedReferrer?.referrer?.first_name} {selectedReferrer?.referrer?.last_name}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-primary-50 rounded-xl border border-primary-100 p-4">
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Email</p>
                  <p className="text-sm font-medium text-primary-900">{selectedReferrer?.referrer?.email || 'N/A'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Téléphone</p>
                  <p className="text-sm font-medium text-primary-900">{selectedReferrer?.referrer?.phone || 'N/A'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Solde bonus</p>
                  <p className="text-sm font-medium text-primary-900">
                    {selectedReferrer?.bonus_balance
                      ? selectedReferrer.bonus_balance.toLocaleString('fr-FR')
                      : 0} XOF
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Code</p>
                  <p className="text-sm font-medium text-primary-900 font-mono">{selectedReferrer.referral_code || 'N/A'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Total filleuls</p>
                  <p className="text-sm font-medium text-primary-900">{selectedReferrer.total_filleuls || 0}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-primary-600 mb-1">Total gains</p>
                  <p className="text-sm font-medium text-primary-900">
                    {selectedReferrer?.total_gains
                      ? selectedReferrer.total_gains.toLocaleString('fr-FR')
                      : 0} XOF
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium mb-4 text-primary-900 pb-2 border-b border-primary-100">Filleuls</h3>
            {(!selectedReferrer.filleuls || selectedReferrer.filleuls.length === 0) ? (
              <div className="text-center py-8 bg-primary-50 rounded-xl border border-primary-100">
                <Users className="h-12 w-12 text-primary-300 mx-auto mb-3" weight="light" />
                <p className="text-sm text-primary-600">Aucun filleul pour ce parrain.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedReferrer.filleuls.map((f: any, index: number) => (
                  <motion.div
                    key={f.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-primary-100 rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-primary-900 mb-1">{f.first_name} {f.last_name}</div>
                      <div className="text-sm text-primary-600">{f.email} - {f.phone}</div>
                    </div>
                    <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end space-y-2">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        f.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        f.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {f.status === 'completed' ? (
                          <>
                            <CheckCircle className="h-3 w-3" weight="light" />
                            <span>Réussi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" weight="light" />
                            <span>{f.status === 'pending' ? 'En attente' : f.status}</span>
                          </>
                        )}
                      </span>
                      <div className="text-xs text-primary-500">
                        Date: {f.date ? new Date(f.date).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                      <div className="text-xs text-primary-900 font-medium">
                        Bonus: {(f.reward_amount || 0).toLocaleString('fr-FR')} XOF
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-primary-100 text-right">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
              >
                Fermer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* En-tête amélioré */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-primary-100"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-light text-primary-900 mb-2">
            Gestion des parrainages
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Suivez et gérez le programme de parrainage
          </p>
        </div>
      </motion.div>

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {[
          { label: 'Total parrainages', value: stats.totalReferrals, icon: Users, color: 'bg-primary-900' },
          { label: 'Réussis', value: stats.successfulReferrals, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'En attente', value: stats.pendingReferrals, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Récompenses payées', value: `${stats.totalRewardsPaid.toLocaleString('fr-FR')} XOF`, icon: CurrencyEur, color: 'bg-purple-500' },
          { label: 'Taux de conversion', value: `${stats.conversionRate.toFixed(1)}%`, icon: TrendUp, color: 'bg-blue-500' },
          { label: 'Récompense moyenne', value: `${stats.averageReward.toLocaleString('fr-FR')} XOF`, icon: Gift, color: 'bg-orange-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 text-center hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <Icon className="h-7 w-7 text-white" weight="light" />
              </div>
              <div className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{stat.value}</div>
              <p className="text-primary-700 text-sm font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meilleurs parraineurs amélioré */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
          >
            <h2 className="text-xl font-light text-primary-900 mb-6 pb-3 border-b border-primary-100">Meilleurs parraineurs</h2>
            <div className="space-y-3">
              {topReferrers.length > 0 ? (
                topReferrers.slice(0, 5).map((referrer: any, index: number) => (
                  <motion.div
                    key={referrer.first_name + index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-white text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-primary-900 text-sm">{referrer.first_name} {referrer.last_name}</h3>
                        <p className="text-xs text-primary-600">{referrer.referrals} parrainage{referrer.referrals > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-primary-900 text-sm">{referrer.earnings.toLocaleString('fr-FR')} XOF</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-primary-300 mx-auto mb-3" weight="light" />
                  <p className="text-primary-600 text-sm">Aucun parraineur pour le moment</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Liste des parrainages améliorée */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-primary-100">
              <h2 className="text-xl font-light text-primary-900">Parrainages récents</h2>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Réussis</option>
                  <option value="pending">En attente</option>
                  <option value="expired">Expirés</option>
                  <option value="cancelled">Annulés</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50 border-b-2 border-primary-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">Parraineur</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">Parrainé</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">Récompense</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary-900">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-primary-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {currentReferrals.length > 0 ? (
                    currentReferrals.map((referral, index) => {
                      const StatusIcon = getStatusIcon(referral.status);
                      return (
                        <motion.tr
                          key={referral.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-primary-50 transition-colors border-b border-primary-100"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-primary-900">{referral.referrer}</div>
                              <div className="text-sm text-primary-600">{referral.referrerEmail}</div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-primary-900">{referral.referred || 'N/A'}</div>
                              <div className="text-sm text-primary-600">{referral.referredEmail || 'N/A'}</div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm bg-primary-100 text-primary-900 px-2 py-1 rounded">
                              {referral.code}
                            </span>
                          </td>
                          
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.status)}`}>
                              <StatusIcon className="h-3 w-3" weight="light" />
                              <span>
                                {referral.status === 'completed' ? 'Réussi' : 
                                 referral.status === 'pending' ? 'En attente' : 
                                 referral.status === 'expired' ? 'Expiré' : 'Annulé'}
                              </span>
                            </span>
                          </td>
                          
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-primary-900">{referral.rewardAmount.toLocaleString('fr-FR')} XOF</div>
                              <div className="text-xs text-primary-600">
                                Parraineur: {referral.referrerReward.toLocaleString('fr-FR')} XOF
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-4">
                            <div className="text-sm text-primary-900">
                              {referral.date ? new Date(referral.date).toLocaleDateString('fr-FR') : 'N/A'}
                            </div>
                          </td>
                          
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              {referral.referrerId && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                  title="Voir les détails"
                                  onClick={() => fetchReferrerDetails(referral.referrerId!)}
                                >
                                  <Eye className="h-4 w-4" weight="light" />
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <UserPlus className="h-16 w-16 text-primary-300 mb-4" weight="light" />
                          <h3 className="text-lg font-medium text-primary-900 mb-2">Aucun parrainage trouvé</h3>
                          <p className="text-sm text-primary-600">
                            {searchTerm || statusFilter !== 'all'
                              ? 'Essayez de modifier vos critères de recherche'
                              : 'Aucun parrainage pour le moment'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-primary-100"
                >
                  <div className="text-sm text-primary-600">
                    Affichage de <span className="font-medium text-primary-900">{startIndex + 1}</span> à{' '}
                    <span className="font-medium text-primary-900">{Math.min(startIndex + itemsPerPage, filteredReferrals.length)}</span> sur{' '}
                    <span className="font-medium text-primary-900">{filteredReferrals.length}</span> parrainages
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      Précédent
                    </motion.button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                            page === currentPage
                              ? 'bg-primary-900 text-white shadow-lg'
                              : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                          }`}
                        >
                          {page}
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      Suivant
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

