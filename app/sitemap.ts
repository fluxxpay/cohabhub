import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cohabhub.com';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://myapi.cohabhub.com';

  // Pages statiques principales
  const staticRoutes = [
    {
      route: '',
      priority: 1.0,
      changeFrequency: 'daily' as const,
    },
    {
      route: '/signin',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      route: '/signup',
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      route: '/privacy-policy',
      priority: 0.3,
      changeFrequency: 'yearly' as const,
    },
    {
      route: '/terms',
      priority: 0.3,
      changeFrequency: 'yearly' as const,
    },
    {
      route: '/contact',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // Récupérer les espaces dynamiques depuis l'API publique (sans authentification)
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cohabhub.com';
    // Essayer d'abord la route API Next.js (proxy), puis Django direct
    let response = await fetch(`${baseUrl}/api/spaces/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });
    
    // Si la route Next.js n'existe pas, essayer directement Django
    if (!response.ok && response.status === 404) {
      response = await fetch(`${apiUrl}/api/spaces/public/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      });
    }

    if (response.ok) {
      const data = await response.json();
      const spaces = Array.isArray(data) ? data : (data?.data || data?.results || []);
      
      dynamicRoutes = spaces
        .filter((space: any) => space.is_active !== false)
        .map((space: any) => ({
          url: `${baseUrl}/espaces/${space.id}`,
          lastModified: space.updated_at 
            ? new Date(space.updated_at) 
            : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      
      // Ajouter la page de listing des espaces
      staticRoutes.push({
        url: `${baseUrl}/espaces`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      });
    }
  } catch (error) {
    // En mode build (Vercel), l'API peut ne pas être accessible - ignorer silencieusement
    // L'erreur est normale pendant le build statique, le sitemap sera régénéré à la demande
    if (process.env.NODE_ENV === 'development') {
      console.warn('Erreur lors de la récupération des espaces pour le sitemap:', error);
    }
    // Continuer sans les routes dynamiques en cas d'erreur
  }

  return [...staticRoutes, ...dynamicRoutes];
}

