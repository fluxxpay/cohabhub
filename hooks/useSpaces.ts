import { useState, useEffect } from 'react';

export interface SpacePrice {
  hourly?: number;
  halfDay?: number;
  fullDay?: number;
  monthly?: number;
  nightly?: number;
  weekly?: number;
}

export interface SpaceOptions {
  parking?: {
    available: boolean;
    price: number;
  };
}

export interface Space {
  id: string;
  name: string;
  type: 'cabine-individuelle' | 'open-desk' | 'premium' | 'evenement' | 'hebergement';
  category: string;
  description: string;
  longDescription: string;
  price: SpacePrice;
  pricePeriod: string;
  size: string;
  capacity: string;
  location: string;
  features: string[];
  amenities: {
    icon: any;
    name: string;
    description: string;
  }[];
  images: string[];
  availability: string;
  rating: number;
  reviews: number;
  transport: {
    icon: any;
    name: string;
    description: string;
  }[];
  nearby: string[];
  options?: SpaceOptions;
  configurations?: string[];
  minStay?: number;
}

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Récupérer les espaces depuis l'API réelle
    const fetchSpaces = async () => {
      setLoading(true);
      
      try {
        // Utiliser SpaceService pour récupérer les espaces réels
        const { SpaceService } = await import('@/lib/services/spaces');
        const apiSpaces = await SpaceService.getSpaces();
        
        // Convertir les espaces de l'API au format attendu par le composant
        const convertedSpaces: Space[] = apiSpaces.map((apiSpace: any) => ({
          id: apiSpace.id.toString(), // Utiliser l'ID numérique comme string pour la compatibilité
          name: apiSpace.name,
          type: (apiSpace.type || 'general') as Space['type'],
          category: apiSpace.category,
          description: apiSpace.description || '',
          longDescription: apiSpace.description || '',
          price: {
            hourly: apiSpace.price_hour || 0,
            halfDay: apiSpace.price_half_day || 0,
            fullDay: apiSpace.price_full_day || 0,
            weekly: 0, // À calculer si nécessaire
          },
          pricePeriod: apiSpace.price_hour ? "/h" : apiSpace.price_full_day ? "/jour" : "",
          size: "", // Non disponible dans l'API
          capacity: apiSpace.capacity?.toString() || "0",
          location: apiSpace.location || '',
          features: [], // À mapper depuis options si nécessaire
          amenities: (apiSpace.options || []).map((opt: any) => ({
            icon: opt.icon || "Gear",
            name: opt.name || opt,
            description: "",
          })),
          images: apiSpace.images || [],
          availability: apiSpace.is_active ? "Disponible immédiatement" : "Non disponible",
          rating: apiSpace.rating || 4.5,
          reviews: 0,
          transport: [],
          nearby: [],
        }));
        
        setSpaces(convertedSpaces);
        setLoading(false);
        return; // Sortir si succès
      } catch (error) {
        console.error('Erreur lors du chargement des espaces depuis l\'API:', error);
        // Fallback sur les données mockées en cas d'erreur
      }
      
      // Données mockées en fallback
      const mockSpaces: Space[] = [
        {
          id: "bureau-privatif-1",
          name: "Bureau privatif 1 place",
          type: "cabine-individuelle",
          category: "Bureau Privé",
          description: "Cabine individuelle fermée pour un travail concentré et privé.",
          longDescription: "Espace de travail privé et confortable, idéal pour les freelances et entrepreneurs qui ont besoin de concentration. Équipé de tous les services essentiels.",
          price: {
            hourly: 3000,
            halfDay: 10000,
            fullDay: 20000,
            weekly: 80000
          },
          pricePeriod: "/h",
          size: "8m²",
          capacity: "1 personne",
          location: "1er étage",
          features: [
            "Cabine fermée avec clé",
            "Climatisation individuelle",
            "WiFi ultra-rapide (1 Gbps)",
            "Éclairage LED ajustable",
            "Bureau ergonomique",
            "Accès 24/7",
            "Café et thé illimités",
            "Impressions (50 pages/mois)"
          ],
          amenities: [
            { icon: "Wifi", name: "WiFi Ultra-rapide", description: "1 Gbps symétrique" },
            { icon: "Coffee", name: "Café Premium", description: "Machine à café professionnelle" },
            { icon: "Printer", name: "Impression", description: "50 pages/mois incluses" },
            { icon: "Monitor", name: "Écran 4K", description: "Écran 24\" 4K inclus" },
            { icon: "Phone", name: "Ligne téléphonique", description: "Numéro dédié inclus" },
            { icon: "Clock", name: "Accès 24/7", description: "Accès permanent avec badge" }
          ],
          images: [
            "/media/images/2600x1600/Bureau-privatif.jpg",
            "/media/images/2600x1600/Bureau-privatif0.jpg",
            "/media/images/2600x1600/hall.jpg"
          ],
          availability: "Disponible immédiatement",
          rating: 4.8,
          reviews: 24,
          transport: [
            { icon: "Motorcycle", name: "Moto", description: "Gozem, Yango (3 min)" },
            { icon: "Bus", name: "Transport en commun", description: "Bus locaux (5 min)" },
            { icon: "Car", name: "Voiture", description: "Parking sécurisé à 100m" },
            { icon: "Bicycle", name: "Vélo", description: "Accès vélo sécurisé" }
          ],
          nearby: [
            "Centre-ville (5 min à pied)",
            "Commerces (3 min à pied)",
            "Banques (2 min à pied)",
            "Restaurants (7 min à pied)"
          ]
        },
        {
          id: "bureau-partage-1",
          name: "Bureau partagé 1 place",
          type: "open-desk",
          category: "Espace Collaboratif",
          description: "Poste en open-desk dans un espace commun pour un travail collaboratif.",
          longDescription: "Espace de travail partagé dans un environnement dynamique et collaboratif. Parfait pour les freelances qui apprécient les échanges et le networking.",
          price: {
            hourly: 1500,
            halfDay: 5000,
            fullDay: 10000,
            weekly: 45000
          },
          pricePeriod: "/h",
          size: "Espace commun",
          capacity: "1 personne",
          location: "Rez-de-chaussée",
          features: [
            "Poste de travail ergonomique",
            "WiFi ultra-rapide (1 Gbps)",
            "Éclairage naturel",
            "Ambiance collaborative",
            "Accès 8h-18h",
            "Café et thé illimités",
            "Impressions (30 pages/mois)",
            "Événements networking"
          ],
          amenities: [
            { icon: "Wifi", name: "WiFi Ultra-rapide", description: "1 Gbps symétrique" },
            { icon: "Coffee", name: "Café Premium", description: "Machine à café professionnelle" },
            { icon: "Printer", name: "Impression", description: "30 pages/mois incluses" },
            { icon: "Users", name: "Communauté", description: "Réseau de professionnels" },
            { icon: "Clock", name: "Horaires flexibles", description: "8h-18h en semaine" }
          ],
          images: [
            "/media/images/2600x1600/Open-space2.jpg",
            "/media/images/2600x1600/Open-space3.jpg",
          ],
          availability: "Disponible immédiatement",
          rating: 4.6,
          reviews: 18,
          transport: [
            { icon: "Motorcycle", name: "Moto", description: "Gozem, Yango (3 min)" },
            { icon: "Bus", name: "Transport en commun", description: "Bus locaux (5 min)" },
            { icon: "Car", name: "Voiture", description: "Parking sécurisé à 100m" },
            { icon: "Bicycle", name: "Vélo", description: "Accès vélo sécurisé" }
          ],
          nearby: [
            "Centre-ville (5 min à pied)",
            "Commerces (3 min à pied)",
            "Banques (2 min à pied)",
            "Restaurants (7 min à pied)"
          ]
        },
        {
          id: "king-office-2",
          name: "King Office 1-2 places",
          type: "premium",
          category: "Bureau Premium",
          description: "Bureau premium avec climatisation et parking en option pour 1 véhicule.",
          longDescription: "Espace de travail premium offrant confort et professionnalisme. Idéal pour les consultants et petites équipes qui ont besoin d'un environnement de qualité.",
          price: {
            hourly: 7500,
            halfDay: 25000,
            fullDay: 45000,
            weekly: 150000
          },
          pricePeriod: "/h",
          size: "15m²",
          capacity: "1-2 personnes",
          location: "2ème étage",
          features: [
            "Bureau premium fermé",
            "Climatisation individuelle",
            "WiFi ultra-rapide (1 Gbps)",
            "Éclairage LED haut de gamme",
            "Mobilier ergonomique",
            "Accès 24/7",
            "Café et thé premium",
            "Impressions illimitées",
            "Parking en option"
          ],
          amenities: [
            { icon: "Wifi", name: "WiFi Ultra-rapide", description: "1 Gbps symétrique" },
            { icon: "Coffee", name: "Café Premium", description: "Machine à café professionnelle" },
            { icon: "Printer", name: "Impression", description: "Illimité" },
            { icon: "Monitor", name: "Écran 4K", description: "Écran 27\" 4K inclus" },
            { icon: "Phone", name: "Ligne téléphonique", description: "Numéro dédié inclus" },
            { icon: "Car", name: "Parking", description: "Place de parking en option" }
          ],
          images: [
            "/media/images/2600x1600/King-office.jpg",
            "/media/images/2600x1600/king-office2.jpg",
            "/media/images/2600x1600/King-office4.jpg"
          ],
          availability: "Disponible immédiatement",
          rating: 4.9,
          reviews: 32,
          transport: [
            { icon: "Motorcycle", name: "Moto", description: "Gozem, Yango (3 min)" },
            { icon: "Bus", name: "Transport en commun", description: "Bus locaux (5 min)" },
            { icon: "Car", name: "Voiture", description: "Parking sécurisé à 100m" },
            { icon: "Bicycle", name: "Vélo", description: "Accès vélo sécurisé" }
          ],
          nearby: [
            "Centre-ville (5 min à pied)",
            "Commerces (3 min à pied)",
            "Banques (2 min à pied)",
            "Restaurants (7 min à pied)"
          ],
          options: {
            parking: {
              available: true,
              price: 2000 // 2 000 XOF/jour
            }
          }
        },
        {
          id: "salle-polyvalente-25",
          name: "Salle polyvalente 25 pers.",
          type: "evenement",
          category: "Salle Événementielle",
          description: "Salle polyvalente pour réunions, formations et événements jusqu'à 25 personnes.",
          longDescription: "Espace modulable parfaitement adapté pour les réunions d'équipe, formations professionnelles et événements. Configuration flexible selon vos besoins.",
          price: {
            hourly: 12500,
            halfDay: 50000,
            fullDay: 80000,
            weekly: undefined
          },
          pricePeriod: "/h",
          size: "80m²",
          capacity: "25 personnes",
          location: "Rez-de-chaussée",
          features: [
            "Salle modulable 80m²",
            "Écran tactile 75\" 4K",
            "Système audio professionnel",
            "Vidéoconférence intégrée",
            "Tableau blanc interactif",
            "Climatisation",
            "Éclairage ajustable",
            "Café et rafraîchissements",
            "WiFi dédié",
            "Configuration flexible"
          ],
          amenities: [
            { icon: "Wifi", name: "WiFi Ultra-rapide", description: "1 Gbps symétrique" },
            { icon: "Coffee", name: "Café Premium", description: "Machine à café professionnelle" },
            { icon: "Printer", name: "Impression", description: "Illimité" },
            { icon: "Monitor", name: "Écran 4K", description: "Écran 75\" 4K inclus" },
            { icon: "Phone", name: "Vidéoconférence", description: "Système intégré" },
            { icon: "Users", name: "Configuration", description: "Théâtre, U, Banquet" }
          ],
          images: [
            "/media/images/2600x1600/poly.jpg",
            "/media/images/2600x1600/poly2.jpg",
            "/media/images/2600x1600/hall.jpg"
          ],
          availability: "Réservation flexible",
          rating: 4.7,
          reviews: 28,
          transport: [
            { icon: "Motorcycle", name: "Moto", description: "Gozem, Yango (3 min)" },
            { icon: "Bus", name: "Transport en commun", description: "Bus locaux (5 min)" },
            { icon: "Car", name: "Voiture", description: "Parking sécurisé à 100m" },
            { icon: "Bicycle", name: "Vélo", description: "Accès vélo sécurisé" }
          ],
          nearby: [
            "Centre-ville (5 min à pied)",
            "Commerces (3 min à pied)",
            "Banques (2 min à pied)",
            "Restaurants (7 min à pied)"
          ],
          configurations: ["théâtre", "U", "banquet"]
        },
        {
          id: "appartement-2-chambres",
          name: "Appartement 2 chambres salon",
          type: "hebergement",
          category: "Hébergement",
          description: "Appartement meublé 2 chambres avec salon pour séjours professionnels ou personnels.",
          longDescription: "Appartement confortable et entièrement équipé, idéal pour les séjours professionnels prolongés ou les événements privés. Séjour minimum de 3 nuitées.",
          price: {
            nightly: 25000,
            weekly: 150000,
            monthly: 500000
          },
          pricePeriod: "/nuit",
          size: "60m²",
          capacity: "4-6 personnes",
          location: "3ème étage",
          features: [
            "2 chambres avec lits doubles",
            "Salon spacieux",
            "Cuisine équipée",
            "Salle de bain privée",
            "WiFi ultra-rapide",
            "Climatisation",
            "Balcon avec vue",
            "Accès 24/7",
            "Ménage inclus",
            "Draps et serviettes fournis"
          ],
          amenities: [
            { icon: "Wifi", name: "WiFi Ultra-rapide", description: "1 Gbps symétrique" },
            { icon: "Coffee", name: "Café Premium", description: "Machine à café incluse" },
            { icon: "Printer", name: "Impression", description: "Service disponible" },
            { icon: "Monitor", name: "TV", description: "Écran 55\" 4K inclus" },
            { icon: "Phone", name: "Téléphone", description: "Ligne locale incluse" },
            { icon: "Clock", name: "Accès 24/7", description: "Accès permanent" }
          ],
          images: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&h=600&q=80",
            "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&h=600&q=80",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&h=600&q=80"
          ],
          availability: "Réservation flexible",
          rating: 4.8,
          reviews: 15,
          transport: [
            { icon: "Motorcycle", name: "Moto", description: "Gozem, Yango (3 min)" },
            { icon: "Bus", name: "Transport en commun", description: "Bus locaux (5 min)" },
            { icon: "Car", name: "Voiture", description: "Parking sécurisé à 100m" },
            { icon: "Bicycle", name: "Vélo", description: "Accès vélo sécurisé" }
          ],
          nearby: [
            "Centre-ville (5 min à pied)",
            "Commerces (3 min à pied)",
            "Banques (2 min à pied)",
            "Restaurants (7 min à pied)"
          ],
          minStay: 3
        }
      ];

      // Simuler un délai de chargement
      setTimeout(() => {
        setSpaces(mockSpaces);
        setLoading(false);
      }, 500);
    };

    fetchSpaces();
  }, [mounted]);

  const getSpaceById = (id: string): Space | undefined => {
    return spaces.find(space => space.id === id);
  };

  return {
    spaces,
    loading,
    getSpaceById
  };
};

