'use client';

import { Notification, NotificationType, NotificationCategory } from '@/lib/services/notifications';
import { Calendar, CheckCircle, AlertCircle, Info, XCircle, CreditCard, Building2, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
}

const getNotificationIcon = (type: NotificationType, category: NotificationCategory) => {
  // Priorité aux icônes de catégorie
  if (category === 'reservation') return Calendar;
  if (category === 'billing') return CreditCard;
  if (category === 'space') return Building2;
  if (category === 'system') return Bell;
  
  // Sinon, utiliser l'icône du type
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertCircle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    default:
      return 'text-blue-500';
  }
};

const getNotificationBadgeColor = (type: NotificationType): 'success' | 'destructive' | 'primary' | 'default' => {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'destructive';
    case 'warning':
      return 'default';
    default:
      return 'primary';
  }
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type, notification.category);
  const iconColor = getNotificationColor(notification.type);
  const badgeColor = getNotificationBadgeColor(notification.type);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch {
      return notification.timestamp || 'Récemment';
    }
  };

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const getActionLink = () => {
    if (!notification.action) return null;
    
    // Extraire l'ID de réservation si présent
    const reservationMatch = notification.action.match(/reservation[\/#]?(\d+)/i);
    if (reservationMatch) {
      return `/dashboard?tab=reservations&reservation=${reservationMatch[1]}`;
    }
    
    // Extraire l'ID de facture si présent
    const invoiceMatch = notification.action.match(/invoice[\/#]?(\d+)/i);
    if (invoiceMatch) {
      return `/dashboard?tab=invoices&invoice=${invoiceMatch[1]}`;
    }
    
    // Lien direct si c'est une URL
    if (notification.action.startsWith('http') || notification.action.startsWith('/')) {
      return notification.action;
    }
    
    return null;
  };

  const actionLink = getActionLink();

  const baseProps = {
    onClick: handleClick,
    className: cn(
      'flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
      !notification.read && 'bg-muted/30'
    ),
  };

  if (actionLink) {
    return (
      <Link href={actionLink} {...baseProps}>
      <div className={cn('shrink-0 size-10 rounded-full flex items-center justify-center', iconColor, 'bg-muted')}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={cn('text-sm font-semibold', !notification.read && 'font-bold')}>
            {notification.title}
          </h4>
          {!notification.read && (
            <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(notification.created_at)}</span>
          {notification.category && (
            <>
              <span>•</span>
              <span className="capitalize">{notification.category}</span>
            </>
          )}
        </div>
      </div>
      </Link>
    );
  }

  return (
    <div {...baseProps}>
      <div className={cn('shrink-0 size-10 rounded-full flex items-center justify-center', iconColor, 'bg-muted')}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={cn('text-sm font-semibold', !notification.read && 'font-bold')}>
            {notification.title}
          </h4>
          {!notification.read && (
            <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(notification.created_at)}</span>
          {notification.category && (
            <>
              <span>•</span>
              <span className="capitalize">{notification.category}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

