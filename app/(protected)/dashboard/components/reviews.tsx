'use client';

import { Fragment, useState, useEffect } from 'react';
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
  Star,
  Plus,
  Search,
  Pencil,
  Trash,
  Filter,
  AlertCircle,
  Loader2,
  MessageSquare,
  CheckCircle,
  XCircle,
  EyeOff,
} from 'lucide-react';
import { ReviewService } from '@/lib/services/reviews';
import { ReservationService, type Reservation } from '@/lib/services/reservations';
import type { Review, ReviewCreatePayload } from '@/types/reviews';
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
import { StarRating } from '@/components/ui/star-rating';
import { ReviewCard } from '@/components/common/review-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReviewForm {
  space: number;
  reservation?: number | null;
  overall_rating: number;
  cleanliness_rating?: number | null;
  comfort_rating?: number | null;
  value_rating?: number | null;
  service_rating?: number | null;
  comment: string;
  is_anonymous: boolean;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [availableReservations, setAvailableReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    space: 0,
    reservation: null,
    overall_rating: 0,
    cleanliness_rating: null,
    comfort_rating: null,
    value_rating: null,
    service_rating: null,
    comment: '',
    is_anonymous: false,
  });
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await ReviewService.getMyReviews({
        status: activeFilter !== 'all' ? (activeFilter as any) : undefined,
        sort: '-created_at',
      });
      const reviewsList = response.results || [];
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des avis:', error);
      toast.error(error.message || 'Erreur lors du chargement des avis');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableReservations = async () => {
    try {
      setLoadingReservations(true);
      const response = await ReservationService.getMyReservations({
        status: 'paid',
      });
      const reservationsList = response.results || response.data || [];
      
      // Filtrer uniquement les réservations payées
      const paidReservations = Array.isArray(reservationsList)
        ? reservationsList.filter((r) => r.status === 'paid')
        : [];
      
      // Normaliser les réservations pour s'assurer que space_id existe
      const normalizedReservations = paidReservations.map((r) => {
        // Si space_id n'existe pas mais space existe (objet ou ID)
        if (!r.space_id && (r as any).space) {
          const spaceField = (r as any).space;
          return {
            ...r,
            space_id: typeof spaceField === 'object' ? String(spaceField.id) : String(spaceField),
          };
        }
        return r;
      });
      
      setAvailableReservations(normalizedReservations);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      toast.error('Erreur lors du chargement des réservations');
      setAvailableReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeFilter]);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      fetchAvailableReservations();
    }
  }, [showCreateModal, showEditModal]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.space_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReviews = filteredReviews.slice(startIndex, startIndex + itemsPerPage);

  const filters = [
    { id: 'all', label: 'Tous', count: reviews.length, icon: MessageSquare },
    {
      id: 'approved',
      label: 'Approuvés',
      count: reviews.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
    },
    {
      id: 'pending',
      label: 'En attente',
      count: reviews.filter((r) => r.status === 'pending').length,
      icon: AlertCircle,
    },
    {
      id: 'rejected',
      label: 'Rejetés',
      count: reviews.filter((r) => r.status === 'rejected').length,
      icon: XCircle,
    },
  ];

  const handleCreate = () => {
    setReviewForm({
      space: 0,
      reservation: null,
      overall_rating: 0,
      cleanliness_rating: null,
      comfort_rating: null,
      value_rating: null,
      service_rating: null,
      comment: '',
      is_anonymous: false,
    });
    setShowDetailedRatings(false);
    setError('');
    setShowCreateModal(true);
  };

  const handleEdit = (review: Review) => {
    setSelectedReview(review);
    setReviewForm({
      space: review.space,
      reservation: review.reservation || null,
      overall_rating: review.overall_rating,
      cleanliness_rating: review.cleanliness_rating || null,
      comfort_rating: review.comfort_rating || null,
      value_rating: review.value_rating || null,
      service_rating: review.service_rating || null,
      comment: review.comment || '',
      is_anonymous: review.is_anonymous,
    });
    setShowDetailedRatings(
      !!(review.cleanliness_rating || review.comfort_rating || review.value_rating || review.service_rating)
    );
    setError('');
    setShowEditModal(true);
  };

  const handleDelete = (review: Review) => {
    setSelectedReview(review);
    setError('');
    setShowDeleteModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation améliorée avec messages spécifiques
    if (!reviewForm.space || reviewForm.space === 0) {
      setError('Veuillez sélectionner une réservation (qui sélectionnera automatiquement l\'espace)');
      return;
    }
    
    if (!reviewForm.overall_rating || reviewForm.overall_rating === 0) {
      setError('Veuillez donner une note globale (1 à 5 étoiles)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: ReviewCreatePayload = {
        space: reviewForm.space,
        reservation: reviewForm.reservation || undefined,
        overall_rating: reviewForm.overall_rating,
        comment: reviewForm.comment,
        is_anonymous: reviewForm.is_anonymous,
      };

      // Ajouter les notes détaillées si au moins une est fournie
      if (showDetailedRatings) {
        if (reviewForm.cleanliness_rating) payload.cleanliness_rating = reviewForm.cleanliness_rating;
        if (reviewForm.comfort_rating) payload.comfort_rating = reviewForm.comfort_rating;
        if (reviewForm.value_rating) payload.value_rating = reviewForm.value_rating;
        if (reviewForm.service_rating) payload.service_rating = reviewForm.service_rating;
      }

      await ReviewService.createReview(payload);
      toast.success('Votre avis a été soumis et sera examiné par notre équipe');
      fetchReviews();
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'avis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || reviewForm.overall_rating === 0) {
      setError('Veuillez donner une note globale');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: ReviewCreatePayload = {
        space: reviewForm.space,
        reservation: reviewForm.reservation || undefined,
        overall_rating: reviewForm.overall_rating,
        comment: reviewForm.comment,
        is_anonymous: reviewForm.is_anonymous,
      };

      if (showDetailedRatings) {
        if (reviewForm.cleanliness_rating) payload.cleanliness_rating = reviewForm.cleanliness_rating;
        if (reviewForm.comfort_rating) payload.comfort_rating = reviewForm.comfort_rating;
        if (reviewForm.value_rating) payload.value_rating = reviewForm.value_rating;
        if (reviewForm.service_rating) payload.service_rating = reviewForm.service_rating;
      }

      await ReviewService.updateReview(selectedReview.id, payload);
      toast.success('Avis modifié avec succès');
      fetchReviews();
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification de l\'avis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReview) return;

    setIsSubmitting(true);
    setError('');

    try {
      await ReviewService.deleteReview(selectedReview.id);
      toast.success('Avis supprimé avec succès');
      fetchReviews();
      setShowDeleteModal(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de l\'avis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReservationChange = (reservationId: string) => {
    const reservation = availableReservations.find((r) => String(r.id) === String(reservationId));
    
    if (reservation) {
      // Vérifier si space_id existe, sinon essayer d'autres champs possibles
      let spaceIdValue = reservation.space_id;
      
      // Si space_id est undefined, vérifier s'il y a un champ 'space' (objet ou ID)
      if (!spaceIdValue && (reservation as any).space) {
        const spaceField = (reservation as any).space;
        spaceIdValue = typeof spaceField === 'object' ? spaceField.id : spaceField;
      }
      
      if (!spaceIdValue) {
        setError(`Erreur: impossible de déterminer l'espace pour cette réservation. Veuillez sélectionner un espace manuellement.`);
        return;
      }
      
      const spaceId = parseInt(String(spaceIdValue), 10);
      const reservationIdNum = parseInt(reservationId, 10);
      
      if (isNaN(spaceId)) {
        setError(`Erreur: l'ID de l'espace (${spaceIdValue}) n'est pas valide. Veuillez sélectionner un espace manuellement.`);
        return;
      }
      
      // Utiliser une fonction de callback pour garantir la mise à jour du state
      setReviewForm((prevForm) => ({
        ...prevForm,
        reservation: reservationIdNum,
        space: spaceId,
      }));
      
      // Effacer l'erreur précédente si tout s'est bien passé
      setError('');
    } else {
      setError('Réservation non trouvée');
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
            <ToolbarPageTitle text="Mes avis" />
            <ToolbarDescription>
              Gérez vos avis et témoignages sur nos espaces
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Laisser un avis
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {/* Statistiques avec HexagonBadge */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
          {filters.map((filter) => {
            const FilterIcon = filter.icon;
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
                placeholder="Rechercher un avis..."
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

        {/* Liste des avis */}
        {currentReviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm || activeFilter !== 'all'
                  ? 'Aucun avis ne correspond à vos critères'
                  : 'Aucun avis pour le moment'}
              </p>
              {!searchTerm && activeFilter === 'all' && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Laisser un avis
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {currentReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showSpaceInfo={true}
              />
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

      {/* Modal de création */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laisser un avis</DialogTitle>
            <DialogDescription>
              Partagez votre expérience avec notre communauté
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Sélection de réservation */}
            <div className="space-y-2">
              <Label htmlFor="reservation">Réservation (optionnel mais recommandé)</Label>
              <Select
                value={reviewForm.reservation ? String(reviewForm.reservation) : undefined}
                onValueChange={handleReservationChange}
                disabled={loadingReservations}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingReservations ? 'Chargement...' : 'Sélectionner une réservation'} />
                </SelectTrigger>
                <SelectContent>
                  {availableReservations.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucune réservation payée disponible
                    </SelectItem>
                  ) : (
                    availableReservations.map((reservation) => (
                      <SelectItem key={reservation.id} value={String(reservation.id)}>
                        {reservation.event_name || 'Réservation'} - {reservation.space_name} - {formatDate(reservation.date)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {reviewForm.space > 0 && (
                <p className="text-xs text-muted-foreground">
                  Espace sélectionné automatiquement depuis la réservation (ID: {reviewForm.space})
                </p>
              )}
            </div>

            {/* Note globale */}
            <div className="space-y-2">
              <Label>Note globale *</Label>
              <StarRating
                rating={reviewForm.overall_rating}
                readOnly={false}
                size="lg"
                onRatingChange={(rating) =>
                  setReviewForm({ ...reviewForm, overall_rating: rating })
                }
                showValue
              />
            </div>

            {/* Notes détaillées (optionnelles) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Notes détaillées (optionnelles)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                >
                  {showDetailedRatings ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
              {showDetailedRatings && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
                  <div className="space-y-2">
                    <Label className="text-xs">Propreté</Label>
                    <StarRating
                      rating={reviewForm.cleanliness_rating || 0}
                      readOnly={false}
                      size="md"
                      onRatingChange={(rating) =>
                        setReviewForm({ ...reviewForm, cleanliness_rating: rating })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Confort</Label>
                    <StarRating
                      rating={reviewForm.comfort_rating || 0}
                      readOnly={false}
                      size="md"
                      onRatingChange={(rating) =>
                        setReviewForm({ ...reviewForm, comfort_rating: rating })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Qualité/prix</Label>
                    <StarRating
                      rating={reviewForm.value_rating || 0}
                      readOnly={false}
                      size="md"
                      onRatingChange={(rating) =>
                        setReviewForm({ ...reviewForm, value_rating: rating })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Service</Label>
                    <StarRating
                      rating={reviewForm.service_rating || 0}
                      readOnly={false}
                      size="md"
                      onRatingChange={(rating) =>
                        setReviewForm({ ...reviewForm, service_rating: rating })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea
                id="comment"
                placeholder="Partagez votre expérience..."
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {reviewForm.comment.length}/2000 caractères
              </p>
            </div>

            {/* Option anonyme */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="is_anonymous"
                checked={reviewForm.is_anonymous}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setReviewForm({ ...reviewForm, is_anonymous: checked === true })
                }
              />
              <div className="flex-1">
                <Label htmlFor="is_anonymous" className="text-sm font-medium cursor-pointer">
                  Publier de manière anonyme
                </Label>
                <p className="text-xs text-muted-foreground">
                  Votre nom ne sera pas affiché publiquement
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || reviewForm.overall_rating === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Soumettre l\'avis'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'avis</DialogTitle>
            <DialogDescription>
              Modifiez votre avis
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Note globale */}
              <div className="space-y-2">
                <Label>Note globale *</Label>
                <StarRating
                  rating={reviewForm.overall_rating}
                  readOnly={false}
                  size="lg"
                  onRatingChange={(rating) =>
                    setReviewForm({ ...reviewForm, overall_rating: rating })
                  }
                  showValue
                />
              </div>

              {/* Notes détaillées */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Notes détaillées (optionnelles)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                  >
                    {showDetailedRatings ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
                {showDetailedRatings && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
                    <div className="space-y-2">
                      <Label className="text-xs">Propreté</Label>
                      <StarRating
                        rating={reviewForm.cleanliness_rating || 0}
                        readOnly={false}
                        size="md"
                        onRatingChange={(rating) =>
                          setReviewForm({ ...reviewForm, cleanliness_rating: rating })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Confort</Label>
                      <StarRating
                        rating={reviewForm.comfort_rating || 0}
                        readOnly={false}
                        size="md"
                        onRatingChange={(rating) =>
                          setReviewForm({ ...reviewForm, comfort_rating: rating })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Qualité/prix</Label>
                      <StarRating
                        rating={reviewForm.value_rating || 0}
                        readOnly={false}
                        size="md"
                        onRatingChange={(rating) =>
                          setReviewForm({ ...reviewForm, value_rating: rating })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Service</Label>
                      <StarRating
                        rating={reviewForm.service_rating || 0}
                        readOnly={false}
                        size="md"
                        onRatingChange={(rating) =>
                          setReviewForm({ ...reviewForm, service_rating: rating })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Commentaire */}
              <div className="space-y-2">
                <Label htmlFor="comment">Commentaire</Label>
                <Textarea
                  id="comment"
                  placeholder="Partagez votre expérience..."
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {reviewForm.comment.length}/2000 caractères
                </p>
              </div>

              {/* Option anonyme */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="is_anonymous_edit"
                  checked={reviewForm.is_anonymous}
                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                    setReviewForm({ ...reviewForm, is_anonymous: checked === true })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="is_anonymous_edit" className="text-sm font-medium cursor-pointer">
                    Publier de manière anonyme
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Votre nom ne sera pas affiché publiquement
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting || reviewForm.overall_rating === 0}>
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
            <DialogTitle>Supprimer l'avis</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet avis ?
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                Êtes-vous sûr de vouloir supprimer votre avis pour{' '}
                <span className="font-medium">{selectedReview.space_name}</span> ?
                Cette action est irréversible.
              </p>

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
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
