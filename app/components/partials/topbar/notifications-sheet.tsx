'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationService, Notification, NotificationCategory } from '@/lib/services/notifications';
import { NotificationItem } from './notifications/notification-item';
import { toast } from 'sonner';

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Charger les notifications quand le sheet s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications(true);
      setNotifications(data);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const filterNotifications = (category?: NotificationCategory) => {
    if (!category) return notifications;
    return notifications.filter((n) => n.category === category);
  };

  const getUnreadCount = (category?: NotificationCategory) => {
    const filtered = filterNotifications(category);
    return filtered.filter((n) => !n.read).length;
  };

  const getCategoryLabel = (category: NotificationCategory) => {
    const labels: Record<NotificationCategory, string> = {
      reservation: 'Réservations',
      billing: 'Paiements',
      system: 'Système',
      space: 'Espaces',
      user: 'Utilisateur',
    };
    return labels[category] || category;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0">
          <SheetTitle className="p-3">
            Notifications
            {getUnreadCount() > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({getUnreadCount()} non lues)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative">
              <TabsList variant="line" className="w-full px-5 mb-5">
                <TabsTrigger value="all">
                  Toutes
                  {getUnreadCount() > 0 && (
                    <span className="ml-1.5 text-xs">({getUnreadCount()})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reservation" className="relative">
                  Réservations
                  {getUnreadCount('reservation') > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 absolute top-1 -end-1" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="billing">
                  Paiements
                  {getUnreadCount('billing') > 0 && (
                    <span className="ml-1.5 text-xs">({getUnreadCount('billing')})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="system">
                  Système
                  {getUnreadCount('system') > 0 && (
                    <span className="ml-1.5 text-xs">({getUnreadCount('system')})</span>
                  )}
                </TabsTrigger>
                <div className="grow flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        mode="icon"
                        className="mb-1"
                      >
                        <Settings className="size-4.5!" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-44"
                      side="bottom"
                      align="end"
                    >
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard?tab=settings">
                          <Settings2 />
                          Paramètres
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TabsList>

              {/* All Tab */}
              <TabsContent value="all" className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filterNotifications().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {filterNotifications().map((notification, index) => (
                      <div key={notification.id}>
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                        />
                        {index < filterNotifications().length - 1 && (
                          <div className="border-b border-b-border" />
                        )}
                      </div>
                    ))}
                </div>
                )}
              </TabsContent>

              {/* Reservations Tab */}
              <TabsContent value="reservation" className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filterNotifications('reservation').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">Aucune notification de réservation</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {filterNotifications('reservation').map((notification, index) => (
                      <div key={notification.id}>
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                        />
                        {index < filterNotifications('reservation').length - 1 && (
                          <div className="border-b border-b-border" />
                        )}
                      </div>
                    ))}
                </div>
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="billing" className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filterNotifications('billing').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">Aucune notification de paiement</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {filterNotifications('billing').map((notification, index) => (
                      <div key={notification.id}>
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                        />
                        {index < filterNotifications('billing').length - 1 && (
                          <div className="border-b border-b-border" />
                        )}
                      </div>
                    ))}
                </div>
                )}
              </TabsContent>

              {/* System Tab */}
              <TabsContent value="system" className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filterNotifications('system').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-muted-foreground">Aucune notification système</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {filterNotifications('system').map((notification, index) => (
                      <div key={notification.id}>
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                        />
                        {index < filterNotifications('system').length - 1 && (
                          <div className="border-b border-b-border" />
                        )}
                      </div>
                    ))}
                </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="border-t border-border p-5 grid grid-cols-2 gap-2.5">
          <Button variant="outline" disabled={getUnreadCount() === 0} onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </Button>
          <Button variant="outline" onClick={fetchNotifications}>
            Actualiser
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
