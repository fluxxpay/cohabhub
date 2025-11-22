'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DropdownMenu4 } from '@/partials/dropdown-menu/dropdown-menu-4';
import {
  Calendar,
  CalendarCheck,
  CreditCard,
  Home,
  Receipt,
  Search,
  Settings,
  UserCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SearchEmpty,
  SearchSettings,
  SearchSettingsItem,
  SearchNoResults,
} from './';
import { SearchService } from '@/lib/services/search';
import { Reservation } from '@/lib/services/reservations';
import { Space } from '@/lib/services/spaces';
import { Invoice } from '@/lib/services/invoices';
import {
  ReservationResultItem,
  SpaceResultItem,
  InvoiceResultItem,
  LoadingState,
  EmptyState,
} from './search-result-item';
import { toast } from 'sonner';

export function SearchDialog({ trigger }: { trigger: ReactNode }) {
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState('1');

  const debouncedSearch = useDebounce(searchInput, 500);

  // Recherche quand le texte change
  useEffect(() => {
    if (isOpen && debouncedSearch.trim().length >= 2) {
      performSearch(debouncedSearch);
    } else if (isOpen && debouncedSearch.trim().length === 0) {
      // Réinitialiser les résultats si la recherche est vide
      setReservations([]);
      setSpaces([]);
      setInvoices([]);
    }
  }, [debouncedSearch, isOpen]);

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      const results = await SearchService.globalSearch(query);
      console.log('🔍 Résultats de recherche:', {
        reservations: results.reservations.length,
        spaces: results.spaces.length,
        invoices: results.invoices.length,
      });
      setReservations(results.reservations);
      setSpaces(results.spaces);
      setInvoices(results.invoices);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const settingsItems = [
    {
      title: 'Raccourcis',
      children: [
        { icon: Home, info: 'Vue d\'ensemble' },
        { icon: Calendar, info: 'Mes réservations' },
        { icon: CalendarCheck, info: 'Calendrier' },
        { icon: UserCircle, info: 'Mon profil' },
        { icon: Settings, info: 'Paramètres' },
      ],
    },
    {
      title: 'Actions rapides',
      children: [
        { icon: Calendar, info: 'Nouvelle réservation' },
        { icon: Receipt, info: 'Mes factures' },
        { icon: CreditCard, info: 'Facturation' },
        { icon: Building2, info: 'Voir les espaces' },
      ],
    },
  ];

  const totalResults = reservations.length + spaces.length + invoices.length;
  const hasResults = totalResults > 0;
  const showEmpty = !loading && searchInput.trim().length >= 2 && !hasResults;
  const showInitial = !loading && searchInput.trim().length < 2;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="lg:max-w-[600px] lg:top-[15%] lg:translate-y-0 p-0 [&_[data-slot=dialog-close]]:top-5.5 [&_[data-slot=dialog-close]]:end-5.5">
        <DialogHeader className="px-4 py-1 mb-1">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 size-4" />
            <Input
              type="text"
              name="query"
              value={searchInput}
              className="ps-6 outline-none! ring-0! shadow-none! border-0"
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher des réservations, espaces, factures..."
              autoFocus
            />
          </div>
        </DialogHeader>
        <DialogBody className="p-0 pb-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="justify-between px-5 mb-2.5" variant="line">
              <div className="flex items-center gap-5">
                <TabsTrigger value="1">
                  Tout
                  {hasResults && (
                    <span className="ml-1.5 text-xs">({totalResults})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="2">Raccourcis</TabsTrigger>
                <TabsTrigger value="3">
                  Réservations
                  {reservations.length > 0 && (
                    <span className="ml-1.5 text-xs">({reservations.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="4">
                  Espaces
                  {spaces.length > 0 && (
                    <span className="ml-1.5 text-xs">({spaces.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="5">
                  Factures
                  {invoices.length > 0 && (
                    <span className="ml-1.5 text-xs">({invoices.length})</span>
                  )}
                </TabsTrigger>
              </div>

              <DropdownMenu4
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    size="sm"
                    className="mb-1.5 -me-2"
                  >
                    <Settings />
                  </Button>
                }
              />
            </TabsList>
            <ScrollArea className="h-[480px]">
              {/* Onglet Tout */}
              <TabsContent value="1" className="mt-0">
                {loading ? (
                  <LoadingState />
                ) : showEmpty ? (
                  <SearchNoResults />
                ) : showInitial ? (
                  <SearchEmpty />
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    {reservations.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                          Réservations ({reservations.length})
                        </h3>
                        <div className="flex flex-col gap-1">
                          {reservations.map((reservation) => (
                            <ReservationResultItem
                              key={reservation.id}
                              reservation={reservation}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {spaces.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                          Espaces ({spaces.length})
                        </h3>
                        <div className="flex flex-col gap-1">
                          {spaces.map((space) => (
                            <SpaceResultItem key={space.id} space={space} />
                          ))}
                        </div>
                      </div>
                    )}
                    {invoices.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                          Factures ({invoices.length})
                        </h3>
                        <div className="flex flex-col gap-1">
                          {invoices.map((invoice) => (
                            <InvoiceResultItem key={invoice.id} invoice={invoice} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Onglet Raccourcis */}
              <TabsContent value="2" className="mt-0">
                <SearchSettings items={settingsItems} />
              </TabsContent>

              {/* Onglet Réservations */}
              <TabsContent value="3" className="mt-0">
                {loading ? (
                  <LoadingState />
                ) : searchInput.trim().length < 2 ? (
                  <EmptyState message="Tapez au moins 2 caractères pour rechercher des réservations" />
                ) : reservations.length === 0 ? (
                  <EmptyState message="Aucune réservation trouvée" />
                ) : (
                  <div className="flex flex-col gap-1 px-2">
                    {reservations.map((reservation) => (
                      <ReservationResultItem
                        key={`reservation-${reservation.id}`}
                        reservation={reservation}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Onglet Espaces */}
              <TabsContent value="4" className="mt-0">
                {loading ? (
                  <LoadingState />
                ) : spaces.length === 0 ? (
                  <EmptyState message="Aucun espace trouvé" />
                ) : (
                  <div className="flex flex-col gap-1 px-2">
                    {spaces.map((space) => (
                      <SpaceResultItem key={space.id} space={space} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Onglet Factures */}
              <TabsContent value="5" className="mt-0">
                {loading ? (
                  <LoadingState />
                ) : invoices.length === 0 ? (
                  <EmptyState message="Aucune facture trouvée" />
                ) : (
                  <div className="flex flex-col gap-1 px-2">
                    {invoices.map((invoice) => (
                      <InvoiceResultItem key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
