import { ReservationStats } from '@/app/(protected)/dashboard/components/reservation-stats';
import { ReservationCallout } from '@/app/(protected)/dashboard/components/reservation-callout';
import { WalletCard } from '@/app/(protected)/dashboard/components/wallet';
import { ReservationsChart } from '@/app/(protected)/dashboard/components/reservations-chart';
import { NextReservation } from '@/app/(protected)/dashboard/components/next-reservation';
import { RecentReservationsList } from '@/app/(protected)/dashboard/components/recent-reservations-list';

export function Demo1LightSidebarContent() {
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
          <WalletCard />
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
