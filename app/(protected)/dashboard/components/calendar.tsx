'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarPageTitle,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Users,
  DollarSign,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { ReservationService, type CalendarReservation } from '@/lib/services/reservations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDateReservations, setSelectedDateReservations] = useState<CalendarReservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const data = await ReservationService.getReservationsByDay();
        // S'assurer que data est un tableau
        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur chargement réservations:', error);
        toast.error('Erreur lors du chargement des réservations');
        setReservations([]); // S'assurer que reservations est toujours un tableau
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const getReservationsForDate = (date: Date): CalendarReservation[] => {
    const dateString = date.toISOString().split('T')[0];
    return reservations.filter((reservation) => reservation.date === dateString);
  };

  const isDateReserved = (date: Date) => getReservationsForDate(date).length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'upcoming':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'upcoming':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    const dayReservations = getReservationsForDate(date);
    setSelectedDateReservations(dayReservations);
    setSelectedDate(date);
    setShowModal(true);
  };

  const renderCalendarHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Calendrier</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mois
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semaine
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-lg font-medium min-w-[200px] text-center">
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>

        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Aujourd'hui
        </Button>
      </div>
    </div>
  );

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    // Ajuster pour commencer la semaine le lundi (0 = dimanche, 1 = lundi)
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;
    for (let i = 0; i < adjustedStartingDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 bg-muted/50">
            {weekDays.map((day) => (
              <div key={day} className="p-4 text-center border-b border-r last:border-r-0">
                <span className="text-sm font-medium">{day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((date, idx) => {
              if (!date)
                return (
                  <div
                    key={idx}
                    className="min-h-[120px] border-r border-b last:border-r-0 bg-muted/20 p-2"
                  ></div>
                );

              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const dayReservations = getReservationsForDate(date);
              const reserved = isDateReserved(date);
              const hasMultipleReservations = dayReservations.length > 1;

              return (
                <HoverCard key={idx} openDelay={300} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <div
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        'min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-sm relative group',
                        !isCurrentMonth && 'bg-muted/20 opacity-50',
                        reserved && 'bg-primary/5',
                        isToday && 'ring-2 ring-primary',
                        hasMultipleReservations && 'bg-gradient-to-br from-primary/5 to-primary/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            'text-sm font-medium transition-all',
                            isToday
                              ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-sm'
                              : isCurrentMonth
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {date.getDate()}
                        </span>
                        {dayReservations.length > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              'text-xs font-semibold transition-all group-hover:scale-110',
                              reserved && 'bg-primary/20 text-primary'
                            )}
                          >
                            {dayReservations.length}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayReservations.slice(0, 2).map((r) => (
                          <div
                            key={r.id}
                            className={cn(
                              'p-1.5 rounded-md text-xs border transition-all hover:shadow-sm',
                              getStatusColor(r.status),
                              'group-hover:scale-[1.02]'
                            )}
                          >
                            <div className="font-semibold truncate flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {r.space}
                            </div>
                            <div className="text-xs opacity-75 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {r.startTime} - {r.endTime}
                            </div>
                          </div>
                        ))}
                        {dayReservations.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center font-medium py-1">
                            +{dayReservations.length - 2} autre{dayReservations.length > 3 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {reserved && (
                        <div className="absolute bottom-1 right-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </div>
                  </HoverCardTrigger>
                  {dayReservations.length > 0 && (
                    <HoverCardContent 
                      className="w-80 p-0" 
                      side="right" 
                      align="start"
                      sideOffset={8}
                    >
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {formatDate(date)}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {dayReservations.length} réservation{dayReservations.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(date);
                            }}
                          >
                            Voir tout
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
                        {dayReservations.map((reservation, index) => (
                          <div
                            key={reservation.id}
                            className={cn(
                              'p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer',
                              getStatusColor(reservation.status),
                              'hover:scale-[1.02]'
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(date);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Building2 className="h-4 w-4 opacity-70" />
                                  <h5 className="font-semibold text-sm">{reservation.space}</h5>
                                </div>
                                <Badge 
                                  variant={getStatusBadgeVariant(reservation.status) as any}
                                  className="text-xs"
                                >
                                  {reservation.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 mt-2 text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="font-medium">
                                  {reservation.startTime} - {reservation.endTime}
                                </span>
                              </div>
                              
                              {reservation.location && reservation.location !== 'N/A' && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="truncate">{reservation.location}</span>
                                </div>
                              )}
                              
                              {reservation.capacity && reservation.capacity !== 'N/A' && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>Capacité: {reservation.capacity}</span>
                                </div>
                              )}
                              
                              {reservation.price && reservation.price !== 'N/A' && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span className="font-semibold">{reservation.price}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    // Ajuster pour commencer la semaine le lundi
    const adjustedDay = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - adjustedDay);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9h à 20h

    return (
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="p-4 border-r bg-muted/50">
              <span className="text-sm font-medium">Heures</span>
            </div>
            {weekDays.map((date) => {
              const reserved = isDateReserved(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'p-4 border-r last:border-r-0 bg-muted/50 text-center cursor-pointer transition-colors hover:bg-muted',
                    reserved && 'bg-primary/10',
                    isToday && 'ring-2 ring-primary'
                  )}
                >
                  <div className="text-sm font-medium">
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b">
                <div className="p-2 border-r bg-muted/30 text-xs text-muted-foreground flex items-center">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((date) => {
                  const dayReservations = getReservationsForDate(date);
                  const hourReservations = dayReservations.filter((reservation) => {
                    const startHour = parseInt(reservation.startTime.split(':')[0]);
                    return startHour === hour;
                  });

                  return (
                    <HoverCard key={date.toISOString()} openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div className="p-2 border-r last:border-r-0 min-h-[60px]">
                          {hourReservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className={cn(
                                'p-1.5 rounded-md text-xs border cursor-pointer transition-all hover:shadow-sm mb-1',
                                getStatusColor(reservation.status),
                                'hover:scale-[1.02]'
                              )}
                            >
                              <div className="font-semibold truncate flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {reservation.space}
                              </div>
                              <div className="text-xs opacity-75 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {reservation.startTime} - {reservation.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </HoverCardTrigger>
                      {hourReservations.length > 0 && (
                        <HoverCardContent className="w-72 p-0" side="right" align="start" sideOffset={8}>
                          <div className="p-3 border-b bg-muted/30">
                            <h4 className="font-semibold text-sm">
                              {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {hourReservations.length} réservation{hourReservations.length > 1 ? 's' : ''} à {hour.toString().padStart(2, '0')}:00
                            </p>
                          </div>
                          <div className="p-3 space-y-2">
                            {hourReservations.map((reservation) => (
                              <div
                                key={reservation.id}
                                className={cn(
                                  'p-2.5 rounded-lg border transition-all',
                                  getStatusColor(reservation.status)
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Building2 className="h-4 w-4 opacity-70" />
                                  <h5 className="font-semibold text-sm">{reservation.space}</h5>
                                </div>
                                <Badge 
                                  variant={getStatusBadgeVariant(reservation.status) as any}
                                  className="text-xs mb-2"
                                >
                                  {reservation.status}
                                </Badge>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{reservation.startTime} - {reservation.endTime}</span>
                                  </div>
                                  {reservation.location && reservation.location !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{reservation.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </HoverCardContent>
                      )}
                    </HoverCard>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Calendrier" />
            <ToolbarDescription>Vue calendrier de vos réservations</ToolbarDescription>
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
        <div className="space-y-6">
          {renderCalendarHeader()}
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </div>
      </Container>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate ? formatDate(selectedDate) : 'Détails des réservations'}
            </DialogTitle>
            <DialogDescription>
              {selectedDateReservations.length > 0
                ? `${selectedDateReservations.length} réservation${selectedDateReservations.length > 1 ? 's' : ''} pour ce jour`
                : 'Aucune réservation'}
            </DialogDescription>
          </DialogHeader>
          {selectedDateReservations.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {selectedDateReservations.map((reservation) => (
                <Card 
                  key={reservation.id}
                  className={cn(
                    'transition-all hover:shadow-lg hover:scale-[1.01]',
                    getStatusColor(reservation.status)
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 opacity-70" />
                          <h4 className="font-semibold text-base">{reservation.space}</h4>
                        </div>
                        <Badge 
                          variant={getStatusBadgeVariant(reservation.status) as any}
                          className="mb-3"
                        >
                          {reservation.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {reservation.startTime} - {reservation.endTime}
                        </span>
                      </div>
                      
                      {reservation.location && reservation.location !== 'N/A' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{reservation.location}</span>
                        </div>
                      )}
                      
                      {reservation.capacity && reservation.capacity !== 'N/A' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Capacité: {reservation.capacity}</span>
                        </div>
                      )}
                      
                      {reservation.price && reservation.price !== 'N/A' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">{reservation.price}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2 font-medium">Aucune réservation pour ce jour</p>
              <p className="text-sm text-muted-foreground mb-6">
                Cliquez sur le bouton ci-dessous pour créer une nouvelle réservation
              </p>
              <Button asChild>
                <Link href="/booking">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle réservation
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
