/**
 * Types pour le système de check-in et décompte
 */

export interface ReservationSession {
  id: number;
  reservation_id: number;
  status: 'pending' | 'checked_in' | 'checked_out' | 'cancelled';
  check_in_time: string | null;
  check_in_notes: string;
  checked_in_by: number | null;
  checked_in_by_name: string | null;
  check_out_time: string | null;
  check_out_notes: string;
  checked_out_by: number | null;
  checked_out_by_name: string | null;
  actual_duration_hours: number | null;
  reserved_duration_hours: number | null;
  overtime_hours: number;
  current_duration_hours: number;
  remaining_reserved_time_hours: number;
  elapsed_time_formatted: string;
  remaining_time_formatted: string;
  base_cost: number;
  overtime_cost: number;
  total_cost: number;
  user_name: string;
  user_email: string;
  space_name: string;
  space_id: number;
  event_name: string;
  is_active: boolean;
  is_overtime: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionStatus {
  session_id: number;
  status: string;
  current_duration_hours: number;
  reserved_duration_hours: number | null;
  remaining_time_hours: number;
  overtime_hours: number;
  check_in_time: string;
  elapsed_time: string;
  is_overtime: boolean;
}

export interface ReservationVerification {
  valid: boolean;
  reservation: {
    id: number;
    space_name: string;
    event_name: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
  } | null;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  can_check_in: boolean;
  message: string | null;
}

export interface CheckInRequest {
  user_verification?: {
    email?: string;
    reservation_id?: number;
    event_name?: string;
  };
  notes?: string;
}

export interface CheckOutRequest {
  notes?: string;
}

export interface ActiveSession {
  session_id: number;
  reservation_id: number;
  user_name: string;
  space_name: string;
  check_in_time: string;
  current_duration: string;
  remaining_time: string;
}

export interface ActiveSessionsResponse {
  active_sessions: ReservationSession[];
  count: number;
}

export interface SessionHistoryResponse {
  sessions: ReservationSession[];
  total?: number;
  count?: number;
  next?: string | null;
  previous?: string | null;
  stats?: {
    total_hours: number;
    total_overtime: number;
    average_duration: number;
    total_sessions: number;
  };
}

export interface CheckInResponse {
  success: boolean;
  session: ReservationSession;
  message: string;
}

export interface CheckOutResponse {
  success: boolean;
  session: ReservationSession;
  actual_duration_hours: number;
  overtime_hours: number;
  overtime_cost: number;
  total_cost: number;
  message: string;
}

export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: any;
}

export interface ExtensionSlot {
  start: string;
  end: string;
  duration_hours?: number;
  hours?: number;
}

export interface SpaceExtensionOption {
  space_id: number;
  space_name: string;
  slots: ExtensionSlot[];
}

export interface ExtensionAvailability {
  same_space: ExtensionSlot[];
  other_spaces: SpaceExtensionOption[];
}

export interface ExtensionAvailabilityResponse {
  success: boolean;
  available_extensions: ExtensionAvailability;
  error?: string;
}

