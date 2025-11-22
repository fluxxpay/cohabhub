'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  WifiHigh, 
  Coffee, 
  Printer, 
  Monitor, 
  Phone, 
  Clock, 
  Users,
  Car,
  MapPin,
  Star,
  ArrowRight,
  Building,
  House,
  Users as UsersIcon
} from '@phosphor-icons/react';
import { useSpaces } from '@/hooks/useSpaces';
import { formatXof } from '@/utils/currency';

export const SpaceSection: React.FC = () => {
  const { spaces, loading } = useSpaces();

  const spaceTypes = [
    {
      icon: Building,
      title: "Bureaux privés",
      description: "Cabines individuelles et bureaux premium pour un travail concentré",
      count: spaces.filter(s => s.type === 'cabine-individuelle' || s.type === 'premium').length
    },
    {
      icon: UsersIcon,
      title: "Espaces collaboratifs", 
      description: "Open-desk et espaces partagés pour le networking",
      count: spaces.filter(s => s.type === 'open-desk').length
    },
    {
      icon: Monitor,
      title: "Salles événementielles",
      description: "Salles polyvalentes pour réunions et formations",
      count: spaces.filter(s => s.type === 'evenement').length
    },
    {
      icon: House,
      title: "Hébergement",
      description: "Appartements meublés pour séjours prolongés",
      count: spaces.filter(s => s.type === 'hebergement').length
    }
  ];

  const getSpaceIcon = (type: string) => {
    switch (type) {
      case 'cabine-individuelle':
        return Building;
      case 'open-desk':
        return UsersIcon;
      case 'premium':
        return Building;
      case 'evenement':
        return Monitor;
      case 'hebergement':
        return House;
      default:
        return Building;
    }
  };

  const getPriceDisplay = (space: any) => {
    if (space.type === 'hebergement') {
      return `${formatXof(space.price.nightly || 0)}/nuit`;
    }
    // Afficher le prix horaire comme prix de départ
    if (space.price.hourly) {
      return `À partir de ${formatXof(space.price.hourly)}/h`;
    }
    return 'Sur demande';
  };

  return (
    <section id="espace" className="py-20 bg-gradient-to-br from-primary-50 to-white relative overflow-hidden">
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
        {/* En-tête */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-display text-primary-900 mb-6"
          >
            Découvrez nos <span className="text-gradient-accent">espaces de travail</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-primary-600 max-w-3xl mx-auto font-body"
          >
            Des espaces flexibles conçus pour s'adapter à vos besoins, 
            de la cabine individuelle à la salle événementielle
          </motion.p>
        </div>

        {/* Types d'espaces */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {spaceTypes.map((type, index) => (
            <motion.div 
              key={index} 
              className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-primary-100 group"
              whileHover={{ y: -5, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-accent-50 rounded-xl group-hover:bg-accent-100 transition-colors duration-300">
                  <type.icon className="w-8 h-8 text-accent-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-display text-primary-900 group-hover:text-accent-600 transition-colors duration-300">{type.title}</h3>
                  <p className="text-sm text-primary-600">{type.count} espaces</p>
                </div>
              </div>
              <p className="text-primary-600 text-sm font-body">{type.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Espaces individuels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spaces.slice(0, 6).map((space, index) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-primary-100 h-full flex flex-col"
              whileHover={{ y: -5, scale: 1.01 }}
            >
              {/* Image */}
              <div className="block cursor-pointer" onClick={() => {
                if (space.type === 'evenement') {
                  window.location.href = '/events';
                } else {
                  // Rediriger vers booking avec l'ID de l'espace
                  window.location.href = `/booking?space=${space.id}`;
                }
              }}>
                <div className="relative h-48 overflow-hidden cursor-pointer">
                  <img 
                    src={space.images[0]} 
                    alt={space.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      {space.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium ml-1">{space.rating}</span>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-display text-primary-900 mb-2 group-hover:text-accent-600 transition-colors duration-300 cursor-pointer hover:text-accent-600"
                        onClick={() => {
                          if (space.type === 'evenement') {
                            window.location.href = '/events';
                          } else {
                            window.location.href = `/booking?space=${space.id}`;
                          }
                        }}>
                      {space.name}
                    </h3>
                    <p className="text-primary-600 text-sm mb-3 font-body">{space.description}</p>
                  </div>
                  <div className="p-2 bg-accent-50 rounded-lg group-hover:bg-accent-100 transition-colors duration-300">
                    {React.createElement(getSpaceIcon(space.type), { className: "w-6 h-6 text-accent-600" })}
                  </div>
                </div>

                {/* Caractéristiques */}
                <div className="flex items-center text-sm text-primary-500 mb-4 space-x-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{space.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{space.capacity}</span>
                  </div>
                </div>

                {/* Prix */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-lg font-semibold text-accent-600">
                      {getPriceDisplay(space)}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      // Si l'utilisateur n'est pas connecté, rediriger vers signup
                      const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
                      if (!isAuthenticated) {
                        window.location.href = `/signup?redirect=${encodeURIComponent(`/booking?space=${space.id}`)}`;
                      } else {
                        window.location.href = `/booking?space=${space.id}`;
                      }
                    }}
                    className="px-6 py-2 bg-primary-900 text-white rounded-full text-sm font-light hover:bg-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 group-hover:scale-105"
                  >
                    {space.type === 'evenement' ? 'Découvrir' : 'Réserver'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>

                {/* Équipements & Services */}
                <div className="border-t border-primary-100 pt-4">
                  <h4 className="text-sm font-display text-primary-900 mb-3">Équipements & Services</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {space.amenities.slice(0, 4).map((amenity, idx) => (
                      <div key={idx} className="flex items-center text-xs text-primary-600">
                        <div className="w-1.5 h-1.5 bg-accent-500 rounded-full mr-2"></div>
                        <span className="font-body">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <button 
            onClick={() => {
              // Rediriger vers booking pour voir tous les espaces
              const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
              if (!isAuthenticated) {
                window.location.href = `/signup?redirect=${encodeURIComponent('/booking')}`;
              } else {
                window.location.href = '/booking';
              }
            }}
            className="px-8 py-3 bg-primary-900 text-white rounded-full text-sm font-light flex items-center space-x-2 transition-all hover:bg-primary-800 shadow-lg hover:shadow-xl mx-auto hover:scale-105"
          >
            <span>Explorer tous nos espaces</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
