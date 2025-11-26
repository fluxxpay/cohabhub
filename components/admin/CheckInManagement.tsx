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
import type {
  ReservationVerification,
  ReservationSession,
  ActiveSessionsResponse,
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
  const [selectedSession, setSelectedSession] = useState<ReservationSession | null>(null);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Polling pour les sessions actives
  useEffect(() => {
    if (activeTab === 'active') {
      loadActiveSessions();
      const interval = setInterval(() => {
        loadActiveSessions();
      }, 5000); // Mise à jour toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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

  const loadActiveSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const result = await CheckInService.getActiveSessions();
      setActiveSessions(result.active_sessions);
    } catch (error: any) {
      console.error('Erreur lors du chargement des sessions actives:', error);
    } finally {
      setIsLoadingSessions(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-500">En cours</Badge>;
      case 'checked_out':
        return <Badge className="bg-gray-500">Terminée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
            <Timer className="h-4 w-4" />
            <span>Sessions actives</span>
            {activeSessions.length > 0 && (
              <Badge className="bg-primary-500">{activeSessions.length}</Badge>
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
          ) : activeSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Timer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucune session active</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((session) => (
                <Card key={session.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.event_name}</CardTitle>
                      {getStatusBadge(session.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{session.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{session.space_name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          {session.check_in_time
                            ? new Date(session.check_in_time).toLocaleString('fr-FR')
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Temps écoulé</span>
                        <span className="text-2xl font-bold text-primary-600">
                          {session.elapsed_time_formatted}
                        </span>
                      </div>
                      {session.reserved_duration_hours && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Temps restant</span>
                          <span className="text-lg font-semibold text-gray-700">
                            {session.remaining_time_formatted}
                          </span>
                        </div>
                      )}
                      {session.is_overtime && (
                        <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                          <Warning className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-sm">
                            Heures supplémentaires en cours
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Button
                      onClick={() => handleCheckOut(session)}
                      variant="outline"
                      className="w-full"
                    >
                      <SignOut className="h-4 w-4 mr-2" />
                      Check-out
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Historique des sessions (à implémenter)</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

