import { apiFetch } from '../api';
import { getApiUrl } from '../config';

export interface SpaceOption {
  id: number;
  name: string;
  price: number;
  icon?: string;
  category?: string;
  option_type?: string;
}

export interface Space {
  id: number;
  name: string;
  description: string;
  category: string;
  type?: string;
  capacity: number;
  location: string;
  price_hour: number;
  price_half_day: number;
  price_full_day: number;
  is_active: boolean;
  status?: 'available' | 'occupied' | 'maintenance';
  options: SpaceOption[];
  images?: string[];
  rating?: number;
}

export interface SpaceListResponse {
  success?: boolean;
  total?: number;
  data?: Space[];
  results?: Space[];
}

/**
 * Service pour gérer les espaces
 */
export class SpaceService {
  /**
   * Récupère tous les espaces disponibles (version publique - sans authentification)
   * Utilise l'endpoint public pour le SEO et les visiteurs non connectés
   */
  static async getSpaces(usePublicEndpoint: boolean = true): Promise<Space[]> {
    try {
      const apiUrl = getApiUrl();
      const endpoint = usePublicEndpoint ? '/api/spaces/public/' : '/api/spaces/';
      
      // Pour les endpoints publics, utiliser fetch directement (pas besoin d'authentification)
      if (usePublicEndpoint) {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des espaces');
        }

        const data = await response.json();
        const spacesData = data.data || data.results || data;
        
        // Parser et normaliser les espaces
        return this.normalizeSpaces(Array.isArray(spacesData) ? spacesData : [spacesData]);
      }
      
      // Pour les endpoints authentifiés, utiliser apiFetch
      const result = await apiFetch(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        throw new Error('Erreur lors du chargement des espaces');
      }

      const data = result.data as SpaceListResponse | Space[];

      // Gérer différents formats de réponse
      let spaces: Space[] = [];
      if (Array.isArray(data)) {
        spaces = data;
      } else if (data?.data) {
        spaces = data.data;
      } else if (data?.results) {
        spaces = data.results;
      }

      // Parser et normaliser les espaces
      return this.normalizeSpaces(spaces);
    } catch (error) {
      console.error('Erreur lors de la récupération des espaces:', error);
      throw error;
    }
  }

  /**
   * Normalise les données d'espaces depuis l'API vers le format attendu
   */
  private static normalizeSpaces(spaces: any[]): Space[] {
    return spaces.map((space: any) => ({
        id: space.id,
        name: space.name,
        description: space.description || '',
        category: space.category,
        type: space.type || 'general',
        capacity: space.capacity || 0,
        location: space.location || '',
        price_hour: parseFloat(space.price_hour || 0),
        price_half_day: parseFloat(space.price_half_day || 0),
        price_full_day: parseFloat(space.price_full_day || 0),
        is_active: space.is_active !== false,
        status: space.is_active ? 'available' : 'maintenance',
        options:
          space.options?.map((opt: any) => ({
            id: opt.id || opt,
            name: opt.name || '',
            price: parseFloat(opt.price || 0),
            icon: opt.icon || '',
            category: opt.category || '',
            option_type: opt.option_type || 'non_variable',
          })) || [],
        images: space.photos?.map((p: any) => {
          // Gérer les différents formats de photos
          const imageUrl = p.image_url || p.image;
          if (!imageUrl) return null;
          if (imageUrl.startsWith('http')) return imageUrl;
          const apiUrl = getApiUrl();
          return `${apiUrl}/media/${imageUrl}`;
        }).filter(Boolean) || [],
        rating: space.rating || 4.5,
      }));
  }

  /**
   * Récupère un espace par son ID (version publique - sans authentification)
   * Utilise l'endpoint public pour le SEO et les visiteurs non connectés
   */
  static async getSpaceById(id: number, usePublicEndpoint: boolean = true): Promise<Space> {
    try {
      const apiUrl = getApiUrl();
      const endpoint = usePublicEndpoint ? `/api/spaces/public/${id}/` : `/api/spaces/${id}/`;
      
      // Pour les endpoints publics, utiliser fetch directement (pas besoin d'authentification)
      if (usePublicEndpoint) {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Espace non trouvé');
        }

        const data = await response.json();
        const space = data.data || data;
        return this.normalizeSpace(space);
      }
      
      // Pour les endpoints authentifiés, utiliser apiFetch
      const result = await apiFetch(endpoint, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        throw new Error('Espace non trouvé');
      }

      const space = result.data as any;
      return this.normalizeSpace(space);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'espace:', error);
      throw error;
    }
  }

  /**
   * Normalise les données d'un espace depuis l'API vers le format attendu
   */
  private static normalizeSpace(space: any): Space {
    return {
        id: space.id,
        name: space.name,
        description: space.description || '',
        category: space.category,
        type: space.type || 'general',
        capacity: space.capacity || 0,
        location: space.location || '',
        price_hour: parseFloat(space.price_hour || 0),
        price_half_day: parseFloat(space.price_half_day || 0),
        price_full_day: parseFloat(space.price_full_day || 0),
        is_active: space.is_active !== false,
        status: space.is_active ? 'available' : 'maintenance',
        options:
          space.options?.map((opt: any) => ({
            id: opt.id || opt,
            name: opt.name || '',
            price: parseFloat(opt.price || 0),
            icon: opt.icon || '',
            category: opt.category || '',
            option_type: opt.option_type || 'non_variable',
          })) || [],
        images: space.photos?.map((p: any) => {
          // Gérer les différents formats de photos
          const imageUrl = p.image_url || p.image;
          if (!imageUrl) return null;
          if (imageUrl.startsWith('http')) return imageUrl;
          const apiUrl = getApiUrl();
          return `${apiUrl}/media/${imageUrl}`;
        }).filter(Boolean) || [],
        rating: space.rating || 4.5,
      };
  }

  /**
   * Récupère les créneaux réservés pour un espace
   */
  static async getReservedSlots(spaceId: number, date?: string): Promise<any[]> {
    try {
      const url = date
        ? `/api/spaces/${spaceId}/reserved/?date=${date}`
        : `/api/spaces/${spaceId}/reserved/`;
      
      const result = await apiFetch(url, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        throw new Error('Erreur lors de la récupération des créneaux réservés');
      }

      return result.data as any[];
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux réservés:', error);
      throw error;
    }
  }
}

