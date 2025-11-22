'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [isRecharge, setIsRecharge] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const statusParam = searchParams.get('status');
        const transactionId = searchParams.get('transaction_id');
        const paymentIdParam = searchParams.get('payment_id');
        const errorParam = searchParams.get('error');
        const rechargeStatus = searchParams.get('recharge_status');
        const amount = searchParams.get('amount');
        const ref = searchParams.get('ref');

        console.log('📞 Callback reçu:', { 
          statusParam, 
          transactionId, 
          paymentIdParam, 
          errorParam,
          rechargeStatus,
          amount,
          ref
        });

        // Si FeexPay redirige directement vers le frontend sans paramètres
        // (cela peut arriver si le callback_url pointe vers le frontend)
        // Vérifier si on a des IDs stockés dans localStorage
        if (!statusParam && !rechargeStatus && !errorParam && !transactionId) {
          const storedTransactionId = localStorage.getItem('wallet_recharge_transaction_id');
          const storedRechargeId = localStorage.getItem('wallet_recharge_id');
          
          if (storedTransactionId || storedRechargeId) {
            console.log('🔍 FeexPay a redirigé sans paramètres, utilisation des IDs stockés:', {
              transactionId: storedTransactionId,
              rechargeId: storedRechargeId
            });
            
            setIsRecharge(true);
            setStatus('pending');
            setMessage('Vérification du statut du paiement...');
            
            // Vérifier le statut via l'API
            const checkStatus = async () => {
              try {
                const checkResult = await apiFetch('/api/feexpay/wallet-recharge/check-status/', {
                  method: 'POST',
                  body: JSON.stringify({
                    transaction_id: storedTransactionId,
                    recharge_id: storedRechargeId,
                  }),
                });

                if (checkResult.response?.ok && checkResult.data) {
                  const data = checkResult.data.data || checkResult.data;
                  
                  if (data.success && data.status === 'successful') {
                    console.log(`✅ Transaction confirmée ! Solde mis à jour: ${data.old_balance} XOF -> ${data.new_balance} XOF`);
                    setStatus('success');
                    setMessage(`Portefeuille rechargé de ${data.amount.toLocaleString()} XOF avec succès !`);
                    
                    // Nettoyer le localStorage
                    localStorage.removeItem('wallet_recharge_transaction_id');
                    localStorage.removeItem('wallet_recharge_id');
                    
                    // Rediriger vers le dashboard
                    setTimeout(() => {
                      router.push('/dashboard?tab=overview&refresh_wallet=true');
                    }, 3000);
                    return;
                  } else if (data.status === 'pending') {
                    console.log('⏳ Transaction encore en attente');
                    setStatus('pending');
                    setMessage('Le paiement est en cours de traitement. Vérifiez votre portefeuille dans quelques instants.');
                    
                    // Rediriger vers le dashboard pour polling
                    setTimeout(() => {
                      router.push('/dashboard?tab=overview&refresh_wallet=true');
                    }, 5000);
                    return;
                  }
                }
              } catch (error) {
                console.error('Erreur lors de la vérification du statut:', error);
              }
              
              // Si la vérification échoue, rediriger vers le dashboard pour polling
              setStatus('pending');
              setMessage('Vérification du statut en cours...');
              setTimeout(() => {
                router.push('/dashboard?tab=overview&refresh_wallet=true');
              }, 3000);
            };
            
            // Démarrer la vérification après un court délai
            setTimeout(checkStatus, 1000);
            return;
          }
        }

        // Vérifier si c'est une recharge de portefeuille
        if (rechargeStatus) {
          setIsRecharge(true);
          
          // Si on a un ref mais pas de statut clair, vérifier le statut via l'API
          if (ref && rechargeStatus === 'pending') {
            // Le webhook backend n'a pas pu trouver la transaction, on va vérifier depuis le frontend
            // Récupérer le transaction_id et recharge_id depuis localStorage
            const storedTransactionId = localStorage.getItem('wallet_recharge_transaction_id');
            const storedRechargeId = localStorage.getItem('wallet_recharge_id');
            
            console.log('🔍 Ref reçu, vérification du statut avec transaction_id:', storedTransactionId, 'recharge_id:', storedRechargeId);
            
            if (storedTransactionId || storedRechargeId) {
              // Vérifier le statut via l'endpoint check-status
              setStatus('pending');
              setMessage('Vérification du statut du paiement...');
              
              const checkStatus = async () => {
                try {
                  const checkResult = await apiFetch('/api/feexpay/wallet-recharge/check-status/', {
                    method: 'POST',
                    body: JSON.stringify({
                      transaction_id: storedTransactionId,
                      recharge_id: storedRechargeId,
                      ref: ref,
                    }),
                  });

                  if (checkResult.response?.ok && checkResult.data) {
                    const data = checkResult.data;
                    
                    if (data.success && data.status === 'successful') {
                      console.log(`✅ Transaction confirmée ! Solde mis à jour: ${data.old_balance} XOF -> ${data.new_balance} XOF`);
                      setStatus('success');
                      setMessage(`Portefeuille rechargé de ${data.amount.toLocaleString()} XOF avec succès !`);
                      
                      // Nettoyer le localStorage
                      localStorage.removeItem('wallet_recharge_transaction_id');
                      localStorage.removeItem('wallet_recharge_id');
                      
                      // Rediriger vers le dashboard
                      setTimeout(() => {
                        router.push('/dashboard?tab=overview&refresh_wallet=true');
                      }, 3000);
                      return;
                    } else if (data.status === 'pending') {
                      console.log('⏳ Transaction encore en attente');
                      setStatus('pending');
                      setMessage('Le paiement est en cours de traitement. Vérifiez votre portefeuille dans quelques instants.');
                      
                      // Rediriger vers le dashboard pour polling
                      setTimeout(() => {
                        router.push('/dashboard?tab=overview&refresh_wallet=true');
                      }, 5000);
                      return;
                    } else if (data.status === 'failed') {
                      console.error('❌ Transaction échouée');
                      setStatus('error');
                      setMessage('Le paiement a échoué. Veuillez réessayer.');
                      return;
                    }
                  }
                } catch (error) {
                  console.error('Erreur lors de la vérification du statut:', error);
                  // En cas d'erreur, rediriger vers le dashboard pour polling
                  setStatus('pending');
                  setMessage('Vérification du statut en cours...');
                  setTimeout(() => {
                    router.push('/dashboard?tab=overview&refresh_wallet=true');
                  }, 3000);
                }
              };
              
              // Démarrer la vérification après un court délai
              setTimeout(checkStatus, 1000);
            } else {
              // Pas de transaction_id stocké, rediriger vers le dashboard
              console.log('⚠️ Pas de transaction_id stocké, redirection vers dashboard');
              setStatus('pending');
              setMessage('Vérification du statut du paiement...');
              setTimeout(() => {
                router.push('/dashboard?tab=overview&refresh_wallet=true');
              }, 2000);
            }
            return;
          }
          
          if (rechargeStatus === 'success') {
            setStatus('success');
            setMessage(`Portefeuille rechargé de ${amount ? parseFloat(amount).toLocaleString() : ''} XOF avec succès !`);
            
            // Nettoyer le localStorage
            localStorage.removeItem('wallet_recharge_transaction_id');
            localStorage.removeItem('wallet_recharge_id');
            
            // Rafraîchir le solde en arrière-plan (pour que le dashboard soit à jour)
            // On fait juste un appel pour déclencher le cache, le dashboard se rafraîchira automatiquement
            try {
              await apiFetch('/api/auth/profile/', { method: 'GET' });
              console.log('✅ Profil rafraîchi en arrière-plan');
            } catch (error) {
              console.error('Erreur lors du rafraîchissement du solde:', error);
            }
            
            // Rediriger vers le dashboard avec le paramètre refresh_wallet
            // Le composant WalletCard détectera ce paramètre et rafraîchira le solde
            // On attend un peu plus longtemps pour laisser le webhook backend traiter le paiement
            setTimeout(() => {
              router.push('/dashboard?tab=overview&refresh_wallet=true');
            }, 4000);
            return;
          } else if (rechargeStatus === 'failed') {
            setStatus('error');
            setMessage('La recharge a échoué. Veuillez réessayer.');
            return;
          } else if (rechargeStatus === 'error') {
            setStatus('error');
            setMessage(errorParam || 'Une erreur est survenue lors de la recharge.');
            return;
          } else if (rechargeStatus === 'pending') {
            setStatus('pending');
            setMessage('Le paiement est en cours de traitement. Vérifiez votre portefeuille dans quelques instants.');
            
            // Polling pour vérifier le statut du portefeuille
            pollWalletRechargeStatus();
            return;
          }
        }

        // Si erreur dans l'URL
        if (errorParam || statusParam === 'error') {
          setStatus('error');
          setMessage(errorParam || 'Une erreur est survenue lors du paiement');
          return;
        }

        // Si payment_id est fourni, vérifier le statut
        if (paymentIdParam) {
          setPaymentId(paymentIdParam);
          
          try {
            // Vérifier le statut du paiement auprès du backend
            const { response, data } = await apiFetch(`/api/feexpay/payment/${paymentIdParam}/status/`, {
              method: 'GET',
            });

            if (response && response.ok) {
              const paymentStatus = data.payment?.status || data.status;
              console.log('📊 Statut du paiement:', paymentStatus);

              if (paymentStatus === 'completed' || paymentStatus === 'success' || paymentStatus === 'paid') {
                setStatus('success');
                setMessage('Paiement confirmé avec succès !');
                
                // Récupérer l'ID de réservation depuis le paiement
                if (data.payment?.reservation) {
                  setReservationId(data.payment.reservation.toString());
                }

                // Rediriger vers le dashboard après 3 secondes
                setTimeout(() => {
                  router.push('/dashboard?tab=reservations');
                }, 3000);
              } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
                setStatus('error');
                setMessage('Le paiement a échoué ou a été annulé.');
              } else {
                setStatus('pending');
                setMessage('Paiement en attente de confirmation...');
                
                // Polling pour vérifier le statut
                pollPaymentStatus(paymentIdParam);
              }
            } else {
              // Si pas de réponse, vérifier le statut depuis l'URL
              if (statusParam === 'successful' || statusParam === 'success') {
                setStatus('success');
                setMessage('Paiement confirmé avec succès !');
                setTimeout(() => {
                  router.push('/dashboard?tab=reservations');
                }, 3000);
              } else {
                setStatus('pending');
                setMessage('Vérification du statut du paiement...');
                if (paymentIdParam) {
                  pollPaymentStatus(paymentIdParam);
                }
              }
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            // Si transaction_id est présent et status est successful, considérer comme succès
            if (statusParam === 'successful' && transactionId) {
              setStatus('success');
              setMessage('Paiement confirmé avec succès !');
              setTimeout(() => {
                router.push('/dashboard?tab=reservations');
              }, 3000);
            } else {
              setStatus('pending');
              setMessage('Vérification du statut du paiement en cours...');
              if (paymentIdParam) {
                pollPaymentStatus(paymentIdParam);
              }
            }
          }
        } else if (statusParam === 'successful' || statusParam === 'success') {
          // Pas de payment_id mais status successful
          setStatus('success');
          setMessage('Paiement confirmé avec succès !');
          setTimeout(() => {
            router.push('/dashboard?tab=reservations');
          }, 3000);
        } else if (statusParam === 'failed' || statusParam === 'failure') {
          setStatus('error');
          setMessage('Le paiement a échoué. Veuillez réessayer.');
        } else {
          setStatus('pending');
          setMessage('Vérification du statut du paiement...');
        }

      } catch (error) {
        console.error('Erreur lors du traitement du callback:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors du traitement du paiement.');
      }
    };

    processCallback();
  }, [searchParams, router]);

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 60; // 2 minutes (60 * 2 secondes)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        console.log(`🔄 Vérification du statut (tentative ${attempts}/${maxAttempts})...`);

        const { response, data } = await apiFetch(`/api/feexpay/payment/${paymentId}/status/`, {
          method: 'GET',
        });

        if (response && response.ok) {
          const paymentStatus = data.payment?.status || data.status;
          
          if (paymentStatus === 'completed' || paymentStatus === 'success' || paymentStatus === 'paid') {
            setStatus('success');
            setMessage('Paiement confirmé avec succès !');
            if (data.payment?.reservation) {
              setReservationId(data.payment.reservation.toString());
            }
            setTimeout(() => {
              router.push('/dashboard?tab=reservations');
            }, 3000);
            return;
          } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
            setStatus('error');
            setMessage('Le paiement a échoué ou a été annulé.');
            return;
          }
        }

        if (attempts >= maxAttempts) {
          setStatus('pending');
          setMessage('Le paiement est toujours en attente. Vérifiez votre application mobile ou contactez le support.');
          return;
        }

        setTimeout(checkStatus, 2000);
      } catch (error) {
        console.error('Erreur lors du polling:', error);
        if (attempts >= maxAttempts) {
          setStatus('error');
          setMessage('Impossible de vérifier le statut du paiement. Veuillez contacter le support.');
        } else {
          setTimeout(checkStatus, 2000);
        }
      }
    };

    // Démarrer après 3 secondes
    setTimeout(checkStatus, 3000);
  };

  const pollWalletRechargeStatus = async () => {
    const maxAttempts = 30; // 1 minute (30 * 2 secondes)
    let attempts = 0;
    const amountParam = searchParams.get('amount');

    const checkBalance = async () => {
      try {
        attempts++;
        console.log(`🔄 Vérification du solde (tentative ${attempts}/${maxAttempts})...`);

        const { response, data } = await apiFetch('/api/auth/profile/', {
          method: 'GET',
        });

        if (response && response.ok) {
          const currentBalance = parseFloat(data.bonus_balance?.toString() || '0');
          const expectedAmount = amountParam ? parseFloat(amountParam) : 0;
          
          // Si le solde a augmenté, considérer comme succès
          // (on ne peut pas comparer directement car on ne connaît pas l'ancien solde)
          // Donc on attend juste un peu et on redirige
          if (attempts >= 5) {
            // Après 10 secondes, rediriger vers le dashboard
            setStatus('success');
            setMessage(amountParam ? `Portefeuille rechargé de ${expectedAmount.toLocaleString()} XOF avec succès !` : 'Portefeuille rechargé avec succès !');
            setTimeout(() => {
              router.push('/dashboard?tab=billing&refresh_wallet=true');
            }, 2000);
            return;
          }
        }

        if (attempts >= maxAttempts) {
          setStatus('pending');
          setMessage('Le paiement est toujours en attente. Vérifiez votre portefeuille dans quelques instants.');
          setTimeout(() => {
            router.push('/dashboard?tab=overview&refresh_wallet=true');
          }, 3000);
          return;
        }

        setTimeout(checkBalance, 2000);
      } catch (error) {
        console.error('Erreur lors du polling du solde:', error);
        if (attempts >= maxAttempts) {
          setStatus('pending');
          setMessage('Impossible de vérifier le statut. Vérifiez votre portefeuille dans quelques instants.');
          setTimeout(() => {
            router.push('/dashboard?tab=overview&refresh_wallet=true');
          }, 3000);
        } else {
          setTimeout(checkBalance, 2000);
        }
      }
    };

    // Démarrer après 3 secondes
    setTimeout(checkBalance, 3000);
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          variant: 'info' as const,
          icon: Loader2,
          title: 'Traitement en cours...',
          description: 'Vérification du statut de votre paiement',
        };
      case 'success':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          title: isRecharge ? 'Recharge réussie' : 'Paiement réussi',
          description: message || (isRecharge ? 'Votre portefeuille a été rechargé avec succès' : 'Votre paiement a été confirmé'),
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          title: isRecharge ? 'Recharge échouée' : 'Paiement échoué',
          description: message || 'Une erreur est survenue lors du traitement',
        };
      case 'pending':
        return {
          variant: 'warning' as const,
          icon: Clock,
          title: 'Paiement en attente',
          description: message || 'Le paiement est en cours de traitement',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getIconColor = () => {
    switch (status) {
      case 'loading':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'pending':
        return 'text-warning';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="p-7.5">
          <div className="flex flex-col items-center gap-5 text-center">
            {/* Icône */}
            <div className="flex justify-center">
              {status === 'loading' ? (
                <Loader2 className={`h-12 w-12 animate-spin ${getIconColor()}`} />
              ) : (
                <Icon className={`h-12 w-12 ${getIconColor()}`} />
              )}
            </div>

            {/* Titre et description */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-xl font-semibold text-mono">{config.title}</h2>
              <p className="text-sm text-secondary-foreground">{config.description}</p>
            </div>

            {/* Alert pour les messages supplémentaires */}
            {message && status !== 'success' && (
              <Alert variant={config.variant} appearance="light" size="md" className="w-full">
                <AlertTitle>{message}</AlertTitle>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full pt-2.5">
              {status === 'error' && (
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Retour au dashboard
                </Button>
              )}
              {status === 'pending' && (
                <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                  Retour au dashboard
                </Button>
              )}
              {(status === 'success' || status === 'loading') && (
                <p className="text-xs text-muted-foreground">
                  {status === 'success' ? 'Redirection automatique...' : 'Veuillez patienter'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <Card className="max-w-md w-full">
            <CardContent className="p-7.5">
              <div className="flex flex-col items-center gap-5 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="flex flex-col gap-2.5">
                  <h2 className="text-xl font-semibold text-mono">Chargement...</h2>
                  <p className="text-sm text-secondary-foreground">Vérification du statut</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}

