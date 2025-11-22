'use client';

import { motion } from 'framer-motion';
import { Warning, Clock, Spinner, Shield, UserGear, Key } from '@phosphor-icons/react';

interface AdminRefreshTokenModalProps {
  onConfirm: () => void;
  onDecline: () => void;
  timeRemaining: number;
  isRefreshing: boolean;
}

export default function AdminRefreshTokenModal({
  onConfirm,
  onDecline,
  timeRemaining,
  isRefreshing
}: AdminRefreshTokenModalProps) {
  // Couleur qui change selon l'urgence
  const getUrgencyColor = () => {
    if (timeRemaining > 30) return 'text-blue-600';
    if (timeRemaining > 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getUrgencyBg = () => {
    if (timeRemaining > 30) return 'bg-blue-50 border-blue-200';
    if (timeRemaining > 15) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getProgressBarColor = () => {
    if (timeRemaining > 30) return 'bg-blue-500';
    if (timeRemaining > 15) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border-2 ${getUrgencyBg()}`}
      >
        {/* En-tête Admin */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Session Admin
            </h2>
            <p className="text-sm text-gray-600">Sécurité de la session</p>
          </div>
        </div>

        {/* Compte à rebours visuel */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Temps restant:</span>
            <span className={`text-lg font-bold ${getUrgencyColor()}`}>
              {timeRemaining}s
            </span>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-3 rounded-full ${getProgressBarColor()} transition-colors duration-300`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeRemaining / 60) * 100}%` }}
              transition={{
                duration: 1,
                ease: "linear"
              }}
              style={{
                minWidth: '0%',
                maxWidth: '100%'
              }}
            />
          </div>

          {/* Légende de la barre */}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Expiré</span>
            <span>60s</span>
          </div>
        </div>

        {/* Message d'alerte */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Warning className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" weight="fill" />
            <div>
              <p className="text-sm text-yellow-800 font-medium mb-1">
                Sécurité administrateur
              </p>
              <p className="text-sm text-yellow-700">
                Votre session de gestion va expirer. Pour continuer à administrer l'espace de coworking, veuillez prolonger votre session.
              </p>
            </div>
          </div>
        </div>

        {/* Actions recommandées */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Key className="h-4 w-4 text-green-600" />
            <span>Prolonger - Continuer l'administration</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UserGear className="h-4 w-4 text-gray-500" />
            <span>Déconnexion - Fermer la session en sécurité</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onDecline}
            disabled={isRefreshing}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium order-2 sm:order-1"
          >
            Se déconnecter
          </button>
          <button
            onClick={onConfirm}
            disabled={isRefreshing}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 shadow-lg order-1 sm:order-2"
          >
            {isRefreshing ? (
              <>
                <Spinner className="h-4 w-4 animate-spin" />
                <span>Sécurisation...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Prolonger la session</span>
              </>
            )}
          </button>
        </div>

        {/* Note de sécurité */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Mesure de sécurité automatique - Session administrateur
          </p>
        </div>
      </motion.div>
    </div>
  );
}

