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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Star,
  CreditCard,
  Building,
  Pencil,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import {
  ProfileService,
  type UserProfile,
  type UpdateProfileData,
  type ProfileStats,
  ProfileError,
} from '@/lib/services/profile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [formData, setFormData] = useState<UpdateProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        ProfileService.getMyProfile(),
        ProfileService.getProfileStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
      });
    } catch (error) {
      if (error instanceof ProfileError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors du chargement du profil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const updatedProfile = await ProfileService.updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès !');
      // Recharger les stats si nécessaire
      const statsData = await ProfileService.getProfileStats();
      setStats(statsData);
    } catch (error) {
      if (error instanceof ProfileError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  if (!profile) {
    return (
      <Container>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Impossible de charger le profil</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Mon profil" />
            <ToolbarDescription>Gérez vos informations personnelles et préférences</ToolbarDescription>
          </ToolbarHeading>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </Toolbar>
      </Container>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5 lg:space-y-7.5">
            {/* Avatar et nom */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-24 w-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
                        : <User className="h-12 w-12" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Mettez à jour vos informations de profil</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="pl-9 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                  </div>

                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="lg:col-span-1 space-y-5 lg:space-y-7.5">
            {/* Statistiques d'adhésion */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques d'adhésion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Membre depuis
                      </span>
                      <span className="font-medium text-foreground">{stats.memberSince}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Niveau
                      </span>
                      <span className="font-medium text-foreground">{stats.level}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Réservations
                      </span>
                      <span className="font-medium text-foreground">{stats.totalReservations}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Dépenses totales
                      </span>
                      <span className="font-medium text-foreground">
                        {stats.totalCost.toLocaleString('fr-FR')} XOF
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Chargement des statistiques...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges et récompenses */}
            <Card>
              <CardHeader>
                <CardTitle>Badges et récompenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && stats.level === 'Premium' && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                    <div>
                      <p className="font-medium text-foreground">Membre Premium</p>
                      <p className="text-xs text-muted-foreground">Accès à tous les services</p>
                    </div>
                  </div>
                )}

                {stats && stats.memberSince && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <Calendar className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">Fidélité</p>
                      <p className="text-xs text-muted-foreground">Membre actif</p>
                    </div>
                  </div>
                )}

                {stats && stats.totalReservations >= 20 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Building className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-foreground">Régulier</p>
                      <p className="text-xs text-muted-foreground">Plus de 20 réservations</p>
                    </div>
                  </div>
                )}

                {(!stats || (stats.level !== 'Premium' && (!stats.memberSince || stats.totalReservations < 20))) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Aucun badge pour le moment</p>
                    <p className="text-xs mt-1">Continuez à utiliser la plateforme pour débloquer des badges</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
