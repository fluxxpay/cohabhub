'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { getWebSocketUrl } from '@/lib/config';
import { toast } from 'sonner';
import {
  Bell,
  CheckCircle,
  Warning,
  Info,
  Trash,
  Check,
  X,
  Users,
  Buildings,
  Calendar,
  CreditCard,
  MagnifyingGlass,
  Funnel
} from '@phosphor-icons/react';

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp?: string;
  read: boolean;
  category: 'user' | 'space' | 'reservation' | 'billing' | 'system';
  action?: string;
  created_at: string;
}

interface NotificationResponse {
  results?: Notification[];
  count?: number;
}

export default function Notifications() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRead, setShowRead] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    const today = new Date();
    return (
      notifDate.getDate() === today.getDate() &&
      notifDate.getMonth() === today.getMonth() &&
      notifDate.getFullYear() === today.getFullYear()
    );
  }).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedType !== 'all') params.append('type', selectedType);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        params.append('show_read', showRead.toString());
        if (searchTerm) params.append('search', searchTerm);

        const { response, data } = await apiFetch(`/api/notifications/?${params.toString()}`);

        if (!response || !response.ok) {
          throw new Error('Erreur lors du chargement des notifications');
        }

        const notifArray: Notification[] = Array.isArray(data)
          ? data
          : Array.isArray((data as NotificationResponse)?.results)
          ? ((data as NotificationResponse).results ?? [])
          : [];
        
        console.log("Notifications reçues :", notifArray);
        setNotifications(notifArray);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [selectedType, selectedCategory, showRead, searchTerm]);

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

  const markAsRead = async (id: number) => {
    try {
      const { response, data } = await apiFetch(`/api/notifications/${id}/read/`, {
        method: 'PATCH',
      });

      // Vérifier le code de statut HTTP (200-299 = succès)
      const status = response?.status ?? 0;
      const isSuccess = response && (response.ok || (status >= 200 && status < 300));

      if (!isSuccess) {
        const errorMessage = (data as any)?.error || (data as any)?.message || 'Erreur lors du marquage comme lu';
        throw new Error(errorMessage);
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      toast.success('Notification marquée comme lue');
    } catch (error: any) {
      console.error('Erreur lors du marquage:', error);
      toast.error(error?.message || 'Erreur lors du marquage');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { response, data } = await apiFetch('/api/notifications/read-all/', {
        method: 'PATCH',
      });

      // Vérifier le code de statut HTTP (200-299 = succès)
      const status = response?.status ?? 0;
      const isSuccess = response && (response.ok || (status >= 200 && status < 300));

      if (!isSuccess) {
        const errorMessage = (data as any)?.error || (data as any)?.message || 'Erreur lors du marquage de tous comme lus';
        throw new Error(errorMessage);
      }

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error: any) {
      console.error('Erreur lors du marquage:', error);
      toast.error(error?.message || 'Erreur lors du marquage');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const { response, data } = await apiFetch(`/api/notifications/${id}/delete/`, {
        method: 'DELETE',
      });

      // Vérifier le code de statut HTTP (200-299 = succès, 204 = No Content aussi OK)
      const status = response?.status ?? 0;
      const isSuccess = response && (response.ok || (status >= 200 && status < 300) || status === 204);

      if (!isSuccess) {
        // Vérifier si les données contiennent une erreur explicite
        const errorData = data as any;
        if (errorData?.error || errorData?.message) {
          const errorMessage = errorData.error || errorData.message;
          console.error('Erreur API lors de la suppression:', { status, data, response });
          throw new Error(errorMessage);
        }
        // Si pas d'erreur explicite mais statut non-OK, vérifier le statut plus précisément
        if (status >= 400) {
          throw new Error(`Erreur serveur (${status})`);
        }
        // Si statut < 400 mais response.ok est false, considérer comme succès (peut être un problème de parsing)
        console.warn('Réponse non-OK mais statut < 400, considéré comme succès:', { status, response });
      }

      // Si on arrive ici, la suppression a réussi
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('Notification supprimée');
    } catch (error: any) {
      // Vraie erreur - seulement afficher si c'est vraiment une erreur
      const errorMessage = error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression:', error);
      toast.error(errorMessage);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return CheckCircle;
      case "warning": return Warning;
      case "error": return X;
      case "info": return Info;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" };
      case "warning":
        return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" };
      case "error":
        return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
      case "info":
        return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "user": return Users;
      case "space": return Buildings;
      case "reservation": return Calendar;
      case "billing": return CreditCard;
      default: return Bell;
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

  const filteredNotifications = notifications.filter(notif => {
    const matchesType = selectedType === 'all' || notif.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || notif.category === selectedCategory;
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRead = showRead || !notif.read;
    return matchesType && matchesCategory && matchesSearch && matchesRead;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 w-full">
      {/* En-tête amélioré */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-primary-100"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-light text-primary-900 mb-2">
            Gestion des notifications
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Gérez toutes les notifications système
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={markAllAsRead}
          className="flex items-center space-x-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors shadow-lg font-medium"
        >
          <Check className="h-5 w-5" weight="light" />
          <span>Tout marquer comme lu</span>
        </motion.button>
      </motion.div>

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {[
          { label: 'Total', value: totalCount, color: 'bg-blue-500', icon: Bell },
          { label: 'Non lues', value: unreadCount, color: 'bg-yellow-500', icon: Bell },
          { label: "Aujourd'hui", value: todayCount, color: 'bg-green-500', icon: Calendar }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" weight="light" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{stat.value}</h3>
                <p className="text-primary-700 text-sm font-medium">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filtres et recherche améliorés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
            <input
              type="text"
              placeholder="Rechercher par titre ou message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
          >
            <option value="all">Tous les types</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
            <option value="info">Information</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
          >
            <option value="all">Toutes les catégories</option>
            <option value="user">Utilisateur</option>
            <option value="space">Espace</option>
            <option value="reservation">Réservation</option>
            <option value="billing">Facturation</option>
            <option value="system">Système</option>
          </select>

          <label className="flex items-center space-x-3 cursor-pointer p-2.5 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
            <input
              type="checkbox"
              checked={showRead}
              onChange={(e) => setShowRead(e.target.checked)}
              className="w-4 h-4 rounded border-primary-200 text-primary-900 focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-primary-700 font-medium">Afficher les lues</span>
          </label>
        </div>
      </motion.div>

      {/* Liste des notifications améliorée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-primary-100 p-12 text-center"
          >
            <Bell className="h-16 w-16 text-primary-300 mx-auto mb-4" weight="light" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">Aucune notification trouvée</h3>
            <p className="text-sm text-primary-600">
              {searchTerm || selectedType !== 'all' || selectedCategory !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucune notification pour le moment'}
            </p>
          </motion.div>
        ) : (
          filteredNotifications.map((notif, index) => {
            const Icon = getNotificationIcon(notif.type);
            const CategoryIcon = getCategoryIcon(notif.category);
            const colors = getNotificationColor(notif.type);

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300 ${
                  !notif.read 
                    ? 'border-l-4 border-primary-500 border-primary-100' 
                    : 'border-primary-100'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} weight="fill" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-lg font-medium text-primary-900">{notif.title}</h3>
                          {!notif.read && (
                            <span className="inline-flex items-center px-2.5 py-1 bg-primary-500 text-white text-xs font-medium rounded-lg">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-primary-600 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-100">
                      <div className="flex items-center flex-wrap gap-4 text-sm text-primary-500">
                        <div className="flex items-center space-x-1.5">
                          <CategoryIcon className="h-4 w-4" weight="light" />
                          <span className="capitalize font-medium">{notif.category}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-4 w-4" weight="light" />
                          <span>{formatDate(notif.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!notif.read && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => markAsRead(notif.id)}
                            className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Marquer comme lu"
                          >
                            <Check className="h-4 w-4" weight="light" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteNotification(notif.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash className="h-4 w-4" weight="light" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

