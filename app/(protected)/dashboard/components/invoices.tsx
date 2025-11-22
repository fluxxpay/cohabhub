'use client';

import { useState, useEffect } from 'react';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarPageTitle,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Container } from '@/components/common/container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Receipt,
  Download,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Search,
  X,
  Users,
  Building,
  Loader2,
  FileCheck,
} from 'lucide-react';
import {
  InvoiceService,
  type Invoice,
  type InvoiceStats,
  InvoiceError,
} from '@/lib/services/invoices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Invoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total_invoices: 0,
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    paid_count: 0,
    pending_count: 0,
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'paid' | 'pending' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);
  const [isNormalizedModalOpen, setIsNormalizedModalOpen] = useState(false);
  const [invoiceToNormalize, setInvoiceToNormalize] = useState<Invoice | null>(null);
  const [normalizedForm, setNormalizedForm] = useState({
    first_name: '',
    last_name: '',
    ifu: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invoicesData, statsData] = await Promise.all([
        InvoiceService.getMyInvoices(),
        InvoiceService.getInvoiceStats(),
      ]);
      setInvoices(invoicesData);
      setStats(statsData);
    } catch (error) {
      if (error instanceof InvoiceError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du chargement des factures');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    setDownloadingInvoice(invoice.id);
    try {
      const blob = await InvoiceService.downloadInvoice(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `facture-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Facture téléchargée avec succès');
    } catch (error) {
      if (error instanceof InvoiceError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du téléchargement');
      }
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleRequestNormalizedInvoice = (invoice: Invoice) => {
    setInvoiceToNormalize(invoice);
    setNormalizedForm({
      first_name: invoice.user_details.name.split(' ')[0] || '',
      last_name: invoice.user_details.name.split(' ').slice(1).join(' ') || '',
      ifu: '',
      email: invoice.user_details.email || '',
      phone: invoice.user_details.phone || '',
    });
    setIsNormalizedModalOpen(true);
  };

  const handleSubmitNormalizedRequest = async () => {
    if (!invoiceToNormalize) return;

    if (!normalizedForm.first_name || !normalizedForm.last_name || !normalizedForm.ifu || !normalizedForm.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await InvoiceService.requestNormalizedInvoice(invoiceToNormalize.id, normalizedForm);
      toast.success(result.message);
      if (result.reference) {
        toast.info(`Référence: ${result.reference}`);
      }
      setIsNormalizedModalOpen(false);
      setInvoiceToNormalize(null);
    } catch (error) {
      if (error instanceof InvoiceError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la demande');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { variant: 'success' as const, label: 'Payée' };
      case 'pending':
        return { variant: 'warning' as const, label: 'En attente' };
      case 'draft':
        return { variant: 'secondary' as const, label: 'Brouillon' };
      default:
        return { variant: 'secondary' as const, label: status };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'draft':
        return FileText;
      default:
        return Clock;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesFilter =
      activeFilter === 'all' ||
      invoice.status === activeFilter ||
      (activeFilter === 'pending' && (invoice.status === 'pending' || invoice.status === 'draft'));
    const matchesSearch =
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { id: 'all' as const, label: 'Toutes', count: invoices.length },
    { id: 'paid' as const, label: 'Payées', count: invoices.filter((i) => i.status === 'paid').length },
    {
      id: 'pending' as const,
      label: 'En attente',
      count: invoices.filter((i) => i.status === 'pending' || i.status === 'draft').length,
    },
  ];

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Mes factures" />
            <ToolbarDescription>Consultez et téléchargez vos factures</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-5 lg:space-y-7.5">
          {/* Statistiques - Style Metronic */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total factures</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_invoices}</div>
                <p className="text-xs text-muted-foreground">Toutes vos factures</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Montant payé</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.paid_amount)} XOF</div>
                <p className="text-xs text-muted-foreground">Factures réglées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.pending_amount)} XOF</div>
                <p className="text-xs text-muted-foreground">À régler</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher une facture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Liste des factures */}
          {filteredInvoices.length > 0 ? (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const StatusIcon = getStatusIcon(invoice.status);
                const statusBadge = getStatusBadge(invoice.status);
                return (
                  <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{invoice.description}</h3>
                              <p className="text-sm text-muted-foreground">
                                Facture #{invoice.invoice_number}
                              </p>
                            </div>
                            <Badge variant={statusBadge.variant} appearance="light" className="flex items-center gap-1.5">
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{statusBadge.label}</span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Émise: {formatDate(invoice.issue_date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Échéance: {formatDate(invoice.due_date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-semibold text-foreground">
                                {formatCurrency(invoice.total_amount)} XOF
                              </span>
                            </div>
                            <div className="flex justify-center md:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRequestNormalizedInvoice(invoice)}
                              >
                                <FileCheck className="h-4 w-4 mr-2" />
                                Facture normalisée
                              </Button>
                            </div>
                          </div>

                          {invoice.items.length > 0 && (
                            <div className="bg-muted rounded-lg p-4">
                              <h4 className="font-medium mb-3">Détails</h4>
                              <div className="space-y-2">
                                {invoice.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="text-foreground">{item.name}</span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-muted-foreground">{item.quantity}</span>
                                      <span className="text-muted-foreground">
                                        {formatCurrency(item.unit_price)} XOF
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {formatCurrency(item.total_price)} XOF
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            mode="icon"
                            onClick={() => handleViewDetails(invoice)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            mode="icon"
                            onClick={() => handleDownloadInvoice(invoice)}
                            disabled={downloadingInvoice === invoice.id}
                            title="Télécharger"
                          >
                            {downloadingInvoice === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucune facture trouvée</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'Aucune facture ne correspond à votre recherche.'
                    : "Vous n'avez pas encore de factures."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>

      {/* Modal de détails */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
            <DialogDescription>Informations complètes de la facture</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* En-tête facture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedInvoice.description}</h3>
                  <p className="text-muted-foreground">Facture #{selectedInvoice.invoice_number}</p>
                  <Badge
                    variant={getStatusBadge(selectedInvoice.status).variant}
                    appearance="light"
                    className="mt-2"
                  >
                    {getStatusBadge(selectedInvoice.status).label}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Date d'émission: {formatDate(selectedInvoice.issue_date)}</p>
                  <p className="text-muted-foreground">Échéance: {formatDate(selectedInvoice.due_date)}</p>
                  <p className="text-lg font-semibold mt-2">
                    Total: {formatCurrency(selectedInvoice.total_amount)} XOF
                  </p>
                </div>
              </div>

              {/* Informations client et espace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Informations client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{selectedInvoice.user_details.name}</p>
                    <p className="text-muted-foreground">{selectedInvoice.user_details.email}</p>
                    {selectedInvoice.user_details.phone && (
                      <p className="text-muted-foreground">{selectedInvoice.user_details.phone}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Informations espace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{selectedInvoice.space_details.name}</p>
                    <p className="text-muted-foreground capitalize">{selectedInvoice.space_details.category}</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(selectedInvoice.space_details.price_hour)} XOF/heure
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Détails réservation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Détails de la réservation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-foreground">{selectedInvoice.reservation_details.event_name}</p>
                      <p className="text-muted-foreground">
                        Date: {formatDate(selectedInvoice.reservation_details.date)}
                      </p>
                      {selectedInvoice.reservation_details.start_time && (
                        <p className="text-muted-foreground">
                          Horaire: {selectedInvoice.reservation_details.start_time} -{' '}
                          {selectedInvoice.reservation_details.end_time}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selectedInvoice.reservation_details.attendees_count} participants
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détails des articles */}
              {selectedInvoice.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Détails de la facture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Quantité</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Prix unitaire</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedInvoice.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm">{item.name}</td>
                              <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-right">
                                {formatCurrency(item.unit_price)} XOF
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-right">
                                {formatCurrency(item.total_price)} XOF
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-sm font-medium text-right">
                              Total
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-right">
                              {formatCurrency(selectedInvoice.total_amount)} XOF
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informations de paiement */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <h4 className="font-medium">Informations de paiement</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cette facture est {selectedInvoice.status === 'paid' ? 'payée' : 'en attente de paiement'}.
                    {selectedInvoice.status !== 'paid' &&
                      ' Veuillez régler avant le ' + formatDate(selectedInvoice.due_date)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
            {selectedInvoice && (
              <Button onClick={() => handleDownloadInvoice(selectedInvoice)}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de facture normalisée */}
      <Dialog open={isNormalizedModalOpen} onOpenChange={setIsNormalizedModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réclamer une facture normalisée</DialogTitle>
            <DialogDescription>
              Remplissez vos informations pour recevoir une facture normalisée
            </DialogDescription>
          </DialogHeader>

          {invoiceToNormalize && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm">
                    <strong>Facture #{invoiceToNormalize.invoice_number}</strong>
                    <br />
                    {invoiceToNormalize.description}
                    <br />
                    Montant: {formatCurrency(invoiceToNormalize.total_amount)} XOF
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom *</label>
                  <Input
                    value={normalizedForm.first_name}
                    onChange={(e) =>
                      setNormalizedForm({ ...normalizedForm, first_name: e.target.value })
                    }
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={normalizedForm.last_name}
                    onChange={(e) =>
                      setNormalizedForm({ ...normalizedForm, last_name: e.target.value })
                    }
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">IFU (Identifiant Fiscal Unique) *</label>
                <Input
                  value={normalizedForm.ifu}
                  onChange={(e) => setNormalizedForm({ ...normalizedForm, ifu: e.target.value })}
                  placeholder="Votre numéro IFU"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail *</label>
                <Input
                  type="email"
                  value={normalizedForm.email}
                  onChange={(e) => setNormalizedForm({ ...normalizedForm, email: e.target.value })}
                  placeholder="votre@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  type="tel"
                  value={normalizedForm.phone}
                  onChange={(e) => setNormalizedForm({ ...normalizedForm, phone: e.target.value })}
                  placeholder="Votre numéro de téléphone"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNormalizedModalOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmitNormalizedRequest} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer la demande'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
