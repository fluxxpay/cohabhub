'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { 
  Check, 
  Star, 
  Users, 
  Buildings, 
  Calendar,
  ArrowRight
} from '@phosphor-icons/react';
import { convertAndFormatEurToXof, formatXof } from '@/utils/currency';

export const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Flex",
      description: "Parfait pour les freelances et entrepreneurs",
      price: { monthly: 89, yearly: 79 },
      icon: Users,
      features: [
        "Accès à l'espace collaboratif",
        "WiFi haute performance",
        "Café & thé illimités",
        "50 pages d'impression par mois",
        "Accès de 8h à 18h",
        "Accès aux événements communautaires"
      ],
      popular: false,
      color: "from-accent-400 to-accent-600"
    },
    {
      name: "Pro",
      description: "Pour les équipes et professionnels exigeants",
      price: { monthly: 149, yearly: 129 },
      icon: Buildings,
      features: [
        "Tout du plan Flex",
        "Bureau dédié ou cabine privée",
        "Accès 24/7",
        "Impressions illimitées",
        "2 heures de salle de réunion par mois",
        "Adresse professionnelle",
        "Support prioritaire"
      ],
      popular: true,
      color: "from-primary-400 to-primary-600"
    },
    {
      name: "Enterprise",
      description: "Solutions sur mesure pour les grandes équipes",
      price: { monthly: 299, yearly: 249 },
      icon: Calendar,
      features: [
        "Tout du plan Pro",
        "Bureaux privatifs",
        "Salles de réunion illimitées",
        "Équipements dédiés",
        "Gestionnaire de compte",
        "Formations incluses",
        "Événements privés"
      ],
      popular: false,
      color: "from-success-400 to-success-600"
    }
  ];

  return (
    <section id="tarifs" ref={ref} className="py-20 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ float: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-64 h-64 bg-accent-100 rounded-full opacity-10 blur-3xl"
        />
        <motion.div
          animate={{ float: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-10 left-10 w-80 h-80 bg-primary-100 rounded-full opacity-10 blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display text-primary-900 mb-6">
            <span className="text-gradient-accent">Tarifs & forfaits</span>
          </h2>
          <p className="text-xl text-primary-600 max-w-3xl mx-auto mb-8 font-body">
            Des formules flexibles adaptées à tous les besoins, 
            sans engagement et avec un essai gratuit de 7 jours.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-primary-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 font-body ${
                billingCycle === 'monthly'
                  ? 'bg-white text-primary-900 shadow-sm'
                  : 'text-primary-600 hover:text-primary-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 font-body ${
                billingCycle === 'yearly'
                  ? 'bg-white text-primary-900 shadow-sm'
                  : 'text-primary-600 hover:text-primary-900'
              }`}
            >
              Annuel
              <span className="ml-1 text-xs bg-accent-100 text-accent-600 px-2 py-1 rounded-full">
                -10%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`relative bg-white rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-primary-100 ${
                plan.popular ? 'ring-2 ring-accent-200 shadow-medium' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="h-4 w-4" weight="fill" />
                    <span>Le plus populaire</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <plan.icon className="h-8 w-8 text-accent-600" weight="duotone" />
                </div>
                <h3 className="text-2xl font-display text-primary-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-primary-600 font-body">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-primary-900">{convertAndFormatEurToXof(plan.price[billingCycle])}</span>
                  <span className="text-primary-600 ml-2 font-body">
                    /{billingCycle === 'monthly' ? 'mois' : 'mois'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-accent-600 mt-2 font-body">
                    Facturé annuellement
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-accent-500 flex-shrink-0 mt-0.5" weight="fill" />
                    <span className="text-primary-600 font-body">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={() => {
                  // Rediriger vers signup si non connecté, sinon vers dashboard
                  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
                  if (!isAuthenticated) {
                    window.location.href = `/signup?redirect=${encodeURIComponent('/dashboard?tab=billing')}`;
                  } else {
                    window.location.href = '/dashboard?tab=billing';
                  }
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-6 rounded-full font-medium transition-all duration-300 font-body ${
                  plan.popular
                    ? 'bg-primary-900 text-white hover:bg-primary-800 shadow-lg hover:shadow-xl'
                    : 'bg-primary-50 text-primary-900 hover:bg-primary-100 border border-primary-200'
                }`}
              >
                Choisir {plan.name}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Tarifs détaillés des espaces */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-medium border border-primary-100 mb-8"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-display text-primary-900 mb-4">
              Tarifs des <span className="text-gradient-accent">espaces</span>
            </h3>
            <p className="text-primary-600 font-body max-w-2xl mx-auto">
              Tarifs flexibles selon la durée d'utilisation, adaptés à tous vos besoins
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-4 px-4 text-sm font-light text-primary-600 uppercase tracking-wider">Espace</th>
                  <th className="text-center py-4 px-4 text-sm font-light text-primary-600 uppercase tracking-wider">Heure</th>
                  <th className="text-center py-4 px-4 text-sm font-light text-primary-600 uppercase tracking-wider">Demi-journée</th>
                  <th className="text-center py-4 px-4 text-sm font-light text-primary-600 uppercase tracking-wider">Journée</th>
                  <th className="text-center py-4 px-4 text-sm font-light text-primary-600 uppercase tracking-wider">Hebdomadaire</th>
                  <th className="text-center py-4 px-4 text-sm font-light text-primary-600 uppercase tracking-wider">Mensuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {[
                  {
                    name: "Open space",
                    hourly: 1500,
                    halfDay: 5000,
                    fullDay: 10000,
                    weekly: 45000,
                    monthly: "A négocier"
                  },
                  {
                    name: "Bureau privatif",
                    hourly: 3000,
                    halfDay: 10000,
                    fullDay: 20000,
                    weekly: 80000,
                    monthly: null
                  },
                  {
                    name: "King Office",
                    hourly: 7500,
                    halfDay: 25000,
                    fullDay: 45000,
                    weekly: 150000,
                    monthly: null
                  },
                  {
                    name: "Salle Polyvalente",
                    hourly: 12500,
                    halfDay: 50000,
                    fullDay: 80000,
                    weekly: "A négocier",
                    monthly: null
                  }
                ].map((space, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                    className="hover:bg-primary-50 transition-colors duration-200"
                  >
                    <td className="py-4 px-4">
                      <span className="font-light text-primary-900">{space.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-light text-primary-700">{formatXof(space.hourly)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-light text-primary-700">{formatXof(space.halfDay)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-light text-primary-700">{formatXof(space.fullDay)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-light text-primary-700">
                        {typeof space.weekly === 'number' ? formatXof(space.weekly) : space.weekly}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-light text-primary-500 italic">
                        {space.monthly || '-'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-8 pt-6 border-t border-primary-200"
          >
            <p className="text-sm text-primary-600 font-light text-center">
              <span className="font-medium text-primary-700">Services inclus :</span> Climatisation, connexion internet, entretien, etc. inclus dans tous les tarifs
            </p>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-medium border border-primary-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Sans engagement",
                description: "Annulation à tout moment"
              },
              {
                title: "Essai gratuit",
                description: "7 jours d'essai gratuit"
              },
              {
                title: "Support disponible",
                description: "Assistance technique 24/7"
              },
              {
                title: "Flexibilité totale",
                description: "Changement de formule à tout moment"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                className="text-center"
              >
                <h4 className="text-lg font-display text-primary-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-primary-600 text-sm font-body">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};
