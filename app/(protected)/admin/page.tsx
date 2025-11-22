'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  House, Users, Buildings, Calendar, CreditCard, ChartLine, Gear, Bell,
  Gift, Package, ArrowRight, List, X, SignOut, User, CaretLeft
} from '@phosphor-icons/react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { ScreenLoader } from '@/components/common/screen-loader';
import AdminOverview from '@/components/admin/AdminOverview';
import UsersManagement from '@/components/admin/UsersManagement';
import SpacesManagement from '@/components/admin/SpacesManagement';
import ReservationsManagement from '@/components/admin/ReservationsManagement';
import BillingManagement from '@/components/admin/BillingManagement';
import Analytics from '@/components/admin/Analytics';
import AdminSettings from '@/components/admin/AdminSettings';
import Notifications from '@/components/admin/Notifications';
import ReferralManagement from '@/components/admin/ReferralManagement';
import OptionsManagement from '@/components/admin/OptionsManagement';

type AdminTab = 'overview' | 'users' | 'spaces' | 'reservations' | 'billing' | 'analytics' | 'settings' | 'notifications' | 'referrals' | 'options';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // Rediriger si pas connecté ou pas admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/signin?redirect=/admin');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return <ScreenLoader />;
  }

  // Ne rien afficher si pas connecté ou pas admin (redirection en cours)
  if (!user || user.role !== 'admin') {
    return null;
  }

  const navigationItems = [
    { id: 'overview' as AdminTab, name: 'Vue d\'ensemble', icon: House, description: 'Tableau de bord principal' },
    { id: 'users' as AdminTab, name: 'Utilisateurs', icon: Users, description: 'Gérer les utilisateurs' },
    { id: 'options' as AdminTab, name: 'Options', icon: Package, description: 'Gérer les services' },
    { id: 'spaces' as AdminTab, name: 'Espaces', icon: Buildings, description: 'Gérer les espaces' },
    { id: 'reservations' as AdminTab, name: 'Réservations', icon: Calendar, description: 'Gérer les réservations' },
    { id: 'billing' as AdminTab, name: 'Facturation', icon: CreditCard, description: 'Gérer la facturation' },
    { id: 'referrals' as AdminTab, name: 'Parrainage', icon: Gift, description: 'Gérer les parrainages' },
    { id: 'analytics' as AdminTab, name: 'Analytics', icon: ChartLine, description: 'Statistiques et rapports' },
    { id: 'notifications' as AdminTab, name: 'Notifications', icon: Bell, description: 'Gérer les notifications' },
    { id: 'settings' as AdminTab, name: 'Paramètres', icon: Gear, description: 'Configuration système' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': 
        return <AdminOverview />;
      case 'users': 
        return <UsersManagement />;
      case 'options': 
        return <OptionsManagement />;
      case 'spaces': 
        return <SpacesManagement />;
      case 'reservations': 
        return <ReservationsManagement />;
      case 'billing': 
        return <BillingManagement />;
      case 'referrals': 
        return <ReferralManagement />;
      case 'analytics': 
        return <Analytics />;
      case 'notifications': 
        return <Notifications />;
      case 'settings': 
        return <AdminSettings />;
      default: 
        return <AdminOverview />;
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 overflow-x-hidden w-full">
      {/* Header du dashboard admin */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md shadow-sm border-b border-primary-100 sticky top-0 z-40"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Bouton toggle sidebar desktop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <CaretLeft className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} weight="light" />
            </motion.button>

            {/* Bouton menu mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" weight="light" />
              ) : (
                <List className="h-6 w-6" weight="light" />
              )}
            </motion.button>

            {/* Logo et titre */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo_large.png"
                    alt="Cohab Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-light text-primary-900">Administration</h1>
                <p className="text-xs text-primary-600 hidden lg:block">Gestion de l'espace de coworking</p>
              </div>
            </div>
          </div>
          
          {/* Actions header */}
          <div className="flex items-center space-x-3">
            {/* Dropdown utilisateur */}
            <div className="hidden md:block relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" weight="light" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-primary-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-primary-600">Administrateur</p>
                </div>
                <motion.div
                  animate={{ rotate: userMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CaretLeft className="h-4 w-4 text-primary-600 rotate-90" weight="light" />
                </motion.div>
              </motion.button>

              {/* Menu dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setUserMenuOpen(false)}
                      className="fixed inset-0 z-10"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-primary-100 overflow-hidden z-20"
                    >
                      <div className="p-2">
                        {/* Info utilisateur dans le menu */}
                        <div className="px-4 py-3 border-b border-primary-100">
                          <p className="text-sm font-medium text-primary-900">{user?.name || 'Admin'}</p>
                          <p className="text-xs text-primary-600 mt-1">{user?.email}</p>
                          <p className="text-xs text-primary-500 mt-1">Administrateur</p>
                        </div>

                        {/* Options du menu */}
                        <div className="py-2">
                          <Link href="/dashboard">
                            <motion.button
                              whileHover={{ x: 4 }}
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                            >
                              <ArrowRight className="h-4 w-4 rotate-180" weight="light" />
                              <span>Vue utilisateur</span>
                            </motion.button>
                          </Link>
                          
                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <SignOut className="h-4 w-4" weight="light" />
                            <span>Se déconnecter</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Bouton utilisateur mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="md:hidden p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <User className="h-5 w-5" weight="light" />
            </motion.button>

            {/* Menu dropdown mobile */}
            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setUserMenuOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden fixed top-16 right-4 w-64 bg-white rounded-xl shadow-2xl border border-primary-100 overflow-hidden z-40"
                  >
                    <div className="p-2">
                      <div className="px-4 py-3 border-b border-primary-100">
                        <p className="text-sm font-medium text-primary-900">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-primary-600 mt-1">{user?.email}</p>
                        <p className="text-xs text-primary-500 mt-1">Administrateur</p>
                      </div>
                      <div className="py-2">
                        <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>
                          <motion.button
                            whileHover={{ x: 4 }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                          >
                            <ArrowRight className="h-4 w-4 rotate-180" weight="light" />
                            <span>Vue utilisateur</span>
                          </motion.button>
                        </Link>
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <SignOut className="h-4 w-4" weight="light" />
                          <span>Se déconnecter</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <div className="flex relative w-full overflow-x-hidden">
        {/* Sidebar Desktop */}
        <motion.aside
          className={`hidden lg:block bg-white shadow-xl transition-all duration-300 min-h-[calc(100vh-80px)] border-r border-primary-100 ${
            sidebarOpen ? 'w-72' : 'w-20'
          }`}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <nav className="p-4 lg:p-6 space-y-2 h-full overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 lg:p-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-lg'
                      : 'text-primary-700 hover:bg-primary-50 hover:text-primary-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-primary-600'}`} weight={isActive ? "regular" : "light"} />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-left overflow-hidden"
                      >
                        <div className="font-medium text-sm lg:text-base">{item.name}</div>
                        <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-primary-500'}`}>
                          {item.description}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </nav>
        </motion.aside>

        {/* Sidebar Mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-6 border-b border-primary-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10">
                        <Image
                          src="/logo_large.png"
                          alt="Cohab Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h2 className="text-lg font-light text-primary-900">Menu</h2>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg"
                    >
                      <X className="h-5 w-5" weight="light" />
                    </button>
                  </div>
                </div>
                <nav className="p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-900 to-primary-800 text-white shadow-lg'
                            : 'text-primary-700 hover:bg-primary-50'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" weight={isActive ? "regular" : "light"} />
                        <div className="text-left">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-primary-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </nav>
                <div className="p-4 border-t border-primary-100 mt-auto">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center space-x-3 p-4 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      <ArrowRight className="h-5 w-5 rotate-180" weight="light" />
                      <span className="text-sm font-medium">Vue utilisateur</span>
                    </motion.button>
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Contenu principal */}
        <motion.main
          className="flex-1 p-4 lg:p-6 xl:p-8 overflow-x-hidden overflow-y-auto min-h-[calc(100vh-80px)] w-full min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-full max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </motion.main>
      </div>
    </div>
  );
}

