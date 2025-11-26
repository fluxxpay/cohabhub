'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Pencil, 
  Trash, 
  ThumbsUp,
  User,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Review } from '@/types/reviews';

export interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onHelpful?: (review: Review) => void;
  showSpaceInfo?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  onEdit,
  onDelete,
  onHelpful,
  showSpaceInfo = false,
  className,
}: ReviewCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" className="bg-green-500/10 text-green-700 border-green-500/20">
            Approuvé
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">Rejeté</Badge>
        );
      case 'hidden':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
            Masqué
          </Badge>
        );
      default:
        return null;
    }
  };

  const hasDetailedRatings = 
    review.cleanliness_rating || 
    review.comfort_rating || 
    review.value_rating || 
    review.service_rating;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between w-full gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {review.is_anonymous ? 'Utilisateur anonyme' : review.user_name}
                </div>
                {review.reservation_date && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(review.reservation_date)}
                  </div>
                )}
              </div>
            </div>
            {showSpaceInfo && (
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {review.space_name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(review.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Note globale */}
        <div className="mb-4">
          <StarRating 
            rating={review.overall_rating} 
            readOnly 
            size="md" 
            showValue 
          />
        </div>

        {/* Notes détaillées (si disponibles) */}
        {hasDetailedRatings && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded-md">
            {review.cleanliness_rating && (
              <div className="text-xs">
                <span className="text-muted-foreground">Propreté: </span>
                <StarRating rating={review.cleanliness_rating} readOnly size="sm" />
              </div>
            )}
            {review.comfort_rating && (
              <div className="text-xs">
                <span className="text-muted-foreground">Confort: </span>
                <StarRating rating={review.comfort_rating} readOnly size="sm" />
              </div>
            )}
            {review.value_rating && (
              <div className="text-xs">
                <span className="text-muted-foreground">Qualité/prix: </span>
                <StarRating rating={review.value_rating} readOnly size="sm" />
              </div>
            )}
            {review.service_rating && (
              <div className="text-xs">
                <span className="text-muted-foreground">Service: </span>
                <StarRating rating={review.service_rating} readOnly size="sm" />
              </div>
            )}
          </div>
        )}

        {/* Commentaire */}
        {review.comment && (
          <p className="text-foreground mb-4 leading-relaxed">
            {review.comment}
          </p>
        )}

        {/* Footer avec actions et métadonnées */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(review.created_at)}
            </div>
            {review.helpful_count > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {review.helpful_count} utile{review.helpful_count > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onHelpful && review.status === 'approved' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onHelpful(review)}
                className="text-xs"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Utile
              </Button>
            )}
            {onEdit && review.can_edit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(review)}
                className="text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            )}
            {onDelete && review.can_delete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(review)}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash className="h-3 w-3 mr-1" />
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
