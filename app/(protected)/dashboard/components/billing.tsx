'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Receipt,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Wallet,
  ArrowRight,
  CheckCircle,
  Clock,
  Plus,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  BillingService,
  type BillingOverview,
  type PaymentTransaction,
  type PaymentMethod,
  type UserPaymentMethod,
  type CreateUserPaymentMethodData,
  BillingError,
} from '@/lib/services/billing';
import { InvoiceService, type Invoice } from '@/lib/services/invoices';
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
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMethod, setNewMethod] = useState<CreateUserPaymentMethodData>({
    method: 0,
    method_name: '',
    details: { phone: '', email: '', last4: '', expiry: '' },
    is_default: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewData, transactionsData, invoicesData, userMethodsData, availableMethodsData] =
        await Promise.all([
          BillingService.getBillingOverview(),
          BillingService.getPaymentHistory(),
          InvoiceService.getMyInvoices(),
          BillingService.getUserPaymentMethods(),
          BillingService.getAvailablePaymentMethods(),
        ]);

      setOverview(overviewData);
      setTransactions(transactionsData);
      setPendingInvoices(invoicesData.filter((inv) => inv.status !== 'paid'));
      setPaymentMethods(userMethodsData);
      setAvailableMethods(availableMethodsData);
    } catch (error) {
      if (error instanceof BillingError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newMethod.method || !newMethod.method_name) {
      toast.error('Veuillez sélectionner une méthode de paiement');
      return;
    }

    // Validation selon le type de méthode
    const isMobileMoney =
      newMethod.method_name?.toLowerCase().includes('mobile') ||
      newMethod.method_name?.toLowerCase().includes('momo') ||
      newMethod.method_name?.toLowerCase().includes('mtn') ||
      newMethod.method_name?.toLowerCase().includes('orange') ||
      newMethod.method_name?.toLowerCase().includes('moov') ||
      newMethod.method_name?.toLowerCase().includes('flooz');

    const isFeexPay = newMethod.method_name?.toLowerCase().includes('feexpay');

    if (isMobileMoney && !newMethod.details?.phone) {
      toast.error('Veuillez saisir un numéro de téléphone Mobile Money');
      return;
    }

    if (isFeexPay && !newMethod.details?.email) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    if (!isMobileMoney && !isFeexPay && !newMethod.details?.last4) {
      toast.error('Veuillez saisir les derniers chiffres de la carte');
      return;
    }

    setIsSubmitting(true);
    try {
      const addedMethod = await BillingService.addUserPaymentMethod(newMethod);
      setPaymentMethods([...paymentMethods, addedMethod]);
      setIsPaymentModalOpen(false);
      setNewMethod({
        method: 0,
        method_name: '',
        details: { phone: '', email: '', last4: '', expiry: '' },
        is_default: false,
      });
      toast.success('Méthode de paiement ajoutée avec succès');
    } catch (error) {
      if (error instanceof BillingError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      return;
    }

    setIsDeleting(methodId);
    try {
      await BillingService.deleteUserPaymentMethod(methodId);
      setPaymentMethods(paymentMethods.filter((m) => m.id !== methodId));
      toast.success('Méthode supprimée avec succès');
    } catch (error) {
      if (error instanceof BillingError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
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
      if (error instanceof BillingError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du téléchargement');
      }
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
    const num = typeof amount === 'string' ? parseFloat(amount.replace(' XOF', '')) : amount;
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return { variant: 'success' as const, label: 'Payé' };
      case 'pending':
        return { variant: 'warning' as const, label: 'En attente' };
      default:
        return { variant: 'secondary' as const, label: status };
    }
  };

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
            <ToolbarPageTitle text="Facturation" />
            <ToolbarDescription>Gérez vos paiements, factures et méthodes de paiement</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="space-y-5 lg:space-y-7.5">
          {/* Statistiques - Style Metronic */}
          {overview && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Factures</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.total_invoices || 0}</div>
                  <p className="text-xs text-muted-foreground">Total factures</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dépenses ce mois</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(overview.month_expenses)} XOF</div>
                  <p className="text-xs text-muted-foreground">Ce mois-ci</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.pending_invoices}</div>
                  <p className="text-xs text-muted-foreground">Factures à régler</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(overview.total_spent)} XOF</div>
                  <p className="text-xs text-muted-foreground">Toutes dépenses</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
            {/* Transactions récentes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Transactions récentes</CardTitle>
                <CardDescription>Vos dernières transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {transactions.length > 0 ? (
                      transactions.slice(0, 10).map((transaction) => {
                        const statusBadge = getStatusBadge(transaction.status);
  return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-primary" />
                              </div>
      <div>
                                <h3 className="font-medium text-foreground">{transaction.description}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{formatDate(transaction.date)}</span>
                                  </span>
                                  <span className="text-muted-foreground">{transaction.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-foreground mb-1">{transaction.amount}</div>
                              <Badge variant={statusBadge.variant} appearance="light" size="sm">
                                {statusBadge.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucune transaction récente</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Factures en attente */}
            <Card>
              <CardHeader>
                <CardTitle>Factures en attente</CardTitle>
                <CardDescription>À régler</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {pendingInvoices.length > 0 ? (
                      pendingInvoices.map((invoice) => {
                        const statusBadge = getStatusBadge(invoice.status);
                        return (
                          <div
                            key={invoice.id}
                            className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-foreground text-sm">
                                {invoice.invoice_number}
                              </h3>
                              <span className="font-semibold text-foreground">
                                {formatCurrency(invoice.total_amount)} XOF
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Échéance: {formatDate(invoice.due_date)}</span>
                              </span>
                              <Badge variant={statusBadge.variant} appearance="light" size="sm">
                                {statusBadge.label}
                              </Badge>
      </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                mode="icon"
                                onClick={() => handleViewInvoice(invoice)}
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                mode="icon"
                                onClick={() => handleDownloadInvoice(invoice)}
                                title="Télécharger"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
      </div>
    </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Aucune facture en attente</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard?tab=invoices">
                      Voir toutes les factures
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Méthodes de paiement */}
          <Card>
            <CardHeader>
              <CardTitle>Méthodes de paiement</CardTitle>
              <CardDescription>Gérez vos méthodes de paiement enregistrées</CardDescription>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsPaymentModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{method.method_name}</h3>
                          {method.details?.phone && (
                            <p className="text-sm text-muted-foreground">{method.details.phone}</p>
                          )}
                          {method.details?.last4 && !method.details?.phone && (
                            <p className="text-sm text-muted-foreground">•••• {method.details.last4}</p>
                          )}
                          {method.details?.email && !method.details?.phone && !method.details?.last4 && (
                            <p className="text-sm text-muted-foreground">{method.details.email}</p>
                          )}
                          {method.details?.expiry && (
                            <p className="text-sm text-muted-foreground">Expire {method.details.expiry}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && (
                          <Badge variant="success" appearance="light" size="sm">
                            Par défaut
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          mode="icon"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={isDeleting === method.id}
                          title="Supprimer"
                        >
                          {isDeleting === method.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="mb-4">Aucune méthode de paiement enregistrée</p>
                  <Button variant="outline" onClick={() => setIsPaymentModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une méthode
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>

      {/* Modal d'ajout de méthode de paiement */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une méthode de paiement</DialogTitle>
            <DialogDescription>Enregistrez une nouvelle méthode de paiement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="method">Type de méthode *</Label>
              <Select
                value={newMethod.method ? String(newMethod.method) : ''}
                onValueChange={(value) => {
                  const selectedMethod = availableMethods.find((m) => m.id.toString() === value);
                  setNewMethod({
                    method: selectedMethod ? selectedMethod.id : 0,
                    method_name: selectedMethod ? selectedMethod.name : '',
                    details: { phone: '', email: '', last4: '', expiry: '' },
                    is_default: false,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une méthode" />
                </SelectTrigger>
                <SelectContent>
                  {availableMethods.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Champs conditionnels selon le type de méthode */}
            {newMethod.method_name?.toLowerCase().includes('mobile') ||
            newMethod.method_name?.toLowerCase().includes('momo') ||
            newMethod.method_name?.toLowerCase().includes('mtn') ||
            newMethod.method_name?.toLowerCase().includes('orange') ||
            newMethod.method_name?.toLowerCase().includes('moov') ||
            newMethod.method_name?.toLowerCase().includes('flooz') ? (
              // Champs pour Mobile Money
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone Mobile Money *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newMethod.details?.phone || ''}
                  onChange={(e) =>
                    setNewMethod({
                      ...newMethod,
                      details: { ...newMethod.details, phone: e.target.value },
                    })
                  }
                  placeholder="+229 XX XX XX XX"
                />
                <p className="text-xs text-muted-foreground">
                  Format international requis (ex: +229 97 12 34 56)
                </p>
              </div>
            ) : newMethod.method_name?.toLowerCase().includes('feexpay') ||
              newMethod.method_name?.toLowerCase().includes('email') ? (
              // Champs pour FeexPay / Email
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMethod.details?.email || ''}
                  onChange={(e) =>
                    setNewMethod({
                      ...newMethod,
                      details: { ...newMethod.details, email: e.target.value },
                    })
                  }
                  placeholder="votre@email.com"
                />
              </div>
            ) : (
              // Champs pour cartes bancaires
              <>
                <div className="space-y-2">
                  <Label htmlFor="last4">Derniers chiffres de la carte *</Label>
                  <Input
                    id="last4"
                    value={newMethod.details?.last4 || ''}
                    onChange={(e) =>
                      setNewMethod({
                        ...newMethod,
                        details: { ...newMethod.details, last4: e.target.value.replace(/\D/g, '').slice(0, 4) },
                      })
                    }
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Date d'expiration</Label>
                  <Input
                    id="expiry"
                    value={newMethod.details?.expiry || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setNewMethod({
                        ...newMethod,
                        details: { ...newMethod.details, expiry: value },
                      });
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={newMethod.is_default}
                onChange={(e) => setNewMethod({ ...newMethod, is_default: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_default" className="font-normal cursor-pointer">
                Définir comme méthode par défaut
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleAddPaymentMethod} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails de facture */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
            <DialogDescription>Informations complètes de la facture</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
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

              {selectedInvoice.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de la facture</CardTitle>
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
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
    </>
  );
}
