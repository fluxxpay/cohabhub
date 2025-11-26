'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, ThumbsUp, Loader2, Plus } from 'lucide-react';
import { ReviewService } from '@/lib/services/reviews';
import type { Review, ReviewStats } from '@/types/reviews';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewCard } from '@/components/common/review-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReviewsSectionProps {
  spaceId: number;
  spaceName: string;
  onReviewClick?: () => void;
  showCreateButton?: boolean;
}

export function ReviewsSection({ 
  spaceId, 
  spaceName,
  onReviewClick,
  showCreateButton = false 
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [spaceId]);

  const fetchReviews = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await ReviewService.getSpaceReviews(spaceId, {
        sort: '-created_at',
        page,
        page_size: pageSize,
      });

      if (page === 1) {
        setReviews(response.results || []);
      } else {
        setReviews((prev) => [...prev, ...(response.results || [])]);
      }

      setHasMore(!!response.next);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await ReviewService.getSpaceReviewStats(spaceId);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleLoadMore = () => {
    fetchReviews(currentPage + 1);
  };

  const handleHelpful = async (review: Review) => {
    try {
      await ReviewService.markHelpful(review.id);
      // Rafraîchir les avis pour mettre à jour le compteur
      fetchReviews(currentPage);
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Avis et témoignages
          </h2>
          {stats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <StarRating 
                  rating={stats.average_rating || 0} 
                  readOnly 
                  size="md" 
                  showValue 
                />
                <span className="text-sm text-muted-foreground">
                  ({stats.total_reviews} avis)
                </span>
              </div>
            </div>
          )}
        </div>
        {showCreateButton && onReviewClick && (
          <Button onClick={onReviewClick}>
            <Plus className="h-4 w-4 mr-2" />
            Laisser un avis
          </Button>
        )}
      </div>

      {/* Statistiques détaillées */}
      {stats && stats.total_reviews > 0 && (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Distribution des notes */}
            {Object.entries(stats.rating_distribution || {}).map(([rating, count]) => (
              <div key={rating} className="text-center">
                <div className="text-2xl font-bold text-primary-900">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {rating} étoile{parseInt(rating) > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Notes détaillées moyennes */}
          {stats.detailed_ratings && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">Notes détaillées</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Propreté</div>
                  <StarRating 
                    rating={stats.detailed_ratings.cleanliness || 0} 
                    readOnly 
                    size="sm" 
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Confort</div>
                  <StarRating 
                    rating={stats.detailed_ratings.comfort || 0} 
                    readOnly 
                    size="sm" 
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Qualité/prix</div>
                  <StarRating 
                    rating={stats.detailed_ratings.value || 0} 
                    readOnly 
                    size="sm" 
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Service</div>
                  <StarRating 
                    rating={stats.detailed_ratings.service || 0} 
                    readOnly 
                    size="sm" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des avis */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Aucun avis pour le moment. Soyez le premier à laisser un avis !
          </p>
          {showCreateButton && onReviewClick && (
            <Button onClick={onReviewClick}>
              <Plus className="h-4 w-4 mr-2" />
              Laisser un avis
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
              showSpaceInfo={false}
            />
          ))}

          {/* Bouton charger plus */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Charger plus d\'avis'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
