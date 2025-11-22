'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { BillingService, type BillingOverview } from '@/lib/services/billing';
import { apiFetch } from '@/lib/api';
import {
  Wallet,
  ArrowUp,
  ArrowDown,
  Plus,
  CreditCard,
  TrendingUp,
  Receipt,
  EllipsisVertical,
  History,
  Download,
  Settings,
} from 'lucide-react';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';
import { WalletRechargePayment } from './wallet-recharge-payment';

interface WalletStatsRow {
  icon: typeof CreditCard;
  text: string;
  total: number;
  stats: number;
  increase: boolean;
}

interface WalletStatsItem {
  badgeColor: string;
  label: string;
}

export function WalletCard() {
  const searchParams = useSearchParams();
  const [billingOverview, setBillingOverview] = useState<BillingOverview | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const previousBalanceRef = useRef<number>(0);

  const fetchData = async () => {
    try {
      // Récupérer les statistiques de facturation
      const billing = await BillingService.getBillingOverview();
      setBillingOverview(billing);

      // Récupérer le bonus_balance depuis le profil utilisateur
      const profileResult = await apiFetch('/api/auth/profile/', {
        method: 'GET',
      });

      if (profileResult.response?.ok && profileResult.data) {
        // L'API retourne {success: true, data: {...}}
        const userData = profileResult.data.data || profileResult.data;
        
        // bonus_balance est maintenant inclus dans le serializer
        const balance = parseFloat(
          userData.bonus_balance?.toString() || 
          '0'
        );
        setBonusBalance(balance);
        previousBalanceRef.current = balance;
        
        // Récupérer les informations utilisateur pour FeexPay
        setUserEmail(userData.email || '');
        setUserName(`${userData.first_name || ''} ${userData.last_name || ''}`.trim());
        setUserPhone(userData.phone || '');
      } else {
        // Fallback: utiliser le balance du billing overview
        setBonusBalance(billing.balance || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données du portefeuille');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Rafraîchir le solde quand on arrive sur le dashboard depuis la page de callback
  useEffect(() => {
    const refreshWallet = searchParams?.get('refresh_wallet');
    
    if (refreshWallet === 'true') {
      console.log('🔄 Rafraîchissement du portefeuille demandé...');
      
      // Nettoyer l'URL immédiatement pour éviter les re-exécutions
      if (typeof window !== 'undefined') {
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]refresh_wallet=[^&]*/, '');
      window.history.replaceState({}, '', newUrl);
      }
      
      // Rafraîchir les données avec plusieurs tentatives pour s'assurer que le backend a traité
      // Le webhook backend peut prendre du temps à traiter, donc on augmente les tentatives
      const refreshWithRetry = async (retries = 10, delay = 3000) => {
        // Récupérer le solde actuel pour comparer
        const initialBalance = previousBalanceRef.current || bonusBalance;
        let previousBalance = initialBalance;
        let lastBalance = initialBalance;
        
        console.log(`🔄 Démarrage du rafraîchissement avec ${retries} tentatives (délai: ${delay}ms)`);
        console.log(`💰 Solde initial: ${initialBalance} XOF`);
        
        for (let i = 0; i < retries; i++) {
          console.log(`🔄 Tentative de rafraîchissement ${i + 1}/${retries}...`);
          
          // Attendre avant chaque tentative (sauf la première)
          if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          try {
            const profileResult = await apiFetch('/api/auth/profile/', {
              method: 'GET',
            });

            if (profileResult.response?.ok && profileResult.data) {
              // L'API retourne {success: true, data: {...}}
              const userData = profileResult.data.data || profileResult.data;
              const balance = parseFloat(
                userData.bonus_balance?.toString() || '0'
              );
              console.log(`💰 Solde récupéré: ${balance} XOF (initial: ${initialBalance} XOF, précédent: ${previousBalance} XOF)`);
              
              // Toujours mettre à jour le solde
              setBonusBalance(balance);
              previousBalanceRef.current = balance;
              lastBalance = balance;
              
              // Rafraîchir aussi les statistiques de facturation
              try {
                const billing = await BillingService.getBillingOverview();
                setBillingOverview(billing);
                console.log('✅ Statistiques de facturation rafraîchies');
              } catch (error) {
                console.error('Erreur lors du rafraîchissement des statistiques:', error);
              }
              
              // Si le solde a changé (augmenté), on peut arrêter les tentatives
              if (balance > initialBalance) {
                console.log(`✅ Solde mis à jour avec succès ! ${initialBalance} XOF -> ${balance} XOF (+${balance - initialBalance} XOF)`);
                toast.success(`Portefeuille rechargé ! Solde actuel: ${balance.toLocaleString()} XOF`);
                return;
              }
              
              previousBalance = balance;
            } else {
              console.error('❌ Erreur lors de la récupération du profil:', profileResult);
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la tentative ${i + 1}:`, error);
          }
        }
        
        // Après toutes les tentatives, vérifier une dernière fois
        console.log('🔄 Toutes les tentatives terminées. Vérification finale...');
        try {
          const finalResult = await apiFetch('/api/auth/profile/', {
            method: 'GET',
          });
          
          if (finalResult.response?.ok && finalResult.data) {
            // L'API retourne {success: true, data: {...}}
            const finalUserData = finalResult.data.data || finalResult.data;
            const finalBalance = parseFloat(
              finalUserData.bonus_balance?.toString() || '0'
            );
            setBonusBalance(finalBalance);
            previousBalanceRef.current = finalBalance;
            
            if (finalBalance > initialBalance) {
              console.log(`✅ Solde final mis à jour: ${initialBalance} XOF -> ${finalBalance} XOF`);
              toast.success(`Portefeuille rechargé ! Solde actuel: ${finalBalance.toLocaleString()} XOF`);
              return;
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la vérification finale:', error);
        }
        
        // Dernière tentative : forcer le rafraîchissement complet
        console.log('🔄 Dernière tentative : rafraîchissement complet...');
        await fetchData();
        
        // Afficher un message selon le cas
        if (lastBalance === initialBalance && initialBalance === 0) {
          console.warn('⚠️ Le solde n\'a pas été mis à jour après toutes les tentatives. Le webhook backend n\'a peut-être pas encore traité le paiement.');
          toast.warning('Le solde n\'a pas encore été mis à jour. Le paiement est peut-être encore en cours de traitement. Veuillez rafraîchir la page dans quelques instants.');
        } else if (lastBalance === initialBalance) {
          console.log('ℹ️ Le solde était déjà à jour');
        }
      };
      
      // Démarrer le rafraîchissement après un délai initial plus long pour laisser le webhook backend traiter
      // Le webhook peut prendre 5-10 secondes à être appelé et traité par FeexPay
      // FeexPay appelle d'abord le callback frontend, puis le webhook backend
      setTimeout(() => {
        refreshWithRetry();
      }, 5000);
    }
  }, [searchParams]);


  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    // Fermer le dialog de saisie et ouvrir le dialog de paiement FeexPay
    setRechargeDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  const handleRechargeSuccess = async () => {
    // Rafraîchir le solde après une recharge réussie
    try {
      // Attendre un peu pour que le webhook backend traite le paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const profileResult = await apiFetch('/api/auth/profile/', {
        method: 'GET',
      });

      if (profileResult.response?.ok && profileResult.data) {
        // L'API retourne {success: true, data: {...}}
        const userData = profileResult.data.data || profileResult.data;
        const balance = parseFloat(
          userData.bonus_balance?.toString() || '0'
        );
        console.log('💰 Nouveau solde du portefeuille:', balance);
        setBonusBalance(balance);
        previousBalanceRef.current = balance;
        
        // Rafraîchir aussi les statistiques de facturation
        try {
          const billing = await BillingService.getBillingOverview();
          setBillingOverview(billing);
        } catch (error) {
          console.error('Erreur lors du rafraîchissement des statistiques:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      // Réessayer une fois après un délai
      setTimeout(async () => {
        try {
          const profileResult = await apiFetch('/api/auth/profile/', {
            method: 'GET',
          });
          if (profileResult.response?.ok && profileResult.data) {
            // L'API retourne {success: true, data: {...}}
            const userData = profileResult.data.data || profileResult.data;
            const balance = parseFloat(
              userData.bonus_balance?.toString() || '0'
            );
            setBonusBalance(balance);
            previousBalanceRef.current = balance;
          }
        } catch (retryError) {
          console.error('Erreur lors de la deuxième tentative de mise à jour:', retryError);
        }
      }, 3000);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast.error('Vous devez être connecté pour exporter');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' 
          ? window.location.origin.replace(':3000', ':8000')
          : 'http://localhost:8000');

      const response = await fetch(`${apiUrl}/api/wallet/export/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_portefeuille_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export réussi');
      } else {
        toast.error('Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export des transactions');
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculer les statistiques pour les lignes
  const totalSpent = billingOverview?.total_spent || 0;
  const monthExpenses = billingOverview?.month_expenses || 0;
  const pendingInvoices = billingOverview?.pending_invoices || 0;

  // Calculer les variations (pour l'instant, on utilise des valeurs statiques)
  const monthChange = monthExpenses > 0 ? ((monthExpenses / totalSpent) * 100).toFixed(1) : '0';
  const monthIncrease = monthExpenses > 0;

  const rows: WalletStatsRow[] = [
    {
      icon: CreditCard,
      text: 'Total dépensé',
      total: Math.round(totalSpent / 1000), // En milliers
      stats: parseFloat(monthChange),
      increase: monthIncrease,
    },
    {
      icon: Receipt,
      text: 'Dépenses ce mois',
      total: Math.round(monthExpenses / 1000),
      stats: parseFloat(monthChange),
      increase: monthIncrease,
    },
    {
      icon: TrendingUp,
      text: 'Factures en attente',
      total: pendingInvoices,
      stats: 0,
      increase: false,
    },
  ];

  const items: WalletStatsItem[] = [
    { badgeColor: 'bg-green-500', label: 'Portefeuille' },
    { badgeColor: 'bg-primary', label: 'Dépenses' },
    { badgeColor: 'bg-yellow-500', label: 'En attente' },
  ];

  // Calculer les pourcentages pour les barres de progression
  const walletPercent = bonusBalance > 0 ? Math.min((bonusBalance / (totalSpent + bonusBalance)) * 100, 100) : 0;
  const spentPercent = totalSpent > 0 ? Math.min((totalSpent / (totalSpent + bonusBalance)) * 100, 100) : 0;
  const pendingPercent = pendingInvoices > 0 ? Math.min((pendingInvoices / 10) * 100, 15) : 0;

  const renderRow = (row: WalletStatsRow, index: number) => {
    const Icon = row.icon;
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="size-4.5 text-muted-foreground" />
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex items-center text-sm font-medium text-foreground gap-6">
          <span className="lg:text-right">
            {row.text.includes('Factures') 
              ? `${row.total}` 
              : `${row.total}k XOF`}
          </span>
          {row.stats > 0 && (
            <span className="flex items-center justify-end gap-1">
              {row.increase ? (
                <ArrowUp className="text-green-500 size-4" />
              ) : (
                <ArrowDown className="text-destructive size-4" />
              )}
              {row.stats}%
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderItem = (item: WalletStatsItem, index: number) => {
    return (
      <div key={index} className="flex items-center gap-1.5">
        <BadgeDot className={item.badgeColor} />
        <span className="text-sm font-normal text-foreground">
          {item.label}
        </span>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle>Portefeuille</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" mode="icon">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]" side="bottom" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard?tab=billing">
                    <History className="h-4 w-4" />
                    <span>Historique</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard?tab=billing">
                    <Receipt className="h-4 w-4" />
                    <span>Transactions</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard?tab=settings">
                    <Settings className="h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Recharger
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recharger mon portefeuille</DialogTitle>
                  <DialogDescription>
                    Entrez le montant que vous souhaitez ajouter à votre portefeuille.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Montant (XOF)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="5000"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      min="1000"
                      step="1000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRechargeDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleRecharge} disabled={recharging || !rechargeAmount}>
                    {recharging ? 'Rechargement...' : 'Payer avec FeexPay'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Dialog de paiement FeexPay */}
            {rechargeAmount && (
              <WalletRechargePayment
                amount={parseFloat(rechargeAmount)}
                customerEmail={userEmail}
                customerName={userName}
                customerPhone={userPhone}
                isOpen={paymentDialogOpen}
                onClose={() => {
                  setPaymentDialogOpen(false);
                  setRechargeAmount('');
                }}
                onRechargeSuccess={handleRechargeSuccess}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            Solde disponible
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-semibold text-mono">
              {bonusBalance.toLocaleString('fr-FR')} XOF
            </span>
            <Badge size="sm" variant="success" appearance="light">
              Actif
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-1.5">
          <div
            className="bg-green-500 h-2 rounded-xs"
            style={{ width: `${walletPercent}%` }}
          ></div>
          <div
            className="bg-primary h-2 rounded-xs"
            style={{ width: `${spentPercent}%` }}
          ></div>
          <div
            className="bg-yellow-500 h-2 rounded-xs"
            style={{ width: `${pendingPercent}%` }}
          ></div>
        </div>

        <div className="flex items-center flex-wrap gap-4 mb-1">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="border-b border-input"></div>

        <div className="grid gap-3">
          {rows.map((row, index) => {
            return renderRow(row, index);
          })}
        </div>
      </CardContent>
    </Card>
  );
}

