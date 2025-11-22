'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Envelope, 
  Phone, 
  User, 
  Shield, 
  Check, 
  Eye, 
  EyeSlash,
  X
} from '@phosphor-icons/react';
import { apiFetch } from '@/lib/api';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'premium' | 'admin';
  password: string;
  confirmPassword: string;
}

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
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

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'user',
        password: '',
        confirmPassword: '',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsSubmitting(false);
    }
  }, [open]);

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
        onClose();
        if (onSuccess) {
          onSuccess();
        }
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-primary-100">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-primary-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-white" weight="light" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-primary-900">Ajouter un utilisateur</h2>
                    <p className="text-sm text-primary-600">Remplissez les informations du nouvel utilisateur</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" weight="light" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                          className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
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
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-primary-100">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="flex items-center space-x-2 px-6 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <span>Annuler</span>
                  </motion.button>

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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

