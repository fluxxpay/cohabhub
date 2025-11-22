'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Shield,
  User,
  Palette,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Moon,
  Sun,
  Globe,
  Download,
  AlertTriangle,
  LogOut,
  CircleCheck,
  Database,
  Trash2,
  FileDown,
  Mail,
  Smartphone,
  Calendar,
  CreditCard,
  Gift,
  MonitorSmartphone,
} from 'lucide-react';
import {
  SettingsService,
  type UserPreferences,
  type ChangePasswordData,
  type ActiveSession,
  SettingsError,
} from '@/lib/services/settings';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { HexagonBadge } from '@/partials/common/hexagon-badge';
import { cn } from '@/lib/utils';
import { toAbsoluteUrl } from '@/lib/helpers';

type SettingsTab = 'notifications' | 'security' | 'privacy' | 'appearance';

interface TabConfig {
  id: SettingsTab;
  name: string;
  icon: typeof Bell;
  description: string;
}

export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'fr',
    email_notifications: true,
    push_notifications: true,
    reservation_notifications: true,
    payment_notifications: false,
    event_notifications: true,
    public_profile: false,
    share_statistics: false,
    marketing_emails: false,
  });
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    old_password: '',
    new_password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const tabs: TabConfig[] = [
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Préférences de notifications',
    },
    {
      id: 'security',
      name: 'Sécurité',
      icon: Shield,
      description: 'Sécurité du compte',
    },
    {
      id: 'privacy',
      name: 'Confidentialité',
      icon: User,
      description: 'Paramètres de confidentialité',
    },
    {
      id: 'appearance',
      name: 'Apparence',
      icon: Palette,
      description: 'Thème et interface',
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prefsData, sessionsData] = await Promise.all([
        SettingsService.getPreferences(),
        SettingsService.getActiveSessions(),
      ]);
      setPreferences(prefsData);
      setSessions(sessionsData);
    } catch (error) {
      if (error instanceof SettingsError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du chargement des paramètres');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const updated = await SettingsService.updatePreferences(preferences);
      setPreferences(updated);
      toast.success('Préférences sauvegardées avec succès !');
    } catch (error) {
      if (error instanceof SettingsError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.old_password || !passwordData.new_password || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.new_password !== confirmPassword) {
      toast.error('Le nouveau mot de passe et la confirmation ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await SettingsService.changePassword(passwordData);
      toast.success(result.message || 'Mot de passe changé avec succès');

      // Déconnexion après changement de mot de passe
      const refreshToken = localStorage.getItem('refresh-token');
      if (refreshToken) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
        } catch (e) {
          console.error('Erreur lors de la déconnexion:', e);
        }
      }

      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      router.push('/auth/login');
    } catch (error) {
      if (error instanceof SettingsError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences({ ...preferences, [key]: value });
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
            <ToolbarPageTitle text="Paramètres" />
            <ToolbarDescription>Gérez vos préférences et paramètres de compte</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-7.5">
          {/* Navigation des paramètres */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tab.name}</p>
                          <p className={cn('text-xs', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {tab.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Contenu des paramètres */}
          <div className="lg:col-span-3">
                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <Card>
                    <CardHeader id="notifications_settings">
                      <CardTitle>Notifications</CardTitle>
                    </CardHeader>
                    <div className="p-0">
                      <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                        <div className="flex items-center gap-3.5">
                          <HexagonBadge
                            stroke="stroke-input"
                            fill="fill-muted/30"
                            size="size-[50px]"
                            badge={<Mail className="text-xl text-muted-foreground" />}
                          />
                          <div className="flex flex-col gap-1.5">
                            <span className="leading-none font-medium text-sm text-foreground">
                              Notifications par email
                            </span>
                            <span className="text-sm text-secondary-foreground">
                              Recevoir des notifications par email
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                          size="sm"
                        />
                      </div>

                      <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                        <div className="flex items-center gap-3.5">
                          <HexagonBadge
                            stroke="stroke-input"
                            fill="fill-muted/30"
                            size="size-[50px]"
                            badge={<Smartphone className="text-xl text-muted-foreground" />}
                          />
                          <div className="flex flex-col gap-1.5">
                            <span className="leading-none font-medium text-sm text-foreground">
                              Notifications push
                            </span>
                            <span className="text-sm text-secondary-foreground">
                              Recevoir des notifications sur votre navigateur
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.push_notifications}
                          onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                          size="sm"
                        />
                      </div>

                      <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                        <div className="flex items-center gap-3.5">
                          <HexagonBadge
                            stroke="stroke-input"
                            fill="fill-muted/30"
                            size="size-[50px]"
                            badge={<Calendar className="text-xl text-muted-foreground" />}
                          />
                          <div className="flex flex-col gap-1.5">
                            <span className="leading-none font-medium text-sm text-foreground">
                              Réservations
                            </span>
                            <span className="text-sm text-secondary-foreground">
                              Notifications concernant vos réservations
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.reservation_notifications}
                          onCheckedChange={(checked) => handlePreferenceChange('reservation_notifications', checked)}
                          size="sm"
                        />
                      </div>

                      <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                        <div className="flex items-center gap-3.5">
                          <HexagonBadge
                            stroke="stroke-input"
                            fill="fill-muted/30"
                            size="size-[50px]"
                            badge={<CreditCard className="text-xl text-muted-foreground" />}
                          />
                          <div className="flex flex-col gap-1.5">
                            <span className="leading-none font-medium text-sm text-foreground">
                              Paiements
                            </span>
                            <span className="text-sm text-secondary-foreground">
                              Notifications concernant les paiements
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.payment_notifications}
                          onCheckedChange={(checked) => handlePreferenceChange('payment_notifications', checked)}
                          size="sm"
                        />
                      </div>

                      <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                        <div className="flex items-center gap-3.5">
                          <HexagonBadge
                            stroke="stroke-input"
                            fill="fill-muted/30"
                            size="size-[50px]"
                            badge={<Gift className="text-xl text-muted-foreground" />}
                          />
                          <div className="flex flex-col gap-1.5">
                            <span className="leading-none font-medium text-sm text-foreground">
                              Événements
                            </span>
                            <span className="text-sm text-secondary-foreground">
                              Notifications sur les événements à venir
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.event_notifications}
                          onCheckedChange={(checked) => handlePreferenceChange('event_notifications', checked)}
                          size="sm"
                        />
                      </div>
                    </div>
                    <CardContent className="flex justify-end pt-2.5">
                      <Button onClick={handleSavePreferences} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          'Sauvegarder les préférences'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

            {/* Sécurité */}
            {activeTab === 'security' && (
              <>
                <Card>
                  <CardHeader id="auth_password">
                    <CardTitle>Changer le mot de passe</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-5">
                    <div className="w-full">
                      <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                        <Label className="flex w-full max-w-56">Mot de passe actuel</Label>
                        <div className="relative grow">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPasswords.old ? 'text' : 'password'}
                            value={passwordData.old_password}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, old_password: e.target.value })
                            }
                            className="pl-9 pr-9"
                            placeholder="Votre mot de passe actuel"
                            disabled={isChangingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full">
                      <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                        <Label className="flex w-full max-w-56">Nouveau mot de passe</Label>
                        <div className="relative grow">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.new_password}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, new_password: e.target.value })
                            }
                            className="pl-9 pr-9"
                            placeholder="Votre nouveau mot de passe"
                            disabled={isChangingPassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full">
                      <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                        <Label className="flex w-full max-w-56">Confirmer le nouveau mot de passe</Label>
                        <div className="relative grow">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-9 pr-9"
                            placeholder="Confirmez votre nouveau mot de passe"
                            disabled={isChangingPassword}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2.5">
                      <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Changement...
                          </>
                        ) : (
                          'Mettre à jour le mot de passe'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-5">
                  <CardHeader>
                    <CardTitle>Sessions actives</CardTitle>
                  </CardHeader>
                  <div className="p-0">
                    {sessions.length > 0 ? (
                      sessions.slice(0, 5).map((session, index) => (
                        <div
                          key={index}
                          className={cn(
                            'border-b border-border flex items-center justify-between py-4 px-6 gap-2.5',
                            index === sessions.slice(0, 5).length - 1 && 'border-b-0'
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <HexagonBadge
                              stroke="stroke-input"
                              fill="fill-muted/30"
                              size="size-[50px]"
                              badge={<MonitorSmartphone className="text-xl text-muted-foreground" />}
                            />
                            <div className="flex flex-col gap-1.5">
                              <span className="leading-none font-medium text-sm text-foreground">
                                {session.browser}
                              </span>
                              <span className="text-sm text-secondary-foreground">
                                {session.location} • {session.status}
                              </span>
                            </div>
                          </div>
                          {session.current ? (
                            <Badge variant="success" appearance="light" size="sm">
                              Actuel
                            </Badge>
                          ) : (
                            <Button variant="ghost" size="sm" mode="icon" title="Déconnecter cette session">
                              <LogOut className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 px-6 text-muted-foreground">
                        <p>Aucune session active</p>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* Confidentialité */}
            {activeTab === 'privacy' && (
              <>
                <Card>
                  <CardHeader id="privacy_settings">
                    <CardTitle>Paramètres de confidentialité</CardTitle>
                  </CardHeader>
                  <div className="p-0">
                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[50px]"
                          badge={<User className="text-xl text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Profil public
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            Permettre aux autres membres de voir votre profil
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.public_profile}
                        onCheckedChange={(checked) => handlePreferenceChange('public_profile', checked)}
                        size="sm"
                      />
                    </div>

                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[50px]"
                          badge={<Database className="text-xl text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Statistiques partagées
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            Partager vos statistiques d'utilisation anonymisées
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.share_statistics}
                        onCheckedChange={(checked) => handlePreferenceChange('share_statistics', checked)}
                        size="sm"
                      />
                    </div>

                    <div className="border-b border-border flex items-center justify-between py-4 px-6 gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[50px]"
                          badge={<Bell className="text-xl text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Marketing
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            Recevoir des offres et promotions
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.marketing_emails}
                        onCheckedChange={(checked) => handlePreferenceChange('marketing_emails', checked)}
                        size="sm"
                      />
                    </div>
                  </div>
                  <CardContent className="flex justify-end pt-2.5">
                    <Button onClick={handleSavePreferences} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder les préférences'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Télécharger mes données */}
                <Card className="mt-5">
                  <CardHeader>
                    <CardTitle>Gérer vos données</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 lg:py-7.5">
                    <div className="flex items-center justify-between flex-wrap gap-2.5">
                      <div className="flex items-center gap-3.5">
                        <HexagonBadge
                          stroke="stroke-input"
                          fill="fill-muted/30"
                          size="size-[50px]"
                          badge={<FileDown className="text-xl text-muted-foreground" />}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="leading-none font-medium text-sm text-foreground">
                            Télécharger mes données
                          </span>
                          <span className="text-sm text-secondary-foreground">
                            Obtenir une copie de toutes vos données personnelles au format JSON
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          setIsDownloading(true);
                          try {
                            // TODO: Implémenter l'endpoint de téléchargement de données
                            toast.info('Fonctionnalité en cours de développement');
                            // await SettingsService.downloadUserData();
                          } catch (error) {
                            toast.error('Erreur lors du téléchargement des données');
                          } finally {
                            setIsDownloading(false);
                          }
                        }}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Supprimer mon compte */}
                <Card className="mt-5">
                  <CardHeader>
                    <CardTitle>Supprimer mon compte</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 lg:py-7.5">
                    <div className="flex flex-col gap-3">
                      <div className="text-sm text-foreground">
                        Nous regrettons de vous voir partir. Confirmez la suppression du compte ci-dessous. Vos données
                        seront définitivement supprimées. Merci d'avoir fait partie de notre communauté.
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="confirm-delete"
                          checked={confirmDelete}
                          onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                        />
                        <Label htmlFor="confirm-delete" className="text-sm font-normal cursor-pointer">
                          Je confirme vouloir supprimer mon compte
                        </Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setConfirmDelete(false);
                          toast.info('Vous pouvez désactiver votre compte au lieu de le supprimer');
                        }}
                      >
                        Désactiver à la place
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (!confirmDelete) {
                            toast.error('Veuillez confirmer la suppression en cochant la case');
                            return;
                          }

                          if (!confirm('Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                            return;
                          }

                          setIsDeleting(true);
                          try {
                            // TODO: Implémenter l'endpoint de suppression de compte
                            toast.error('Fonctionnalité en cours de développement');
                            // await SettingsService.deleteAccount();
                          } catch (error) {
                            toast.error('Erreur lors de la suppression du compte');
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        disabled={!confirmDelete || isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Suppression...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer le compte
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Apparence */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader id="advanced_settings_appearance">
                  <CardTitle>Apparence</CardTitle>
                </CardHeader>
                <CardContent className="lg:py-7.5">
                  <div className="mb-5">
                    <h3 className="text-base font-medium text-foreground">Thème</h3>
                    <span className="text-sm text-secondary-foreground">
                      Sélectionnez ou personnalisez votre thème d'interface
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5 mb-8">
                    <div>
                      <Label
                        className={cn(
                          'flex items-end border bg-no-repeat bg-cover border-input rounded-xl has-checked:border-green-500 has-checked:border-3 has-checked:[&_.checked]:flex h-[170px] mb-0.5 cursor-pointer',
                          preferences.theme === 'light' && 'border-green-500 border-3'
                        )}
                        style={{
                          backgroundImage: `url(${toAbsoluteUrl('/media/images/600x400/32.jpg')})`,
                        }}
                      >
                        <Input
                          className="absolute opacity-0 w-0 h-0"
                          type="radio"
                          name="theme_option"
                          checked={preferences.theme === 'light'}
                          onChange={() => handlePreferenceChange('theme', 'light')}
                        />
                        <CircleCheck
                          size={20}
                          className={cn(
                            'ms-5 mb-5 text-xl text-green-500 leading-none',
                            preferences.theme === 'light' ? 'flex' : 'hidden'
                          )}
                        />
                      </Label>
                      <span className="text-sm font-medium text-foreground">Clair</span>
                    </div>

                    <div>
                      <Label
                        className={cn(
                          'flex items-end border bg-no-repeat bg-cover border-input rounded-xl has-checked:border-green-500 has-checked:border-3 has-checked:[&_.checked]:flex h-[170px] mb-0.5 cursor-pointer',
                          preferences.theme === 'dark' && 'border-green-500 border-3'
                        )}
                        style={{
                          backgroundImage: `url(${toAbsoluteUrl('/media/images/600x400/28.jpg')})`,
                        }}
                      >
                        <Input
                          className="absolute opacity-0 w-0 h-0"
                          type="radio"
                          name="theme_option"
                          checked={preferences.theme === 'dark'}
                          onChange={() => handlePreferenceChange('theme', 'dark')}
                        />
                        <CircleCheck
                          size={20}
                          className={cn(
                            'ms-5 mb-5 text-xl text-green-500 leading-none',
                            preferences.theme === 'dark' ? 'flex' : 'hidden'
                          )}
                        />
                      </Label>
                      <span className="text-sm font-medium text-foreground">Sombre</span>
                    </div>

                    <div>
                      <Label
                        className={cn(
                          'flex items-end border bg-no-repeat bg-cover border-input rounded-xl has-checked:border-green-500 has-checked:border-3 has-checked:[&_.checked]:flex h-[170px] mb-0.5 cursor-pointer',
                          preferences.theme === 'system' && 'border-green-500 border-3'
                        )}
                        style={{
                          backgroundImage: `url(${toAbsoluteUrl('/media/images/600x400/30.jpg')})`,
                        }}
                      >
                        <Input
                          className="absolute opacity-0 w-0 h-0"
                          type="radio"
                          name="theme_option"
                          checked={preferences.theme === 'system'}
                          onChange={() => handlePreferenceChange('theme', 'system')}
                        />
                        <CircleCheck
                          size={20}
                          className={cn(
                            'ms-5 mb-5 text-xl text-green-500 leading-none',
                            preferences.theme === 'system' ? 'flex' : 'hidden'
                          )}
                        />
                      </Label>
                      <span className="text-sm font-medium text-foreground">Système</span>
                    </div>
                  </div>

                  <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5 mb-8">
                    <Label className="flex w-full max-w-56">Langue</Label>
                    <div className="grow">
                      <Select
                        value={preferences.language || 'fr'}
                        onValueChange={(value) => handlePreferenceChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSavePreferences} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder les préférences'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
      </div>
    </div>
      </Container>
    </>
  );
}
