'use client';

import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarPageTitle,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash,
  Download,
  MoreVertical,
  Filter,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ReservationService, type Reservation, type ReservationUpdatePayload } from '@/lib/services/reservations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HexagonBadge } from '@/partials/common/hexagon-badge';
import { cn } from '@/lib/utils';
import { FeexPayPayment } from './feexpay-payment';
import { ProfileService, type UserProfile } from '@/lib/services/profile';
import { CreditCard as CreditCardIcon } from 'lucide-react';

// Types importés depuis le service

interface EditForm {
  event_name: string;
  attendees_count: number;
  date: string;
  start_time: string;
  end_time: string;
  nbr_nights?: number;
  options: number[];
}

export default function Reservations() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    event_name: '',
    attendees_count: 0,
    date: '',
    start_time: '',
    end_time: '',
    nbr_nights: 1,
    options: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReservation, setPaymentReservation] = useState<Reservation | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refundToWallet, setRefundToWallet] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await ReservationService.getMyReservations();
      // getMyReservations retourne un ReservationListResponse avec results ou data
      const reservationsList = response.results || response.data || [];
      setReservations(Array.isArray(reservationsList) ? reservationsList : []);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      toast.error('Erreur lors du chargement des réservations');
      setReservations([]); // S'assurer que reservations est toujours un tableau
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await ProfileService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.space_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'paid' && reservation.status === 'paid') ||
      (activeFilter === 'draft' && reservation.status === 'draft') ||
      (activeFilter === 'cancelled' && reservation.status === 'cancelled');

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReservations = filteredReservations.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const filters = [
    { id: 'all', label: 'Toutes', count: reservations.length },
    {
      id: 'paid',
      label: 'Payées',
      count: reservations.filter((r) => r.status === 'paid').length,
    },
    {
      id: 'draft',
      label: 'Brouillons',
      count: reservations.filter((r) => r.status === 'draft').length,
    },
    {
      id: 'cancelled',
      label: 'Annulées',
      count: reservations.filter((r) => r.status === 'cancelled').length,
    },
  ];

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowViewModal(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditForm({
      event_name: reservation.event_name,
      attendees_count: reservation.attendees_count,
      date: reservation.date,
      start_time: reservation.start_time || '',
      end_time: reservation.end_time || '',
      nbr_nights: reservation.nbr_nights || 1,
      options: reservation.reservation_options
        ? reservation.reservation_options.map((opt) => opt.id)
        : [],
    });
    setError('');
    setShowEditModal(true);
  };

  const handleDelete = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setError('');
    setRefundToWallet(false); // Réinitialiser la checkbox
    setShowDeleteModal(true);
  };

  const handlePay = (reservation: Reservation) => {
    setPaymentReservation(reservation);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    fetchReservations();
    setShowPaymentModal(false);
    setPaymentReservation(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload: ReservationUpdatePayload = {
        space: selectedReservation.space_id,
        date: editForm.date,
        event_name: editForm.event_name,
        attendees_count: editForm.attendees_count,
        is_active: selectedReservation.is_active,
        options: editForm.options,
      };

      if (selectedReservation.space_category === 'appartement') {
        payload.nbr_nights = editForm.nbr_nights || 1;
        payload.start_time = null;
        payload.end_time = null;
      } else {
        payload.start_time = editForm.start_time;
        payload.end_time = editForm.end_time;
        payload.nbr_nights = null;
      }

      await ReservationService.updateReservation(selectedReservation.id, payload);
      toast.success('Réservation modifiée avec succès');
      fetchReservations();
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReservation) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Si la réservation est payée et que l'utilisateur veut un remboursement
      if (selectedReservation.status === 'paid' && refundToWallet) {
        const { apiFetch } = await import('@/lib/api');
        const response = await apiFetch(`/api/reservations/${selectedReservation.id}/cancel-with-refund/`, {
          method: 'POST',
          body: JSON.stringify({
            refund_to_wallet: true,
          }),
        });

        if (response.response?.ok && response.data) {
          const data = response.data.data || response.data;
          if (data.success) {
            if (data.refunded) {
              toast.success(`Réservation annulée. Remboursement de ${data.refund_amount.toLocaleString('fr-FR')} XOF crédité sur votre portefeuille`);
            } else {
              toast.success('Réservation annulée avec succès');
            }
            fetchReservations();
            setShowDeleteModal(false);
            setRefundToWallet(false);
            return;
          } else {
            setError(data.error || 'Erreur lors de l\'annulation');
            return;
          }
        } else {
          const errorData = response.data?.data || response.data;
          setError(errorData?.error || 'Erreur lors de l\'annulation');
          return;
        }
      } else {
        // Annulation simple sans remboursement
      await ReservationService.deleteReservation(selectedReservation.id);
      toast.success('Réservation annulée avec succès');
      fetchReservations();
      setShowDeleteModal(false);
        setRefundToWallet(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (reservation: Reservation) => {
    if (!reservation.invoice?.id) {
      toast.error('Aucune facture disponible pour cette réservation');
      return;
    }

    setDownloadingInvoice(reservation.id);

    try {
      const blob = await ReservationService.downloadInvoice(reservation.invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `facture-${reservation.invoice.invoice_number || reservation.invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Facture téléchargée avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getCancellationInfo = (reservation: Reservation) => {
    const now = new Date();
    const reservationDate = new Date(`${reservation.date}T${reservation.start_time || '00:00'}`);
    const diffMs = reservationDate.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs >= 72) {
      return { fee: 0, message: 'Annulation avant 72h : aucun frais.' };
    } else if (diffHrs > 0) {
      return { fee: 0.1, message: 'Annulation à moins de 72h : 10% du montant sera prélevé.' };
    } else {
      return { fee: 1, message: 'Réservation passée, annulation impossible.' };
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="success" className="bg-green-500/10 text-green-700 border-green-500/20">
            Payée
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="warning" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
            Brouillon
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">Annulée</Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Container>
    );
  }

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Mes réservations" />
            <ToolbarDescription>
              Gérez vos réservations d'espaces de coworking
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button asChild>
              <Link href="/booking">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle réservation
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {/* Statistiques avec HexagonBadge */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
          {filters.map((filter) => {
            const getFilterIcon = () => {
              switch (filter.id) {
                case 'paid':
                  return CreditCard;
                case 'draft':
                  return AlertCircle;
                case 'cancelled':
                  return Trash;
                default:
                  return Calendar;
              }
            };
            const FilterIcon = getFilterIcon();
            const isActive = activeFilter === filter.id;

            return (
              <Card
                key={filter.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  isActive && 'ring-2 ring-primary'
                )}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setCurrentPage(1);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3.5">
                    <HexagonBadge
                      stroke={isActive ? 'stroke-primary' : 'stroke-input'}
                      fill={isActive ? 'fill-primary/20' : 'fill-muted/30'}
                      size="size-[50px]"
                      badge={<FilterIcon className="text-xl text-foreground" />}
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className="leading-none font-medium text-sm text-foreground">
                        {filter.label}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        {filter.count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recherche */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Rechercher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une réservation..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des réservations */}
        {currentReservations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm || activeFilter !== 'all'
                  ? 'Aucune réservation ne correspond à vos critères'
                  : 'Aucune réservation pour le moment'}
              </p>
              {!searchTerm && activeFilter === 'all' && (
                <Button asChild>
                  <Link href="/booking">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une réservation
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {currentReservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3.5">
                      <HexagonBadge
                        stroke="stroke-input"
                        fill="fill-muted/30"
                        size="size-[50px]"
                        badge={
                          <span className="text-xs font-semibold text-foreground">
                            #{String(reservation.id).slice(-4)}
                          </span>
                        }
                      />
                      <div className="flex flex-col gap-1.5">
                        <CardTitle className="text-base leading-none">{reservation.event_name}</CardTitle>
                        <span className="text-sm text-secondary-foreground">
                          {reservation.space_name} • {reservation.space_category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(reservation.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(reservation)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          {reservation.status === 'paid' && reservation.invoice && (
                            <DropdownMenuItem
                              onClick={() => handleDownloadInvoice(reservation)}
                              disabled={downloadingInvoice === reservation.id}
                            >
                              {downloadingInvoice === reservation.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Télécharger la facture
                            </DropdownMenuItem>
                          )}
                          {(reservation.status === 'draft' || reservation.status === 'pending') && (
                            <DropdownMenuItem onClick={() => handlePay(reservation)}>
                              <CreditCardIcon className="h-4 w-4 mr-2" />
                              Payer
                            </DropdownMenuItem>
                          )}
                          {reservation.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleEdit(reservation)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {reservation.status !== 'cancelled' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(reservation)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="flex items-center gap-2">
                      <HexagonBadge
                        stroke="stroke-input"
                        fill="fill-muted/30"
                        size="size-[28px]"
                        badge={<Calendar className="text-[10px] text-muted-foreground" />}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="leading-none font-medium text-[9px] text-foreground uppercase tracking-wide">
                          Date
                        </span>
                        <span className="text-[11px] text-secondary-foreground">
                          {formatDate(reservation.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <HexagonBadge
                        stroke="stroke-input"
                        fill="fill-muted/30"
                        size="size-[28px]"
                        badge={<Clock className="text-[10px] text-muted-foreground" />}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="leading-none font-medium text-[9px] text-foreground uppercase tracking-wide">
                          Horaire
                        </span>
                        <span className="text-[11px] text-secondary-foreground">
                          {reservation.space_category === 'appartement'
                            ? `${reservation.nbr_nights || 1} Nuit(s)`
                            : `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <HexagonBadge
                        stroke="stroke-input"
                        fill="fill-muted/30"
                        size="size-[28px]"
                        badge={<MapPin className="text-[10px] text-muted-foreground" />}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="leading-none font-medium text-[9px] text-foreground uppercase tracking-wide">
                          Localisation
                        </span>
                        <span className="text-[11px] text-secondary-foreground line-clamp-1">
                          {reservation.space_location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <HexagonBadge
                        stroke="stroke-input"
                        fill="fill-muted/30"
                        size="size-[28px]"
                        badge={<Users className="text-[10px] text-muted-foreground" />}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="leading-none font-medium text-[9px] text-foreground uppercase tracking-wide">
                          Participants
                        </span>
                        <span className="text-[11px] text-secondary-foreground">
                          {reservation.attendees_count} personnes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <HexagonBadge
                        stroke="stroke-input"
                        fill="fill-muted/30"
                        size="size-[28px]"
                        badge={<CreditCard className="text-[10px] text-muted-foreground" />}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="leading-none font-medium text-[9px] text-foreground uppercase tracking-wide">
                          Montant
                        </span>
                        <span className="text-[11px] font-semibold text-foreground">
                          {reservation.total_price.toLocaleString('fr-FR')} XOF
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>

      {/* Modal de détails */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
            <DialogDescription>
              Informations complètes sur votre réservation
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3.5">
                    <HexagonBadge
                      stroke="stroke-input"
                      fill="fill-muted/30"
                      size="size-[50px]"
                      badge={<Calendar className="text-xl text-muted-foreground" />}
                    />
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="text-base leading-none">{selectedReservation.event_name}</CardTitle>
                      <span className="text-sm text-secondary-foreground">
                        {selectedReservation.space_name} • {selectedReservation.space_category}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[40px]"
                          badge={<Calendar className="text-lg text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Date
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            {formatDate(selectedReservation.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[40px]"
                          badge={<Clock className="text-lg text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            {selectedReservation.space_category === 'appartement'
                              ? 'Nombre de nuits'
                              : 'Horaire'}
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            {selectedReservation.space_category === 'appartement'
                              ? `${selectedReservation.nbr_nights || 1} Nuit(s)`
                              : `${formatTime(selectedReservation.start_time)} - ${formatTime(selectedReservation.end_time)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[40px]"
                          badge={<MapPin className="text-lg text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Localisation
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            {selectedReservation.space_location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[40px]"
                          badge={<Users className="text-lg text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Participants
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            {selectedReservation.attendees_count} personnes
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedReservation.reservation_options &&
                      selectedReservation.reservation_options.length > 0 && (
                        <div className="border-b border-border py-4 px-6">
                          <div className="mb-3">
                            <span className="leading-none font-medium text-sm text-foreground">
                              Options choisies
                            </span>
                          </div>
                          <div className="space-y-2">
                            {selectedReservation.reservation_options.map((opt, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
                              >
                                <span className="text-sm text-foreground">{opt.name}</span>
                                <span className="text-sm font-medium text-foreground">
                                  {opt.price.toLocaleString('fr-FR')} XOF
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[40px]"
                          badge={<CreditCard className="text-lg text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Montant total
                          </span>
                          <span className="text-xl font-semibold text-foreground">
                            {selectedReservation.total_price.toLocaleString('fr-FR')} XOF
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre réservation
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="event_name">Nom de l'événement</Label>
                <Input
                  id="event_name"
                  value={editForm.event_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, event_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees_count">Nombre de personnes</Label>
                  <Input
                    id="attendees_count"
                    type="number"
                    min="1"
                    value={editForm.attendees_count}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        attendees_count: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {selectedReservation.space_category === 'appartement' ? (
                <div className="space-y-2">
                  <Label htmlFor="nbr_nights">Nombre de nuits</Label>
                  <Input
                    id="nbr_nights"
                    type="number"
                    min="1"
                    value={editForm.nbr_nights || 1}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        nbr_nights: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Heure de début</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Heure de fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ?
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                Êtes-vous sûr de vouloir annuler la réservation de{' '}
                <span className="font-medium">{selectedReservation.space_name}</span> le{' '}
                <span className="font-medium">{formatDate(selectedReservation.date)}</span> ?
              </p>

              {(() => {
                const { fee, message } = getCancellationInfo(selectedReservation);
                return (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                );
              })()}

              {/* Option de remboursement pour les réservations payées */}
              {selectedReservation.status === 'paid' && !selectedReservation.is_refunded && (
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
                  <Checkbox
                    id="refund-wallet"
                    checked={refundToWallet}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setRefundToWallet(checked === true)}
                    disabled={isSubmitting}
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="refund-wallet" className="text-sm font-medium cursor-pointer">
                      Rembourser sur mon portefeuille
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Si vous choisissez cette option, {(() => {
                        const refundAmount = selectedReservation.total_price * 0.80;
                        return `${refundAmount.toLocaleString('fr-FR')} XOF`;
                      })()} sera crédité sur votre portefeuille (20% de frais déduits).
                    </p>
                  </div>
                </div>
              )}

              {selectedReservation.status === 'paid' && selectedReservation.is_refunded && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cette réservation a déjà été remboursée.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Annulation...
                    </>
                  ) : (
                    "Confirmer l'annulation"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de paiement FeexPay */}
      {paymentReservation && userProfile && (
        <FeexPayPayment
          reservationId={paymentReservation.id}
          reservationTotal={paymentReservation.total_price}
          customerEmail={userProfile.email}
          customerName={`${userProfile.first_name} ${userProfile.last_name}`.trim()}
          customerPhone={userProfile.phone}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentReservation(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Fragment>
  );
}
