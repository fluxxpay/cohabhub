'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, Plus } from 'lucide-react';

interface IReservationCalloutProps {
  className: string;
}

export function ReservationCallout({ className }: IReservationCalloutProps) {
  return (
    <Fragment>
      <style>
        {`
          .reservation-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/2.png')}');
          }
          .dark .reservation-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/2-dark.png')}');
          }
        `}
      </style>

      <Card className={`h-full ${className}`}>
        <CardContent className="p-10 bg-[length:80%] rtl:[background-position:-70%_25%] [background-position:175%_25%] bg-no-repeat reservation-callout-bg">
          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="size-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-mono">
              Créez votre prochaine <br />
              réservation{' '}
              <Button mode="link" asChild className="text-xl font-semibold">
                <Link href="/booking">maintenant</Link>
              </Button>
            </h2>
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              Réservez facilement vos espaces de travail, salles de réunion <br />
              ou événements. Choisissez parmi nos espaces disponibles <br />
              et finalisez votre réservation en quelques clics.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/booking" className="flex items-center gap-2">
              <Plus className="size-4" />
              Créer une réservation
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}

