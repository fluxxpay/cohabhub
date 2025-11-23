'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MapPin,
  Users,
  Star,
  WifiHigh,
  Coffee,
  Printer,
  Monitor,
  Phone,
  Clock,
  Car,
  ArrowLeft,
  Calendar,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { formatXof } from '@/utils/currency';
import type { Space } from '@/lib/services/spaces';
import { PublicFooter } from '@/components/public/footer';

interface SpaceDetailPageProps {
  space: Space;
}

export function SpaceDetailPage({ space }: SpaceDetailPageProps) {
  const router = useRouter();

  const getPriceDisplay = () => {
    if (space.price_hour > 0) {
      return { label: 'Par heure', price: space.price_hour };
    } else if (space.price_half_day > 0) {
      return { label: 'Demi-journée', price: space.price_half_day };
    } else if (space.price_full_day > 0) {
      return { label: 'Journée complète', price: space.price_full_day };
    }
    return { label: 'Sur demande', price: 0 };
  };

  const priceInfo = getPriceDisplay();

  const handleReserve = () => {
    router.push(`/booking?space=${space.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header avec image de fond */}
      <header className="relative h-64 md:h-80 lg:h-96 overflow-hidden w-full">
        {/* Image de fond */}
        <div className="absolute inset-0">
          {space.images && space.images.length > 0 ? (
            <img
              src={space.images[0]}
              alt={space.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/media/images/2600x1600/hall.jpg')",
              }}
            />
          )}
          {/* Overlay sombre pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
        </div>
        
        {/* Contenu du header */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white hover:text-primary-200 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </button>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
              {space.name}
            </h1>
          </div>
        </div>
      </header>
      
      {/* Contenu principal */}
      <main className="py-8 w-full">
        {/* Conteneur boxed avec largeur maximale et centré */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* Images (si plus d'une image, afficher la galerie) */}
            {space.images && space.images.length > 1 && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
                <div className="grid grid-cols-2 gap-2 h-96">
                  {space.images.slice(0, 3).map((img, index) => (
                    <div key={index} className={index === 0 ? 'col-span-2' : ''}>
                      <img
                        src={img}
                        alt={`${space.name} - Vue ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h2 className="text-2xl font-bold text-primary-900 mb-4">Description</h2>
              <p className="text-primary-600 leading-relaxed">{space.description || 'Aucune description disponible.'}</p>
            </div>

            {/* Caractéristiques */}
            {space.options && space.options.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-primary-900 mb-4">Équipements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {space.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <WifiHigh className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="text-primary-700">{option.name || option}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Réservation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-8">
              
              <div className="flex items-center gap-4 mb-4 text-sm text-primary-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span>{space.rating}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{space.location}</span>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary-600">Capacité</span>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-primary-600" />
                    <span className="font-semibold">{space.capacity} personnes</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">Type</span>
                  <span className="font-semibold">{space.category}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-primary-600 mb-1">{priceInfo.label}</div>
                <div className="text-3xl font-bold text-primary-900">
                  {priceInfo.price > 0 ? formatXof(priceInfo.price) : 'Sur demande'}
                </div>
                {space.price_hour > 0 && space.price_full_day > 0 && (
                  <div className="text-sm text-primary-500 mt-2">
                    Journée complète: {formatXof(space.price_full_day)}
                  </div>
                )}
              </div>

              <Button
                onClick={handleReserve}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-6 text-lg font-semibold"
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Réserver maintenant
              </Button>

              <div className="mt-4 text-sm text-primary-600 text-center">
                Réservation instantanée • Annulation gratuite
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}

