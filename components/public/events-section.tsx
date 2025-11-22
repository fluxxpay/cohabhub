'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  ArrowRight,
  Monitor,
  BookOpen,
  Sparkle
} from '@phosphor-icons/react';
import { useEvents } from '@/hooks/useEvents';

export const EventsSection: React.FC = () => {
  const { getFeaturedEvents } = useEvents();
  const featuredEvents = getFeaturedEvents().slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPriceDisplay = (event: any) => {
    if (event.price === 'gratuit') {
      return 'Gratuit';
    }
    return `${event.price} XOF`;
  };

  return (
    <section id="events" className="py-24 bg-white relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-accent-100 rounded-full filter blur-[150px] opacity-10" />
        <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-primary-100 rounded-full filter blur-[120px] opacity-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-sm text-primary-500 uppercase tracking-wider mb-4"
          >
            Prochains événements
          </motion.p>
          <motion.h2 
            className="text-4xl md:text-5xl font-light text-primary-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="block mb-2">Événements &</span>
            <span className="font-light text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-600">
              formations
            </span>
          </motion.h2>
          <motion.p 
            className="text-lg text-primary-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Des événements pour développer vos compétences, 
            élargir votre réseau et rencontrer d'autres professionnels
          </motion.p>
        </div>

        {/* Grille d'événements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {featuredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <div 
                onClick={() => {
                  // Rediriger vers signup si non connecté, sinon vers dashboard avec onglet événements
                  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
                  if (!isAuthenticated) {
                    window.location.href = `/signup?redirect=${encodeURIComponent('/dashboard')}`;
                  } else {
                    // Pour l'instant, rediriger vers dashboard
                    // TODO: Créer une page dédiée aux événements
                    window.location.href = '/dashboard';
                  }
                }}
                className="cursor-pointer"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-100 h-full">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary-700 shadow-sm">
                        {event.category}
                      </span>
                    </div>
                    
                    {/* Prix */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        event.price === 'gratuit' 
                          ? 'bg-accent-500 text-white' 
                          : 'bg-white/90 backdrop-blur-sm text-primary-700'
                      }`}>
                        {getPriceDisplay(event)}
                      </span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    <h3 className="text-xl font-light text-primary-900 mb-2 group-hover:text-accent-600 transition-colors duration-300">
                      {event.title}
                    </h3>
                    <p className="text-primary-600 text-sm mb-4 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Détails */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-primary-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-sm text-primary-500">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{event.time} • {event.duration}</span>
                      </div>
                      <div className="flex items-center text-sm text-primary-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-primary-500">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{event.availableSeats}/{event.capacity} places</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-4 border-t border-primary-100">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-2.5 rounded-full text-sm font-light transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 ${
                          event.price === 'gratuit'
                            ? 'bg-accent-500 text-white hover:bg-accent-600'
                            : 'bg-primary-900 text-white hover:bg-primary-800'
                        }`}
                      >
                        <span>{event.price === 'gratuit' ? 'S\'inscrire' : 'Acheter un ticket'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={() => {
              // Rediriger vers signup si non connecté, sinon vers dashboard
              const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('auth-token');
              if (!isAuthenticated) {
                window.location.href = `/signup?redirect=${encodeURIComponent('/dashboard')}`;
              } else {
                window.location.href = '/dashboard';
              }
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-primary-900 text-white rounded-full text-lg font-light hover:bg-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto group"
          >
            <span>Découvrir tous les événements</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          
          <motion.p 
            className="text-primary-600 mt-4 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Découvrez tous nos événements • Inscription en ligne
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
