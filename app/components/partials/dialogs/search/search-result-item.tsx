'use client';

import Link from 'next/link';
import { Calendar, Building2, Receipt, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Reservation } from '@/lib/services/reservations';
import { Space } from '@/lib/services/spaces';
import { Invoice } from '@/lib/services/invoices';

interface ReservationResultItemProps {
  reservation: Reservation;
}

export function ReservationResultItem({ reservation }: ReservationResultItemProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      return timeStr.substring(0, 5); // HH:MM
    } catch {
      return timeStr;
    }
  };

  return (
    <Link
      href={`/dashboard?tab=reservations&reservation=${reservation.id}`}
      className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <div className="shrink-0 size-10 rounded-full flex items-center justify-center bg-primary/10">
        <Calendar className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold mb-1 truncate">
          {reservation.event_name || `Réservation #${reservation.id}`}
        </h4>
        <p className="text-xs text-muted-foreground mb-1">
          {reservation.space_name || 'Espace non spécifié'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(reservation.date)}</span>
          {reservation.start_time && reservation.end_time && (
            <>
              <span>•</span>
              <span>
                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
              </span>
            </>
          )}
          {reservation.total_price && (
            <>
              <span>•</span>
              <span>
                {typeof reservation.total_price === 'number'
                  ? reservation.total_price.toLocaleString()
                  : parseFloat(String(reservation.total_price)).toLocaleString()}{' '}
                XOF
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

interface SpaceResultItemProps {
  space: Space;
}

export function SpaceResultItem({ space }: SpaceResultItemProps) {
  return (
    <Link
      href={`/booking?space=${space.id}`}
      className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <div className="shrink-0 size-10 rounded-full flex items-center justify-center bg-primary/10">
        <Building2 className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold mb-1 truncate">
          {space.name}
        </h4>
        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
          {space.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{space.category}</span>
          {space.capacity && (
            <>
              <span>•</span>
              <span>{space.capacity} places</span>
            </>
          )}
          {space.price_hour && (
            <>
              <span>•</span>
              <span>{space.price_hour.toLocaleString()} XOF/h</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

interface InvoiceResultItemProps {
  invoice: Invoice;
}

export function InvoiceResultItem({ invoice }: InvoiceResultItemProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'draft':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Link
      href={`/dashboard?tab=invoices&invoice=${invoice.id}`}
      className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <div className="shrink-0 size-10 rounded-full flex items-center justify-center bg-primary/10">
        <Receipt className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold mb-1 truncate">
          {invoice.invoice_number}
        </h4>
        <p className="text-xs text-muted-foreground mb-1">
          {invoice.reservation_details?.event_name || 'Facture'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(invoice.issue_date)}</span>
          {invoice.total_amount && (
            <>
              <span>•</span>
              <span>{parseFloat(invoice.total_amount).toLocaleString()} XOF</span>
            </>
          )}
          {invoice.status && (
            <>
              <span>•</span>
              <span className={cn('capitalize', getStatusColor(invoice.status))}>
                {invoice.status === 'paid' ? 'Payée' : invoice.status === 'pending' ? 'En attente' : 'Brouillon'}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Recherche en cours...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="size-6 animate-spin text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'Aucun résultat trouvé' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

