'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { SpaceService, type Space } from '@/lib/services/spaces';
import { ReservationService, type ReservationCreatePayload } from '@/lib/services/reservations';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarPageTitle,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Home,
  Sparkles,
  Monitor,
  House,
  Wifi,
  Coffee,
  Printer,
  Phone,
  Car,
  Camera,
  Speaker,
  Projector,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { HexagonBadge } from '@/partials/common/hexagon-badge';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FeexPayPayment } from '@/app/(protected)/dashboard/components/feexpay-payment';
import { ProfileService, type UserProfile } from '@/lib/services/profile';
import { CreditCard } from 'lucide-react';

interface BookingForm {
  event_name: string;
  attendees_count: number;
  date: string;
  start_time: string;
  end_time: string;
  nbr_nights: number;
  selectedOptions: number[];
  optionQuantities: Record<number, number>;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building,
  Monitor,
  House,
  Sparkles,
  WifiHigh: Wifi,
  Wifi,
  Coffee,
  Printer,
  Phone,
  Car,
  Camera,
  SpeakerHigh: Speaker,
  Speaker,
  ProjectorScreen: Projector,
  Projector,
  Zap,
};

// Composant TimePicker dans le style Metronic - compact et élégant
interface TimePickerInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minTime?: string;
}

