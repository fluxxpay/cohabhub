import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { generateProductSchema } from '@/lib/seo';
// SpaceService.getSpaceById utilise apiFetch (côté client), on utilise fetch directement côté serveur
import { SpaceDetailPage as SpaceDetailComponent } from '@/components/public/space-detail-page';
import { StructuredData } from '@/components/seo/structured-data';
// Fonction pour obtenir l'URL de l'API côté serveur
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://myapi.cohabhub.com';
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// Fonction pour récupérer un espace par ID ou slug
async function getSpaceByIdentifier(identifier: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiUrl = getApiUrl();
  
  // Si c'est un nombre, utiliser directement comme ID
  // Essayer d'abord la route API Next.js (proxy), puis l'endpoint Django direct
  if (!isNaN(parseInt(identifier)) && identifier === parseInt(identifier).toString()) {
    // Essayer d'abord la route API Next.js (qui fait le proxy)
    const nextApiUrl = `${baseUrl}/api/spaces/public/${parseInt(identifier)}`;
    const djangoUrl = `${apiUrl}/api/spaces/public/${parseInt(identifier)}/`;
    
    // Essayer d'abord la route Next.js (proxy)
    let response = await fetch(nextApiUrl, {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // Si la route Next.js n'existe pas ou échoue, essayer directement Django
    if (!response.ok && response.status === 404) {
      response = await fetch(djangoUrl, {
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json',
        },
      });
    }
    
    if (response.ok) {
      return response;
    }
  }
  
  // Sinon, chercher dans la liste des espaces pour trouver l'ID correspondant au slug
  try {
    // Essayer d'abord la route API Next.js (proxy)
    let listResponse = await fetch(`${baseUrl}/api/spaces/public`, {
      next: { revalidate: 3600 },
    });
    
    // Si la route Next.js n'existe pas, essayer directement Django
    if (!listResponse.ok && listResponse.status === 404) {
      listResponse = await fetch(`${apiUrl}/api/spaces/public/`, {
        next: { revalidate: 3600 },
      });
    }
    
    if (listResponse.ok) {
      const data = await listResponse.json();
      const spaces = Array.isArray(data) ? data : (data?.data || data?.results || []);
      
      // Chercher l'espace par slug, identifier, ou nom (normalisé)
      const normalizedIdentifier = identifier.toLowerCase().replace(/\s+/g, '-');
      
      const foundSpace = spaces.find((space: any) => {
        // Vérifier le slug si disponible
        if (space.slug) {
          const spaceSlug = space.slug.toLowerCase();
          if (spaceSlug === normalizedIdentifier) {
            return true;
          }
        }
        // Vérifier l'identifier si disponible
        if (space.identifier) {
          const spaceIdentifier = space.identifier.toLowerCase();
          if (spaceIdentifier === normalizedIdentifier) {
            return true;
          }
        }
        // Vérifier l'ID
        if (space.id?.toString() === identifier) {
          return true;
        }
        // Vérifier le nom normalisé
        const spaceName = (space.name || '').toLowerCase().replace(/\s+/g, '-');
        if (spaceName === normalizedIdentifier) {
          return true;
        }
        return false;
      });
      
      if (foundSpace && foundSpace.id) {
        // Récupérer l'espace par son ID numérique
        const response = await fetch(`${apiUrl}/api/spaces/public/${foundSpace.id}/`, {
          next: { revalidate: 3600 },
        });
        if (response.ok) {
          return response;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la recherche de l\'espace:', error);
  }

  // Dernier recours : essayer avec l'identifiant tel quel (peut être un slug supporté par l'API)
  return await fetch(`${apiUrl}/api/spaces/public/${identifier}/`, {
    next: { revalidate: 3600 },
  });
}

// Générer les metadata dynamiques pour chaque espace
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await getSpaceByIdentifier(id);

    if (!response.ok) {
      throw new Error('Espace non trouvé');
    }

    const responseData = await response.json();
    // Gérer le format de réponse de l'endpoint public (peut avoir une clé 'data')
    const spaceData = responseData.data || responseData;
    const apiUrl = getApiUrl();
    const space = {
      id: spaceData.id,
      name: spaceData.name,
      description: spaceData.description || '',
      category: spaceData.category,
      type: spaceData.type || 'general',
      capacity: spaceData.capacity || 0,
      location: spaceData.location || '',
      price_hour: parseFloat(spaceData.price_hour || 0),
      price_half_day: parseFloat(spaceData.price_half_day || 0),
      price_full_day: parseFloat(spaceData.price_full_day || 0),
      is_active: spaceData.is_active !== false,
      images: spaceData.photos?.map((p: any) => {
        const imageUrl = p.image_url || p.image;
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${apiUrl}/media/${imageUrl}`;
      }).filter(Boolean) || [],
    };
    
    const price = space.price_hour || space.price_full_day || space.price_half_day || 0;
    const description = space.description || `Découvrez ${space.name}, un espace de coworking ${space.category} à ${space.location}. Capacité: ${space.capacity} personnes.`;

    return generateSEOMetadata({
      title: `${space.name} | Cohab`,
      description: description,
      keywords: [
        space.name.toLowerCase(),
        space.category,
        space.type,
        'coworking',
        space.location,
        'location espace',
      ],
      image: space.images[0] || undefined,
      url: `/espaces/${id}`,
      type: 'website',
    });
  } catch (error) {
    return generateSEOMetadata({
      title: 'Espace non trouvé | Cohab',
      description: 'L\'espace demandé n\'existe pas.',
      noindex: true,
    });
  }
}

// Générer les paramètres statiques pour le SSG
export async function generateStaticParams() {
  try {
    const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/spaces/public/`, {
      next: { revalidate: 3600 }, // Revalider toutes les heures
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    // Gérer le format de réponse de l'endpoint public
    const spacesData = data.data || data.results || data;
    const spaces = Array.isArray(spacesData) ? spacesData : [spacesData];

    return spaces
      .filter((space: any) => space.is_active !== false)
      .map((space: any) => ({
        // Utiliser le slug s'il existe, sinon l'ID
        id: space.slug || space.identifier || space.id.toString(),
      }));
  } catch (error) {
    console.error('Erreur lors de la génération des paramètres statiques:', error);
    return [];
  }
}

export default async function SpaceDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const response = await getSpaceByIdentifier(id);

    if (!response.ok) {
      notFound();
    }

    const responseData = await response.json();
    // Gérer le format de réponse de l'endpoint public (peut avoir une clé 'data')
    const spaceData = responseData.data || responseData;
    const apiUrl = getApiUrl();
    const space = {
      id: spaceData.id,
      name: spaceData.name,
      description: spaceData.description || '',
      category: spaceData.category,
      type: spaceData.type || 'general',
      capacity: spaceData.capacity || 0,
      location: spaceData.location || '',
      price_hour: parseFloat(spaceData.price_hour || 0),
      price_half_day: parseFloat(spaceData.price_half_day || 0),
      price_full_day: parseFloat(spaceData.price_full_day || 0),
      is_active: spaceData.is_active !== false,
      status: (spaceData.is_active ? 'available' : 'maintenance') as 'available' | 'maintenance' | 'occupied' | undefined,
      options: spaceData.options?.map((opt: any) => ({
        id: opt.id || opt,
        name: opt.name || '',
        price: parseFloat(opt.price || 0),
        icon: opt.icon || '',
        category: opt.category || '',
        option_type: opt.option_type || 'non_variable',
      })) || [],
      images: spaceData.photos?.map((p: any) => {
        const imageUrl = p.image_url || p.image;
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${apiUrl}/media/${imageUrl}`;
      }).filter(Boolean) || [],
      rating: spaceData.rating || 4.5,
    };

    if (!space.is_active) {
      notFound();
    }

    // Générer le structured data Product
    const price = space.price_hour || space.price_full_day || space.price_half_day || 0;
    const productSchema = generateProductSchema({
      name: space.name,
      description: space.description || `${space.name} - ${space.category} à ${space.location}`,
      image: space.images[0],
      price: price,
      currency: 'XOF',
      availability: space.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `/espaces/${id}`,
    });

    return (
      <>
        <StructuredData data={productSchema} />
        <SpaceDetailComponent space={space} />
      </>
    );
  } catch (error) {
    console.error('Erreur lors du chargement de l\'espace:', error);
    notFound();
  }
}

