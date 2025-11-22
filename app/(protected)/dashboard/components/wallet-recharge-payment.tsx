'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { feexPayService, type FeexPayWalletRechargeRequest } from '@/lib/services/feexpay';
import { toast } from 'sonner';
import { FeexPayProvider, FeexPayButton } from '@feexpay/react-sdk';
import { apiFetch } from '@/lib/api';

interface WalletRechargePaymentProps {
  amount: number;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  isOpen: boolean;
  onClose: () => void;
  onRechargeSuccess?: () => void;
}

export function WalletRechargePayment({
  amount,
  customerEmail,
  customerName,
  customerPhone,
  isOpen,
  onClose,
  onRechargeSuccess,
}: WalletRechargePaymentProps) {
  const [initiating, setInitiating] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [formVisible, setFormVisible] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [rechargeId, setRechargeId] = useState<string | null>(null);
  const paymentStatusRef = useRef(paymentStatus);

  // Surveiller l'apparition du formulaire FeexPay
  useEffect(() => {
    if (!paymentConfig || initiating) return;

    const checkForm = () => {
      const container = document.getElementById('feexpay-wallet-recharge-container');
      if (container) {
        const hasForm = container.querySelector('iframe, form, [class*="feexpay"]:not(button)');
        if (hasForm) {
          setFormVisible(true);
          container.style.minHeight = '800px';
          container.style.paddingBottom = '4rem';
        }
      }
    };

    checkForm();
    const interval = setInterval(checkForm, 500);

    return () => clearInterval(interval);
  }, [paymentConfig, initiating]);

    // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setPaymentConfig(null);
      setError(null);
      setPaymentStatus('idle');
      setTransactionId(null);
      setRechargeId(null);
      // Nettoyer le localStorage des anciennes transactions
      localStorage.removeItem('wallet_recharge_transaction_id');
      localStorage.removeItem('wallet_recharge_id');
      initiateRecharge();
    }
  }, [isOpen, amount]);

  // Initier la recharge
  const initiateRecharge = async () => {
    setInitiating(true);
    setError(null);

    try {
      const request: FeexPayWalletRechargeRequest = {
        amount,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_type: 'MOBILE',
      };

      const response = await feexPayService.initiateWalletRecharge(request);
      
      console.log('📦 Réponse complète de l\'initiation:', response);
      
      // Extraire la configuration de paiement
      const config = response.payment?.payment_config;
      
      if (!config) {
        throw new Error('Configuration de paiement manquante');
      }

      setPaymentConfig(config);
      setPaymentStatus('pending');
      
      // Stocker le transaction_id et recharge_id si disponibles pour vérification ultérieure
      if (response.payment?.transaction_id) {
        setTransactionId(response.payment.transaction_id);
        // Stocker aussi dans localStorage pour pouvoir le récupérer après redirection
        localStorage.setItem('wallet_recharge_transaction_id', response.payment.transaction_id);
        console.log('💾 Transaction ID stocké:', response.payment.transaction_id);
      }
      
      if ((response as any).recharge_id) {
        const rechargeIdValue = (response as any).recharge_id;
        setRechargeId(rechargeIdValue);
        // Stocker aussi dans localStorage pour pouvoir le récupérer après redirection
        localStorage.setItem('wallet_recharge_id', rechargeIdValue);
        console.log('💾 Recharge ID stocké:', rechargeIdValue);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'initiation de la recharge:', error);
      setError(error.message || 'Erreur lors de l\'initiation de la recharge');
      setPaymentStatus('failed');
      toast.error(error.message || 'Erreur lors de l\'initiation de la recharge');
    } finally {
      setInitiating(false);
    }
  };

  // Fonction pour vérifier le statut de la transaction et mettre à jour le solde
  const checkTransactionStatusAndUpdateBalance = async (retries = 5, delay = 2000): Promise<void> => {
    if (!transactionId && !rechargeId) {
      console.warn('⚠️ Pas de transaction_id ou recharge_id disponible pour vérification');
      // Fallback: appeler le callback normal
      if (onRechargeSuccess) {
        onRechargeSuccess();
      }
      return;
    }

    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`🔍 Vérification du statut de la transaction (tentative ${i + 1}/${retries})...`);
        
        // Appeler l'endpoint backend pour vérifier le statut et mettre à jour le solde
        // On peut aussi passer le ref si on l'a (depuis l'URL de callback)
        const checkResult = await apiFetch('/api/feexpay/wallet-recharge/check-status/', {
          method: 'POST',
          body: JSON.stringify({
            transaction_id: transactionId,
            recharge_id: rechargeId,
            // Le ref peut être dans l'URL si le webhook a redirigé
            ref: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null,
          }),
        });

        if (checkResult.response?.ok && checkResult.data) {
          const data = checkResult.data;
          
          // Gérer les différents formats de réponse
          const responseData = data.data || data;
          
          if (responseData.success && responseData.status === 'successful') {
            console.log(`✅ Transaction confirmée ! Solde mis à jour: ${responseData.old_balance} XOF -> ${responseData.new_balance} XOF (+${responseData.amount} XOF)`);
            
            // Appeler le callback pour mettre à jour le solde dans le composant parent
            if (onRechargeSuccess) {
              onRechargeSuccess();
            }
            
            toast.success(`Portefeuille rechargé ! Solde actuel: ${responseData.new_balance.toLocaleString()} XOF`);
            return;
          } else if (responseData.status === 'pending') {
            console.log(`⏳ Transaction encore en attente (tentative ${i + 1}/${retries})`);
            // Continuer les tentatives
          } else if (responseData.status === 'failed') {
            console.error('❌ Transaction échouée');
            toast.error('Le paiement a échoué');
            return;
          } else {
            console.log(`ℹ️ Statut inconnu: ${responseData.status}, message: ${responseData.message}`);
          }
        } else {
          console.warn(`⚠️ Réponse invalide de check-status:`, checkResult);
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification du statut (tentative ${i + 1}):`, error);
        if (i === retries - 1) {
          // Dernière tentative échouée, on appelle quand même le callback
          console.warn('⚠️ Impossible de vérifier le statut après toutes les tentatives');
          if (onRechargeSuccess) {
            onRechargeSuccess();
          }
        }
      }
    }
    
    // Si toutes les tentatives ont échoué, appeler le callback quand même
    console.warn('⚠️ Vérification du statut terminée sans succès, appel du callback de fallback');
    if (onRechargeSuccess) {
      onRechargeSuccess();
    }
  };

  // Gérer la réponse du paiement
  const handlePaymentCallback = async (response: any) => {
    console.log('🔔 Réponse FeexPay pour recharge (callback):', response);
    console.log('🔔 Type de response:', typeof response);
    console.log('🔔 Clés de response:', Object.keys(response || {}));

    // Normaliser le statut - accepter différents formats (comme dans l'ancien frontend)
    const status = response?.status || response?.Status || response?.transaction_status || '';
    const normalizedStatus = String(status).toUpperCase();

    console.log('🔔 Statut normalisé:', normalizedStatus);

    if (
      normalizedStatus === 'SUCCESSFUL' || 
      normalizedStatus === 'SUCCESS' || 
      normalizedStatus === 'COMPLETED' ||
      normalizedStatus === 'PAID' ||
      response?.success === true ||
      status === 'success' // Format en minuscules aussi
    ) {
      console.log('✅ Paiement réussi détecté');
      setPaymentStatus('completed');
      
      toast.success(`Paiement confirmé ! Vérification du statut...`);
      
      // Vérifier le statut de la transaction et mettre à jour le solde
      // Cela garantit que le solde sera mis à jour même si le webhook n'est pas appelé
      await checkTransactionStatusAndUpdateBalance();
      
      // Ne pas nettoyer le localStorage ici car la page de callback en a besoin
      // Il sera nettoyé dans la page de callback après vérification réussie
      
      // Rediriger vers la page de callback qui gérera le rafraîchissement
      setTimeout(() => {
        window.location.href = `/payment/callback?recharge_status=success&amount=${amount}`;
      }, 2000);
    } else if (
      normalizedStatus === 'FAILED' || 
      normalizedStatus === 'FAILURE' ||
      normalizedStatus === 'ERROR' ||
      response?.success === false ||
      status === 'failed' // Format en minuscules aussi
    ) {
      console.log('❌ Paiement échoué détecté');
      setPaymentStatus('failed');
      setError('Le paiement a échoué. Veuillez réessayer.');
      toast.error('Le paiement a échoué');
    } else {
      console.log('⏳ Statut pending ou inconnu:', normalizedStatus);
      // Si le statut n'est pas clair, rediriger vers la page de callback qui fera le polling
      setPaymentStatus('pending');
      setTimeout(() => {
        window.location.href = `/payment/callback?recharge_status=pending&amount=${amount}`;
      }, 2000);
    }
  };

  // Mettre à jour la ref quand paymentStatus change
  useEffect(() => {
    paymentStatusRef.current = paymentStatus;
  }, [paymentStatus]);

  // Vérifier périodiquement le statut du paiement si le callback ne se déclenche pas
  useEffect(() => {
    if (paymentStatus === 'pending' && paymentConfig && (transactionId || rechargeId)) {
      console.log('⏰ Démarrage de la vérification périodique du statut...');
      
      let attemptCount = 0;
      const maxAttempts = 20; // 20 tentatives = 100 secondes max
      
      const checkInterval = setInterval(async () => {
        attemptCount++;
        try {
          console.log(`⏰ Vérification du statut du paiement (tentative ${attemptCount}/${maxAttempts})...`);
          
          // Vérifier le statut via l'API backend
          await checkTransactionStatusAndUpdateBalance(1, 0); // 1 tentative immédiate
          
          // Si le paiement est confirmé, checkTransactionStatusAndUpdateBalance aura appelé onRechargeSuccess
          // et redirigé, donc on peut arrêter la vérification
          if (paymentStatusRef.current === 'completed') {
            console.log('✅ Paiement confirmé via vérification périodique');
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du statut:', error);
        }
        
        // Arrêter après maxAttempts
        if (attemptCount >= maxAttempts) {
          console.log('⏰ Arrêt de la vérification périodique après toutes les tentatives');
          clearInterval(checkInterval);
          
          // Permettre à l'utilisateur de fermer et vérifier manuellement
          toast.warning('Vérification terminée. Vous pouvez fermer cette fenêtre et vérifier votre portefeuille.');
        }
      }, 5000); // Vérifier toutes les 5 secondes

      return () => {
        clearInterval(checkInterval);
      };
    }
  }, [paymentStatus, paymentConfig, transactionId, rechargeId]);

  // Charger le CSS de FeexPay de manière conditionnelle
  useEffect(() => {
    if (isOpen && paymentConfig) {
      // @ts-ignore
      import('@feexpay/react-sdk/style.css').then(() => {
        // CSS chargé
      }).catch(() => {
        // Ignorer les erreurs de chargement CSS
      });
    }
  }, [isOpen, paymentConfig]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[95vh] overflow-y-auto"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '95vh',
        }}
      >
        <DialogHeader>
          <DialogTitle>Recharger mon portefeuille</DialogTitle>
          <DialogDescription>
            Montant à recharger : <strong>{amount.toLocaleString()} XOF</strong>
          </DialogDescription>
        </DialogHeader>

        {initiating && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Initialisation du paiement...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'completed' && (
          <Alert>
            <CheckCircle className="size-4" />
            <AlertDescription>
              Recharge effectuée avec succès ! Votre portefeuille a été crédité.
            </AlertDescription>
          </Alert>
        )}

        {paymentConfig && !initiating && paymentStatus !== 'completed' && (
          <div className="space-y-4">
            <div
              id="feexpay-wallet-recharge-container"
              className="flex justify-center items-center min-h-[400px]"
            >
              <FeexPayProvider>
                <FeexPayButton
                  id={paymentConfig.id}
                  token={paymentConfig.token}
                  amount={paymentConfig.amount}
                  mode={paymentConfig.mode}
                  currency={paymentConfig.currency}
                  customId={paymentConfig.custom_id}
                  callback={handlePaymentCallback}
                  callback_url={paymentConfig.callback_url}
                  error_callback_url={paymentConfig.error_callback_url}
                  description={paymentConfig.description || `Recharge portefeuille ${amount} XOF`}
                  callback_info={{
                    email: customerEmail,
                    fullname: customerName,
                    phone: customerPhone,
                  }}
                  case={paymentConfig.payment_type || 'MOBILE'}
                />
              </FeexPayProvider>
            </div>
            
            {paymentStatus === 'pending' && (
              <div className="text-center py-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  ⏳ En attente de confirmation du paiement...
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Si vous avez déjà effectué le paiement, vous pouvez fermer cette fenêtre. 
                  Le portefeuille sera mis à jour automatiquement dans quelques instants.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Rafraîchir le solde manuellement
                    if (onRechargeSuccess) {
                      onRechargeSuccess();
                    }
                    onClose();
                  }}
                >
                  Fermer et vérifier le portefeuille
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

