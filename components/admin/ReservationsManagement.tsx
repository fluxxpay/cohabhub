'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  Warning,
  Eye,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  Funnel,
  Plus,
  MapPin,
  CreditCard,
  ArrowRight,
  DotsThree,
  Phone,
  Envelope,
  X,
  Car,
  Money,
  Building,
  House,
  ForkKnife,
  Drop,
  Tag,
  Info,
  Camera,
  SpeakerHigh,
  ProjectorScreen,
  Sparkle,
  Monitor,
  WifiHigh,
  Coffee,
  Printer
} from '@phosphor-icons/react';
import Link from 'next/link';

interface Reservation {
  id: string | number;
  event_name?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  nbr_nights?: number;
  attendees_count: number;
  reservation_status: 'paid' | 'draft' | 'cancelled';
  is_refunded?: boolean;
  total_price?: number | string;
  space?: {
    id: number;
    name: string;
    description?: string;
    category: string;
    capacity: number;
    location: string;
  };
  space_id?: number;
  space_category?: string;
  options?: Array<{ id: number; name: string }>;
  reservants?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  payment?: {
    method: string;
    amount: number | string;
    status: string;
  };
  created_at?: string;
}

export default function ReservationsManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<string | number | null>(null);
  const [selectedReservationData, setSelectedReservationData] = useState<Reservation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    count: 0,
    pending_count: 0,
    paid_count: 0,
    cancelled_count: 0,
    total_revenue: 0
  });

  const [showRefundChoice, setShowRefundChoice] = useState(false);
  const [refundType, setRefundType] = useState<'wallet' | 'transfer' | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    id_number: ''
  });
  const [selectedReservationForRefund, setSelectedReservationForRefund] = useState<Reservation | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<Reservation | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const filters = [
    { id: 'all', label: 'Toutes', count: reservations.length },
    { id: 'paid', label: 'Confirmées', count: reservations.filter(r => r.reservation_status === 'paid').length },
    { id: 'draft', label: 'Brouillon', count: reservations.filter(r => r.reservation_status === 'draft').length },
    { id: 'cancelled', label: 'Annulées', count: reservations.filter(r => r.reservation_status === 'cancelled').length },
    { id: 'refunded', label: 'Remboursées', count: reservations.filter(r => r.is_refunded).length }
  ];

  useEffect(() => {
    async function fetchReservations() {
      try {
        const { response, data } = await apiFetch('/api/admin/reservations/', {
          method: 'GET',
        });

        if (!response || !response.ok) {
          throw new Error('Erreur lors de la récupération des réservations');
        }

        const responseData = data as { results?: Reservation[]; count?: number; pending_count?: number; paid_count?: number; cancelled_count?: number; total_revenue?: number };

        console.log('Réservations', responseData.results);
        console.log('Statistiques', responseData);

        setReservations(responseData.results || []);
        setStats({
          count: responseData.count || 0,
          pending_count: responseData.pending_count || 0,
          paid_count: responseData.paid_count || 0,
          cancelled_count: responseData.cancelled_count || 0,
          total_revenue: responseData.total_revenue || 0
        });

      } catch (error: any) {
        console.error('Erreur récupération réservations:', error.message);
        toast.error('Erreur lors du chargement des réservations');
      }
    }

    fetchReservations();
  }, []);

  useEffect(() => {
    if (!selectedReservation) return;

    async function fetchReservationDetails() {
      try {
        const { response, data } = await apiFetch(`/api/admin/reservations/${selectedReservation}/`, {
          method: 'GET',
        });

        if (!response || !response.ok) {
          console.error('Erreur API récupération réservation:', response?.status, data);
          toast.error(`Erreur serveur: ${response?.status}`);
          setSelectedReservationData(null);
          return;
        }

        setSelectedReservationData(data as Reservation);
        console.log('Détails réservation', data);

      } catch (error: any) {
        console.error('Erreur récupération réservation:', error.message);
        toast.error('Erreur serveur lors du chargement de la réservation');
        setSelectedReservationData(null);
      }
    }

    fetchReservationDetails();
  }, [selectedReservation]);

  const handleEditClick = (reservation: Reservation) => {
    console.log('Edit clicked:', reservation);
    setEditData(reservation);
    setShowEdit(true);
  };

  const handleDeleteClick = (reservation: Reservation) => {
    setSelectedReservationData(reservation);
    setShowDeleteModal(true);
  };

  const handleUpdateReservation = async () => {
    if (!editData || !editData.id) {
      toast.error('Données de réservation invalides');
      return;
    }

    try {
      const payload: any = {
        event_name: editData.event_name || '',
        date: editData.date || '',
        attendees_count: parseInt(String(editData.attendees_count)) || 1,
        status: editData.reservation_status || 'pending',
        space: editData.space_id ?? editData.space?.id
      };

      const category = editData.space?.category || editData.space_category;
      if (category === 'appartement') {
        payload.nbr_nights = editData.nbr_nights || 1;
      } else {
        payload.start_time = editData.start_time || '';
        payload.end_time = editData.end_time || '';
      }

      if (Array.isArray(editData.options) && editData.options.length > 0) {
        payload.options = editData.options
          .map((opt: any) => (typeof opt === 'object' ? opt.id : opt))
          .filter((id: any) => id != null);
      }
      console.log('Payload envoyé:', payload);

      const { response, data } = await apiFetch(`/api/admin/reservations/${editData.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (!response || !response.ok) {
        console.error('Erreur mise à jour réservation:', data);
        toast.error(`Erreur ${response?.status}: ${(data as any)?.message || response?.statusText}`);
        return;
      }
      setReservations(reservations.map(r =>
        r.id === editData.id ? { ...r, ...(data as Reservation) } : r
      ));
      setShowEdit(false);
      toast.success('Réservation modifiée avec succès');

    } catch (error: any) {
      console.error('Erreur update:', error);
      toast.error('Erreur serveur lors de la modification de la réservation');
    }
  };

  const handleDeleteReservation = async () => {
    if (!selectedReservationData?.id) return;

    try {
      const { response } = await apiFetch(`/api/admin/reservations/${selectedReservationData.id}/`, {
        method: "DELETE",
      });

      if (!response || !response.ok) {
        console.error('Erreur suppression réservation');
        toast.error(`Erreur serveur: ${response?.status}`);
        return;
      }

      setReservations(reservations.filter(r => r.id !== selectedReservationData.id));
      setShowDeleteModal(false);
      toast.success('Réservation supprimée avec succès');
    } catch (error: any) {
      console.error("Erreur suppression:", error);
      toast.error('Erreur serveur lors de la suppression de la réservation');
    }
  };

  const handleWalletRefund = async (reservation: Reservation) => {
    try {
      const { response, data } = await apiFetch(`/api/admin/reservations/${reservation.id}/refund_wallet/`, {
        method: 'POST',
      });
      
      if (!response || !response.ok) {
        console.error("Erreur de remboursement :", data);

        if ((data as any)?.message?.includes("déjà remboursée")) {
          toast.info("Réservation déjà remboursée.");
          return;
        }
        toast.error((data as any)?.message || "Erreur lors du remboursement par portefeuille");
        return;
      }
      toast.success("Remboursement effectué. Vérifiez portefeuille !");
      setShowRefundChoice(false);
      // Recharger les réservations
      window.location.reload();

    } catch (error) {
      console.error("Erreur serveur :", error);
      toast.error("Erreur serveur pendant le remboursement");
    }
  };

  const handleTransferSubmit = async () => {
    try {
      if (!selectedReservationForRefund) return;

      const { response, data } = await apiFetch(`/api/admin/reservations/${selectedReservationForRefund.id}/refund_transfer/`, {
        method: 'POST',
        body: JSON.stringify(transferData)
      });

      if (!response || !response.ok) {
        console.error(data);
        toast.error("Erreur lors de la soumission du remboursement par transfert");
        return;
      }

      toast.success("Email envoyé : Vous serez remboursé d'ici peu. Cohab prélève 20 %.");
      setShowTransferModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur pendant la soumission du transfert");
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesFilter = selectedStatus === 'all' ||
        (selectedStatus === 'refunded' && reservation.is_refunded) ||
        reservation.reservation_status === selectedStatus;
    const matchesSearch =
      reservation.space?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.space?.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayedReservations = filteredReservations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-gray-100 text-gray-500';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-gray-100 text-gray-500';
      case 'cancelled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-blue-100 text-blue-300';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  };

  const getRefundBadge = (reservation: Reservation) => {
    if (reservation.is_refunded) {
      console.log("Badge remboursé affiché pour :", reservation.id);
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-medium">
          <Money className="h-3 w-3" weight="light" />
          <span>Remboursée</span>
        </span>
      );
    }
    return null;
  };

  const getReservantInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

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
            Gestion des réservations
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Gérez toutes les réservations d'espaces
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/booking">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 bg-yellow-500 text-white px-5 py-2.5 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg font-medium"
            >
              <Money className="h-5 w-5" weight="light" />
              <span>Réservations par chèque</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total', value: stats.count, color: 'bg-blue-500', icon: Calendar },
          { label: 'Confirmées', value: stats.paid_count, color: 'bg-green-500', icon: CheckCircle },
          { label: 'Brouillon', value: stats.pending_count, color: 'bg-yellow-500', icon: Clock },
          { label: 'Annulées', value: stats.cancelled_count, color: 'bg-red-500', icon: Warning }
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
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedStatus(filter.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedStatus === filter.id
                    ? 'bg-primary-900 text-white shadow-lg'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                }`}
              >
                {filter.label} ({filter.count})
              </motion.button>
            ))}
          </div>

          <div className="relative w-full lg:w-auto">
            <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
            <input
              type="text"
              placeholder="Rechercher par nom d'espace ou catégorie..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full lg:w-64 pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </motion.div>

      {/* Liste des réservations améliorée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {displayedReservations.length > 0 ? (
          displayedReservations.map((reservation, index) => {
            const reservantName = (reservation.reservants && reservation.reservants[0]?.name) || 'Utilisateur';
            const reservantInitials = getReservantInitials(reservantName);

            return (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300 ${
                  reservation.is_refunded 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-white border-primary-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-11 h-11 bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white text-sm font-medium">{reservantInitials}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-primary-900">{reservantName}</h3>
                          <p className="text-sm text-primary-600">{reservation.space?.name}</p>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getPaymentStatusColor(reservation.reservation_status)} border-opacity-50`}>
                            {(() => {
                              const StatusIcon = reservation.reservation_status === 'paid' ? CheckCircle : 
                                                reservation.reservation_status === 'draft' ? Clock : Warning;
                              return <StatusIcon className="h-3 w-3" weight="light" />;
                            })()}
                            <span>{getPaymentStatusLabel(reservation.reservation_status)}</span>
                          </span>
                          {getRefundBadge(reservation)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2 text-primary-600">
                          <Calendar className="h-4 w-4" weight="light" />
                          <span className="text-sm">{new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-primary-600">
                          <Tag className="h-4 w-4" weight="light" />
                          <span className="text-sm">{reservation.space?.description || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-primary-600">
                          <MapPin className="h-4 w-4" weight="light" />
                          <span className="text-sm">{reservation.space?.location || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-primary-500">
                          <span>
                            Prix : {reservation.total_price
                              ? `${parseFloat(String(reservation.total_price)).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} XOF`
                              : "N/A"}
                          </span>
                          <span>• Capacité : {reservation.space?.capacity || 'N/A'} Pers</span>
                          <span>• Catégorie: {reservation.space?.category || 'N/A'}</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setSelectedReservation(reservation.id);
                              setShowDetails(true);
                            }}
                            className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" weight="light" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                            title="Modifier"
                            onClick={() => handleEditClick(reservation)}
                          >
                            <PencilSimple className="h-4 w-4" weight="light" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                            onClick={() => handleDeleteClick(reservation)}
                          >
                            <Trash className="h-4 w-4" weight="light" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              reservation.is_refunded
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            }`}
                            title={reservation.is_refunded ? "Déjà remboursée" : "Rembourser"}
                            disabled={reservation.is_refunded === true}
                            onClick={() => {
                              if (reservation.reservation_status !== 'paid') {
                                toast.info("Impossible de rembourser une réservation non payée.");
                                return;
                              }
                              if (reservation.is_refunded) {
                                toast.info("Cette réservation a déjà été remboursée.");
                                return;
                              }
                              setSelectedReservationForRefund(reservation);
                              setShowRefundChoice(true);
                            }}
                          >
                            Rembourser
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-primary-100 p-12 text-center"
          >
            <Calendar className="h-16 w-16 text-primary-300 mx-auto mb-4" weight="light" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">Aucune réservation trouvée</h3>
            <p className="text-sm text-primary-600">
              {searchTerm || selectedStatus !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucune réservation pour le moment'}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Pagination améliorée */}
      {filteredReservations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-primary-100 p-4 lg:p-6"
        >
          <div className="text-sm text-primary-600">
            Affichage de <span className="font-medium text-primary-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à{' '}
            <span className="font-medium text-primary-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length)}</span> sur{' '}
            <span className="font-medium text-primary-900">{filteredReservations.length}</span> réservations
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

      {/* Modal choix remboursement amélioré */}
      {showRefundChoice && selectedReservationForRefund && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-md w-full border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">
                Choisir le mode de remboursement
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRefundChoice(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="flex flex-col space-y-3 mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg"
                onClick={() => handleWalletRefund(selectedReservationForRefund)}
              >
                Par Portefeuille
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-primary-900 text-white py-3 rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
                onClick={() => {
                  setRefundType('transfer');
                  setShowRefundChoice(false);
                  setShowTransferModal(true);
                }}
              >
                Par Transfert
              </motion.button>
            </div>

            <p className="text-xs text-center text-primary-600 pt-4 border-t border-primary-100">
              ⚠️ Pour tout remboursement, Cohab prélève 20 % du montant.
            </p>
          </motion.div>
        </div>
      )}

      {/* Modal transfert amélioré */}
      {showTransferModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-lg w-full border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">Remboursement par transfert</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTransferModal(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="space-y-4">
              {Object.entries(transferData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    {key === 'first_name' ? 'Prénom' :
                     key === 'last_name' ? 'Nom' :
                     key === 'email' ? 'Email' :
                     key === 'phone' ? 'Numéro de téléphone' :
                     "Numéro de pièce d'identité"}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setTransferData({ ...transferData, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-center text-primary-600 mt-4 pt-4 border-t border-primary-100">
              ⚠️ Pour tout remboursement, Cohab prélève 20 % du montant.
            </p>

            <div className="flex justify-end space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                onClick={() => setShowTransferModal(false)}
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
                onClick={handleTransferSubmit}
              >
                Soumettre
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal édition amélioré */}
      {showEdit && editData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-lg w-full overflow-y-auto max-h-[90vh] border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">Modifier la réservation</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEdit(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Nom de l'évènement</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={editData.event_name || ""}
                  onChange={(e) => setEditData({ ...editData, event_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={editData.date || ""}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Nombre de personnes</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={editData.attendees_count || ""}
                  onChange={(e) => setEditData({ ...editData, attendees_count: Number(e.target.value) })}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Statut</label>
                <select
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                  value={editData.reservation_status || "draft"}
                  onChange={(e) => setEditData({ ...editData, reservation_status: e.target.value as 'paid' | 'draft' | 'cancelled' })}
                >
                  <option value="draft">Brouillon</option>
                  <option value="paid">Payé</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <h3 className="font-medium mb-3 text-primary-900">Informations non modifiables</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-primary-600">Espace: <span className="font-medium text-primary-900">{editData.space?.name || 'N/A'}</span></p>
                  <p className="text-primary-600">
                    Prix total : <span className="font-medium text-primary-900">{editData.total_price
                      ? `${parseFloat(String(editData.total_price)).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} XOF`
                      : "N/A"}</span>
                  </p>
                  <p className="text-primary-600">
                    Options: <span className="font-medium text-primary-900">{editData.options?.map(opt => opt.name).join(', ') || 'Aucune'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-primary-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                onClick={() => setShowEdit(false)}
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
                onClick={handleUpdateReservation}
              >
                Enregistrer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal suppression amélioré */}
      {showDeleteModal && selectedReservationData && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-md w-full border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Warning className="h-8 w-8 text-red-600" weight="light" />
              </div>
              <h2 className="text-xl font-light text-primary-900 mb-3">Confirmation de suppression</h2>
              <p className="text-sm text-primary-600">
                Êtes-vous sûr de vouloir supprimer la réservation de l'espace{" "}
                <span className="font-medium text-primary-900">{selectedReservationData.space?.name || 'N/A'}</span>{" "}
                pour l'évènement{" "}
                <span className="font-medium text-primary-900">{selectedReservationData.event_name || "sans nom"}</span>{" "}
                effectuée par{" "}
                <span className="font-medium text-primary-900">
                  {selectedReservationData.reservants && selectedReservationData.reservants[0]?.name || 'N/A'}
                </span>{" "}
                prévu pour la date du {" "}
                <span className="font-medium text-primary-900">
                  {selectedReservationData.date
                    ? new Date(selectedReservationData.date).toLocaleDateString('fr-FR')
                    : 'Date non renseignée'}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-4 border-t border-primary-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-lg"
                onClick={handleDeleteReservation}
              >
                Supprimer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal détails amélioré */}
      {showDetails && selectedReservationData && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-primary-900">Détails de la réservation</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDetails(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="space-y-4">
              {selectedReservationData.reservants && selectedReservationData.reservants.length > 0 && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <h3 className="text-sm font-medium text-primary-900 mb-3">Informations Utilisateur réservant</h3>
                  {selectedReservationData.reservants.map((reservant, index) => (
                    <div key={index} className="space-y-2 border-b border-primary-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-primary-600" weight="light" />
                        <span className="text-sm text-primary-700">{reservant.name || "Non spécifié"}</span>
                      </div>
                      {reservant.email && (
                        <div className="flex items-center space-x-2">
                          <Envelope className="h-4 w-4 text-primary-600" weight="light" />
                          <span className="text-sm text-primary-700">{reservant.email}</span>
                        </div>
                      )}
                      {reservant.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-primary-600" weight="light" />
                          <span className="text-sm text-primary-700">{reservant.phone}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedReservationData.space && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <h3 className="text-sm font-medium text-primary-900 mb-3">Informations espace</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Building className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Espace</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.space.name}</p>
                      </div>
                    </div>
                    {selectedReservationData.space.description && (
                      <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                        <Info className="h-4 w-4 text-primary-600" weight="light" />
                        <div>
                          <p className="text-xs text-primary-600 mb-0.5">Description</p>
                          <p className="text-sm font-medium text-primary-900">{selectedReservationData.space.description}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Tag className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Catégorie</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.space.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Users className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Capacité</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.space.capacity} Pers</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg md:col-span-2">
                      <MapPin className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Position</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.space.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <h3 className="text-sm font-medium text-primary-900 mb-3">Informations réservation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedReservationData.event_name && (
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Tag className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Évènement</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.event_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                    <Calendar className="h-4 w-4 text-primary-600" weight="light" />
                    <div>
                      <p className="text-xs text-primary-600 mb-0.5">Date</p>
                      <p className="text-sm font-medium text-primary-900">
                        {new Date(selectedReservationData.date).toLocaleDateString('fr-FR')}
                        {selectedReservationData.start_time && ` de ${selectedReservationData.start_time} à ${selectedReservationData.end_time}`}
                      </p>
                    </div>
                  </div>
                  {selectedReservationData.nbr_nights && (
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Clock className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Nuits</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.nbr_nights} Nuit(s)</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                    <Users className="h-4 w-4 text-primary-600" weight="light" />
                    <div>
                      <p className="text-xs text-primary-600 mb-0.5">Personnes</p>
                      <p className="text-sm font-medium text-primary-900">{selectedReservationData.attendees_count} Pers</p>
                    </div>
                  </div>
                  {selectedReservationData.total_price && (
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Money className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Prix</p>
                        <p className="text-sm font-medium text-primary-900">
                          {parseFloat(String(selectedReservationData.total_price)).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} XOF
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedReservationData.created_at && (
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Clock className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Créée le</p>
                        <p className="text-sm font-medium text-primary-900">
                          {new Date(selectedReservationData.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedReservationData.payment && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <h3 className="text-sm font-medium text-primary-900 mb-3">Informations Paiement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <CreditCard className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Méthode</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.payment.method}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <Money className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Montant</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.payment.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <CheckCircle className="h-4 w-4 text-primary-600" weight="light" />
                      <div>
                        <p className="text-xs text-primary-600 mb-0.5">Statut</p>
                        <p className="text-sm font-medium text-primary-900">{selectedReservationData.payment.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-4 border-t border-primary-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
                  onClick={() => setShowDetails(false)}
                >
                  Fermer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

