'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  Eye, 
  Buildings,
  WifiHigh,
  Coffee,
  Printer,
  ProjectorScreen,
  Monitor,
  CheckCircle,
  Warning,
  MagnifyingGlass,
  Star,
  Gear,
  Lightbulb,
  Shield,
  Users,
  Clock,
  CurrencyEur,
  ArrowsInLineHorizontal,
  ArrowsOutLineHorizontal,
  X
} from '@phosphor-icons/react';

interface Option {
  id: string | number;
  name: string;
  description: string;
  category: 'equipement' | 'service' | 'confort' | 'securite' | 'transport' | 'restauration';
  option_type: 'variable' | 'non_variable';
  icon: string;
  price: number;
  is_global: boolean;
  is_active: boolean;
  created_at?: string;
  createdAt?: string;
}

export default function OptionsManagement() {
  const [activeTab, setActiveTab] = useState<'global' | 'space-specific'>('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Option[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    option_type: "non_variable" as 'variable' | 'non_variable',
    price: "",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<{ id: string | number; name: string } | null>(null);

  const openAddModal = () => {
    setShowAddModal(true);
    setFormData({
      name: "",
      description: "",
      category: "",
      option_type: "non_variable",
      price: "",
    });
  };

  const openEditModal = (option: Option) => {
    setEditingOption(option);
    setShowAddModal(false);
    setFormData({
      name: option.name,
      description: option.description || "",
      category: option.category || "",
      option_type: option.option_type || "non_variable",
      price: option.price.toString(),
    });
  };

  const categories = [
    { id: 'all', label: 'Toutes', icon: Star },
    { id: 'equipement', label: 'Équipement', icon: Gear },
    { id: 'service', label: 'Service', icon: CheckCircle },
    { id: 'confort', label: 'Confort', icon: Lightbulb },
    { id: 'securite', label: 'Sécurité', icon: Shield },
    { id: 'transport', label: 'Transport', icon: Buildings },
    { id: 'restauration', label: 'Restauration', icon: Coffee }
  ];

  const optionTypes = [
    {
      id: 'non_variable',
      label: 'Non-Variable',
      description: 'Prix fixe',
      icon: ArrowsOutLineHorizontal
    },
    {
      id: 'variable',
      label: 'Variable',
      description: 'Prix Par Personne',
      icon: ArrowsInLineHorizontal
    }
  ];

  const confirmDelete = (id: string | number, name: string) => {
    setOptionToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!optionToDelete) return;
    try {
      await handleDeleteOption(optionToDelete.id);
      toast.success("Option supprimée");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer l'option");
    } finally {
      setIsDeleteModalOpen(false);
      setOptionToDelete(null);
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const { response, data } = await apiFetch('/api/options/', {
          method: 'GET',
        });

        if (!response || !response.ok) {
          throw new Error('Impossible de récupérer les options');
        }

        const optionsData = Array.isArray(data) ? data : (data as any).data || [];
        setOptions(optionsData);
      } catch (err) {
        console.error('Erreur récupération options:', err);
        toast.error('Impossible de récupérer les options');
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleDeleteOption = async (optionId: string | number) => {
    try {
      const { response } = await apiFetch(`/api/options/${optionId}/`, {
        method: 'DELETE',
      });

      if (!response || (!response.ok && response.status !== 204)) {
        throw new Error('Impossible de supprimer l\'option');
      }

      setOptions(prev => prev.filter(opt => opt.id !== optionId));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleOptionStatus = async (optionId: string | number) => {
    try {
      const { response, data } = await apiFetch(`/api/options/${optionId}/toggle_active/`, {
        method: 'POST',
      });

      if (!response || !response.ok) {
        throw new Error('Impossible de changer le statut de l\'option');
      }

      setOptions(prev =>
        prev.map(opt =>
          opt.id === optionId ? { ...opt, is_active: (data as any).is_active } : opt
        )
      );
      toast.success('Statut mis à jour');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      WifiHigh, Coffee, Printer, ProjectorScreen, Monitor, Buildings,
      Star, Gear, CheckCircle, Lightbulb, Shield, Users, Clock, CurrencyEur
    };
    return iconMap[iconName] || Star;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'equipement':
        return 'bg-blue-100 text-blue-700';
      case 'service':
        return 'bg-green-100 text-green-700';
      case 'confort':
        return 'bg-yellow-100 text-yellow-700';
      case 'securite':
        return 'bg-red-100 text-red-700';
      case 'transport':
        return 'bg-purple-100 text-purple-700';
      case 'restauration':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredOptions = options.filter(option => {
    const matchesTab = activeTab === 'global' ? option.is_global : !option.is_global;
    const matchesSearch = option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         option.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || option.category === selectedCategory;
    return matchesTab && matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredOptions.length / itemsPerPage);
  const paginatedOptions = filteredOptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateOption = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const { response, data } = await apiFetch('/api/options/', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          is_global: true,
          is_active: true,
          icon: "Star", // Icône par défaut
        }),
      });

      if (!response || !response.ok) {
        throw new Error((data as any)?.message || `Erreur HTTP ${response?.status || "inconnu"}`);
      }

      const newOption = data as Option;
      setOptions((prev) => [newOption, ...prev]);
      setShowAddModal(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        option_type: "non_variable",
        price: "",
      });
      toast.success("Option créée avec succès");
    } catch (err) {
      console.error("Erreur création option:", err);
      toast.error("Impossible de créer l'option");
    }
  };

  const handleSaveOption = async () => {
    if (!editingOption) return;

    try {
      const { response, data } = await apiFetch(`/api/options/${editingOption.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
        }),
      });

      if (!response || !response.ok) {
        throw new Error((data as any)?.message || `Erreur HTTP ${response?.status || "inconnu"}`);
      }

      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === editingOption.id ? { ...opt, ...(data as Option) } : opt
        )
      );

      setEditingOption(null);
      setFormData({
        name: "",
        description: "",
        category: "",
        option_type: "non_variable",
        price: "",
      });
      toast.success("Option mise à jour");
    } catch (err) {
      console.error("Erreur update option:", err);
      toast.error("Impossible de modifier");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 w-full">
      {/* En-tête amélioré */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-primary-100"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-light text-primary-900 mb-2">
            Gestion des options
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Gérez les services et équipements disponibles
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors shadow-lg font-medium"
        >
          <Plus className="h-5 w-5" weight="light" />
          <span>Nouvelle option</span>
        </motion.button>
      </motion.div>

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total', value: options.length, icon: Star, color: 'bg-blue-500' },
          { label: 'Globales', value: options.filter(o => o.is_global).length, icon: Buildings, color: 'bg-green-500' },
          { label: 'Spécifiques', value: options.filter(o => !o.is_global).length, icon: Gear, color: 'bg-purple-500' },
          { label: 'Actives', value: options.filter(o => o.is_active).length, icon: CheckCircle, color: 'bg-yellow-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" weight="light" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{stat.value}</h3>
                <p className="text-primary-700 text-sm font-medium">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Onglets et filtres améliorés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('global')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'global'
                  ? 'bg-primary-900 text-white shadow-lg'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              Options globales
            </motion.button>
          </div>

          <div className="relative w-full lg:w-auto">
            <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
            <input
              type="text"
              placeholder="Rechercher une option..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-64 pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-900 text-white shadow-lg'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                }`}
              >
                <Icon className="h-4 w-4" weight="light" />
                <span>{category.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Liste des options améliorée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {paginatedOptions.length > 0 ? (
          paginatedOptions.map((option, index) => {
            const Icon = getIconComponent(option.icon);
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-600" weight="light" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="text-lg font-medium text-primary-900">{option.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(option.category)} border-opacity-50`}>
                          {categories.find(c => c.id === option.category)?.label}
                        </span>
                        {option.is_active ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-medium">
                            <CheckCircle className="h-3 w-3" weight="light" />
                            <span>Actif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium">
                            <Warning className="h-3 w-3" weight="light" />
                            <span>Inactif</span>
                          </span>
                        )}
                      </div>
                      
                      <p className="text-primary-600 mb-3">{option.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-primary-500">
                        <div className="flex items-center space-x-1">
                          <span>
                            {option.price === 0 ? 'Gratuit' : `${Math.round(option.price).toLocaleString('fr-FR')} XOF`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Buildings className="h-4 w-4" weight="light" />
                          <span>Tous les espaces</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedOption(option)}
                      className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" weight="light" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(option)}
                      className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <PencilSimple className="h-4 w-4" weight="light" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleOptionStatus(option.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        option.is_active
                          ? 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={option.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {option.is_active ? (
                        <Warning className="h-4 w-4" weight="light" />
                      ) : (
                        <CheckCircle className="h-4 w-4" weight="light" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => confirmDelete(option.id, option.name)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash className="h-4 w-4" weight="light" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-primary-100 p-12 text-center"
          >
            <Star className="h-16 w-16 text-primary-300 mx-auto mb-4" weight="light" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">Aucune option trouvée</h3>
            <p className="text-sm text-primary-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter une option'}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Pagination améliorée */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-primary-100 p-4 lg:p-6"
        >
          <div className="text-sm text-primary-600">
            Page <span className="font-medium text-primary-900">{currentPage}</span> sur{' '}
            <span className="font-medium text-primary-900">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Précédent
            </motion.button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                    page === currentPage
                      ? 'bg-primary-900 text-white shadow-lg'
                      : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Suivant
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Modal de création */}
      {showAddModal && !editingOption && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-primary-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">Nouvelle option</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    name: "",
                    description: "",
                    category: "",
                    option_type: "non_variable",
                    price: "",
                  });
                }}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom de l'option"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'option"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Catégorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.filter(cat => cat.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Type d'option
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {optionTypes.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = formData.option_type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, option_type: type.id as 'variable' | 'non_variable' })}
                        className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-primary-200 hover:border-primary-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4 text-primary-600" weight={isSelected ? "fill" : "regular"} />
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Prix (XOF)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-primary-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    name: "",
                    description: "",
                    category: "",
                    option_type: "non_variable",
                    price: "",
                  });
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateOption}
                className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
              >
                Créer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal d'édition amélioré */}
      {editingOption && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-primary-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">Modifier l'option</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingOption(null);
                  setFormData({
                    name: "",
                    description: "",
                    category: "",
                    option_type: "non_variable",
                    price: "",
                  });
                }}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Changer la catégorie</option>
                  {categories.filter(cat => cat.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Type d'option
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {optionTypes.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = formData.option_type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, option_type: type.id as 'variable' | 'non_variable' })}
                        className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-primary-200 hover:border-primary-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4 text-primary-600" weight={isSelected ? "fill" : "regular"} />
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Prix</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Prix"
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-primary-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingOption(null);
                  setFormData({
                    name: "",
                    description: "",
                    category: "",
                    option_type: "non_variable",
                    price: "",
                  });
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveOption}
                className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
              >
                Sauvegarder
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de suppression amélioré */}
      {isDeleteModalOpen && optionToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-primary-100"
          >
            <h2 className="text-xl font-light text-primary-900 mb-4">
              Confirmation de suppression
            </h2>
            <p className="text-primary-600 mb-6">
              Voulez-vous vraiment supprimer l'option{' '}
              <span className="font-medium text-primary-900">{optionToDelete.name}</span> ?
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-primary-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium shadow-lg"
              >
                Supprimer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de détails amélioré */}
      {selectedOption && (() => {
        const Icon = getIconComponent(selectedOption.icon);
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 lg:p-8 border border-primary-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary-600" weight="light" />
                  </div>
                  <h2 className="text-2xl font-light text-primary-900">{selectedOption.name}</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedOption(null)}
                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" weight="light" />
                </motion.button>
              </div>
              <p className="text-primary-600 mb-6">{selectedOption.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                  <Star className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Catégorie</p>
                    <p className="text-sm font-medium text-primary-900">
                      {categories.find(c => c.id === selectedOption.category)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                  <CurrencyEur className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Prix</p>
                    <p className="text-sm font-medium text-primary-900">
                      {selectedOption.price === 0 ? 'Gratuit' : `${selectedOption.price.toLocaleString('fr-FR')} XOF`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-primary-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedOption(null)}
                  className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
                >
                  Fermer
                </motion.button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}

