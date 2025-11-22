'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Gear, 
  Building, 
  Users, 
  Bell, 
  Shield, 
  CreditCard,
  Globe,
  Palette,
  Database,
  Key,
  Eye,
  EyeSlash,
  Check,
  FloppyDisk
} from '@phosphor-icons/react';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Cohab Coworking',
    contactEmail: 'contact@cohab-coworking.fr',
    phoneNumber: '+229 01 62 00 00 00',
    address: '123 Rue de l\'Innovation, Abomey Calavi',
    timezone: 'Africa/Porto-Novo',
    currency: 'XOF',
    language: 'fr'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newUserAlerts: true,
    paymentAlerts: true,
    maintenanceAlerts: true,
    dailyReports: false,
    weeklyReports: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    auditLogs: true
  });

  const [billingSettings, setBillingSettings] = useState({
    autoInvoicing: true,
    paymentTerms: 30,
    lateFeePercentage: 5,
    taxRate: 20,
    currency: 'XOF',
    invoicePrefix: 'INV'
  });

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'Général',
      description: 'Paramètres de base de l\'entreprise',
      icon: Building
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configuration des alertes',
      icon: Bell
    },
    {
      id: 'security',
      title: 'Sécurité',
      description: 'Paramètres de sécurité',
      icon: Shield
    },
    {
      id: 'billing',
      title: 'Facturation',
      description: 'Configuration de la facturation',
      icon: CreditCard
    },
    {
      id: 'appearance',
      title: 'Apparence',
      description: 'Personnalisation de l\'interface',
      icon: Palette
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      description: 'Services tiers connectés',
      icon: Globe
    }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulation d'une sauvegarde - à adapter selon votre API
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Nom de l'entreprise *
          </label>
          <input
            type="text"
            value={generalSettings.companyName}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Email de contact *
          </label>
          <input
            type="email"
            value={generalSettings.contactEmail}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={generalSettings.phoneNumber}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Adresse
          </label>
          <input
            type="text"
            value={generalSettings.address}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Fuseau horaire
          </label>
          <select
            value={generalSettings.timezone}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Africa/Porto-Novo">Africa/Porto-Novo</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Devise
          </label>
          <select
            value={generalSettings.currency}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="XOF">XOF (CFA)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary-900">Canal de notification</h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700">Notifications par email</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notificationSettings.smsNotifications}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700">Notifications par SMS</span>
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary-900">Types d'alertes</h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notificationSettings.newUserAlerts}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, newUserAlerts: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700">Nouveaux utilisateurs</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notificationSettings.paymentAlerts}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentAlerts: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700">Alertes de paiement</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notificationSettings.maintenanceAlerts}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, maintenanceAlerts: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700">Maintenance</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-primary-900">Rapports automatiques</h3>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={notificationSettings.dailyReports}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailyReports: e.target.checked }))}
            className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-primary-700">Rapports quotidiens</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={notificationSettings.weeklyReports}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
            className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-primary-700">Rapports hebdomadaires</span>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={securitySettings.twoFactorAuth}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700 font-medium">Authentification à deux facteurs</span>
          </label>
          <p className="text-sm text-primary-600">Exige une vérification supplémentaire pour les connexions</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Timeout de session (minutes)
          </label>
          <input
            type="number"
            value={securitySettings.sessionTimeout}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="5"
            max="480"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Expiration du mot de passe (jours)
          </label>
          <input
            type="number"
            value={securitySettings.passwordExpiry}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="30"
            max="365"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Tentatives de connexion max
          </label>
          <input
            type="number"
            value={securitySettings.maxLoginAttempts}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="3"
            max="10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-900 mb-2">
          Liste blanche IP (optionnel)
        </label>
        <textarea
          value={securitySettings.ipWhitelist}
          onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
          className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Entrez les adresses IP autorisées, une par ligne"
        />
        <p className="text-sm text-primary-600 mt-1">Laissez vide pour autoriser toutes les IP</p>
      </div>

      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={securitySettings.auditLogs}
          onChange={(e) => setSecuritySettings(prev => ({ ...prev, auditLogs: e.target.checked }))}
          className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-primary-700">Activer les logs d'audit</span>
      </label>
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={billingSettings.autoInvoicing}
              onChange={(e) => setBillingSettings(prev => ({ ...prev, autoInvoicing: e.target.checked }))}
              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-primary-700 font-medium">Facturation automatique</span>
          </label>
          <p className="text-sm text-primary-600">Génère automatiquement les factures</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Conditions de paiement (jours)
          </label>
          <input
            type="number"
            value={billingSettings.paymentTerms}
            onChange={(e) => setBillingSettings(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            max="90"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Pénalité de retard (%)
          </label>
          <input
            type="number"
            value={billingSettings.lateFeePercentage}
            onChange={(e) => setBillingSettings(prev => ({ ...prev, lateFeePercentage: parseFloat(e.target.value) }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            max="20"
            step="0.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Taux de TVA (%)
          </label>
          <input
            type="number"
            value={billingSettings.taxRate}
            onChange={(e) => setBillingSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            max="50"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Préfixe des factures
          </label>
          <input
            type="text"
            value={billingSettings.invoicePrefix}
            onChange={(e) => setBillingSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            maxLength={10}
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'billing':
        return renderBillingSettings();
      case 'appearance':
        return (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 text-primary-400 mx-auto mb-4" weight="light" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">Personnalisation</h3>
            <p className="text-primary-600">Interface de personnalisation en cours de développement</p>
          </div>
        );
      case 'integrations':
        return (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-primary-400 mx-auto mb-4" weight="light" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">Intégrations</h3>
            <p className="text-primary-600">Configuration des services tiers en cours de développement</p>
          </div>
        );
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary-900 mb-2">Paramètres</h1>
          <p className="text-primary-600">Configuration du système</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            isSaving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-900 text-white hover:bg-primary-800'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sauvegarde...</span>
            </>
          ) : (
            <>
              <FloppyDisk className="h-5 w-5" weight="light" />
              <span>Sauvegarder</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation des sections */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <motion.button
                    key={section.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-900 text-white'
                        : 'text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" weight="light" />
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className={`text-xs ${isActive ? 'text-white text-opacity-80' : 'text-primary-500'}`}>
                        {section.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenu de la section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-light text-primary-900">
                {sections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-primary-600">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

