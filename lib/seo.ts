/**
 * Configuration SEO centralisée pour Cohab
 * Contient toutes les métadonnées, Open Graph, Twitter Cards, etc.
 */

import { Metadata } from 'next';

// Fonction pour obtenir l'URL de base côté serveur
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://cohabhub.com';
}

const baseUrl = getBaseUrl();

// Informations de base de l'entreprise
export const siteConfig = {
  name: 'Cohab',
  title: 'Cohab - Location d\'espaces de coworking et salles de réunion',
  description: 'Découvrez et réservez des espaces de coworking, salles de réunion et bureaux partagés. Trouvez l\'espace parfait pour votre équipe ou votre événement.',
  url: baseUrl,
  ogImage: `${baseUrl}/media/app/og-image.png`, // Image Open Graph
  twitterHandle: '@cohabhub', // À adapter
  locale: 'fr_FR',
  type: 'website',
  siteName: 'Cohab',
};

/**
 * Génère les métadonnées complètes pour une page
 */
export function generateMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
  nofollow = false,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  nofollow?: boolean;
}): Metadata {
  const pageTitle = title 
    ? `${title} | ${siteConfig.name}`
    : siteConfig.title;
  
  const pageDescription = description || siteConfig.description;
  const pageUrl = url ? `${baseUrl}${url}` : baseUrl;
  const pageImage = image || siteConfig.ogImage;
  const pageKeywords = keywords?.join(', ') || 'coworking, location espace, salle de réunion, bureau partagé, espace de travail';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://myapi.cohabhub.com';

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: type,
      locale: siteConfig.locale,
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.siteName,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: siteConfig.twitterHandle,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // À ajouter quand vous aurez les codes de vérification
      google: 'AVl6DcOVGEUR0GT66D_GR7Gcyey1_OeiEZIEM502Hv0',
      // yandex: 'your-yandex-verification-code',
      // bing: 'your-bing-verification-code',
    },
    other: {
      // Preconnect pour améliorer les performances
      'preconnect-api': apiUrl,
    },
  };
}

/**
 * Génère les structured data JSON-LD pour une organisation
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      // Ajoutez vos réseaux sociaux ici
      // 'https://www.facebook.com/cohabhub',
      // 'https://www.twitter.com/cohabhub',
      // 'https://www.linkedin.com/company/cohabhub',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      // availableLanguage: ['French', 'English'],
    },
  };
}

/**
 * Génère les structured data JSON-LD pour un service
 */
export function generateServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Location d\'espaces de coworking',
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Bénin',
    },
    description: siteConfig.description,
  };
}

/**
 * Génère les structured data JSON-LD pour un article/blog
 */
export function generateArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image || siteConfig.ogImage,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author || siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${url}`,
    },
  };
}

/**
 * Génère les structured data JSON-LD pour un produit/service (espace)
 */
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = 'XOF',
  availability = 'https://schema.org/InStock',
  url,
}: {
  name: string;
  description: string;
  image?: string;
  price?: number;
  currency?: string;
  availability?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    image: image || siteConfig.ogImage,
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: currency,
        availability: availability,
        url: `${baseUrl}${url}`,
      },
    }),
  };
}

/**
 * Génère les structured data JSON-LD pour un BreadcrumbList
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Génère les structured data JSON-LD pour un FAQPage
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

