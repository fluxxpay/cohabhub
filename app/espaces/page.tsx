import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { SpacesListingPage } from '@/components/public/spaces-listing-page';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Nos espaces de coworking | Cohab',
  description: 'Découvrez tous nos espaces de coworking, salles de réunion et bureaux partagés. Filtrez par type, capacité et prix pour trouver l\'espace parfait.',
  keywords: ['espaces coworking', 'liste espaces', 'bureaux partagés', 'salles de réunion', 'location espace bénin'],
  url: '/espaces',
});

export default function EspacesPage() {
  return <SpacesListingPage />;
}

