'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Buildings,
  Plus,
  Upload,
  Check,
  X,
  ArrowLeft
} from '@phosphor-icons/react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

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

interface AddSpaceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSpaceModal({ open, onClose, onSuccess }: AddSpaceModalProps) {
  const router = useRouter();
  const { user } = useAuth();
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
  const [availableOptions, setAvailableOptions] = useState<OptionData[]>([]);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setFormData({
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
        user: user?.id || 0,
        images: []
      });
      setCurrentStep(1);
      setIsSubmitting(false);
    }
  }, [open, user]);

  // Récupérer le profil utilisateur pour obtenir l'ID
  useEffect(() => {
    if (open && user) {
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
            const userId = user?.id || profileData?.id || profileData?.user_id;
            if (userId) {
              setFormData(prev => ({ ...prev, user: userId }));
            }
          }
        } catch (error) {
          console.error('Erreur de récupération du profil:', error);
        }
      };

      fetchProfile();
    }
  }, [open, user]);

  // Récupérer les options disponibles
  useEffect(() => {
    if (open) {
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
    }
  }, [open]);

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
      onClose();
      if (onSuccess) {
        onSuccess();
      }
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
      { id: 1, label: 'Informations', icon: Buildings },
      { id: 2, label: 'Équipements', icon: Plus },
      { id: 3, label: 'Images', icon: Upload },
      { id: 4, label: 'Validation', icon: Check }
    ];

    return (
      <div className="flex items-center justify-center mb-6 overflow-x-auto pb-4">
        <div className="flex items-center space-x-2 min-w-max">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-primary-900 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-primary-100 text-primary-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Icon className="h-5 w-5" weight="light" />
                  </motion.div>
                  <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                    isActive ? 'text-primary-900' : 'text-primary-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
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
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Nom de l'espace *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex: Espace Innovation"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Catégorie *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Prix/heure (XOF) *
          </label>
          <input
            type="number"
            value={formData.price_hour}
            onChange={(e) => handleInputChange('price_hour', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Prix demi-journée (XOF) *
          </label>
          <input
            type="number"
            value={formData.price_half_day}
            onChange={(e) => handleInputChange('price_half_day', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-900 mb-2">
            Prix/jour (XOF) *
          </label>
          <input
            type="number"
            value={formData.price_full_day}
            onChange={(e) => handleInputChange('price_full_day', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            rows={3}
            className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Décrivez l'espace..."
          />
        </div>

        <div className="md:col-span-2 flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.has_parking_option}
              onChange={(e) => handleInputChange('has_parking_option', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-primary-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-primary-900">Option de parking</span>
          </label>
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
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-medium text-primary-900 mb-2">Équipements disponibles</h3>
        <p className="text-sm text-primary-600 mb-4">Sélectionnez les équipements inclus</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
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
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-primary-200 bg-white text-primary-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{option.name}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary-500" weight="light" />
                    )}
                  </div>
                  {option.price && (
                    <p className="text-xs text-primary-600 mt-1">{option.price.toLocaleString('fr-FR')} XOF</p>
                  )}
                </motion.button>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-4 text-primary-500 text-sm">
              Aucun équipement disponible
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
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-medium text-primary-900 mb-2">Images de l'espace</h3>
        <p className="text-sm text-primary-600 mb-4">Ajoutez des photos pour présenter l'espace</p>

        <div className="border-2 border-dashed border-primary-300 rounded-lg p-6 text-center">
          <Upload className="h-10 w-10 text-primary-400 mx-auto mb-3" weight="light" />
          <p className="text-primary-600 mb-1 text-sm">Glissez-déposez vos images ici</p>
          <p className="text-xs text-primary-500 mb-3">ou cliquez pour sélectionner</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload-space"
          />
          <label
            htmlFor="image-upload-space"
            className="inline-flex items-center space-x-2 bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors cursor-pointer text-sm"
          >
            <Plus className="h-4 w-4" weight="light" />
            <span>Sélectionner des images</span>
          </label>
        </div>
      </div>

      {formData.images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-primary-900 mb-3">Images sélectionnées</h4>
          <div className="grid grid-cols-3 gap-3">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" weight="light" />
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
      className="space-y-4"
    >
      <div className="bg-primary-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-primary-900 mb-3">Récapitulatif</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-primary-900 mb-2">Informations de base</h4>
            <div className="space-y-1 text-primary-600">
              <p><strong>Nom :</strong> {formData.name}</p>
              <p><strong>Catégorie :</strong> {formData.category}</p>
              <p><strong>Capacité :</strong> {formData.capacity} personnes</p>
              <p><strong>Prix/heure :</strong> {formData.price_hour.toLocaleString('fr-FR')} XOF</p>
              <p><strong>Localisation :</strong> {formData.location}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-primary-900 mb-2">Équipements</h4>
            <div className="flex flex-wrap gap-2 mb-3">
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
                <span className="text-primary-500 text-xs">Aucun équipement</span>
              )}
            </div>

            <h4 className="font-medium text-primary-900 mb-2">Images</h4>
            <p className="text-sm text-primary-600">{formData.images.length} image(s)</p>
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
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-primary-100">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-primary-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center">
                    <Buildings className="h-5 w-5 text-white" weight="light" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-primary-900">Ajouter un espace</h2>
                    <p className="text-sm text-primary-600">Créez un nouvel espace de coworking</p>
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

              {/* Step Indicator */}
              <div className="px-6 pt-4 border-b border-primary-100">
                {renderStepIndicator()}
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <form onSubmit={handleSubmit} id="space-form">
                  <AnimatePresence mode="wait">
                    {renderCurrentStep()}
                  </AnimatePresence>
                </form>
              </div>

              {/* Footer with Navigation */}
              <div className="sticky bottom-0 bg-white border-t border-primary-100 px-6 py-4 flex items-center justify-between">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" weight="light" />
                  <span className="text-sm">Précédent</span>
                </motion.button>

                {currentStep < 4 ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      canProceed()
                        ? 'bg-primary-900 text-white hover:bg-primary-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm">Suivant</span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    form="space-form"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isSubmitting || !canProceed()}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isSubmitting || !canProceed()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Création...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" weight="light" />
                        <span className="text-sm">Créer l'espace</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

