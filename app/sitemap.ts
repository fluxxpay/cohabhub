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

  // Récupérer les espaces dynamiques depuis l'API
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    const response = await fetch(`${apiUrl}/api/spaces/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache pour éviter de surcharger l'API
      next: { revalidate: 3600 }, // Revalider toutes les heures
    });

    if (response.ok) {
      const data = await response.json();
      const spaces = Array.isArray(data) ? data : (data?.data || data?.results || []);
      
      dynamicRoutes = spaces
        .filter((space: any) => space.is_active !== false)
        .map((space: any) => ({
          url: `${baseUrl}/space/${space.id}`,
          lastModified: space.updated_at 
            ? new Date(space.updated_at) 
            : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des espaces pour le sitemap:', error);
    // Continuer sans les routes dynamiques en cas d'erreur
  }

  return [...staticRoutes, ...dynamicRoutes];
}

