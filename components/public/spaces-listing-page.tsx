'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Building,
  Users as UsersIcon,
  Monitor,
  House,
  MapPin,
  Users,
  Star,
  ArrowRight,
} from '@phosphor-icons/react';
import { useSpaces } from '@/hooks/useSpaces';
import { formatXof } from '@/utils/currency';

export function SpacesListingPage() {
  const { spaces, loading } = useSpaces();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const spaceTypes = [
    { id: 'cabine-individuelle', icon: Building, title: 'Bureaux privés' },
    { id: 'open-desk', icon: UsersIcon, title: 'Espaces collaboratifs' },
    { id: 'evenement', icon: Monitor, title: 'Salles événementielles' },
    { id: 'hebergement', icon: House, title: 'Hébergement' },
  ];

  const categories = Array.from(new Set(spaces.map(s => s.category)));

  const filteredSpaces = spaces.filter(space => {
    if (selectedType && space.type !== selectedType) return false;
    if (selectedCategory && space.category !== selectedCategory) return false;
    return true;
  });

  const getPriceDisplay = (space: any) => {
    if (space.price_hour > 0) {
      return `${formatXof(space.price_hour)}/heure`;
    } else if (space.price_half_day > 0) {
      return `${formatXof(space.price_half_day)}/demi-journée`;
    } else if (space.price_full_day > 0) {
      return `${formatXof(space.price_full_day)}/jour`;
    }
    return 'Sur demande';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-900 mb-4">
            Tous nos espaces de coworking
          </h1>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto">
            Découvrez notre sélection d'espaces de travail, salles de réunion et bureaux partagés
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-6 py-2 rounded-full transition-colors ${
              selectedType === null
                ? 'bg-primary-600 text-white'
                : 'bg-white text-primary-600 hover:bg-primary-50'
            }`}
          >
            Tous
          </button>
          {spaceTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-6 py-2 rounded-full transition-colors flex items-center gap-2 ${
                selectedType === type.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-primary-600 hover:bg-primary-50'
              }`}
            >
              <type.icon className="w-5 h-5" />
              {type.title}
            </button>
          ))}
        </div>

        {/* Liste des espaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpaces.map((space, index) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-primary-100"
            >
              <Link href={`/espaces/${space.id}`}>
                <div className="relative h-48 overflow-hidden cursor-pointer">
                  <img 
                    src={space.images[0] || '/placeholder-space.jpg'} 
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

                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                    {space.name}
                  </h3>
                  <p className="text-primary-600 text-sm mb-4 line-clamp-2">
                    {space.description}
                  </p>

                  <div className="flex items-center text-sm text-primary-500 mb-4 space-x-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{space.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{space.capacity} pers.</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-primary-900">
                      {getPriceDisplay(space)}
                    </div>
                    <ArrowRight className="w-5 h-5 text-accent-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredSpaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-primary-600">Aucun espace trouvé avec ces filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}