function TimePickerInput({ id, value, onChange, placeholder = "Sélectionner une heure", minTime }: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':').map(Number);
      setSelectedHour(hour);
      setSelectedMinute(minute);
    } else {
      setSelectedHour(null);
      setSelectedMinute(null);
    }
  }, [value]);

  const handleTimeSelect = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  // Heures de 0 à 23, minutes par pas de 15
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          mode="input"
          variant="outline"
          id={id}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatDisplayTime(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Grille compacte pour les heures */}
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Heure</div>
            <div className="grid grid-cols-6 gap-1">
              {hours.map((hour) => {
                const isSelected = selectedHour === hour;
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => {
                      setSelectedHour(hour);
                      if (selectedMinute !== null) {
                        handleTimeSelect(hour, selectedMinute);
                      }
                    }}
                    className={cn(
                      'size-8 rounded-md text-xs transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-accent',
                    )}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grille compacte pour les minutes */}
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Minute</div>
            <div className="grid grid-cols-4 gap-1">
              {minutes.map((minute) => {
                const isSelected = selectedMinute === minute;
                return (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => {
                      setSelectedMinute(minute);
                      if (selectedHour !== null) {
                        handleTimeSelect(selectedHour, minute);
                      }
                    }}
                    className={cn(
                      'size-8 rounded-md text-xs transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-accent',
                    )}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bouton Maintenant */}
          <div className="pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7"
              onClick={() => {
                const now = new Date();
                const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
                handleTimeSelect(now.getHours(), roundedMinutes);
              }}
            >
              Maintenant
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function BookingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [form, setForm] = useState<BookingForm>({
    event_name: '',
    attendees_count: 1,
    date: '',
    start_time: '',
    end_time: '',
    nbr_nights: 1,
    selectedOptions: [],
    optionQuantities: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await SpaceService.getSpaces();
        setSpaces(data.filter((s) => s.is_active));
      } catch (err) {
        console.error('Erreur lors du chargement des espaces:', err);
        toast.error('Erreur lors du chargement des espaces');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const profile = await ProfileService.getMyProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    };

    fetchSpaces();
    fetchUserProfile();
  }, []);

  const handleSelectSpace = (space: Space) => {
    setSelectedSpace(space);
    setForm((prev) => ({
      ...prev,
      selectedOptions: [],
      optionQuantities: {},
    }));
  };

  const handleOptionToggle = (optionId: number) => {
    setForm((prev) => {
      const isSelected = prev.selectedOptions.includes(optionId);
      const newOptions = isSelected
        ? prev.selectedOptions.filter((id) => id !== optionId)
        : [...prev.selectedOptions, optionId];

      const option = selectedSpace?.options.find((opt) => opt.id === optionId);
      const newQuantities = { ...prev.optionQuantities };

      if (isSelected) {
        delete newQuantities[optionId];
      } else if (option?.option_type === 'variable') {
        newQuantities[optionId] = 1;
      }

      return {
        ...prev,
        selectedOptions: newOptions,
        optionQuantities: newQuantities,
      };
    });
  };

  const handleOptionQuantityChange = (optionId: number, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      optionQuantities: {
        ...prev.optionQuantities,
        [optionId]: Math.max(1, quantity),
      },
    }));
  };

  const calculatePrice = (): number => {
    if (!selectedSpace) return 0;

    let basePrice = 0;

    if (selectedSpace.category === 'appartement') {
      basePrice = selectedSpace.price_full_day * form.nbr_nights;
    } else {
      if (form.start_time && form.end_time) {
        const start = new Date(`${form.date}T${form.start_time}`);
        const end = new Date(`${form.date}T${form.end_time}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        basePrice = selectedSpace.price_hour * hours;
      }
    }

    form.selectedOptions.forEach((optionId) => {
      const option = selectedSpace.options.find((opt) => opt.id === optionId);
      if (option) {
        if (option.option_type === 'variable') {
          const quantity = form.optionQuantities[optionId] || 1;
          basePrice += option.price * quantity;
        } else {
          basePrice += option.price;
        }
      }
    });

    return basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSpace) {
      setError('Veuillez sélectionner un espace');
      return;
    }

    if (!form.event_name.trim()) {
      setError('Le nom de l\'événement est requis');
      return;
    }

    if (!form.date) {
      setError('Veuillez sélectionner une date');
      return;
    }

    if (selectedSpace.category === 'appartement') {
      if (form.nbr_nights < 1) {
        setError('Le nombre de nuits doit être au moins 1');
        return;
      }
    } else {
      if (!form.start_time || !form.end_time) {
        setError('Veuillez sélectionner l\'heure de début et de fin');
        return;
      }
    }

    if (form.attendees_count < 1) {
      setError('Le nombre de personnes doit être au moins 1');
      return;
    }

    if (!user?.id) {
      setError('Vous devez être connecté pour effectuer une réservation');
      return;
    }

    // Ouvrir le modal récapitulatif au lieu de créer directement
    setShowSummaryModal(true);
  };

  const createReservationAsDraft = async () => {
    if (!selectedSpace || !user?.id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload: ReservationCreatePayload = {
        space: selectedSpace.id,
        date: form.date,
        event_name: form.event_name,
        attendees_count: form.attendees_count,
        options: form.selectedOptions,
        option_quantities: Object.keys(form.optionQuantities).length > 0 ? form.optionQuantities : undefined,
        is_active: true,
      };

      if (selectedSpace.category === 'appartement') {
        payload.nbr_nights = form.nbr_nights;
        payload.start_time = undefined;
        payload.end_time = undefined;
      } else {
        payload.start_time = form.start_time;
        payload.end_time = form.end_time;
        payload.nbr_nights = undefined;
      }

      // Créer la réservation en statut draft
      const reservation = await ReservationService.createReservation(payload);
      
      // Mettre à jour le statut en draft
      await ReservationService.updateReservationStatus(reservation.id, 'draft');
      
      setCreatedReservation(reservation);
      setShowSummaryModal(false);
      toast.success('Réservation créée en brouillon !');
      router.push(`/dashboard?tab=reservations`);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création de la réservation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeReservation = async () => {
    if (!selectedSpace || !user?.id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload: ReservationCreatePayload = {
        space: selectedSpace.id,
        date: form.date,
        event_name: form.event_name,
        attendees_count: form.attendees_count,
        options: form.selectedOptions,
        option_quantities: Object.keys(form.optionQuantities).length > 0 ? form.optionQuantities : undefined,
        is_active: true,
      };

      if (selectedSpace.category === 'appartement') {
        payload.nbr_nights = form.nbr_nights;
        payload.start_time = undefined;
        payload.end_time = undefined;
      } else {
        payload.start_time = form.start_time;
        payload.end_time = form.end_time;
        payload.nbr_nights = undefined;
      }

      // Créer la réservation
      const reservation = await ReservationService.createReservation(payload);
      setCreatedReservation(reservation);
      setShowSummaryModal(false);
      
      // Ouvrir le modal de paiement
      setShowPaymentModal(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création de la réservation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Réservation finalisée avec succès !');
    router.push(`/dashboard?tab=reservations`);
  };

  const getSpaceIcon = (category: string) => {
    switch (category) {
      case 'bureau':
        return Building;
      case 'salle':
        return Monitor;
      case 'appartement':
        return House;
      default:
        return Sparkles;
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  return (
    <div className="space-y-6">
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Nouvelle réservation" />
            <ToolbarDescription>
              Sélectionnez un espace et remplissez les informations pour créer votre réservation
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des espaces */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Sélectionner un espace</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {spaces.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Aucun espace disponible</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {spaces.map((space) => {
                      const Icon = getSpaceIcon(space.category);
                      const isSelected = selectedSpace?.id === space.id;
                      const spaceImage = space.images && space.images.length > 0 ? space.images[0] : null;

                      return (
                        <button
                          key={space.id}
                          onClick={() => handleSelectSpace(space)}
                          className={cn(
                            'w-full text-left transition-all relative',
                            isSelected && 'bg-primary/5'
                          )}
                        >
                          <div className="p-0">
                            {/* CardHeader avec image */}
                            {spaceImage ? (
                              <div
                                className={cn(
                                  'h-32 bg-cover bg-center bg-no-repeat relative',
                                  isSelected && 'ring-2 ring-primary ring-offset-2'
                                )}
                                style={{
                                  backgroundImage: `url(${spaceImage})`,
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                  <h4 className="font-semibold text-sm text-white mb-1">{space.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" size="sm" className="bg-white/90 text-foreground">
                                      {space.category}
                                    </Badge>
                                    {isSelected && (
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  'h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative',
                                  isSelected && 'ring-2 ring-primary ring-offset-2'
                                )}
                              >
                                <HexagonBadge
                                  stroke="stroke-primary"
                                  fill="fill-primary/20"
                                  size="size-[60px]"
                                  badge={<Icon className="text-2xl text-primary" />}
                                />
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                              </div>
                            )}
                            {/* CardContent avec détails */}
                            <div className="p-4">
                              {!spaceImage && (
                                <h4 className="font-semibold text-sm mb-2">{space.name}</h4>
                              )}
                              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                {space.description}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{space.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>Capacité: {space.capacity} personnes</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs font-medium text-primary">
                                    {space.category === 'appartement'
                                      ? `${space.price_full_day.toLocaleString('fr-FR')} XOF/jour`
                                      : `À partir de ${space.price_hour.toLocaleString('fr-FR')} XOF/h`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de réservation */}
          <div className="lg:col-span-2">
            {!selectedSpace ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Veuillez sélectionner un espace pour commencer
                  </p>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de la réservation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="event_name">Nom de l'événement *</Label>
                      <Input
                        id="event_name"
                        value={form.event_name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, event_name: e.target.value }))
                        }
                        placeholder="Ex: Réunion d'équipe"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              mode="input"
                              variant="outline"
                              id="date"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !form.date && 'text-muted-foreground',
                              )}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {form.date ? (
                                format(new Date(form.date), 'dd MMM yyyy')
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form.date ? new Date(form.date) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setForm((prev) => ({
                                    ...prev,
                                    date: format(date, 'yyyy-MM-dd'),
                                  }));
                                }
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="attendees_count">Nombre de personnes *</Label>
                        <Input
                          id="attendees_count"
                          type="number"
                          min="1"
                          max={selectedSpace.capacity}
                          value={form.attendees_count}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              attendees_count: parseInt(e.target.value) || 1,
                            }))
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Capacité max: {selectedSpace.capacity} personnes
                        </p>
                      </div>
                    </div>

                    {selectedSpace.category === 'appartement' ? (
                      <div className="space-y-2">
                        <Label htmlFor="nbr_nights">Nombre de nuits *</Label>
                        <Input
                          id="nbr_nights"
                          type="number"
                          min="1"
                          value={form.nbr_nights}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              nbr_nights: parseInt(e.target.value) || 1,
                            }))
                          }
                          required
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_time">Heure de début *</Label>
                          <TimePickerInput
                            id="start_time"
                            value={form.start_time}
                            onChange={(value) =>
                              setForm((prev) => ({ ...prev, start_time: value }))
                            }
                            placeholder="Sélectionner l'heure de début"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_time">Heure de fin *</Label>
                          <TimePickerInput
                            id="end_time"
                            value={form.end_time}
                            onChange={(value) =>
                              setForm((prev) => ({ ...prev, end_time: value }))
                            }
                            placeholder="Sélectionner l'heure de fin"
                            minTime={form.start_time}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Options */}
                {selectedSpace.options.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Options disponibles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {selectedSpace.options.map((option) => {
                          const isSelected = form.selectedOptions.includes(option.id);
                          const quantity = form.optionQuantities[option.id] || 1;
                          const OptionIcon = option.icon
                            ? ICON_MAP[option.icon] || Sparkles
                            : Sparkles;

                          return (
                            <div
                              key={option.id}
                              className={cn(
                                'p-4 transition-all cursor-pointer',
                                isSelected && 'bg-primary/5'
                              )}
                              onClick={() => handleOptionToggle(option.id)}
                            >
                              <div className="flex items-start gap-4">
                                <HexagonBadge
                                  stroke={isSelected ? 'stroke-primary' : 'stroke-muted-foreground'}
                                  fill={isSelected ? 'fill-primary/20' : 'fill-muted/20'}
                                  size="size-[48px]"
                                  badge={<OptionIcon className="text-lg text-foreground" />}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <label
                                        htmlFor={`option-${option.id}`}
                                        className="font-medium cursor-pointer block mb-1"
                                      >
                                        {option.name}
                                      </label>
                                      {option.option_type === 'variable' && isSelected && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <Label htmlFor={`quantity-${option.id}`} className="text-xs">
                                            Quantité:
                                          </Label>
                                          <Input
                                            id={`quantity-${option.id}`}
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleOptionQuantityChange(
                                                option.id,
                                                parseInt(e.target.value) || 1,
                                              );
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-20 h-8"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-semibold text-primary text-sm">
                                        {option.price.toLocaleString('fr-FR')} XOF
                                        {option.option_type === 'variable' && isSelected
                                          ? ` × ${quantity} = ${(option.price * quantity).toLocaleString('fr-FR')} XOF`
                                          : ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    id={`option-${option.id}`}
                                    checked={isSelected}
                                    onChange={() => handleOptionToggle(option.id)}
                                    className="mt-1"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Récapitulatif */}
                <Card>
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Espace:</span>
                        <span className="font-medium">{selectedSpace.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {form.date
                            ? new Date(form.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>
                      {selectedSpace.category === 'appartement' ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nombre de nuits:</span>
                          <span className="font-medium">{form.nbr_nights}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Horaire:</span>
                          <span className="font-medium">
                            {form.start_time && form.end_time
                              ? `${form.start_time} - ${form.end_time}`
                              : '-'}
                          </span>
                        </div>
                      )}
                      {form.selectedOptions.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Options:</span>
                          <span className="font-medium">{form.selectedOptions.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          {calculatePrice().toLocaleString('fr-FR')} XOF
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard">Annuler</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer la réservation'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>

      {/* Modal récapitulatif */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Récapitulatif de la réservation</DialogTitle>
            <DialogDescription>
              Vérifiez les détails de votre réservation avant de finaliser
            </DialogDescription>
          </DialogHeader>

          {selectedSpace && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Espace</Label>
                  <p className="font-medium">{selectedSpace.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Localisation</Label>
                  <p className="font-medium">{selectedSpace.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Événement</Label>
                  <p className="font-medium">{form.event_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Participants</Label>
                  <p className="font-medium">{form.attendees_count} personne(s)</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {form.date
                      ? new Date(form.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                {selectedSpace.category === 'appartement' ? (
                  <div>
                    <Label className="text-muted-foreground">Nombre de nuits</Label>
                    <p className="font-medium">{form.nbr_nights} nuit(s)</p>
                  </div>
                ) : (
                  <div>
                    <Label className="text-muted-foreground">Horaire</Label>
                    <p className="font-medium">
                      {form.start_time && form.end_time
                        ? `${form.start_time} - ${form.end_time}`
                        : '-'}
                    </p>
                  </div>
                )}
              </div>

              {form.selectedOptions.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Options sélectionnées</Label>
                  <div className="mt-2 space-y-2">
                    {form.selectedOptions.map((optionId) => {
                      const option = selectedSpace.options.find((opt) => opt.id === optionId);
                      if (!option) return null;
                      const quantity = form.optionQuantities[optionId] || 1;
                      return (
                        <div key={optionId} className="flex justify-between items-center">
                          <span className="text-sm">
                            {option.name}
                            {option.option_type === 'variable' && ` x${quantity}`}
                          </span>
                          <span className="text-sm font-medium">
                            {option.option_type === 'variable'
                              ? (option.price * quantity).toLocaleString('fr-FR')
                              : option.price.toLocaleString('fr-FR')}{' '}
                            XOF
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {calculatePrice().toLocaleString('fr-FR')} XOF
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={createReservationAsDraft}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Payer plus tard'
              )}
            </Button>
            <Button
              type="button"
              onClick={finalizeReservation}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalisation...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finaliser la réservation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de paiement FeexPay */}
      {createdReservation && userProfile && (
        <FeexPayPayment
          reservationId={createdReservation.id}
          reservationTotal={createdReservation.total_price || calculatePrice()}
          customerEmail={userProfile.email}
          customerName={`${userProfile.first_name} ${userProfile.last_name}`.trim()}
          customerPhone={userProfile.phone}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setCreatedReservation(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

