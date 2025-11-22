'use client';

import { Fragment, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Calendar, CreditCard } from 'lucide-react';

interface IReservationStatsItem {
  icon: typeof Building2;
  info: string;
  desc: string;
  color: string;
}
type IReservationStatsItems = Array<IReservationStatsItem>;

const ReservationStats = () => {
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalSpent: 0,
    upcomingReservations: 0,
    activeReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await apiFetch('/api/reservations/my/', {
          method: 'GET',
        });

        if (result.response?.ok && result.data) {
          let reservations: any[] = [];
          let totalCostFromAPI = 0;

          // Récupérer les réservations
          if (Array.isArray(result.data)) {
            reservations = result.data;
          } else if (result.data.results && Array.isArray(result.data.results)) {
            reservations = result.data.results;
            // Utiliser total_cost de l'API si disponible (plus fiable)
            totalCostFromAPI = parseFloat(result.data.total_cost) || 0;
          }

          console.log('📊 Réservations récupérées:', reservations.length);
          console.log('💰 Total cost depuis API:', totalCostFromAPI);

          const now = new Date();
          const upcoming = reservations.filter((r: any) => {
            if (!r.date || !r.start_time || r.status !== 'paid') return false;
            try {
              const reservationDate = new Date(`${r.date}T${r.start_time}`);
              return reservationDate > now;
            } catch {
              return false;
            }
          });

          // Calculer le total dépensé
          // Prioriser total_cost de l'API, sinon calculer depuis les réservations
          let totalSpent = totalCostFromAPI;
          
          if (totalSpent === 0) {
            // Fallback: calculer depuis les réservations payées
            totalSpent = reservations
              .filter((r: any) => r.status === 'paid')
              .reduce((sum: number, r: any) => {
                // Gérer différents formats de total_price
                let price = 0;
                if (typeof r.total_price === 'number') {
                  price = r.total_price;
                } else if (typeof r.total_price === 'string') {
                  // Si c'est une chaîne, enlever "XOF" et autres caractères non numériques
                  const cleaned = r.total_price.replace(/[^\d.,]/g, '').replace(',', '.');
                  price = parseFloat(cleaned) || 0;
                }
                return sum + price;
              }, 0);
          }

          console.log('💰 Total dépensé calculé:', totalSpent);

          const paidReservations = reservations.filter((r: any) => r.status === 'paid');
          console.log('✅ Réservations payées:', paidReservations.length);

          setStats({
            totalReservations: reservations.length,
            totalSpent: isNaN(totalSpent) || totalSpent === 0 ? 0 : Math.round(totalSpent / 1000), // En milliers
            upcomingReservations: upcoming.length,
            activeReservations: paidReservations.length,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const items: IReservationStatsItems = [
    {
      icon: Calendar,
      info: stats.totalReservations.toString(),
      desc: 'Total réservations',
      color: 'text-primary',
    },
    {
      icon: CreditCard,
      info: `${isNaN(stats.totalSpent) ? 0 : stats.totalSpent}k`,
      desc: 'Total dépensé (k XOF)',
      color: 'text-green-500',
    },
    {
      icon: Users,
      info: stats.upcomingReservations.toString(),
      desc: 'Réservations à venir',
      color: 'text-blue-500',
    },
    {
      icon: Building2,
      info: stats.activeReservations.toString(),
      desc: 'Réservations actives',
      color: 'text-yellow-500',
    },
  ];

  const renderItem = (item: IReservationStatsItem, index: number) => {
    const Icon = item.icon;
    const getBgColor = (color: string) => {
      if (color === 'text-primary') return 'bg-primary/10';
      if (color === 'text-green-500') return 'bg-green-500/10';
      if (color === 'text-blue-500') return 'bg-blue-500/10';
      if (color === 'text-yellow-500') return 'bg-yellow-500/10';
      return 'bg-muted';
    };
    
    return (
      <Card key={index}>
        <CardContent className="p-0 flex flex-col justify-between gap-6 h-full bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat reservation-stats-bg">
          <div className="p-4">
            <div className={`p-2 rounded-lg ${getBgColor(item.color)} w-fit`}>
              <Icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
          <div className="flex flex-col gap-1 pb-4 px-5">
            <span className="text-3xl font-semibold text-mono">
              {loading ? '...' : item.info}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {item.desc}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Fragment>
      <style>
        {`
          .reservation-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3.png')}');
          }
          .dark .reservation-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3-dark.png')}');
          }
        `}
      </style>

      <div className="grid grid-cols-2 gap-5 lg:gap-7.5 h-full items-stretch">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>
    </Fragment>
  );
};

export { ReservationStats, type IReservationStatsItem, type IReservationStatsItems };
