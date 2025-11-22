'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import {
  ChartLine,
  TrendUp,
  Users,
  Buildings,
  Calendar,
  CurrencyEur,
  ArrowUp,
  ArrowDown,
  Star
} from '@phosphor-icons/react';

interface AnalyticsData {
  period: string;
  revenue: number;
  users: number;
  reservations: number;
  occupancy: number;
}

interface TopSpace {
  name: string;
  revenue: number;
  reservations: number;
  rating?: number;
}

interface Trend {
  metric: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface AnalyticsResponse {
  main_metrics?: AnalyticsData;
  monthly_data?: AnalyticsData[];
  top_spaces?: TopSpace[];
  trends?: Trend[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'reservations' | 'occupancy'>('revenue');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalActiveUsers, setTotalActiveUsers] = useState<number>(0);

  const fetchActiveUsers = async () => {
    try {
      const { response, data } = await apiFetch('/api/auth/users/', {
        method: 'GET',
      });

      if (!response || !response.ok) {
        throw new Error(`Erreur HTTP: ${response?.status}`);
      }

      const userData = data as { success?: boolean; total_active?: number };

      if (userData.success) {
        setTotalActiveUsers(userData.total_active || 0);
        console.log(`Total utilisateurs actifs: ${userData.total_active}`);
      } else {
        console.error("Erreur API users:", (data as any).message || (data as any).errors);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs actifs:", error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error('Token manquant');
      }

      const res = await fetch(
        `${apiUrl}/api/analytics/?period=${selectedPeriod}&status=all`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error(`Erreur API analytics: ${res.status}`);
        setData(null);
        return;
      }

      const json: AnalyticsResponse = await res.json();
      setData(json);

      await fetchActiveUsers();

    } catch (error) {
      console.error('Erreur API analytics:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const monthlyData = Array.isArray(data.monthly_data)
    ? data.monthly_data.map(item => ({
        period: item.period || '',
        revenue: item.revenue || 0,
        users: item.users || 0,
        reservations: item.reservations || 0,
        occupancy: item.occupancy || 0,
      }))
    : [];

  const currentData = monthlyData.length > 0
    ? monthlyData[monthlyData.length - 1]
    : { period: '', revenue: 0, users: 0, reservations: 0, occupancy: 0 };

  const previousData = monthlyData.length > 1
    ? monthlyData[monthlyData.length - 2]
    : currentData;

  const getMetricValue = (metric: string, analytics: AnalyticsData) => {
    switch (metric) {
      case 'revenue': return analytics.revenue;
      case 'users': return analytics.users;
      case 'reservations': return analytics.reservations;
      case 'occupancy': return analytics.occupancy;
      default: return 0;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'revenue': return 'Revenus';
      case 'users': return 'Utilisateurs actifs';
      case 'reservations': return 'Réservations';
      case 'occupancy': return 'Taux d\'occupation';
      default: return '';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'revenue': return CurrencyEur;
      case 'users': return Users;
      case 'reservations': return Calendar;
      case 'occupancy': return Buildings;
      default: return ChartLine;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'revenue': return 'text-green-600';
      case 'users': return 'text-blue-600';
      case 'reservations': return 'text-purple-600';
      case 'occupancy': return 'text-orange-600';
      default: return 'text-primary-600';
    }
  };

  const getBgColor = (metric: string) => {
    switch (metric) {
      case 'revenue': return 'bg-green-50';
      case 'users': return 'bg-blue-50';
      case 'reservations': return 'bg-purple-50';
      case 'occupancy': return 'bg-orange-50';
      default: return 'bg-primary-50';
    }
  };

  const getChange = (metric: string) => {
    if (metric === 'users') {
      return {
        value: 0,
        isPositive: true,
        currentValue: totalActiveUsers,
        previousValue: totalActiveUsers
      };
    }

    const currentValue = currentData[metric as keyof AnalyticsData] as number;
    const previousValue = previousData[metric as keyof AnalyticsData] as number;
    const change = ((currentValue - previousValue) / (previousValue || 1)) * 100;

    return {
      value: change,
      isPositive: change >= 0,
      currentValue,
      previousValue
    };
  };

  const formatValue = (metric: string, value: number) => {
    switch (metric) {
      case 'revenue': return `${value.toLocaleString('fr-FR')} XOF`;
      case 'occupancy': return `${value}%`;
      case 'users': return value.toLocaleString();
      default: return value.toLocaleString();
    }
  };

  const topSpaces = Array.isArray(data?.top_spaces) ? data.top_spaces : [];

  const mainTrends: Trend[] = [
    {
      metric: 'Revenus',
      value: formatValue('revenue', getChange('revenue').currentValue),
      trend: getChange('revenue').isPositive ? 'up' : 'down',
      period: 'Ce mois'
    },
    {
      metric: 'Utilisateurs actifs',
      value: formatValue('users', totalActiveUsers),
      trend: 'up',
      period: 'Actuel'
    },
    {
      metric: 'Réservations payées',
      value: formatValue('reservations', getChange('reservations').currentValue),
      trend: getChange('reservations').isPositive ? 'up' : 'down',
      period: 'Actuel'
    }
  ];

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary-900 mb-2">Analytics</h1>
          <p className="text-primary-600">Statistiques et rapports détaillés</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
            className="px-4 py-2 border border-primary-200 rounded-lg bg-white text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['revenue', 'users', 'reservations', 'occupancy'] as const).map((metric) => {
          const Icon = getMetricIcon(metric);
          const changeData = getChange(metric);

          return (
            <motion.div
              key={metric}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl shadow-xl bg-white text-primary-900"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getBgColor(metric)}`}>
                  <Icon className={`h-6 w-6 ${getMetricColor(metric)}`} weight="light" />
                </div>
                <div className="text-sm font-medium text-primary-600">
                  {getMetricLabel(metric)}
                </div>
              </div>

              <div>
                <h3 className={`text-2xl font-bold mb-1 ${getMetricColor(metric)}`}>
                  {formatValue(metric, changeData.currentValue)}
                </h3>

                <div className="flex items-center space-x-2">
                  {metric === 'users' ? (
                    <span className="text-sm text-primary-500">
                      Total actifs
                    </span>
                  ) : (
                    <>
                      <div className={`flex items-center ${changeData.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {changeData.isPositive ? (
                          <ArrowUp className="h-4 w-4 mr-1" weight="light" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" weight="light" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(changeData.value).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-sm text-primary-500">
                        vs période précédente
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-primary-900">Évolution</h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
            className="px-4 py-2 border border-primary-200 rounded-lg bg-white text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="revenue">Revenus</option>
            <option value="users">Utilisateurs</option>
            <option value="reservations">Réservations</option>
            <option value="occupancy">Taux d'occupation</option>
          </select>
        </div>
        <div className="h-64 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4">
          {monthlyData.length > 0 ? (
            <div className="flex items-end justify-between h-full space-x-2">
              {monthlyData.map((data, index) => {
                const value = getMetricValue(selectedMetric, data);
                const maxValue = Math.max(...monthlyData.map(d => getMetricValue(selectedMetric, d)), 1);
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return (
                  <div key={data.period || index} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="text-xs text-primary-600 font-medium">
                      {selectedMetric === 'revenue' ? `${(value / 1000).toFixed(0)}k` :
                       selectedMetric === 'occupancy' ? `${value}%` : value}
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        selectedMetric === 'revenue' ? 'bg-green-500' :
                        selectedMetric === 'users' ? 'bg-blue-500' :
                        selectedMetric === 'reservations' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-xs text-primary-600">{data.period}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-primary-600">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Espaces les plus populaires */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-light text-primary-900 mb-6">Espaces les plus populaires</h2>
          <div className="space-y-4">
            {topSpaces.length > 0 ? (
              topSpaces.map((space, index) => (
                <motion.div
                  key={space.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-primary-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-primary-900">{space.name}</h3>
                      <p className="text-sm text-primary-600">{space.reservations} réservations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-primary-900">{space.revenue.toLocaleString('fr-FR')} XOF</div>
                    {space.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400" weight="fill" />
                        <span className="text-xs text-primary-600">{space.rating}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-primary-600">
                Aucun espace disponible
              </div>
            )}
          </div>
        </div>

        {/* Tendances récentes */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-light text-primary-900 mb-6">Tendances récentes</h2>
          <div className="space-y-4">
            {mainTrends.map((trend, index) => (
              <motion.div
                key={trend.metric}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-primary-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trend.trend === 'up' ? 'bg-green-100' :
                    trend.trend === 'down' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {trend.trend === 'up' ? (
                      <ArrowUp className="h-5 w-5 text-green-600" weight="light" />
                    ) : trend.trend === 'down' ? (
                      <ArrowDown className="h-5 w-5 text-red-600" weight="light" />
                    ) : (
                      <TrendUp className="h-5 w-5 text-blue-600" weight="light" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-primary-900">{trend.metric}</h3>
                    <p className="text-sm text-primary-600">{trend.period}</p>
                  </div>
                </div>
                <div className={`font-medium ${
                  trend.trend === 'up' ? 'text-green-600' :
                  trend.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {trend.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

