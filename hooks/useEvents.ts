import { useState, useEffect } from 'react';

export interface Event {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  duration: string;
  price: number | 'gratuit';
  ticketUrl?: string;
  capacity: number;
  availableSeats: number;
  organizer: string;
  organizerEmail: string;
  organizerPhone: string;
  category: 'conference' | 'workshop' | 'networking' | 'formation' | 'seminaire' | 'exposition';
  tags: string[];
  image: string;
  location: string;
  spaceId: string;
  features: string[];
  speakers?: {
    name: string;
    title: string;
    company: string;
    image: string;
  }[];
  agenda?: {
    time: string;
    title: string;
    speaker?: string;
    description: string;
  }[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline: string;
  isFeatured: boolean;
  createdAt: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchEvents = async () => {
      setLoading(true);
      
      // Données simulées d'événements réels
      const mockEvents: Event[] = [
        {
          id: "workshop-design-thinking-2024",
          title: "Workshop Design Thinking",
          description: "Apprenez les méthodologies de design thinking pour innover dans vos projets.",
          longDescription: "Un workshop intensif de 3 heures pour maîtriser les principes du design thinking. Vous découvrirez comment appliquer cette méthodologie innovante à vos projets professionnels et personnels. Animé par des experts du domaine avec des exercices pratiques et des cas d'usage concrets.",
          date: "2024-12-15",
          time: "14:00",
          duration: "3h",
          price: 15000,
          ticketUrl: "https://eventbrite.com/workshop-design-thinking",
          capacity: 20,
          availableSeats: 8,
          organizer: "Cohab Innovation Lab",
          organizerEmail: "events@cohab.bj",
          organizerPhone: "+229 90 00 00 00",
          category: "workshop",
          tags: ["Design Thinking", "Innovation", "Méthodologie", "Créativité"],
          image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center",
          location: "Salle polyvalente 25 pers.",
          spaceId: "salle-polyvalente-25",
          features: [
            "Matériel fourni",
            "Certificat de participation",
            "Networking inclus",
            "Café et rafraîchissements"
          ],
          speakers: [
            {
              name: "Marie Dubois",
              title: "Design Thinking Coach",
              company: "Innovation Studio",
              image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
            },
            {
              name: "Thomas Martin",
              title: "Product Manager",
              company: "Tech Solutions",
              image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
            }
          ],
          agenda: [
            {
              time: "14:00 - 14:30",
              title: "Introduction au Design Thinking",
              speaker: "Marie Dubois",
              description: "Présentation des principes fondamentaux"
            },
            {
              time: "14:30 - 15:30",
              title: "Exercices pratiques",
              speaker: "Thomas Martin",
              description: "Application sur un cas concret"
            },
            {
              time: "15:30 - 16:00",
              title: "Pause networking",
              description: "Échanges et questions"
            },
            {
              time: "16:00 - 17:00",
              title: "Projet final",
              description: "Travail en équipe sur un challenge"
            }
          ],
          status: "upcoming",
          registrationDeadline: "2024-12-14",
          isFeatured: true,
          createdAt: "2024-11-01"
        },
        {
          id: "networking-entrepreneurs-dec-2024",
          title: "Networking Entrepreneurs",
          description: "Rencontrez d'autres entrepreneurs et partagez vos expériences.",
          longDescription: "Une soirée networking exclusive pour entrepreneurs, startups et professionnels. L'occasion parfaite d'élargir votre réseau, de partager vos expériences et de découvrir de nouvelles opportunités de collaboration. Ambiance conviviale avec cocktail dînatoire.",
          date: "2024-12-18",
          time: "19:00",
          duration: "2h",
          price: "gratuit",
          capacity: 30,
          availableSeats: 5,
          organizer: "Cohab Community",
          organizerEmail: "community@cohab.bj",
          organizerPhone: "+229 90 00 00 00",
          category: "networking",
          tags: ["Networking", "Entrepreneurs", "Startup", "Collaboration"],
          image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&crop=center",
          location: "Espace détente",
          spaceId: "espace-detente",
          features: [
            "Cocktail dînatoire",
            "Speed networking",
            "Présentations flash",
            "Ambiance conviviale"
          ],
          status: "upcoming",
          registrationDeadline: "2024-12-17",
          isFeatured: true,
          createdAt: "2024-11-05"
        },
        {
          id: "conference-tech-trends-2025",
          title: "Conférence Tech Trends 2025",
          description: "Découvrez les tendances technologiques qui vont marquer l'année 2025.",
          longDescription: "Une conférence majeure sur les technologies émergentes et les tendances qui vont transformer l'industrie en 2025. IA, blockchain, réalité augmentée, et bien plus encore. Avec des experts internationaux et des démonstrations live.",
          date: "2024-12-22",
          time: "10:00",
          duration: "4h",
          price: 25000,
          ticketUrl: "https://eventbrite.com/tech-trends-2025",
          capacity: 60,
          availableSeats: 15,
          organizer: "Cohab Tech Hub",
          organizerEmail: "tech@cohab.bj",
          organizerPhone: "+229 90 00 00 00",
          category: "conference",
          tags: ["Technologie", "IA", "Innovation", "Futur"],
          image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center",
          location: "Auditorium",
          spaceId: "auditorium",
          features: [
            "Conférences d'experts",
            "Démonstrations live",
            "Q&A sessions",
            "Certificat de participation"
          ],
          speakers: [
            {
              name: "Dr. Sarah Johnson",
              title: "AI Research Director",
              company: "TechCorp",
              image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
            },
            {
              name: "Alex Chen",
              title: "Blockchain Expert",
              company: "CryptoLab",
              image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            }
          ],
          agenda: [
            {
              time: "10:00 - 10:30",
              title: "Accueil et introduction",
              description: "Présentation du programme"
            },
            {
              time: "10:30 - 11:30",
              title: "L'IA en 2025",
              speaker: "Dr. Sarah Johnson",
              description: "Nouvelles avancées et applications"
            },
            {
              time: "11:30 - 12:00",
              title: "Pause café",
              description: "Networking"
            },
            {
              time: "12:00 - 13:00",
              title: "Blockchain et Web3",
              speaker: "Alex Chen",
              description: "L'avenir de la décentralisation"
            }
          ],
          status: "upcoming",
          registrationDeadline: "2024-12-21",
          isFeatured: true,
          createdAt: "2024-11-10"
        },
        {
          id: "formation-marketing-digital",
          title: "Formation Marketing Digital",
          description: "Maîtrisez les outils du marketing digital pour développer votre business.",
          longDescription: "Formation complète de 2 jours sur les stratégies et outils du marketing digital. Du SEO au social media, en passant par l'email marketing et la publicité en ligne. Formation pratique avec des cas d'usage réels.",
          date: "2024-12-25",
          time: "09:00",
          duration: "2 jours",
          price: 45000,
          ticketUrl: "https://eventbrite.com/formation-marketing-digital",
          capacity: 15,
          availableSeats: 3,
          organizer: "Cohab Academy",
          organizerEmail: "academy@cohab.bj",
          organizerPhone: "+229 90 00 00 00",
          category: "formation",
          tags: ["Marketing", "Digital", "Formation", "Business"],
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center",
          location: "Salle de formation",
          spaceId: "salle-formation",
          features: [
            "Support de cours",
            "Exercices pratiques",
            "Certificat de formation",
            "Accompagnement post-formation"
          ],
          speakers: [
            {
              name: "Sophie Bernard",
              title: "Marketing Digital Manager",
              company: "Digital Agency",
              image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
            }
          ],
          status: "upcoming",
          registrationDeadline: "2024-12-24",
          isFeatured: false,
          createdAt: "2024-11-15"
        }
      ];
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvents(mockEvents);
      setLoading(false);
    };

    fetchEvents();
  }, [mounted]);

  const getEventById = (id: string): Event | undefined => {
    return events.find(event => event.id === id);
  };

  const getUpcomingEvents = (): Event[] => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate > now && event.status === 'upcoming';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getFeaturedEvents = (): Event[] => {
    return events.filter(event => event.isFeatured && event.status === 'upcoming');
  };

  const getEventsByCategory = (category: string): Event[] => {
    return events.filter(event => event.category === category && event.status === 'upcoming');
  };

  const searchEvents = (query: string): Event[] => {
    const lowercaseQuery = query.toLowerCase();
    return events.filter(event => 
      event.title.toLowerCase().includes(lowercaseQuery) ||
      event.description.toLowerCase().includes(lowercaseQuery) ||
      event.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  return {
    events,
    loading,
    getEventById,
    getUpcomingEvents,
    getFeaturedEvents,
    getEventsByCategory,
    searchEvents
  };
};

