'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReservationStats } from './reservation-stats';
import { ReservationCallout } from './reservation-callout';
import { WalletCard } from './wallet';
import { ReservationsChart } from './reservations-chart';
import { NextReservation } from './next-reservation';
import { RecentReservationsList } from './recent-reservations-list';

export default function DashboardOverview() {
  const searchParams = useSearchParams();

  // Rafraîchir le WalletCard si on arrive depuis la page de callback
  useEffect(() => {
    const refreshWallet = searchParams?.get('refresh_wallet');
    if (refreshWallet === 'true') {
      // Le WalletCard détectera ce paramètre et se rafraîchira
      // On nettoie l'URL ici aussi pour éviter les re-renders
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]refresh_wallet=[^&]*/, '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams]);

  return (
    <div className="grid gap-5 lg:gap-7.5">
      <div className="grid lg:grid-cols-3 gap-y-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-1">
          <ReservationStats />
        </div>
        <div className="lg:col-span-2">
          <ReservationCallout className="h-full" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-1">
          <WalletCard key={searchParams?.get('refresh_wallet')} />
        </div>
        <div className="lg:col-span-2">
          <ReservationsChart />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-1">
          <NextReservation />
        </div>
        <div className="lg:col-span-2">
          <RecentReservationsList />
        </div>
      </div>
    </div>
  );
}
