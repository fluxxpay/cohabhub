'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { MapPin, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export function NextReservation() {
  const [nextReservation, setNextReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextReservation = async () => {
      try {
        const result = await apiFetch('/api/reservations/my/', {
          method: 'GET',
        });

        if (result.response?.ok && result.data) {
          let reservations: any[] = [];
          if (Array.isArray(result.data)) {
            reservations = result.data;
          } else if (result.data.results && Array.isArray(result.data.results)) {
            reservations = result.data.results;
          }

          // Trouver la prochaine réservation (payée et à venir)
          const now = new Date();
          const upcoming = reservations
            .filter((r: any) => {
              if (r.status !== 'paid') return false;
              const reservationDate = new Date(`${r.date}T${r.start_time}`);
              return reservationDate > now;
            })
            .sort((a: any, b: any) => {
              const dateA = new Date(`${a.date}T${a.start_time}`);
              const dateB = new Date(`${b.date}T${b.start_time}`);
              return dateA.getTime() - dateB.getTime();
            });

          if (upcoming.length > 0) {
            setNextReservation(upcoming[0]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNextReservation();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!nextReservation) {
    return (
      <Card className="h-full">
        <CardContent className="grow lg:p-7.5 lg:pt-6 p-5 flex flex-col items-center justify-center">
          <div className="text-center">
            <Calendar className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-normal text-secondary-foreground mb-4">
              Aucune réservation à venir
            </p>
            <Button asChild>
              <Link href="/booking">Créer une réservation</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="grow lg:p-7.5 lg:pt-6 p-5">
        <div className="flex items-center justify-between flex-wrap gap-5 mb-7.5">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-mono">
              Prochaine réservation
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatTime(nextReservation.start_time)} -{' '}
              {formatTime(nextReservation.end_time)}
            </span>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calendar className="size-7 text-primary" />
          </div>
        </div>
        <p className="text-sm font-normal text-foreground leading-5.5 mb-8">
          {nextReservation.event_name}
        </p>
        <div className="flex rounded-lg bg-accent/50 gap-10 p-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1.5 text-sm font-normal text-foreground">
              <MapPin size={16} className="text-base text-muted-foreground" />
              Localisation
            </div>
            <div className="text-sm font-medium text-foreground pt-1.5">
              {nextReservation.space_location || nextReservation.space_name}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1.5 text-sm font-normal text-foreground">
              <Clock size={16} className="text-base text-muted-foreground" />
              Date
            </div>
            <div className="text-sm font-medium text-foreground pt-1.5">
              {formatDate(nextReservation.date)}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button mode="link" underlined="dashed" asChild>
          <Link href="/dashboard?tab=reservations" className="flex items-center gap-2">
            Voir toutes les réservations
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

