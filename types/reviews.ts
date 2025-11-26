/**
 * Types TypeScript pour le système d'avis (reviews)
 */

export interface Review {
  id: number;
  space: number;
  space_name: string;
  reservation?: number | null;
  reservation_date?: string | null;
  user: number;
  user_name: string;
  user_email: string;
  overall_rating: number;
  cleanliness_rating?: number | null;
  comfort_rating?: number | null;
  value_rating?: number | null;
  service_rating?: number | null;
  average_detailed_rating?: number | null;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  is_anonymous: boolean;
  helpful_count: number;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  average_rating: number | null;
  total_reviews: number;
  rating_distribution: { [key: number]: number };
  detailed_ratings: {
    cleanliness: number;
    comfort: number;
    value: number;
    service: number;
  } | null;
}

export interface ReviewCreatePayload {
  space: number;
  reservation?: number | null;
  overall_rating: number;
  cleanliness_rating?: number | null;
  comfort_rating?: number | null;
  value_rating?: number | null;
  service_rating?: number | null;
  comment: string;
  is_anonymous?: boolean;
}

export interface ReviewUpdatePayload extends Partial<ReviewCreatePayload> {}

export interface ReviewListResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: Review[];
}

export interface ReviewFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'hidden';
  rating?: number;
  space_id?: number;
  user_id?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface ApiError {
  detail?: string;
  non_field_errors?: string | string[];
  [key: string]: any;
}

export class ReviewError extends Error {
  constructor(
    message: string,
    public code: string = 'REVIEW_ERROR',
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ReviewError';
  }
}

