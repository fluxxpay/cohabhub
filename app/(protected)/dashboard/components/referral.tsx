'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
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
  CardFooter,
  CardHeading,
  CardToolbar,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, InputWrapper } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  Copy,
  Gift,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Link as LinkIcon,
  QrCode,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ReferralService,
  type ReferralData,
  type Referral,
  ReferralError,
} from '@/lib/services/referral';
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

export default function Referral() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedShareMethod, setSelectedShareMethod] = useState<string | null>(null);
  const [expandedReferral, setExpandedReferral] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData>({
    referral_code: '',
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    availableBalance: 0,
    referrals: [],
  });
  const [referralEmail, setReferralEmail] = useState('');
  const [referralPhone, setReferralPhone] = useState('');

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        const data = await ReferralService.getMyReferralDetails();
        setReferralData(data);
      } catch (error) {
        if (error instanceof ReferralError) {
          toast.error(error.message);
        } else {
          toast.error('Erreur lors du chargement des données de parrainage');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, []);

  const copyToClipboard = async () => {
    if (!referralData.referral_code) return;
    try {
      await navigator.clipboard.writeText(referralData.referral_code);
      setCopied(true);
      toast.success('Code copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      toast.error('Erreur lors de la copie');
    }
  };

  const copyLinkToClipboard = async () => {
    if (!referralData.referral_code) return;
    try {
      const referralLink = `${window.location.origin}/register?ref=${referralData.referral_code}`;
      await navigator.clipboard.writeText(referralLink);
      toast.success('Lien copié dans le presse-papier !');
      setSelectedShareMethod(null);
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const sendReferral = async () => {
    if (!referralData.referral_code) {
      toast.error('Code de parrainage introuvable');
      return;
    }

    setSending(true);

    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidPhone = (phone: string) => {
      return /^(\+229|00229)?[6-9]\d{7}$/.test(phone.replace(/\s/g, ''));
    };

    try {
      switch (selectedShareMethod) {
        case 'email':
          if (!referralEmail) {
            toast.error("Veuillez entrer l'email du filleul");
            setSending(false);
            return;
          }
          if (!isValidEmail(referralEmail)) {
            toast.error("Veuillez entrer un email valide");
            setSending(false);
            return;
          }
          await ReferralService.sendReferralEmail(referralEmail, referralData.referral_code);
          toast.success('Email envoyé avec succès !');
          setReferralEmail('');
          setSelectedShareMethod(null);
          break;

        case 'sms':
          if (!referralPhone) {
            toast.error('Veuillez entrer le numéro du filleul');
            setSending(false);
            return;
          }
          if (!isValidPhone(referralPhone)) {
            toast.error('Veuillez entrer un numéro béninois valide');
            setSending(false);
            return;
          }
          await ReferralService.sendReferralSMS(referralPhone, referralData.referral_code);
          toast.success('SMS envoyé avec succès !');
          setReferralPhone('');
          setSelectedShareMethod(null);
          break;

        case 'link':
          await copyLinkToClipboard();
          break;

        case 'qr':
          toast.info('Fonctionnalité QR code à venir');
          break;

        default:
          toast.error('Méthode de partage non supportée');
      }
    } catch (error) {
      if (error instanceof ReferralError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } finally {
      setSending(false);
    }
  };

  const handleWithdrawInfo = () => {
    if (referralData.availableBalance === 0) {
      toast.info("Vous n'avez pas encore de solde à utiliser. Parrainez des amis pour gagner !");
    } else {
      toast.info(
        `Votre solde de ${referralData.availableBalance.toLocaleString('fr-FR')} XOF ne peut pas être retiré en espèces. Utilisez-le pour réserver !`,
        { duration: 5000 }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { variant: 'success' as const, label: 'Réussi' };
      case 'pending':
        return { variant: 'warning' as const, label: 'En attente' };
      case 'expired':
        return { variant: 'destructive' as const, label: 'Expiré' };
      default:
        return { variant: 'secondary' as const, label: status };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      default:
        return Clock;
    }
  };

  const shareMethods = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'link', label: 'Lien', icon: LinkIcon },
    { id: 'qr', label: 'QR Code', icon: QrCode },
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
            <ToolbarPageTitle text="Parrainage" />
            <ToolbarDescription>Parrainez vos amis et gagnez des récompenses</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
          {/* Colonne principale */}
          <div className="xl:col-span-2 space-y-5 lg:space-y-7.5">
            {/* Code de parrainage - Card avec style Metronic */}
            <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-0">
              <CardHeader>
                <div className="flex items-center gap-2.5 mb-2">
                  <Gift className="size-5" />
                  <CardTitle className="text-lg text-primary-foreground">Votre code unique</CardTitle>
                </div>
                <CardDescription className="text-primary-foreground/80">
                  Partagez ce code avec vos amis et gagnez jusqu'à{' '}
                  <strong className="text-primary-foreground">19 700 XOF</strong> pour chaque inscription valide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <InputWrapper className="flex-1 bg-white/10 border-white/20">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary-foreground/70 mb-1">Votre code</div>
                      <div className="text-xl font-mono font-semibold tracking-wider text-primary-foreground">
                        {referralData.referral_code || 'Chargement...'}
                      </div>
                    </div>
                    <Button
                      variant="dim"
                      mode="icon"
                      onClick={copyToClipboard}
                      className={cn(
                        'shrink-0',
                        copied && 'bg-green-500 hover:bg-green-600'
                      )}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </InputWrapper>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques - Style Metronic comme overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Parrainages</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralData.totalReferrals}</div>
                  <p className="text-xs text-muted-foreground">Total parrainages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Réussis</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralData.successfulReferrals}</div>
                  <p className="text-xs text-muted-foreground">Parrainages validés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralData.pendingReferrals}</div>
                  <p className="text-xs text-muted-foreground">En cours de validation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gains totaux</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {referralData.totalEarnings.toLocaleString('fr-FR')} XOF
                  </div>
                  <p className="text-xs text-muted-foreground">Montant total gagné</p>
                </CardContent>
              </Card>
            </div>

            {/* Partage - Style Metronic comme InvitePeople */}
            <Card>
              <CardHeader>
                <CardTitle>Partager votre code</CardTitle>
                <CardDescription>Choisissez votre méthode de partage préférée</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {shareMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <Button
                        key={method.id}
                        variant="outline"
                        className="flex flex-col items-center h-auto py-4 hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedShareMethod(method.id)}
                      >
                        <Icon className="h-5 w-5 mb-2" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Liste des parrainages - Style Metronic */}
            <Card>
              <CardHeader>
                <CardTitle>Vos parrainages</CardTitle>
                <CardDescription>Liste de tous vos filleuls et leurs statuts</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {referralData.referrals.length > 0 ? (
                  <div className="divide-y divide-border">
                    {referralData.referrals.map((referral) => {
                      const StatusIcon = getStatusIcon(referral.status);
                      const statusBadge = getStatusBadge(referral.status);
                      const isExpanded = expandedReferral === referral.id;

                      return (
                        <div key={referral.id}>
                          <button
                            onClick={() => setExpandedReferral(isExpanded ? null : referral.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                                {referral.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-sm text-foreground">{referral.name}</h3>
                                <p className="text-xs text-muted-foreground">{referral.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <Badge
                                variant={statusBadge.variant}
                                appearance="light"
                                className="flex items-center gap-1.5"
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span>{statusBadge.label}</span>
                              </Badge>
                              <div className="text-right min-w-[100px]">
                                <div className="font-semibold text-sm text-foreground">
                                  {referral.reward.toLocaleString('fr-FR')} XOF
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-3 border-t border-border bg-muted/20">
                              <div className="grid grid-cols-2 gap-4 text-sm pt-3">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Date d'inscription</span>
                                  <span className="font-medium text-foreground">
                                    {new Date(referral.date).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Statut</span>
                                  <span className="font-medium text-foreground">
                                    {statusBadge.label}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Récompense</span>
                                  <span className="font-medium text-foreground">
                                    {referral.reward.toLocaleString('fr-FR')} XOF
                                  </span>
                                </div>
                                {referral.phone && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Téléphone</span>
                                    <span className="font-medium text-foreground">{referral.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun parrainage</h3>
                    <p className="text-muted-foreground mb-6">
                      Commencez à partager votre code pour inviter vos amis
                    </p>
                    <Button onClick={() => setSelectedShareMethod('link')}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Partager maintenant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="xl:col-span-1 space-y-5 lg:space-y-7.5">
            {/* Solde disponible */}
            <Card>
              <CardHeader>
                <CardTitle>Solde disponible</CardTitle>
                <CardDescription>Montant que vous avez gagné</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-4">
                  {referralData.availableBalance.toLocaleString('fr-FR')} XOF
                </div>
                <div className="space-y-2.5">
                  <Button
                    onClick={handleWithdrawInfo}
                    variant="outline"
                    className="w-full"
                  >
                    Informations
                  </Button>
                  <Button
                    asChild
                    className="w-full"
                  >
                    <Link href="/booking">
                      Réserver avec le solde
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Invite avec lien - Style Metronic */}
            <Card>
              <CardHeader>
                <CardTitle>Inviter avec un lien</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                  <Label className="flex w-full max-w-32">Lien</Label>
                  <div className="flex flex-col items-start grow gap-5">
                    <InputWrapper>
                      <Input
                        type="text"
                        readOnly
                        value={
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/register?ref=${referralData.referral_code}`
                            : ''
                        }
                        className="text-xs"
                      />
                      <Button
                        variant="dim"
                        mode="icon"
                        onClick={copyLinkToClipboard}
                        className="-me-2"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </InputWrapper>
                  </div>
                </div>
                <p className="text-foreground text-sm text-muted-foreground">
                  Partagez ce lien avec vos amis. Ils pourront s'inscrire et vous gagnerez des récompenses
                  lorsqu'ils effectueront leur première réservation.
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button onClick={() => setSelectedShareMethod('link')} className="w-full">
                  Partager le lien
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Container>

      {/* Modal de partage - Style Metronic */}
      <Dialog open={!!selectedShareMethod} onOpenChange={(open) => !open && setSelectedShareMethod(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Partager via {shareMethods.find((m) => m.id === selectedShareMethod)?.label}
            </DialogTitle>
            <DialogDescription>
              Partagez votre code de parrainage avec vos amis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Votre code de parrainage</div>
              <div className="text-xl font-mono font-semibold">{referralData.referral_code}</div>
            </div>

            {selectedShareMethod === 'email' && (
              <div className="grid gap-5">
                <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                  <Label className="flex w-full max-w-32">Email</Label>
                  <div className="grow min-w-48">
                    <Input
                      type="email"
                      value={referralEmail}
                      onChange={(e) => setReferralEmail(e.target.value)}
                      placeholder="exemple@mail.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedShareMethod === 'sms' && (
              <div className="grid gap-5">
                <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                  <Label className="flex w-full max-w-32">Téléphone</Label>
                  <div className="grow min-w-48">
                    <Input
                      type="tel"
                      value={referralPhone}
                      onChange={(e) => setReferralPhone(e.target.value)}
                      placeholder="+229 66 00 00 00"
                    />
                  </div>
                </div>
      </div>
            )}

            {selectedShareMethod === 'link' && (
              <div className="bg-muted rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-2">Lien de parrainage</div>
                <div className="text-sm font-mono break-all">
                  {typeof window !== 'undefined' &&
                    `${window.location.origin}/register?ref=${referralData.referral_code}`}
      </div>
    </div>
            )}

            {selectedShareMethod === 'qr' && (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité QR code à venir</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedShareMethod(null)}
              disabled={sending}
            >
              Annuler
            </Button>
            <Button onClick={sendReferral} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : selectedShareMethod === 'link' ? (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </>
              ) : (
                'Partager'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
