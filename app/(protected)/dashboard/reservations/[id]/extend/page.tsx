'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Clock, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckInService } from '@/lib/services/checkin';
import { ReservationService, type Reservation } from '@/lib/services/reservations';
import type { ExtensionAvailability } from '@/types/checkin';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';

export default function ExtendReservationPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [extending, setExtending] = useState(false);
  const [availability, setAvailability] = useState<ExtensionAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    space_id: number;
    space_name: string;
    start: string;
    end: string;
    duration_hours: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
      loadAvailability();
    }
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      const res = await ReservationService.getReservationById(reservationId);
      setReservation(res);
    } catch (error: any) {
      console.error('Erreur lors du chargement de la réservation:', error);
      toast.error('Erreur lors du chargement de la réservation');
      router.push('/dashboard?tab=reservations');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    if (!reservationId) return;
    
    try {
      setLoadingAvailability(true);
      setError(null);
      const result = await CheckInService.getExtensionAvailability(parseInt(reservationId));
      
      if (result.success && result.available_extensions) {
        setAvailability(result.available_extensions);
      } else {
        setError(result.error || 'Aucune disponibilité trouvée');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des disponibilités:', error);
      setError(error.message || 'Erreur lors du chargement des disponibilités');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleExtend = async () => {
    if (!selectedSlot || !reservation) {
      toast.error('Veuillez sélectionner un créneau');
      return;
    }

    try {
      setExtending(true);
      
      // Calculer la nouvelle heure de fin
      const currentEndTime = reservation.end_time;
      const [endHours, endMinutes] = currentEndTime.split(':').map(Number);
      
      // Calculer la nouvelle heure de fin en ajoutant la durée du créneau
      const slotStart = selectedSlot.start;
      const [slotStartHours, slotStartMinutes] = slotStart.split(':').map(Number);
      
      // Si le créneau commence après l'heure de fin actuelle, utiliser l'heure de fin du créneau
      // Sinon, prolonger jusqu'à l'heure de fin du créneau
      const newEndTime = selectedSlot.end;
      
      // Mettre à jour la réservation avec la nouvelle heure de fin
      const updated = await ReservationService.updateReservation(reservation.id, {
        space: reservation.space_id,
        date: reservation.date,
        event_name: reservation.event_name,
        attendees_count: reservation.attendees_count,
        is_active: reservation.is_active,
        options: reservation.reservation_options?.map(opt => opt.id) || [],
        nbr_nights: reservation.nbr_nights,
        start_time: reservation.start_time,
        end_time: newEndTime,
      });

      toast.success('Réservation prolongée avec succès');
      router.push(`/dashboard?tab=reservations`);
    } catch (error: any) {
      console.error('Erreur lors de la prolongation:', error);
      toast.error(error.message || 'Erreur lors de la prolongation de la réservation');
    } finally {
      setExtending(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </Container>
    );
  }

  if (!reservation) {
    return (
      <Container>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Réservation introuvable</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard?tab=reservations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <ToolbarPageTitle text="Prolonger la réservation" />
            <ToolbarDescription>
              {reservation.event_name} - {reservation.space_name}
            </ToolbarDescription>
          </div>
        </div>
      </Toolbar>

      <div className="mt-6 space-y-6">
        {/* Informations de la réservation actuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Réservation actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Heure</p>
                <p className="font-medium">{reservation.start_time} - {reservation.end_time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Espace</p>
                <p className="font-medium">{reservation.space_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Événement</p>
                <p className="font-medium">{reservation.event_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disponibilités */}
        <Card>
          <CardHeader>
            <CardTitle>Disponibilités pour prolongation</CardTitle>
            <CardDescription>
              Sélectionnez un créneau pour prolonger votre réservation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAvailability ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500 mr-2" />
                <span>Chargement des disponibilités...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : availability && (
              <div className="space-y-6">
                {/* Même salle */}
                {availability.same_space && availability.same_space.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary-500" />
                      Même salle ({reservation.space_name})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availability.same_space.map((slot, index) => {
                        const slotKey = `same-${index}`;
                        // Formater l'heure (peut être "HH:MM:SS" ou "HH:MM")
                        const formatTime = (time: string) => {
                          if (!time) return '';
                          return time.split(':').slice(0, 2).join(':');
                        };
                        const startTime = formatTime(slot.start);
                        const endTime = formatTime(slot.end);
                        const duration = slot.duration_hours || slot.hours || 0;
                        const isSelected = selectedSlot?.space_id === parseInt(reservation.space_id) && 
                                          selectedSlot?.start === startTime;
                        return (
                          <button
                            key={slotKey}
                            onClick={() => setSelectedSlot({
                              space_id: parseInt(reservation.space_id),
                              space_name: reservation.space_name,
                              start: startTime,
                              end: endTime,
                              duration_hours: duration,
                            })}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {startTime} - {endTime}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {duration.toFixed(1)}h
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-primary-500" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Autres salles */}
                {availability.other_spaces && availability.other_spaces.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-secondary-500" />
                      Autres salles disponibles
                    </h3>
                    <div className="space-y-4">
                      {availability.other_spaces.map((spaceOption, spaceIndex) => (
                        <div key={`other-${spaceIndex}`} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">{spaceOption.space_name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {spaceOption.slots.map((slot, slotIndex) => {
                              const slotKey = `other-${spaceIndex}-${slotIndex}`;
                              // Formater l'heure (peut être "HH:MM:SS" ou "HH:MM")
                              const formatTime = (time: string) => {
                                if (!time) return '';
                                return time.split(':').slice(0, 2).join(':');
                              };
                              const startTime = formatTime(slot.start);
                              const endTime = formatTime(slot.end);
                              const duration = slot.hours || slot.duration_hours || 0;
                              const isSelected = selectedSlot?.space_id === spaceOption.space_id && 
                                                selectedSlot?.start === startTime;
                              return (
                                <button
                                  key={slotKey}
                                  onClick={() => setSelectedSlot({
                                    space_id: spaceOption.space_id,
                                    space_name: spaceOption.space_name,
                                    start: startTime,
                                    end: endTime,
                                    duration_hours: duration,
                                  })}
                                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                                    isSelected
                                      ? 'border-primary-500 bg-primary-50'
                                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {startTime} - {endTime}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {duration.toFixed(1)}h
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-5 w-5 text-primary-500" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!availability.same_space || availability.same_space.length === 0) &&
                 (!availability.other_spaces || availability.other_spaces.length === 0) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucune disponibilité trouvée pour prolonger cette réservation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="font-medium mb-2">Créneau sélectionné :</p>
                <p className="text-sm">
                  <strong>{selectedSlot.space_name}</strong> - {selectedSlot.start} à {selectedSlot.end} 
                  ({selectedSlot.duration_hours.toFixed(1)}h)
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  La réservation sera prolongée jusqu'à {selectedSlot.end}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <Button
                onClick={handleExtend}
                disabled={!selectedSlot || extending}
                className="flex-1"
              >
                {extending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Prolongation en cours...
                  </>
                ) : (
                  'Prolonger la réservation'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard?tab=reservations')}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

