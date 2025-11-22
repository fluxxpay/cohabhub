'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Buildings,
  ArrowLeft,
  Plus,
  Upload,
  Check,
  X
} from '@phosphor-icons/react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { ScreenLoader } from '@/components/common/screen-loader';

interface SpaceFormData {
  name: string;
  description: string;
  category: 'bureau' | 'salle' | 'appartement' | 'autre';
  capacity: number;
  has_parking_option: boolean;
  price_hour: number;
  price_half_day: number;
  price_full_day: number;
  min_nights: number;
  is_active: boolean;
  location: string;
  options: number[];
  user: number | string;
  images: File[];
}

interface OptionData {
  id: number;
  name: string;
  price?: number;
  icon?: string;
}

export default function AddSpacePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<SpaceFormData>({
    name: '',
    description: '',
    category: 'bureau',
    capacity: 1,
    has_parking_option: false,
    price_hour: 0,
    price_half_day: 0,
    price_full_day: 0,
    min_nights: 1,
    is_active: true,
    location: '',
    options: [],
    user: 0,
    images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableOptions, setAvailableOptions] = useState<OptionData[]>([]);

  // Rediriger si pas connecté ou pas admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/signin?redirect=/admin/spaces/add');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Récupérer le profil utilisateur
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const { response, data } = await apiFetch('/api/auth/profile/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response && response.ok) {
          const profileData = (data as any)?.data || data;
          setProfile(profileData);
          // Utiliser l'ID utilisateur depuis le token ou le profil
          const userId = user?.id || profileData?.id || profileData?.user_id;
          if (userId) {
            setFormData(prev => ({ ...prev, user: userId }));
          }
        }
      } catch (error) {
        console.error('Erreur de récupération du profil:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Récupérer les options disponibles
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const { response, data } = await apiFetch('/api/options/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response && response.ok) {
          const optionsData = Array.isArray(data) ? data : (data as any)?.results || (data as any)?.data || [];
          setAvailableOptions(optionsData);
        }
      } catch (error) {
        console.error('Erreur de récupération des options:', error);
      }
    };

    fetchOptions();
  }, []);

  const handleInputChange = (field: keyof SpaceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (optionId: number) => {
    setFormData(prev => {
      const options = prev.options.includes(optionId)
        ? prev.options.filter(id => id !== optionId)
        : [...prev.options, optionId];
      return { ...prev, options };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...Array.from(e.target.files!)] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const images = [...prev.images];
      images.splice(index, 1);
      return { ...prev, images };
    });
  };

  const handleCreateSpace = async () => {
    try {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        toast.error("Utilisateur non authentifié");
        return;
      }

      if (!formData.user || formData.user === 0) {
        toast.error("Impossible de créer un espace : utilisateur non défini");
        return;
      }

      const form = new FormData();
      form.append("name", formData.name || "");
      form.append("description", formData.description || "");
      form.append("category", formData.category || "autre");
      form.append("capacity", (formData.capacity ?? 1).toString());
      form.append("has_parking_option", formData.has_parking_option ? "true" : "false");
      form.append("price_hour", (formData.price_hour ?? 0).toFixed(2));
      form.append("price_half_day", (formData.price_half_day ?? 0).toFixed(2));
      form.append("price_full_day", (formData.price_full_day ?? 0).toFixed(2));
      form.append("min_nights", (formData.min_nights ?? 1).toString());
      form.append("is_active", formData.is_active ? "true" : "false");
      form.append("location", formData.location || "");
      form.append("user", formData.user.toString());

      formData.options?.forEach((optId) => {
        if (optId !== undefined && optId !== null) form.append("option_ids", optId.toString());
      });

      formData.images?.forEach((file) => {
        if (file) form.append("photos", file);
      });

      console.log("📤 Données envoyées :", Array.from(form.entries()));

      const { response, data } = await apiFetch("/api/spaces/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      console.log("📩 Réponse API :", data);

      if (!response || !response.ok) {
        const errorMsg = (data as any)?.detail || (data as any)?.message || "Erreur de création d'espace";
        throw new Error(errorMsg);
      }

      toast.success("✅ Espace créé avec succès !");
      setTimeout(() => router.push("/admin?tab=spaces"), 1500);

      return (data as any)?.id;
    } catch (error: any) {
      console.error("Erreur création espace :", error);
      toast.error(error.message || "Erreur lors de la création de l'espace");
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await handleCreateSpace();
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 1, label: 'Informations de base', icon: Buildings },
      { id: 2, label: 'Équipements', icon: Plus },
      { id: 3, label: 'Images', icon: Upload },
      { id: 4, label: 'Validation', icon: Check }
    ];

    return (
      <div className="flex items-center justify-center mb-8 overflow-x-auto">
        <div className="flex items-center space-x-4 min-w-max">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-primary-900 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-primary-100 text-primary-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className="h-6 w-6" weight="light" />
                  </motion.div>
                  <span className={`text-xs mt-2 font-medium whitespace-nowrap ${
                    isActive ? 'text-primary-900' : 'text-primary-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-primary-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBasicInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Nom de l'espace *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: Espace Innovation"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Catégorie d'espace *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="bureau">Bureau</option>
            <option value="salle">Salle</option>
            <option value="appartement">Appartement</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Capacité (personnes) *
          </label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Prix par heure (XOF) *
          </label>
          <input
            type="number"
            value={formData.price_hour}
            onChange={(e) => handleInputChange('price_hour', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Prix de demi-journée (XOF) *
          </label>
          <input
            type="number"
            value={formData.price_half_day}
            onChange={(e) => handleInputChange('price_half_day', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Prix par jour (XOF) *
          </label>
          <input
            type="number"
            value={formData.price_full_day}
            onChange={(e) => handleInputChange('price_full_day', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Localisation *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: 2ème étage, Aile ouest"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Décrivez l'espace, ses caractéristiques, son ambiance..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.has_parking_option}
              onChange={(e) => handleInputChange('has_parking_option', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-primary-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-primary-900">Option de parking disponible</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-primary-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-primary-900">Espace actif</span>
          </label>
        </div>
      </div>
    </motion.div>
  );

  const renderAmenities = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-primary-900 mb-4">Équipements disponibles</h3>
        <p className="text-primary-600 mb-6">Sélectionnez les équipements inclus dans cet espace</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => {
              const isSelected = formData.options.includes(option.id);

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionToggle(option.id)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-primary-200 bg-white text-primary-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.name}</span>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary-500" weight="light" />
                    )}
                  </div>
                  {option.price && (
                    <p className="text-sm text-primary-600 mt-1">{option.price.toLocaleString('fr-FR')} XOF</p>
                  )}
                </motion.button>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-primary-500">
              <p>Aucun équipement disponible</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderImages = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-primary-900 mb-4">Images de l'espace</h3>
        <p className="text-primary-600 mb-6">Ajoutez des photos pour présenter l'espace</p>

        <div className="border-2 border-dashed border-primary-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-primary-400 mx-auto mb-4" weight="light" />
          <p className="text-primary-600 mb-2">Glissez-déposez vos images ici</p>
          <p className="text-sm text-primary-500 mb-4">ou cliquez pour sélectionner</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="inline-flex items-center space-x-2 bg-primary-900 text-white px-6 py-3 rounded-lg hover:bg-primary-800 transition-colors cursor-pointer"
          >
            <Plus className="h-5 w-5" weight="light" />
            <span>Sélectionner des images</span>
          </label>
        </div>
      </div>

      {formData.images.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-primary-900 mb-4">Images sélectionnées</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" weight="light" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderValidation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-primary-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-primary-900 mb-4">Récapitulatif</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-primary-900 mb-2">Informations de base</h4>
            <div className="space-y-2 text-sm text-primary-600">
              <p><strong>Nom :</strong> {formData.name}</p>
              <p><strong>Catégorie :</strong> {formData.category}</p>
              <p><strong>Capacité :</strong> {formData.capacity} personnes</p>
              <p><strong>Prix par heure :</strong> {formData.price_hour.toLocaleString('fr-FR')} XOF</p>
              <p><strong>Localisation :</strong> {formData.location}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-primary-900 mb-2">Équipements</h4>
            <div className="flex flex-wrap gap-2">
              {formData.options.length > 0 ? (
                formData.options.map(optionId => {
                  const option = availableOptions.find(o => o.id === optionId);
                  return (
                    <span key={optionId} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                      {option?.name}
                    </span>
                  );
                })
              ) : (
                <span className="text-primary-500 text-sm">Aucun équipement sélectionné</span>
              )}
            </div>

            <h4 className="font-medium text-primary-900 mb-2 mt-4">Images</h4>
            <p className="text-sm text-primary-600">{formData.images.length} image(s) sélectionnée(s)</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderAmenities();
      case 3:
        return renderImages();
      case 4:
        return renderValidation();
      default:
        return renderBasicInfo();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          (formData.name?.trim() ?? '') !== '' &&
          (formData.location?.trim() ?? '') !== '' &&
          !isNaN(formData.capacity) && formData.capacity > 0 &&
          !isNaN(formData.price_hour) && formData.price_hour >= 0 &&
          !isNaN(formData.price_half_day) && formData.price_half_day >= 0 &&
          !isNaN(formData.price_full_day) && formData.price_full_day >= 0
        );
      case 2:
        return true; // Les équipements sont optionnels
      case 3:
        return true; // Les images sont optionnelles
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Afficher un loader pendant la vérification
  if (authLoading || loading) {
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
            <Link href="/admin?tab=spaces">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-primary-600 hover:text-primary-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" weight="light" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-2xl font-light text-primary-900">Ajouter un espace</h1>
              <p className="text-sm text-primary-600">Créez un nouvel espace de coworking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Indicateur d'étapes */}
        {renderStepIndicator()}

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {renderCurrentStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary-100">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                <ArrowLeft className="h-5 w-5" weight="light" />
                <span>Précédent</span>
              </motion.button>

              {currentStep < 4 ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                    canProceed()
                      ? 'bg-primary-900 text-white hover:bg-primary-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>Suivant</span>
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting || !canProceed()}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                    isSubmitting || !canProceed()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
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
                      <span>Créer l'espace</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

