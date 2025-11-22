'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddSpaceModal from './AddSpaceModal';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus,
  Camera,
  MagnifyingGlass, 
  Funnel, 
  PencilSimple, 
  Trash, 
  Eye,
  Warning,
  Clock,
  Users,
  WifiHigh, Coffee, Printer, ProjectorScreen, Monitor, Car, ForkKnife,
  Star, Gear, CheckCircle, Lightbulb, Shield, CurrencyEur, Buildings,
  X
} from '@phosphor-icons/react';

const ICONS_MAP: Record<string, any> = {
  WifiHigh,
  Coffee,
  Printer,
  ProjectorScreen,
  Monitor,
  Car,
  ForkKnife,
  Star,
  Gear,
  CheckCircle,
  Lightbulb,
  Shield,
  CurrencyEur,
  Buildings,
};

interface OptionData {
  id: number;
  name: string;
  icon: string;
  price?: number;
  category?: string;
}

interface Space {
  id: number;
  name: string;
  description: string;
  category: string;
  capacity: number;
  location: string;
  price_hour: number;
  price_half_day: number;
  price_full_day: number;
  is_active: boolean;
  status: 'available' | 'occupied' | 'maintenance';
  options: OptionData[];
  option_ids?: number[];
  occupancy: number;
}

export default function SpacesManagement() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter();
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [availableOptions, setAvailableOptions] = useState<OptionData[]>([]);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    capacity: 0,
    location: '',
    price_hour: 0,
    price_half_day: 0,
    price_full_day: 0,
    is_active: true,
    options: [] as number[],
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { response, data } = await apiFetch('/api/options/', {
          method: 'GET',
        });
        if (!response || !response.ok) {
          throw new Error('Erreur de récupération des options');
        }
        setAvailableOptions(Array.isArray(data) ? data : (data as any).data || []);
      } catch (err) {
        console.error('Erreur récupération options:', err);
        // Ne pas bloquer le chargement des espaces si les options échouent
        setAvailableOptions([]);
      }
    };
    fetchOptions();
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const { response, data } = await apiFetch('/api/spaces/', {
        method: 'GET',
      });
      if (!response || !response.ok) {
        throw new Error('Erreur de récupération des espaces');
      }

      const rawList = Array.isArray(data) ? data : ((data as any).data || (data as any).results || []);
      const parsedSpaces: Space[] = rawList.map((space: any) => {
        const rawOptions = space.options || [];
        const optionObjs: OptionData[] = rawOptions
          .map((o: any) => {
            let opt: OptionData | undefined;
            if (typeof o === 'number') {
              opt = availableOptions.find(a => a.id === o);
            } else if (o && typeof o === 'object') {
              opt = o;
            }
            if (opt && !opt.icon) opt.icon = 'Gear';
            return opt;
          })
          .filter(Boolean) as OptionData[];

        return {
          ...space,
          price_hour: parseFloat(space.price_hour || 0),
          price_half_day: parseFloat(space.price_half_day || 0),
          price_full_day: parseFloat(space.price_full_day || 0),
          status: space.is_active ? 'available' : 'maintenance',
          options: optionObjs,
          option_ids: optionObjs.map(o => o.id),
          occupancy: 0,
        };
      });
      setSpaces(parsedSpaces);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des espaces :', err);
      toast.error('Impossible de récupérer les espaces');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger les espaces indépendamment des options
    fetchSpaces();
  }, []);

  // Recharger les espaces quand les options sont disponibles pour mettre à jour les options des espaces
  useEffect(() => {
    if (availableOptions.length > 0 && spaces.length > 0) {
      // Mettre à jour les options des espaces existants
      setSpaces(prev => prev.map(space => {
        const rawOptions = space.option_ids || [];
        const optionObjs: OptionData[] = rawOptions
          .map((optId: number) => availableOptions.find(a => a.id === optId))
          .filter(Boolean) as OptionData[];
        return {
          ...space,
          options: optionObjs,
        };
      }));
    }
  }, [availableOptions]);

  const openViewModal = (spaceId: number) => {
    const s = spaces.find(sp => sp.id === spaceId) || null;
    setSelectedSpace(s);
    setShowView(!!s);
  };

  const onEditChange = (field: keyof typeof editForm, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const openEditModal = (spaceId: number) => {
    const s = spaces.find(sp => sp.id === spaceId);
    if (!s) return;
    setSelectedSpace(s);
    setEditForm({
      name: s.name,
      description: s.description,
      category: s.category,
      capacity: s.capacity,
      location: s.location,
      price_hour: s.price_hour,
      price_half_day: s.price_half_day,
      price_full_day: s.price_full_day,
      is_active: s.is_active,
      options: s.option_ids || [],
    });
    setShowEdit(true);
  };

  const toggleOption = (optId: number) => {
    setEditForm(prev => ({
      ...prev,
      options: prev.options.includes(optId)
        ? prev.options.filter(id => id !== optId)
        : [...prev.options, optId],
    }));
  };

  const saveEdit = async () => {
    if (!selectedSpace) return;
    try {
      const { response, data } = await apiFetch(`/api/spaces/${selectedSpace.id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          option_ids: editForm.options,
        }),
      });
      if (!response || !response.ok) {
        throw new Error((data as any)?.message || 'Erreur de mise à jour');
      }

      setSpaces(prev =>
        (prev || []).map(sp =>
          sp.id === selectedSpace.id
            ? {
                ...sp,
                ...editForm,
                status: editForm.is_active ? 'available' : 'maintenance',
                options: availableOptions.filter(o => editForm.options.includes(o.id)),
                option_ids: editForm.options,
              }
            : sp
        )
      );
      setShowEdit(false);
      setSelectedSpace(null);
      toast.success('Espace mis à jour avec succès');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Impossible de mettre à jour l\'espace');
    }
  };

  const handleDelete = async (spaceId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet espace ?')) return;
    try {
      const { response } = await apiFetch(`/api/spaces/${spaceId}/`, {
        method: 'DELETE',
      });
      if (!response || !response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      setSpaces(prev => (prev || []).filter(s => s.id !== spaceId));
      toast.success('Espace supprimé avec succès');
    } catch (err) {
      console.error(err);
      toast.error('Impossible de supprimer cet espace');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maintenance': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircle;
      case 'occupied': return Users;
      case 'maintenance': return Warning;
      default: return Clock;
    }
  };

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || space.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || space.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calculer les statistiques
  const totalSpaces = spaces.length;
  const availableSpaces = spaces.filter(s => s.status === 'available').length;
  const occupiedSpaces = spaces.filter(s => s.status === 'occupied').length;
  const maintenanceSpaces = spaces.filter(s => s.status === 'maintenance').length;

  return (
    <div className="space-y-6 lg:space-y-8 w-full">
      {/* Modal Vue détaillée */}
      {showView && selectedSpace && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
          onClick={() => setShowView(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-primary-900">{selectedSpace.name}</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowView(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-6 bg-primary-50 rounded-xl border border-primary-100">
                <div className="w-16 h-16 bg-primary-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Buildings className="h-8 w-8 text-white" weight="light" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h3 className="text-xl font-medium text-primary-900">
                      {selectedSpace.name}
                    </h3>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(selectedSpace.status)}`}>
                      {(() => {
                        const StatusIcon = getStatusIcon(selectedSpace.status);
                        return <StatusIcon className="h-3 w-3" weight="light" />;
                      })()}
                      <span>{selectedSpace.status === 'available' ? 'Disponible' : selectedSpace.status === 'occupied' ? 'Occupé' : 'Maintenance'}</span>
                    </span>
                  </div>
                  <p className="text-primary-600">{selectedSpace.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <Buildings className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Catégorie</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <Users className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Capacité</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.capacity} personnes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <Buildings className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Lieu</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <CurrencyEur className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Prix journée</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.price_full_day.toLocaleString("fr-FR")} XOF</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <Clock className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Horaire</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.price_hour.toLocaleString("fr-FR")} XOF</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <Clock className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Demi-journée</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.price_half_day.toLocaleString("fr-FR")} XOF</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <Clock className="h-5 w-5 text-primary-600" weight="light" />
                  <div>
                    <p className="text-xs text-primary-600 mb-0.5">Journée</p>
                    <p className="text-sm font-medium text-primary-900">{selectedSpace.price_full_day.toLocaleString("fr-FR")} XOF</p>
                  </div>
                </div>
              </div>

              {selectedSpace.options && selectedSpace.options.length > 0 && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-primary-900 mb-4">
                    Options disponibles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpace.options.map((opt) => {
                      const Icon = ICONS_MAP[opt.icon] || Gear;
                      return (
                        <span
                          key={opt.id}
                          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-primary-200 text-primary-700 rounded-xl text-sm"
                        >
                          <Icon className="h-4 w-4" weight="light" />
                          <span>{opt.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-6 border-t border-primary-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowView(false)}
                  className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
                >
                  Fermer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal Edition amélioré */}
      {showEdit && selectedSpace && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 lg:p-8 relative max-h-[90vh] overflow-y-auto border border-primary-100"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEdit(false)}
              className="absolute top-4 right-4 p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" weight="light" />
            </motion.button>

            <h2 className="text-xl font-light text-primary-900 mb-6 pb-3 border-b border-primary-100">
              Modifier l'espace <span className="text-primary-700">{selectedSpace.name}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => onEditChange("name", e.target.value)}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => onEditChange("description", e.target.value)}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Capacité</label>
                  <input
                    type="number"
                    value={editForm.capacity}
                    onChange={e => onEditChange("capacity", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Lieu</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => onEditChange("location", e.target.value)}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Prix horaire (XOF)</label>
                  <input
                    type="number"
                    value={editForm.price_hour}
                    onChange={e => onEditChange("price_hour", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Prix demi-journée (XOF)</label>
                  <input
                    type="number"
                    value={editForm.price_half_day}
                    onChange={e => onEditChange("price_half_day", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">Prix journée (XOF)</label>
                  <input
                    type="number"
                    value={editForm.price_full_day}
                    onChange={e => onEditChange("price_full_day", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">Options disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {availableOptions.map((opt) => {
                    const Icon = ICONS_MAP[opt.icon] || Gear;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleOption(opt.id)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-sm transition ${
                          editForm.options.includes(opt.id)
                            ? "bg-primary-100 border-primary-500 text-primary-700"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="h-4 w-4" weight={editForm.options.includes(opt.id) ? "fill" : "light"} />
                        <span>{opt.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl cursor-pointer hover:bg-primary-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={e => onEditChange("is_active", e.target.checked)}
                    className="w-4 h-4 rounded border-primary-200 text-primary-900 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-primary-700">Espace actif</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-primary-100 space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowEdit(false)}
                className="px-5 py-2.5 rounded-xl border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors font-medium"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveEdit}
                className="px-5 py-2.5 rounded-xl bg-primary-900 text-white hover:bg-primary-800 transition-colors font-medium shadow-lg"
              >
                Enregistrer
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* En-tête amélioré */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-primary-100"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-light text-primary-900 mb-2">
            Gestion des espaces
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Gérez les espaces de coworking
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors shadow-lg font-medium"
        >
          <Plus className="h-5 w-5" weight="light" />
          <span>Ajouter un espace</span>
        </motion.button>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Buildings className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{totalSpaces}</h3>
            <p className="text-primary-700 text-sm font-medium">Total espaces</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{availableSpaces}</h3>
            <p className="text-primary-700 text-sm font-medium">Disponibles</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{occupiedSpaces}</h3>
            <p className="text-primary-700 text-sm font-medium">Occupés</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Warning className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{maintenanceSpaces}</h3>
            <p className="text-primary-700 text-sm font-medium">En maintenance</p>
          </div>
        </motion.div>
      </div>

      {/* Filtres améliorés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
            <input 
              type="text" 
              placeholder="Rechercher un espace par nom..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
          >
            <option value="all">Tous les types</option>
            <option value="meeting">Salle de réunion</option>
            <option value="office">Bureau</option>
            <option value="coworking">Coworking</option>
            <option value="event">Événement</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="occupied">Occupé</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </motion.div>

      {/* Liste des espaces améliorée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
      >
        {filteredSpaces.length > 0 ? (
          filteredSpaces.map((space, index) => {
            const StatusIcon = getStatusIcon(space.status);
            return (
              <motion.div 
                key={space.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: index * 0.05 }} 
                className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6 hover:shadow-xl transition-all duration-300"
              >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center">
                  <Buildings className="h-6 w-6 text-white" weight="light" />
                </div>
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(space.status)}`}>
                  <StatusIcon className="h-3 w-3" weight="light" />
                  <span>{space.status === 'available' ? 'Disponible' : space.status === 'occupied' ? 'Occupé' : 'Maintenance'}</span>
                </span>
              </div>

              <h3 className="text-xl font-medium text-primary-900 mb-2">{space.name}</h3>
              <p className="text-primary-600 text-sm mb-4">{space.location}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-600">Capacité</span>
                  <span className="text-sm font-medium text-primary-900">{space.capacity} personnes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-600">Prix</span>
                  <span className="text-sm font-medium text-primary-900">{space.price_full_day.toLocaleString('fr-FR')} XOF/jour</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-primary-900 mb-2">Équipements</h4>
                <div className="flex flex-wrap gap-2">
                  {space.options && space.options.length > 0 ? (
                    space.options.map((option) => {
                      const Icon = ICONS_MAP[option.icon] || Gear;
                      return (
                        <span
                          key={option.id}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs"
                        >
                          <Icon className="h-3 w-3" weight="light" />
                          <span>{option.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-primary-500">Aucun équipement</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-1">
                <motion.button 
                  onClick={() => openViewModal(space.id)} 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }} 
                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors" 
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" weight="light"/>
                </motion.button>
                <motion.button 
                  onClick={() => openEditModal(space.id)} 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }} 
                  className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors" 
                  title="Modifier"
                >
                  <PencilSimple className="h-4 w-4" weight="light"/>
                </motion.button>
                <motion.button 
                  onClick={() => handleDelete(space.id)} 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }} 
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                  title="Supprimer"
                >
                  <Trash className="h-4 w-4" weight="light"/>
                </motion.button>
              </div>
            </motion.div>
          );
        })
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full bg-white rounded-2xl shadow-lg border border-primary-100 p-12 text-center"
          >
            <Buildings className="h-16 w-16 text-primary-300 mx-auto mb-4" weight="light" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">Aucun espace trouvé</h3>
            <p className="text-sm text-primary-600">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter un espace'}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Modal d'ajout d'espace */}
      <AddSpaceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Recharger la liste des espaces
          fetchSpaces();
        }}
      />
    </div>
  );
}

