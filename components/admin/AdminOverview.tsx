'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { getWebSocketUrl } from '@/lib/config';
import { useAdminTokenExpiration } from '@/hooks/useAdminTokenExpiration';
import AdminRefreshTokenModal from '@/components/common/AdminRefreshTokenModal';
import { toast } from 'sonner';
import {
  Users,
  Buildings,
  Calendar,
  CreditCard,
  TrendUp,
  TrendDown,
  Warning,
  Clock,
  Star,
  ArrowRight,
  UserPlus,
  CheckCircle,
  Bell,
} from '@phosphor-icons/react';
import Link from 'next/link';
import AddUserModal from './AddUserModal';
import AddSpaceModal from './AddSpaceModal';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface User {
  id: string | number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

interface Space {
  id: string | number;
  name: string;
  category?: string;
}

interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  created_at: string;
}

interface NotificationResponse {
  results?: Notification[];
  count?: number;
}

export default function AdminOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [users, setUsers] = useState<User[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalSpaces, setTotalSpaces] = useState<number>(0);
  const [totalReservations, setTotalReservations] = useState<number>(0);
  const [totalPrices, setTotalPrices] = useState<number>(0);
  const [totalActiveUsers, setTotalActiveUsers] = useState<number>(0);

  const [showAdminRefreshModal, setShowAdminRefreshModal] = useState(false);
  const [isRefreshingAdmin, setIsRefreshingAdmin] = useState(false);
  const [adminTimeRemaining, setAdminTimeRemaining] = useState(120);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddSpaceModal, setShowAddSpaceModal] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return CheckCircle;
      case "warning": return Warning;
      case "info": return Bell;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return { bg: "bg-green-100", text: "text-green-700" };
      case "warning":
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      case "info":
        return { bg: "bg-blue-100", text: "text-blue-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Hook de détection d'expiration pour l'admin - 2 MINUTES avant expiration
  useAdminTokenExpiration(() => {
    console.log('🛡️ Hook déclenché - Token admin va expirer!');
    setShowAdminRefreshModal(true);

    const countdown = setInterval(() => {
      setAdminTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleAdminLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, 2);

  const reloadAdminCriticalData = async () => {
    try {
      console.log('🔄 Rechargement des données critiques admin...');
      await fetchUsers();
      await fetchSpaces();
      await fetchReservations();
      console.log('✅ Données critiques rechargées');
    } catch (error) {
      console.error('❌ Erreur rechargement données admin:', error);
    }
  };

  // Charger les notifications depuis l'API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { response, data } = await apiFetch('/api/notifications/');

        if (!response || !response.ok) {
          throw new Error('Erreur lors du chargement des notifications');
        }

        // S'assurer que notifications est un tableau
        const notifArray: Notification[] = Array.isArray(data)
          ? data
          : Array.isArray((data as NotificationResponse)?.results)
          ? ((data as NotificationResponse).results ?? [])
          : [];
        
        console.log("Notifications reçues :", notifArray);
        setNotifications(notifArray);
      } catch (error) {
        console.error('Erreur:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // WebSocket pour les notifications en temps réel
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.warn("⚠️ Pas de token trouvé pour WebSocket - notifications en temps réel désactivées");
      return;
    }

    // Utiliser la configuration centralisée pour l'URL WebSocket
    const wsUrl = getWebSocketUrl();
    
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isIntentionallyClosed = false;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(`${wsUrl}/ws/notifications/?token=${token}`);

        socket.onopen = () => {
          console.log("✅ WebSocket connecté pour les notifications");
          socket?.send(JSON.stringify({ type: "ping" }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📩 Notification reçue:", data);
            setNotifications(prev => [data, ...prev]);
          } catch (error) {
            console.warn("⚠️ Erreur lors du parsing du message WebSocket:", error);
          }
        };

        socket.onclose = (event) => {
          // Ne pas reconnecter si la fermeture était intentionnelle
          if (isIntentionallyClosed) {
            return;
          }

          // Codes de fermeture normaux (1000 = normal closure, 1001 = going away)
          if (event.code === 1000 || event.code === 1001) {
            console.log("🔌 WebSocket fermé normalement");
            return;
          }

          // Pour les autres codes, tenter une reconnexion après un délai
          console.warn(`⚠️ WebSocket fermé (code: ${event.code}) - Tentative de reconnexion dans 5 secondes...`);
          reconnectTimeout = setTimeout(() => {
            if (!isIntentionallyClosed) {
              connectWebSocket();
            }
          }, 5000);
        };

        socket.onerror = (err) => {
          // Ne pas afficher d'erreur si la connexion n'est pas disponible
          // C'est normal si le serveur WebSocket n'est pas démarré
          const socketState = socket?.readyState;
          if (socketState === WebSocket.CONNECTING || socketState === WebSocket.CLOSING) {
            // Erreur silencieuse - le serveur WebSocket peut ne pas être disponible
            return;
          }
          console.warn("⚠️ Erreur WebSocket - Le serveur de notifications peut ne pas être disponible");
        };
      } catch (error) {
        console.warn("⚠️ Impossible de créer la connexion WebSocket:", error);
      }
    };

    // Démarrer la connexion
    connectWebSocket();

    return () => {
      isIntentionallyClosed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Gestion spécifique admin
  const handleAdminRefreshToken = async () => {
    setIsRefreshingAdmin(true);
    console.log('🛡️ Rafraîchissement token admin en cours...');

    try {
      const refreshToken = localStorage.getItem('refresh-token');
      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible pour l\'admin');
      }

      const { response, data } = await apiFetch('/api/auth/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response && response.ok) {
        const tokenData = data as { access: string; refresh?: string };

        // Sauvegarde des tokens
        localStorage.setItem('auth-token', tokenData.access);
        if (tokenData.refresh) {
          localStorage.setItem('refresh-token', tokenData.refresh);
        }

        console.log('✅ Token admin rafraîchi avec succès');

        // Réinitialisation du modal
        setShowAdminRefreshModal(false);
        setAdminTimeRemaining(60);
        setIsRefreshingAdmin(false);

        // Notification de succès
        toast.success('Session prolongée avec succès');

        // Rechargement des données critiques pour l'admin
        await reloadAdminCriticalData();

      } else {
        throw new Error(`Échec rafraîchissement admin: ${response?.status || 'No response'}`);
      }
    } catch (error) {
      console.error('❌ Erreur rafraîchissement token admin:', error);
      toast.error('Erreur de prolongation de session');
      handleAdminLogout();
    }
  };

  const handleAdminLogout = () => {
    console.log('🚪 Déconnexion administrateur sécurisée');

    // Nettoyage spécifique admin
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    localStorage.removeItem('admin-session-data');

    // Redirection vers login
    window.location.href = '/signin?redirect=/admin';
  };

  const handleAdminDeclineRefresh = () => {
    console.log('👤 Admin a choisi la déconnexion manuelle');
    toast.info('Déconnexion sécurisée effectuée');
    handleAdminLogout();
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const { response, data } = await apiFetch('/api/auth/users/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response || !response.ok) {
        throw new Error(`Erreur HTTP: ${response?.status}`);
      }

      const responseData = data as { success?: boolean; data?: User[]; total?: number; total_active?: number };
      
      if (responseData.success) {
        setUsers(responseData.data || []);
        setTotalUsers(responseData.total || 0);
        setTotalActiveUsers(responseData.total_active || 0);
        console.log(`Total utilisateurs trouvés : ${responseData.total}`);
        console.log(`Total utilisateurs actifs : ${responseData.total_active}`);
      } else {
        console.error("Erreur API :", (data as any).message || (data as any).errors);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs :", error);
    }
  };

  const fetchSpaces = async () => {
    try {
      const { response, data } = await apiFetch('/api/spaces/', {
        method: 'GET',
      });

      if (!response || !response.ok) {
        throw new Error(`Erreur HTTP: ${response?.status}`);
      }

      // data peut être un array direct ou un objet { data: [...] }
      const spacesList = Array.isArray(data) ? data : (data as any).data || [];
      setSpaces(spacesList);
      setTotalSpaces(spacesList.length);
      console.log(`Espaces trouvés : ${spacesList.length}`);
    } catch (error) {
      console.error("Erreur lors du chargement des espaces :", error);
    }
  };

  const fetchReservations = async () => {
    try {
      const { response, data } = await apiFetch('/api/admin/reservations/', {
        method: 'GET',
      });

      if (!response || !response.ok) {
        throw new Error(`Erreur HTTP: ${response?.status}`);
      }

      const responseData = data as { results?: any[]; count?: number; total_revenue?: number };
      setReservations(responseData.results || []);
      setTotalReservations(responseData.count || 0);
      setTotalPrices(responseData.total_revenue || 0);
      console.log(`Total reservations trouvés : ${responseData.count}`);
      console.log(`Total revenu : ${responseData.total_revenue}`);
    } catch (error) {
      console.error('Erreur récupération réservations', error);
    }
  };

  // Chargement séquentiel avec délais
  useEffect(() => {
    const fetchDataSequentially = async () => {
      setLoading(true);
      try {
        // 1. D'abord les utilisateurs
        await fetchUsers();
        await delay(300);

        // 2. Ensuite les espaces
        await fetchSpaces();
        await delay(300);

        // 3. Enfin les réservations
        await fetchReservations();

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataSequentially();
  }, []);

  const formatNumberWithSpaces = (num: number | string) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const stats = [
    {
      title: 'Utilisateurs actifs',
      value: totalActiveUsers,
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Ce mois'
    },
    {
      title: 'Espaces disponibles',
      value: totalSpaces,
      change: '+5%',
      trend: 'up' as const,
      icon: Buildings,
      color: 'bg-green-500',
      description: 'Total'
    },
    {
      title: 'Réservations',
      value: totalReservations,
      change: '+18%',
      trend: 'up' as const,
      icon: Calendar,
      color: 'bg-purple-500',
      description: 'Ce mois'
    },
    {
      title: 'Revenus en XOF',
      value: formatNumberWithSpaces(totalPrices),
      change: '+23%',
      trend: 'up' as const,
      icon: CreditCard,
      color: 'bg-orange-500',
      description: 'Ce mois'
    }
  ];

  const quickActions = [
    {
      title: 'Ajouter un utilisateur',
      description: 'Créer un nouveau compte',
      icon: UserPlus,
      link: null as string | null,
      onClick: () => setShowAddUserModal(true),
      color: 'bg-blue-500'
    },
    {
      title: 'Nouvel espace',
      description: 'Créer un espace',
      icon: Buildings,
      link: null as string | null,
      onClick: () => setShowAddSpaceModal(true),
      color: 'bg-purple-500'
    },
    {
      title: 'Nouvelle réservation',
      description: 'Créer une réservation',
      icon: Calendar,
      link: '/booking',
      color: 'bg-green-500'
    }
  ];

  // Calculer les statistiques supplémentaires
  const recentReservations = reservations.slice(0, 5);
  const recentUsers = users.slice(0, 5);
  const occupancyRate = totalSpaces > 0 ? Math.round((totalReservations / (totalSpaces * 30)) * 100) : 0;
  const averageRevenue = totalReservations > 0 ? Math.round(totalPrices / totalReservations) : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {showAdminRefreshModal && (
        <AdminRefreshTokenModal
          onConfirm={handleAdminRefreshToken}
          onDecline={handleAdminDeclineRefresh}
          timeRemaining={adminTimeRemaining}
          isRefreshing={isRefreshingAdmin}
        />
      )}
      
      {/* En-tête amélioré */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-primary-100"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-light text-primary-900 mb-2">
            Vue d'ensemble
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Tableau de bord administrateur - Gestion complète de l'espace de coworking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
            className="px-4 py-2.5 border border-primary-200 rounded-xl bg-white text-primary-900 text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </motion.div>

      {/* Statistiques principales améliorées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" weight="light" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendUp className="h-3.5 w-3.5" weight="light" />
                  ) : (
                    <TrendDown className="h-3.5 w-3.5" weight="light" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">
                  {typeof stat.value === 'number' ? formatNumberWithSpaces(stat.value) : stat.value}
                </h3>
                <p className="text-primary-700 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-primary-500 text-xs">{stat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Actions rapides améliorées */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">Actions rapides</h2>
            </div>
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                const ButtonContent = (
                  <motion.button
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(action as any).onClick}
                    className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-primary-50 transition-all duration-200 group border border-transparent hover:border-primary-200"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                      <Icon className="h-5 w-5 text-white" weight="light" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-primary-900 text-sm">{action.title}</div>
                      <div className="text-xs text-primary-600">{action.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" weight="light" />
                  </motion.button>
                );

                if (action.link && action.link !== null) {
                  return (
                    <Link key={action.title} href={action.link}>
                      {ButtonContent}
                    </Link>
                  );
                }

                return <div key={action.title}>{ButtonContent}</div>;
              })}
            </div>
          </div>
        </motion.div>

        {/* Activités récentes améliorées */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">Activités récentes</h2>
              <Link href="/admin?tab=notifications">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-sm text-primary-600 hover:text-primary-900 flex items-center space-x-1 transition-colors"
                >
                  <span>Voir tout</span>
                  <ArrowRight className="h-3.5 w-3.5" weight="light" />
                </motion.button>
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
                </div>
              ) : notifications && notifications.length > 0 ? (
                notifications.slice(0, 5).map((notif, index) => {
                  const Icon = getNotificationIcon(notif.type);
                  const colors = getNotificationColor(notif.type);
                  return (
                    <motion.div
                      key={notif.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-start space-x-4 p-4 rounded-xl hover:bg-primary-50 transition-all duration-200 border border-transparent hover:border-primary-100"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.bg} shadow-sm flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${colors.text}`} weight="fill" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-primary-900 font-medium text-sm mb-1">{notif.title}</p>
                        <p className="text-sm text-primary-600 mb-2 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-primary-400">
                          <Clock className="h-3.5 w-3.5" weight="light" />
                          <span>{formatDate(notif.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-primary-300 mx-auto mb-3" weight="light" />
                  <p className="text-sm text-primary-500">Aucune notification récente</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grille de contenu supplémentaire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Réservations récentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light text-primary-900">Réservations récentes</h2>
            <Link href="/admin?tab=reservations">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-sm text-primary-600 hover:text-primary-900 flex items-center space-x-1 transition-colors"
              >
                <span>Voir tout</span>
                <ArrowRight className="h-3.5 w-3.5" weight="light" />
              </motion.button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
              </div>
            ) : recentReservations.length > 0 ? (
              recentReservations.map((reservation, index) => (
                <motion.div
                  key={reservation.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-100"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary-700" weight="light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">
                      {reservation.event_name || 'Sans nom'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-primary-600 mt-1">
                      <span>{reservation.space?.name || 'Espace'}</span>
                      <span>•</span>
                      <span>{new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    reservation.reservation_status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : reservation.reservation_status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {reservation.reservation_status === 'paid' ? 'Payée' : 
                     reservation.reservation_status === 'draft' ? 'Brouillon' : 'Annulée'}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-primary-300 mx-auto mb-2" weight="light" />
                <p className="text-sm text-primary-500">Aucune réservation récente</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Nouveaux utilisateurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light text-primary-900">Nouveaux utilisateurs</h2>
            <Link href="/admin?tab=users">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="text-sm text-primary-600 hover:text-primary-900 flex items-center space-x-1 transition-colors"
              >
                <span>Voir tout</span>
                <ArrowRight className="h-3.5 w-3.5" weight="light" />
              </motion.button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
              </div>
            ) : recentUsers.length > 0 ? (
              recentUsers.map((user, index) => (
                <motion.div
                  key={user.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-100"
                >
                  <div className="w-10 h-10 bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" weight="light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.name || user.email}
                    </p>
                    <p className="text-xs text-primary-600 truncate">{user.email}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-primary-300 mx-auto mb-2" weight="light" />
                <p className="text-sm text-primary-500">Aucun utilisateur récent</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Métriques de performance améliorées */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
      >
        <h2 className="text-xl font-light text-primary-900 mb-6">Métriques de performance</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          <div className="text-center p-4 rounded-xl bg-primary-50">
            <div className="text-3xl font-light text-primary-900 mb-2">4.8</div>
            <div className="flex items-center justify-center space-x-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-3.5 w-3.5 text-yellow-400" weight="fill" />
              ))}
            </div>
            <p className="text-primary-600 text-xs font-medium">Note moyenne</p>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-green-50">
            <div className="text-3xl font-light text-primary-900 mb-2">{occupancyRate}%</div>
            <p className="text-primary-600 text-xs font-medium">Taux d'occupation</p>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-blue-50">
            <div className="text-3xl font-light text-primary-900 mb-2">
              {formatNumberWithSpaces(averageRevenue)}
            </div>
            <p className="text-primary-600 text-xs font-medium">Revenu moyen</p>
            <p className="text-primary-500 text-xs mt-1">XOF/réservation</p>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-purple-50">
            <div className="text-3xl font-light text-primary-900 mb-2">{totalSpaces}</div>
            <p className="text-primary-600 text-xs font-medium">Espaces disponibles</p>
          </div>
        </div>
      </motion.div>

      {/* Modal d'ajout d'utilisateur */}
      <AddUserModal
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          // Recharger les données
          reloadAdminCriticalData();
        }}
      />

      {/* Modal d'ajout d'espace */}
      <AddSpaceModal
        open={showAddSpaceModal}
        onClose={() => setShowAddSpaceModal(false)}
        onSuccess={() => {
          // Recharger les données
          reloadAdminCriticalData();
        }}
      />
    </div>
  );
}

