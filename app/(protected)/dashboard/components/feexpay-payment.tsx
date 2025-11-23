'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { feexPayService, type FeexPayInitiateRequest } from '@/lib/services/feexpay';
import { toast } from 'sonner';
import { ReservationService } from '@/lib/services/reservations';
import { FeexPayProvider, FeexPayButton } from '@feexpay/react-sdk';
import { apiFetch } from '@/lib/api';

interface FeexPayPaymentProps {
  reservationId: string | number;
  reservationTotal: number;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function FeexPayPayment({
  reservationId,
  reservationTotal,
  customerEmail,
  customerName,
  customerPhone,
  isOpen,
  onClose,
  onPaymentSuccess,
}: FeexPayPaymentProps) {
  const [initiating, setInitiating] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [formVisible, setFormVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [payingWithWallet, setPayingWithWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Surveiller l'apparition du formulaire FeexPay pour ajuster la hauteur
  useEffect(() => {
    if (!paymentConfig || initiating) return;

    const checkForm = () => {
      const container = document.getElementById('feexpay-payment-container');
      if (container) {
        const hasForm = container.querySelector('iframe, form, [class*="feexpay"]:not(button)');
        if (hasForm) {
          setFormVisible(true);
          // Ajuster la hauteur du conteneur
          container.style.minHeight = '800px';
          container.style.paddingBottom = '4rem';
        }
      }
    };

    // Vérifier immédiatement
    checkForm();

    // Vérifier périodiquement car le formulaire peut apparaître avec un délai
    const interval = setInterval(checkForm, 500);

    return () => clearInterval(interval);
  }, [paymentConfig, initiating]);

  // Initier le paiement
  const initiatePayment = async () => {
    setInitiating(true);
    setError(null);

    try {
      // Nettoyer la description pour éviter les caractères spéciaux interdits
      const cleanDescription = `Paiement reservation ${reservationId}`
        .replace(/[@#$%^*()_+=?/\\`~|[\]{}|;:]/g, '')
        .substring(0, 200); // Limiter la longueur
      
      const request: FeexPayInitiateRequest = {
        reservation_id: reservationId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_type: 'MOBILE',
        description: cleanDescription,
      };

      const response = await feexPayService.initiatePayment(request);
      
      // Extraire la configuration de paiement
      const config = response.payment.payment_config;
      
      setPaymentConfig({
        id: config.id,
        token: config.token,
        amount: config.amount,
        mode: config.mode || 'LIVE',
        case: config.case || config.payment_type || '',
        currency: config.currency || 'XOF',
        customId: config.custom_id || `RES_${reservationId}`,
        description: config.description
          ? config.description.replace(/[@#$%^*()_+=?/\\`~|[\]{}|;:]/g, '').substring(0, 200)
          : cleanDescription,
        callback_info: {
          email: customerEmail,
          fullname: customerName || '',
          phone: customerPhone || '',
        },
      });
      
      setPaymentStatus('pending');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'initiation du paiement';
      setError(errorMessage);
      toast.error(errorMessage);
      setPaymentStatus('failed');
    } finally {
      setInitiating(false);
    }
  };

  // Récupérer le solde du wallet
  const fetchWalletBalance = async () => {
    try {
      const profileResult = await apiFetch('/api/auth/profile/', {
        method: 'GET',
      });

      if (profileResult.response?.ok && profileResult.data) {
        const userData = profileResult.data.data || profileResult.data;
        const balance = parseFloat(userData.bonus_balance?.toString() || '0');
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
    }
  };

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setPaymentConfig(null);
      setError(null);
      setPaymentStatus('idle');
      setWalletError(null);
      setPayingWithWallet(false);
      // Récupérer le solde du wallet
      fetchWalletBalance();
      // Initier automatiquement le paiement quand le modal s'ouvre
      initiatePayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Payer avec le wallet
  const handlePayWithWallet = async () => {
    setPayingWithWallet(true);
    setWalletError(null);

    try {
      const response = await apiFetch('/api/reservations/pay-with-wallet/', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: reservationId,
        }),
      });

      if (response.response?.ok && response.data) {
        const data = response.data.data || response.data;
        
        if (data.success) {
          setPaymentStatus('completed');
          toast.success('Paiement effectué avec succès avec votre portefeuille !');
          
          // Mettre à jour le solde affiché
          if (data.new_balance !== undefined) {
            setWalletBalance(data.new_balance);
          }
          
          // Appeler le callback de succès
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
          
          // Fermer le modal après un délai
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setWalletError(data.error || 'Erreur lors du paiement');
          toast.error(data.error || 'Erreur lors du paiement');
        }
      } else {
        const errorData = response.data?.data || response.data;
        const errorMessage = errorData?.error || 'Erreur lors du paiement';
        setWalletError(errorMessage);
        
        if (errorData?.missing_amount) {
          toast.error(`Solde insuffisant. Il manque ${errorData.missing_amount.toLocaleString()} XOF`);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement';
      setWalletError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPayingWithWallet(false);
    }
  };

  // Callback après paiement
  const handlePaymentCallback = async (response: any) => {
    console.log('Réponse FeexPay:', response);
    
    if (response.status === 'success' || response.status === 'completed') {
      setPaymentStatus('completed');
      toast.success('Paiement effectué avec succès !');
      
      // Mettre à jour le statut de la réservation
      try {
        await ReservationService.updateReservationStatus(reservationId, 'paid');
        toast.success('Réservation confirmée');
        
        // Appeler le callback de succès
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        
        // Fermer le modal après un délai
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err: any) {
        console.error('Erreur lors de la mise à jour du statut:', err);
        toast.error('Paiement réussi mais erreur lors de la mise à jour de la réservation');
      }
    } else if (response.status === 'failed' || response.status === 'error') {
      setPaymentStatus('failed');
      setError(response.message || 'Le paiement a échoué');
      toast.error('Le paiement a échoué');
    } else {
      // Statut pending ou autre
      setPaymentStatus('pending');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[95vh] overflow-y-auto" 
        style={{ 
          maxHeight: '95vh',
          height: formVisible ? '95vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogHeader>
          <DialogTitle>Paiement FeexPay</DialogTitle>
          <DialogDescription>
            Paiement de la réservation #{reservationId} - {reservationTotal.toLocaleString('fr-FR')} XOF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'completed' && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Paiement effectué avec succès !
              </AlertDescription>
            </Alert>
          )}

          {initiating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Initialisation du paiement...</span>
            </div>
          )}

          {paymentConfig && !initiating && (
            <div className="space-y-4">
              {/* Option de paiement avec wallet */}
              {walletBalance !== null && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Solde disponible</p>
                        <p className="text-xs text-muted-foreground">
                          {walletBalance.toLocaleString('fr-FR')} XOF
                        </p>
                      </div>
                    </div>
                    {walletBalance >= reservationTotal ? (
                      <Button
                        onClick={handlePayWithWallet}
                        disabled={payingWithWallet || paymentStatus === 'completed'}
                        variant="outline"
                        className="gap-2"
                      >
                        {payingWithWallet ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4" />
                            Payer avec wallet
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs text-destructive font-medium">
                          Solde insuffisant
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Il manque {(reservationTotal - walletBalance).toLocaleString('fr-FR')} XOF
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {walletError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{walletError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Utilisez le bouton ci-dessous pour effectuer le paiement avec FeexPay :
              </p>
              {/* Conteneur isolé pour FeexPay - hauteur adaptative seulement quand le formulaire est affiché */}
              <div 
                id="feexpay-payment-container" 
                className="feexpay-container"
                style={{
                  isolation: 'isolate',
                  position: 'relative',
                  zIndex: 1,
                  minHeight: formVisible ? '800px' : 'auto',
                  width: '100%',
                  overflow: formVisible ? 'auto' : 'visible',
                  maxHeight: formVisible ? 'none' : 'auto',
                }}
              >
                <FeexPayProvider>
                  <FeexPayButton
                    id={paymentConfig.id}
                    token={paymentConfig.token}
                    amount={paymentConfig.amount}
                    mode={paymentConfig.mode}
                    case={paymentConfig.case}
                    currency={paymentConfig.currency}
                    customId={paymentConfig.customId}
                    description={paymentConfig.description}
                    callback_info={paymentConfig.callback_info}
                    callback={handlePaymentCallback}
                    buttonText="Payer avec FeexPay"
                    buttonClass="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
                  />
                </FeexPayProvider>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
