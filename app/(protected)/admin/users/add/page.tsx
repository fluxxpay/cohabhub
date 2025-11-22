'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Envelope, Phone, User, Shield, Check, Eye, EyeSlash } from '@phosphor-icons/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { ScreenLoader } from '@/components/common/screen-loader';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'premium' | 'admin';
  password: string;
  confirmPassword: string;
}

export default function AddUserPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rediriger si pas connecté ou pas admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/signin?redirect=/admin/users/add');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push('Le prénom est requis');
    if (!formData.lastName.trim()) errors.push('Le nom est requis');
    if (!formData.email.trim()) errors.push('L\'email est requis');
    if (!formData.phone.trim()) errors.push('Le téléphone est requis');
    if (formData.password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères');
    if (formData.password !== formData.confirmPassword) errors.push('Les mots de passe ne correspondent pas');

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast.error('Erreurs de validation:\n' + errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        toast.error("Vous devez être connecté en tant qu'admin.");
        setIsSubmitting(false);
        return;
      }
      if (!formData.password.trim() || !formData.confirmPassword.trim()) {
        toast.error("Les mots de passe ne peuvent pas être vides");
        return;
      }

      // Payload avec le format Django attendu
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        password: formData.password,
        confirm_password: formData.confirmPassword
      };

      console.log("📤 Payload envoyé:", payload);

      const res = await apiFetch('/api/auth/admin/create_user/', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const { response, data } = res;

      console.log("🔍 Réponse API:", { status: response?.status, data });

      if (!response || !response.ok) {
        // Gestion d'erreur améliorée
        let errorMessage = "Erreur lors de la création";

        if (data && typeof data === 'object') {
          if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.details) {
            errorMessage = data.details;
          } else if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors) 
              ? data.non_field_errors.join(', ')
              : String(data.non_field_errors);
          }
        }
        
        if (response && response.status === 400) {
          errorMessage = "Données invalides. Vérifiez les informations saisies.";
        }

        throw new Error(errorMessage);
      }

      if (data.success) {
        toast.success("✅ Utilisateur créé avec succès !");
        // Redirection après 1 seconde
        setTimeout(() => {
          router.push("/admin?tab=users");
        }, 1000);
      } else {
        throw new Error(data.message || "La création a échoué");
      }

    } catch (error: any) {
      console.error("Erreur lors de l'ajout d'utilisateur :", error);
      toast.error("❌ Erreur : " + (error.message || "Une erreur est survenue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher un loader pendant la vérification
  if (authLoading) {
    return <ScreenLoader />;
  }

  // Ne rien afficher si pas connecté ou pas admin (redirection en cours)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-primary-100">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin?tab=users">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-primary-600 hover:text-primary-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" weight="light" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-2xl font-light text-primary-900">Ajouter un utilisateur</h1>
              <p className="text-sm text-primary-600">Créez un nouveau compte utilisateur</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" weight="light" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-primary-900">Informations utilisateur</h2>
              <p className="text-primary-600">Remplissez les informations du nouvel utilisateur</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-medium text-primary-900 mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Prénom"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="email@exemple.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+229 01 62 00 00 00"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rôle et sécurité */}
            <div>
              <h3 className="text-lg font-medium text-primary-900 mb-4">Rôle et sécurité</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Rôle *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-600"
                    >
                      {showPassword ? (
                        <EyeSlash className="h-5 w-5" weight="light" />
                      ) : (
                        <Eye className="h-5 w-5" weight="light" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-primary-500 mt-1">Minimum 8 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Confirmer le mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlash className="h-5 w-5" weight="light" />
                      ) : (
                        <Eye className="h-5 w-5" weight="light" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-primary-100">
              <Link href="/admin?tab=users">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" weight="light" />
                  <span>Annuler</span>
                </motion.button>
              </Link>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                  isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-900 text-white hover:bg-primary-800'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" weight="light" />
                    <span>Créer l'utilisateur</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

