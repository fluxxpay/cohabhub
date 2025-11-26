'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  User,
  Calendar,
  MapPin,
  Timer,
  SignIn,
  SignOut,
  Warning,
  Check,
  X,
  Eye,
  Funnel,
} from '@phosphor-icons/react';
import { CheckInService } from '@/lib/services/checkin';
import { apiFetch } from '@/lib/api';
import type {
  ReservationVerification,
  ReservationSession,
  ActiveSessionsResponse,
  SessionHistoryResponse,
} from '@/types/checkin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckInManagement() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'active' | 'history'>('checkin');
  const [reservationId, setReservationId] = useState('');
  const [email, setEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [verification, setVerification] = useState<ReservationVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [activeSessions, setActiveSessions] = useState<ReservationSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ReservationSession | null>(null);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // État pour l'historique
  const [historySessions, setHistorySessions] = useState<ReservationSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    space_id: '',
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStats, setHistoryStats] = useState<{
    total_hours: number;
    total_overtime: number;
    average_duration: number;
    total_sessions: number;
  } | null>(null);
  const [historyPagination, setHistoryPagination] = useState<{
    next: string | null;
    previous: string | null;
    count: number;
  }>({ next: null, previous: null, count: 0 });
  const [selectedHistorySession, setSelectedHistorySession] = useState<ReservationSession | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [spaces, setSpaces] = useState<Array<{ id: number; name: string }>>([]);

  // Charger les espaces au montage
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const result = await apiFetch<Array<{ id: number; name: string }>>('/api/spaces/', {
          method: 'GET',
        });
        if (result.response?.ok) {
          const spacesList = Array.isArray(result.data) ? result.data : (result.data as any).data || [];
          setSpaces(spacesList);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des espaces:', error);
      }
    };
    fetchSpaces();
  }, []);

  // Polling pour les sessions actives
  useEffect(() => {
    if (activeTab === 'active') {
      // Premier chargement avec indicateur de chargement
      loadActiveSessions(true);
      const interval = setInterval(() => {
        // Actualisations suivantes en arrière-plan sans indicateur
        loadActiveSessions(false);
      }, 5000); // Mise à jour toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Charger l'historique quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyFilters, historyPage]);

  const handleVerify = async () => {
    if (!reservationId) {
      toast.error('Veuillez entrer un ID de réservation');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await CheckInService.verifyReservation(
        parseInt(reservationId),
        email || undefined,
        eventName || undefined
      );
      setVerification(result);
      if (!result.valid || !result.can_check_in) {
        toast.error(result.message || 'Réservation non valide pour check-in');
      } else {
        toast.success('Réservation vérifiée avec succès');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la vérification');
      setVerification(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!verification?.can_check_in) {
      toast.error('Impossible d\'effectuer le check-in');
      return;
    }

    setIsCheckingIn(true);
    try {
      const result = await CheckInService.checkIn(
        parseInt(reservationId),
        { notes: checkInNotes }
      );
      toast.success('Check-in effectué avec succès');
      setVerification(null);
      setReservationId('');
      setEmail('');
      setEventName('');
      setCheckInNotes('');
      // Passer à l'onglet des sessions actives
      setActiveTab('active');
      loadActiveSessions();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du check-in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const loadActiveSessions = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoadingSessions(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const result = await CheckInService.getActiveSessions();
      setActiveSessions(result.active_sessions);
    } catch (error: any) {
      console.error('Erreur lors du chargement des sessions actives:', error);
    } finally {
      setIsLoadingSessions(false);
      setIsRefreshing(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const filters: any = {
        page: historyPage,
        page_size: 10,
      };
      if (historyFilters.status) filters.status = historyFilters.status;
      if (historyFilters.date_from) filters.date_from = historyFilters.date_from;
      if (historyFilters.date_to) filters.date_to = historyFilters.date_to;
      if (historyFilters.space_id) filters.space_id = parseInt(historyFilters.space_id);

      const result = await CheckInService.getSessionHistory(filters);
      
      // Debug: afficher la structure de la réponse
      console.log('Réponse historique complète:', result);
      
      // La pagination Django REST Framework peut retourner les données dans 'results'
      // ou directement dans 'sessions' selon le format de la réponse
      let sessions: ReservationSession[] = [];
      let stats = null;
      let paginationData = {
        next: null as string | null,
        previous: null as string | null,
        count: 0,
      };

      // Gérer la structure paginée (results contient {sessions, stats})
      if ((result as any).results) {
        const resultsData = (result as any).results;
        sessions = Array.isArray(resultsData.sessions) ? resultsData.sessions : [];
        stats = resultsData.stats || null;
        paginationData = {
          next: (result as any).next || null,
          previous: (result as any).previous || null,
          count: (result as any).count || 0,
        };
      } else {
        // Structure directe
        sessions = Array.isArray(result.sessions) ? result.sessions : [];
        stats = result.stats || null;
        paginationData = {
          next: result.next || null,
          previous: result.previous || null,
          count: result.count || result.total || 0,
        };
      }

      console.log('Sessions extraites:', sessions.length, sessions);
      console.log('Stats:', stats);
      console.log('Pagination:', paginationData);

      setHistorySessions(sessions);
      setHistoryStats(stats);
      setHistoryPagination(paginationData);
    } catch (error: any) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast.error('Erreur lors du chargement de l\'historique');
      setHistorySessions([]); // S'assurer que c'est toujours un tableau
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleHistoryFilterChange = (key: string, value: string) => {
    setHistoryFilters((prev) => ({ ...prev, [key]: value }));
    setHistoryPage(1); // Réinitialiser à la première page
  };

  const handleViewHistoryDetail = async (session: ReservationSession) => {
    try {
      const detail = await CheckInService.getSessionDetail(session.id);
      setSelectedHistorySession(detail);
      setShowHistoryDetail(true);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleCheckOut = async (session: ReservationSession) => {
    setSelectedSession(session);
    setShowCheckOutModal(true);
  };

  const confirmCheckOut = async () => {
    if (!selectedSession) return;

    setIsCheckingOut(true);
    try {
      const result = await CheckInService.checkOut(selectedSession.id, {
        notes: checkOutNotes,
      });
      toast.success('Check-out effectué avec succès');
      setShowCheckOutModal(false);
      setCheckOutNotes('');
      setSelectedSession(null);
      loadActiveSessions();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du check-out');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes, seconds] = timeString.split(':');
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const safeToNumber = (value: any): number | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm px-3 py-1 font-semibold">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>En cours</span>
            </div>
          </Badge>
        );
      case 'checked_out':
        return (
          <Badge className="bg-gray-500 text-white border-0 shadow-sm px-3 py-1 font-semibold">
            Terminée
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-sm px-3 py-1 font-semibold">
            En attente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-400 text-white border-0 shadow-sm px-3 py-1 font-semibold">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'checkin'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <SignIn className="h-4 w-4" />
            <span>Check-in</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Timer className={`h-4 w-4 ${isRefreshing ? 'animate-pulse' : ''}`} />
            <span>Sessions actives</span>
            {activeSessions.length > 0 && (
              <Badge className="bg-primary-500">{activeSessions.length}</Badge>
            )}
            {isRefreshing && (
              <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Historique</span>
          </div>
        </button>
      </div>

      {/* Check-in Tab */}
      {activeTab === 'checkin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Vérifier et Check-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reservation_id">ID Réservation *</Label>
                  <Input
                    id="reservation_id"
                    type="number"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="event_name">Nom événement (optionnel)</Label>
                  <Input
                    id="event_name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Réunion équipe"
                  />
                </div>
              </div>

              <Button
                onClick={handleVerify}
                disabled={isVerifying || !reservationId}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <MagnifyingGlass className="h-4 w-4 mr-2" />
                    Vérifier la réservation
                  </>
                )}
              </Button>

              {verification && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {verification.valid && verification.can_check_in ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {verification.message}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{verification.message}</AlertDescription>
                      </Alert>
                    )}

                    {verification.valid && verification.reservation && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="text-lg">Informations de la réservation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Utilisateur</p>
                              <p className="font-medium">
                                {verification.user?.first_name} {verification.user?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{verification.user?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Événement</p>
                              <p className="font-medium">{verification.reservation.event_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Espace</p>
                              <p className="font-medium">{verification.reservation.space_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Date</p>
                              <p className="font-medium">
                                {new Date(verification.reservation.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            {verification.reservation.start_time && (
                              <div>
                                <p className="text-sm text-gray-600">Heures</p>
                                <p className="font-medium">
                                  {verification.reservation.start_time} -{' '}
                                  {verification.reservation.end_time}
                                </p>
                              </div>
                            )}
                          </div>

                          {verification.can_check_in && (
                            <div className="mt-4 space-y-4">
                              <div>
                                <Label htmlFor="checkin_notes">Notes (optionnel)</Label>
                                <Textarea
                                  id="checkin_notes"
                                  value={checkInNotes}
                                  onChange={(e) => setCheckInNotes(e.target.value)}
                                  placeholder="Notes du gérant..."
                                  rows={3}
                                />
                              </div>
                              <Button
                                onClick={handleCheckIn}
                                disabled={isCheckingIn}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                {isCheckingIn ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    Check-in en cours...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Effectuer le check-in
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Sessions Tab */}
      {activeTab === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {isRefreshing && (
                <div className="flex items-center justify-end text-xs text-gray-500 mb-2">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Actualisation...
                </div>
              )}
              {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Timer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune session active</p>
              </CardContent>
            </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="relative overflow-hidden border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-300 group">
                        {/* Barre de statut colorée en haut */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500" />
                        
                        <CardHeader className="pb-3 pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                                {session.event_name}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-2">
                                <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                                  <User className="h-4 w-4 text-primary-500" />
                                  <span className="font-medium text-gray-800">{session.user_name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {getStatusBadge(session.status)}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-5 pt-0">
                          {/* Informations de base */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-primary-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Espace</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{session.space_name}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Check-in</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {session.check_in_time
                                    ? new Date(session.check_in_time).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '-'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Section temps avec design moderne */}
                          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-5 shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <Timer className="h-5 w-5 text-white/90" />
                                  <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                                    Temps écoulé
                                  </span>
                                </div>
                              </div>
                              <div className="mb-4">
                                <span className="text-4xl font-bold text-white drop-shadow-sm">
                                  {session.elapsed_time_formatted}
                                </span>
                              </div>
                              
                              {session.reserved_duration_hours && (
                                <div className="pt-4 border-t border-white/20">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                                      Temps restant
                                    </span>
                                    <span className="text-lg font-bold text-white">
                                      {session.remaining_time_formatted}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Alerte heures supplémentaires */}
                          {session.is_overtime && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative"
                            >
                              <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-sm">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <Warning className="h-5 w-5 text-yellow-600 animate-pulse" />
                                  </div>
                                  <div className="flex-1">
                                    <AlertDescription className="text-yellow-900 font-semibold">
                                      Heures supplémentaires en cours
                                    </AlertDescription>
                                    {session.overtime_hours && (
                                      <p className="text-sm text-yellow-700 mt-1">
                                        +{session.overtime_hours.toFixed(1)}h supplémentaires
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Alert>
                            </motion.div>
                          )}

                          {/* Bouton check-out moderne */}
                          <Button
                            onClick={() => handleCheckOut(session)}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11"
                          >
                            <SignOut className="h-4 w-4 mr-2" />
                            Effectuer le check-out
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Statistiques */}
          {historyStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100 font-medium">Total Sessions</p>
                      <p className="text-2xl font-bold mt-1">{historyStats.total_sessions}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-100 font-medium">Total Heures</p>
                      <p className="text-2xl font-bold mt-1">{historyStats.total_hours.toFixed(1)}h</p>
                    </div>
                    <Timer className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-100 font-medium">Heures Supp.</p>
                      <p className="text-2xl font-bold mt-1">{historyStats.total_overtime.toFixed(1)}h</p>
                    </div>
                    <Warning className="h-8 w-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-100 font-medium">Durée Moyenne</p>
                      <p className="text-2xl font-bold mt-1">{historyStats.average_duration.toFixed(1)}h</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtres */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Funnel className="h-5 w-5" />
                  <span>Filtres</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistoryFilters({
                      status: '',
                      date_from: '',
                      date_to: '',
                      space_id: '',
                    });
                    setHistoryPage(1);
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="history_status">Statut</Label>
                  <select
                    id="history_status"
                    value={historyFilters.status}
                    onChange={(e) => handleHistoryFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="checked_in">En cours</option>
                    <option value="checked_out">Terminée</option>
                    <option value="pending">En attente</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="history_space">Espace</Label>
                  <select
                    id="history_space"
                    value={historyFilters.space_id}
                    onChange={(e) => handleHistoryFilterChange('space_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Tous les espaces</option>
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="history_date_from">Date début</Label>
                  <Input
                    id="history_date_from"
                    type="date"
                    value={historyFilters.date_from}
                    onChange={(e) => handleHistoryFilterChange('date_from', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="history_date_to">Date fin</Label>
                  <Input
                    id="history_date_to"
                    type="date"
                    value={historyFilters.date_to}
                    onChange={(e) => handleHistoryFilterChange('date_to', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des sessions */}
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : !historySessions || historySessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune session trouvée</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(historySessions || []).map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary-500"
                    onClick={() => handleViewHistoryDetail(session)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">{session.event_name}</h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-1.5">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{session.user_name}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <MapPin className="h-4 w-4" />
                                  <span>{session.space_name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(session.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Check-in</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {session.check_in_time
                                  ? new Date(session.check_in_time).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Check-out</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {session.check_out_time
                                  ? new Date(session.check_out_time).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Durée</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {(() => {
                                  const duration = safeToNumber(session.actual_duration_hours);
                                  return duration !== null
                                    ? `${duration.toFixed(1)}h`
                                    : session.elapsed_time_formatted || '-';
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Coût Total</p>
                              <p className="text-sm font-semibold text-primary-600">
                                {(() => {
                                  const cost = safeToNumber(session.total_cost);
                                  return cost !== null ? `${cost.toFixed(2)} €` : '-';
                                })()}
                              </p>
                            </div>
                          </div>

                          {session.is_overtime && (() => {
                            const overtimeHours = safeToNumber(session.overtime_hours);
                            const overtimeCost = safeToNumber(session.overtime_cost);
                            return overtimeHours !== null && overtimeHours > 0 ? (
                              <div className="flex items-center space-x-2 pt-2">
                                <Warning className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-700 font-medium">
                                  {overtimeHours.toFixed(1)}h supplémentaires
                                  {overtimeCost !== null ? ` (+${overtimeCost.toFixed(2)} €)` : ''}
                                </span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <div className="ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewHistoryDetail(session);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Pagination */}
              {historyPagination.count > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Affichage de {historySessions.length} sur {historyPagination.count} sessions
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={!historyPagination.previous || historyPage === 1}
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-gray-600 px-3">
                      Page {historyPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => p + 1)}
                      disabled={!historyPagination.next}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Modal détails session historique */}
      <Dialog open={showHistoryDetail} onOpenChange={setShowHistoryDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la session</DialogTitle>
            <DialogDescription>
              Informations complètes de la session de check-in/check-out
            </DialogDescription>
          </DialogHeader>
          {selectedHistorySession && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Événement</p>
                  <p className="text-lg font-bold text-gray-900">{selectedHistorySession.event_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Utilisateur</p>
                  <p className="text-lg font-bold text-gray-900">{selectedHistorySession.user_name}</p>
                  <p className="text-sm text-gray-600">{selectedHistorySession.user_email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Espace</p>
                  <p className="text-lg font-bold text-gray-900">{selectedHistorySession.space_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Statut</p>
                  <div className="mt-1">{getStatusBadge(selectedHistorySession.status)}</div>
                </div>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Check-in</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Date et heure</p>
                      <p className="font-semibold">
                        {selectedHistorySession.check_in_time
                          ? new Date(selectedHistorySession.check_in_time).toLocaleString('fr-FR')
                          : '-'}
                      </p>
                    </div>
                    {selectedHistorySession.checked_in_by_name && (
                      <div>
                        <p className="text-xs text-gray-500">Effectué par</p>
                        <p className="font-semibold">{selectedHistorySession.checked_in_by_name}</p>
                      </div>
                    )}
                    {selectedHistorySession.check_in_notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm">{selectedHistorySession.check_in_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Check-out</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Date et heure</p>
                      <p className="font-semibold">
                        {selectedHistorySession.check_out_time
                          ? new Date(selectedHistorySession.check_out_time).toLocaleString('fr-FR')
                          : '-'}
                      </p>
                    </div>
                    {selectedHistorySession.checked_out_by_name && (
                      <div>
                        <p className="text-xs text-gray-500">Effectué par</p>
                        <p className="font-semibold">{selectedHistorySession.checked_out_by_name}</p>
                      </div>
                    )}
                    {selectedHistorySession.check_out_notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm">{selectedHistorySession.check_out_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Durées et coûts */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader>
                    <CardTitle className="text-base">Durées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const reserved = safeToNumber(selectedHistorySession.reserved_duration_hours);
                      return reserved !== null ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Réservé</span>
                          <span className="font-semibold">{reserved}h</span>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Réel</span>
                      <span className="font-semibold">
                        {(() => {
                          const duration = safeToNumber(selectedHistorySession.actual_duration_hours);
                          return duration !== null ? `${duration.toFixed(1)}h` : '-';
                        })()}
                      </span>
                    </div>
                    {selectedHistorySession.is_overtime && (() => {
                      const overtimeHours = safeToNumber(selectedHistorySession.overtime_hours);
                      return overtimeHours !== null && overtimeHours > 0 ? (
                        <div className="flex justify-between text-yellow-700">
                          <span className="text-sm font-medium">Heures supplémentaires</span>
                          <span className="font-bold">+{overtimeHours.toFixed(1)}h</span>
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader>
                    <CardTitle className="text-base">Coûts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const baseCost = safeToNumber(selectedHistorySession.base_cost);
                      return baseCost !== null && baseCost > 0 ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Coût de base</span>
                          <span className="font-semibold">{baseCost.toFixed(2)} €</span>
                        </div>
                      ) : null;
                    })()}
                    {(() => {
                      const overtimeCost = safeToNumber(selectedHistorySession.overtime_cost);
                      return overtimeCost !== null && overtimeCost > 0 ? (
                        <div className="flex justify-between text-yellow-700">
                          <span className="text-sm font-medium">Heures supplémentaires</span>
                          <span className="font-semibold">+{overtimeCost.toFixed(2)} €</span>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex justify-between pt-2 border-t border-green-200">
                      <span className="text-sm font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-green-700">
                        {(() => {
                          const totalCost = safeToNumber(selectedHistorySession.total_cost);
                          return totalCost !== null ? `${totalCost.toFixed(2)} €` : '-';
                        })()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDetail(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Modal */}
      <Dialog open={showCheckOutModal} onOpenChange={setShowCheckOutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-out</DialogTitle>
            <DialogDescription>
              Confirmer le check-out pour {selectedSession?.user_name}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temps écoulé:</span>
                  <span className="font-semibold">{selectedSession.elapsed_time_formatted}</span>
                </div>
                {selectedSession.reserved_duration_hours && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Temps réservé:</span>
                      <span className="font-semibold">
                        {selectedSession.reserved_duration_hours}h
                      </span>
                    </div>
                    {selectedSession.is_overtime && (
                      <div className="flex justify-between text-yellow-600">
                        <span className="text-sm">Heures supplémentaires:</span>
                        <span className="font-semibold">
                          {selectedSession.current_duration_hours -
                            selectedSession.reserved_duration_hours}
                          h
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="checkout_notes">Notes (optionnel)</Label>
                <Textarea
                  id="checkout_notes"
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  placeholder="Notes du gérant..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckOutModal(false)}
              disabled={isCheckingOut}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmCheckOut}
              disabled={isCheckingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCheckingOut ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Check-out en cours...
                </>
              ) : (
                <>
                  <SignOut className="h-4 w-4 mr-2" />
                  Confirmer le check-out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

