'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  /**
   * Note actuelle (0-5)
   */
  rating: number;
  /**
   * Mode lecture seule (true) ou interactif (false)
   */
  readOnly?: boolean;
  /**
   * Taille des étoiles
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Callback appelé quand la note change (mode interactif)
   */
  onRatingChange?: (rating: number) => void;
  /**
   * Afficher la note numérique à côté
   */
  showValue?: boolean;
  /**
   * Nombre d'étoiles (par défaut 5)
   */
  maxStars?: number;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StarRating({
  rating = 0,
  readOnly = true,
  size = 'md',
  onRatingChange,
  showValue = false,
  maxStars = 5,
  className,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);
  const [internalRating, setInternalRating] = React.useState(rating);

  // Synchroniser le rating interne avec le prop
  React.useEffect(() => {
    setInternalRating(rating);
  }, [rating]);

  const displayRating = hoveredRating !== null ? hoveredRating : internalRating;

  const handleClick = (value: number) => {
    if (readOnly || !onRatingChange) return;
    setInternalRating(value);
    onRatingChange(value);
  };

  const handleMouseEnter = (value: number) => {
    if (readOnly) return;
    setHoveredRating(value);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoveredRating(null);
  };

  // Arrondir la note pour l'affichage (ex: 4.5 → 4.5, 4.3 → 4)
  const roundedRating = Math.round(displayRating * 2) / 2;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= roundedRating;
          const isHalfFilled = roundedRating > index && roundedRating < starValue;

          return (
            <button
              key={starValue}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={cn(
                'transition-colors duration-150',
                !readOnly && 'cursor-pointer hover:scale-110',
                readOnly && 'cursor-default'
              )}
              aria-label={`${starValue} étoile${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalfFilled
                    ? 'fill-yellow-200 text-yellow-400'
                    : 'fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600',
                  !readOnly && 'hover:fill-yellow-300 hover:text-yellow-300'
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">
          {roundedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

