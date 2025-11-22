import { apiFetch } from '../api';

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
   * Récupère tous les espaces disponibles
   */
  static async getSpaces(): Promise<Space[]> {
    try {
      const result = await apiFetch('/api/spaces/', {
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
        images: space.photos?.map((p: any) => 
          p.image?.startsWith('http') ? p.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/media/${p.image}`
        ) || [],
        rating: space.rating || 4.5,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des espaces:', error);
      throw error;
    }
  }

  /**
   * Récupère un espace par son ID
   */
  static async getSpaceById(id: number): Promise<Space> {
    try {
      const result = await apiFetch(`/api/spaces/${id}/`, {
        method: 'GET',
      });

      if (!result.response?.ok) {
        throw new Error('Espace non trouvé');
      }

      const space = result.data as any;
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
        images: space.photos?.map((p: any) => 
          p.image?.startsWith('http') ? p.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/media/${p.image}`
        ) || [],
        rating: space.rating || 4.5,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'espace:', error);
      throw error;
    }
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

