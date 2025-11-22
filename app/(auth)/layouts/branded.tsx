'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SpaceGalleryItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  imageDark?: string;
}

const spaces: SpaceGalleryItem[] = [
  {
    id: 1,
    name: 'Bureau Open Space',
    description: 'Espace collaboratif moderne et lumineux',
    price: 1500,
    image: '/media/images/2600x1600/Open-space3.jpg',
    imageDark: '/media/images/2600x1600/Open-space2.jpg',
  },
  {
    id: 2,
    name: 'Bureau Privatif',
    description: 'Confort et tranquillité pour un travail concentré',
    price: 3000,
    image: '/media/images/2600x1600/Bureau-privatif0.jpg',
    imageDark: '/media/images/2600x1600/Bureau-privatif.jpg',
  },
  {
    id: 3,
    name: 'Bureau king office',
    description: 'Bureau premium avec climatisation et parking en option pour 1 véhicule.',
    price: 7500,
    image: '/media/images/2600x1600/King-office.jpg',
    imageDark: '/media/images/2600x1600/King-office.jpg',
  },
];

export function BrandedLayout({ children }: { children: ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSpace = spaces[currentIndex];

  const nextSpace = () => {
    setCurrentIndex((prev) => (prev + 1) % spaces.length);
  };

  const prevSpace = () => {
    setCurrentIndex((prev) => (prev - 1 + spaces.length) % spaces.length);
  };

  return (
      <div className="grid lg:grid-cols-2 grow">
        <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1">
          <Card className="w-full max-w-[400px]">
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>

      <div className="order-1 lg:order-2 relative overflow-hidden min-h-[400px] lg:min-h-0">
        {/* Image de fond avec overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out"
          style={{
            backgroundImage: `url(${toAbsoluteUrl(currentSpace.image)})`,
          }}
        >
          {/* Image pour le mode sombre */}
          <div
            className="dark:block hidden absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out"
            style={{
              backgroundImage: `url(${toAbsoluteUrl(currentSpace.imageDark || currentSpace.image)})`,
            }}
          />
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/20 dark:from-background/80 dark:via-background/60 dark:to-background/40"></div>

        {/* Contenu */}
        <div className="relative flex flex-col h-full px-8 lg:px-16 pt-8 lg:pt-16 pb-8 lg:pb-16 gap-6 z-10">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <img
              src={toAbsoluteUrl('/logo_blue.png')}
              className="h-[40px] w-auto object-contain"
              alt="Cohab Logo"
            />
          </Link>

          {/* Informations de l'espace */}
          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-4xl font-bold text-foreground drop-shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {currentSpace.name}
              </h3>
                <p className="text-sm font-normal text-foreground/80 drop-shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {currentSpace.description}
                </p>
                <div className="text-xl font-normal text-primary drop-shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  à partir de {currentSpace.price.toLocaleString('fr-FR')} FCFA /Heure
                </div>
              </div>
            </div>
          </div>

          {/* Navigation de la galerie */}
          <div className="flex items-center justify-between gap-4 mt-4">
            {/* Indicateurs */}
            <div className="flex gap-2">
              {spaces.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-foreground/30 hover:bg-foreground/50'
                  }`}
                  aria-label={`Aller à l'espace ${index + 1}`}
                />
              ))}
            </div>

            {/* Boutons de navigation */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                mode="icon"
                onClick={prevSpace}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                aria-label="Espace précédent"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                mode="icon"
                onClick={nextSpace}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                aria-label="Espace suivant"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
