'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ApexOptions } from 'apexcharts';
import ApexChart from 'react-apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ReservationsChart() {
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12');

  const categories: string[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  useEffect(() => {
    const fetchReservationsData = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        const result = await apiFetch(`/api/reservations/monthly-stats/?year=${currentYear}`, {
          method: 'GET',
        });

        if (result.response?.ok && result.data) {
          // L'endpoint retourne directement les données mensuelles
          const dataInThousands = result.data.monthly_data.map((amount: number) =>
            Math.round(amount / 1000)
          );
          setChartData(dataInThousands);
        } else {
          // Fallback: utiliser l'ancienne méthode si l'endpoint n'est pas disponible
          const fallbackResult = await apiFetch('/api/reservations/my/', {
            method: 'GET',
          });

          if (fallbackResult.response?.ok && fallbackResult.data) {
            let reservations: any[] = [];
            if (Array.isArray(fallbackResult.data)) {
              reservations = fallbackResult.data;
            } else if (fallbackResult.data.results && Array.isArray(fallbackResult.data.results)) {
              reservations = fallbackResult.data.results;
            }

            // Grouper les réservations par mois
            const monthlyData = new Array(12).fill(0);
            reservations.forEach((reservation: any) => {
              if (reservation.date && reservation.status === 'paid') {
                const date = new Date(reservation.date);
                const month = date.getMonth();
                monthlyData[month] += reservation.total_price || 0;
              }
            });

            // Convertir en milliers pour l'affichage
            const dataInThousands = monthlyData.map((amount) =>
              Math.round(amount / 1000)
            );
            setChartData(dataInThousands);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationsData();
  }, [selectedPeriod]);

  const options: ApexOptions = {
    series: [
      {
        name: 'Dépenses',
        data: chartData.length > 0 ? chartData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
    chart: {
      height: 250,
      type: 'area',
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      curve: 'smooth',
      show: true,
      width: 3,
      colors: ['var(--color-primary)'],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: 'var(--color-secondary-foreground)',
          fontSize: '12px',
        },
      },
      crosshairs: {
        position: 'front',
        stroke: {
          color: 'var(--color-primary)',
          width: 1,
          dashArray: 3,
        },
      },
    },
    yaxis: {
      min: 0,
      tickAmount: 5,
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: 'var(--color-secondary-foreground)',
          fontSize: '12px',
        },
        formatter: (defaultValue) => {
          return `${defaultValue}k XOF`;
        },
      },
    },
    tooltip: {
      enabled: true,
      custom({ series, seriesIndex, dataPointIndex, w }) {
        const number = parseInt(series[seriesIndex][dataPointIndex]) * 1000;
        const month = w.globals.seriesX[seriesIndex][dataPointIndex];
        const monthName = categories[month];

        const formattedNumber = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'XOF',
          minimumFractionDigits: 0,
        }).format(number);

        return `
          <div class="flex flex-col gap-2 p-3.5">
            <div class="font-medium text-sm text-secondary-foreground">${monthName}, 2024</div>
            <div class="flex items-center gap-1.5">
              <div class="font-semibold text-base text-mono">${formattedNumber}</div>
            </div>
          </div>
        `;
      },
    },
    markers: {
      size: 0,
      colors: 'var(--color-white)',
      strokeColors: 'var(--color-primary)',
      strokeWidth: 4,
      strokeOpacity: 1,
      hover: {
        size: 8,
      },
    },
    fill: {
      gradient: {
        opacityFrom: 0.25,
        opacityTo: 0,
      },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Évolution des dépenses</CardTitle>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent className="w-28">
            <SelectItem value="1">1 mois</SelectItem>
            <SelectItem value="3">3 mois</SelectItem>
            <SelectItem value="6">6 mois</SelectItem>
            <SelectItem value="12">12 mois</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col justify-end items-stretch grow px-3 py-1">
        <ApexChart
          id="reservations_chart"
          options={options}
          series={options.series}
          type="area"
          max-width="694"
          height="250"
        />
      </CardContent>
    </Card>
  );
}

