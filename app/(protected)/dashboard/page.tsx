'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardOverview from './components/overview';
import Reservations from './components/reservations';
import CalendarComponent from './components/calendar';
import Referral from './components/referral';
import Invoices from './components/invoices';
import Profile from './components/profile';
import Billing from './components/billing';
import SettingsPage from './components/settings';

type DashboardTab =
  | 'overview'
  | 'reservations'
  | 'calendar'
  | 'referral'
  | 'invoices'
  | 'profile'
  | 'billing'
  | 'settings';

const validTabs: DashboardTab[] = [
  'overview',
  'reservations',
  'calendar',
  'referral',
  'invoices',
  'profile',
  'billing',
  'settings',
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Lire le paramètre 'tab' depuis l'URL
  useEffect(() => {
    const tab = searchParams?.get('tab') as DashboardTab | null;
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      // Si pas de paramètre tab ou tab invalide, utiliser 'overview' par défaut
      setActiveTab('overview');
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'reservations':
        return <Reservations />;
      case 'referral':
        return <Referral />;
      case 'calendar':
        return <CalendarComponent />;
      case 'invoices':
        return <Invoices />;
      case 'profile':
        return <Profile />;
      case 'billing':
        return <Billing />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8">
      {renderContent()}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}

