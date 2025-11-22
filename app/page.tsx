'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { PublicHeader } from '@/components/public/header';
import { HeroSection } from '@/components/public/hero-section';
import { SpaceSection } from '@/components/public/space-section';
import { ServicesSection } from '@/components/public/services-section';
import { PricingSection } from '@/components/public/pricing-section';
import { EventsSection } from '@/components/public/events-section';
import { TestimonialsSection } from '@/components/public/testimonials-section';
import { ContactSection } from '@/components/public/contact-section';
import { PublicFooter } from '@/components/public/footer';
import { ScreenLoader } from '@/components/common/screen-loader';

export default function Home() {
  const { user, isLoading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return <ScreenLoader />;
  }

  // Afficher le site public pour tous (connectés ou non)
  // Les utilisateurs connectés peuvent naviguer vers le dashboard via le header
  return (
    <main className="min-h-screen public-site-container">
      <PublicHeader />
      <HeroSection />
      <SpaceSection />
      <ServicesSection />
      <PricingSection />
      <EventsSection />
      <TestimonialsSection />
      <ContactSection />
      <PublicFooter />
    </main>
  );
}

