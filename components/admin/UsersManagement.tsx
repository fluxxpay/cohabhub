'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  MagnifyingGlass, 
  Funnel, 
  DotsThree, 
  PencilSimple, 
  Trash, 
  Eye,
  CheckCircle,
  Warning,
  Clock,
  Envelope,
  Phone,
  Calendar,
  Star,
  X
} from '@phosphor-icons/react';
import Link from 'next/link';
import AddUserModal from './AddUserModal';

interface User {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: 'user' | 'admin';
  total_reservations: number;
  date_joined: string;
  reservations?: number;
  status?: string;
  rating?: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const USERS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    is_active: "",
    role: "",
  });

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      is_active: user.is_active.toString(),
      role: user.role || "user"
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const { response, data } = await apiFetch('/api/auth/users/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response || !response.ok) {
          throw new Error(`Erreur HTTP: ${response?.status}`);
        }

        const responseData = data as { success?: boolean; data?: User[]; total?: number };
        
        if (responseData.success) {
          setUsers(responseData.data || []);
          console.log(`Total utilisateurs trouvés : ${responseData.total}`);
        } else {
          console.error("Erreur API :", (data as any).message || (data as any).errors);
          toast.error("Erreur lors du chargement des utilisateurs");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs :", error);
        toast.error("Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fetchUserDetails = async (userId: string | number) => {
    try {
      const { response, data } = await apiFetch(`/api/auth/users/${userId}/`, {
        method: 'GET',
      });

      if (!response || !response.ok) {
        throw new Error(`Erreur HTTP: ${response?.status || 'inconnu'}`);
      }

      const responseData = data as { data?: any };
      const userData = responseData.data || data;

      const transformedUser: User = {
        id: userData.id.toString(),
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        status: userData.is_active ? 'active' : 'inactive',
        role: userData.role || 'user',
        date_joined: userData.date_joined || '',
        reservations: userData.total_reservations || 0,
        rating: userData.rating || 0,
        is_active: userData.is_active || false,
        total_reservations: userData.total_reservations || 0,
      };
      setSelectedUser(transformedUser);
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur :", error);
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const { response, data } = await apiFetch(`/api/auth/users/${editingUser.id}/`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          is_active: formData.is_active === "true",
        }),
      });

      if (!response || !response.ok) {
        throw new Error(`Erreur HTTP ${response?.status || 'inconnu'}`);
      }

      const responseData = data as { success?: boolean; data?: User };
      
      if (responseData.success) {
        setUsers(prev =>
          prev.map(u =>
            u.id.toString() === editingUser.id.toString() ? { ...u, ...responseData.data } : u
          )
        );
        setEditingUser(null);
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          is_active: "",
          role: "",
        });
        toast.success("Utilisateur mis à jour avec succès");
      } else {
        console.error("Erreur API:", (data as any).message || (data as any).errors);
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur update utilisateur:", err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteUser = async (userId: string | number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    
    try {
      const { response } = await apiFetch(`/api/auth/users/${userId}/`, {
        method: 'DELETE',
      });

      if (!response || !response.ok) {
        throw new Error(`Impossible de supprimer l'utilisateur. Statut: ${response?.status || 'inconnu'}`);
      }

      setUsers(prev => prev.filter(user => user.id.toString() !== userId.toString()));
      toast.success("Utilisateur supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression utilisateur :", err);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'inactive':
        return Warning;
      default:
        return Clock;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'user':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const userName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const userStatus = user.is_active ? 'active' : 'inactive';
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calculer les statistiques
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const totalReservations = users.reduce((sum, u) => sum + (u.total_reservations || 0), 0);

  return (
    <div className="space-y-6 lg:space-y-8 w-full">
      {/* Modal d'édition amélioré */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-primary-100"
          >
            <h2 className="text-xl font-light text-primary-900 mb-6">
              Modifier {editingUser.first_name} {editingUser.last_name}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Prénom</label>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Nom</label>
                <input
                  type="text"
                  placeholder="Nom"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Téléphone</label>
                <input
                  type="text"
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Statut</label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.value})}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-primary-100">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setEditingUser(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdateUser}
                className="px-5 py-2.5 bg-primary-900 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium shadow-lg"
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
            Gestion des utilisateurs
          </h1>
          <p className="text-primary-600 text-sm lg:text-base">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-colors shadow-lg font-medium"
        >
          <UserPlus className="h-5 w-5" weight="light" />
          <span>Ajouter un utilisateur</span>
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
              <Users className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{totalUsers}</h3>
            <p className="text-primary-700 text-sm font-medium">Total utilisateurs</p>
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
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{activeUsers}</h3>
            <p className="text-primary-700 text-sm font-medium">Utilisateurs actifs</p>
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
            <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{adminUsers}</h3>
            <p className="text-primary-700 text-sm font-medium">Administrateurs</p>
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
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-white" weight="light" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-light text-primary-900 mb-1.5 tracking-tight">{totalReservations}</h3>
            <p className="text-primary-700 text-sm font-medium">Réservations totales</p>
          </div>
        </motion.div>
      </div>

      {/* Filtres et recherche améliorés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-3">
            <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </motion.div>

      {/* Détails utilisateur amélioré */}
      {selectedUser && (() => {
        const userStatus = selectedUser.status || (selectedUser.is_active ? 'active' : 'inactive');
        const StatusIcon = getStatusIcon(userStatus);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-primary-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light text-primary-900">
                Détails de {selectedUser.first_name} {selectedUser.last_name}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedUser(null)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" weight="light" />
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                <Envelope className="h-5 w-5 text-primary-600" weight="light" />
                <div>
                  <p className="text-xs text-primary-600 mb-0.5">Email</p>
                  <p className="text-sm font-medium text-primary-900">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                <Phone className="h-5 w-5 text-primary-600" weight="light" />
                <div>
                  <p className="text-xs text-primary-600 mb-0.5">Téléphone</p>
                  <p className="text-sm font-medium text-primary-900">{selectedUser.phone || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                <Users className="h-5 w-5 text-primary-600" weight="light" />
                <div>
                  <p className="text-xs text-primary-600 mb-0.5">Rôle</p>
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-primary-600" weight="light" />
                <div>
                  <p className="text-xs text-primary-600 mb-0.5">Statut</p>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(userStatus)}`}>
                    <StatusIcon className="h-3 w-3" weight="light" />
                    <span>{userStatus === 'active' ? 'Actif' : 'Inactif'}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                <Calendar className="h-5 w-5 text-primary-600" weight="light" />
                <div>
                  <p className="text-xs text-primary-600 mb-0.5">Réservations</p>
                  <p className="text-sm font-medium text-primary-900">{selectedUser.reservations || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
                <Clock className="h-5 w-5 text-primary-600" weight="light" />
                <div>
                  <p className="text-xs text-primary-600 mb-0.5">Inscrit le</p>
                  <p className="text-sm font-medium text-primary-900">
                    {selectedUser.date_joined
                      ? new Date(selectedUser.date_joined).toLocaleDateString('fr-FR')
                      : 'Non renseigné'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Liste des utilisateurs améliorée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden w-full"
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full table-auto">
            <thead className="bg-primary-50 border-b border-primary-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-medium text-primary-900">Utilisateur</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-medium text-primary-900">Statut</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-medium text-primary-900">Rôle</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-medium text-primary-900">Réservations</th>
                <th className="px-4 lg:px-6 py-4 text-left text-sm font-medium text-primary-900">Inscrit le</th>
                <th className="px-4 lg:px-6 py-4 text-center text-sm font-medium text-primary-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {paginatedUsers.map((user, index) => {
                const fullName = `${user.first_name} ${user.last_name}`;
                const status = user.is_active ? "active" : "inactive";
                const StatusIcon = getStatusIcon(status);

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-primary-50 transition-colors border-b border-primary-100 last:border-0"
                  >
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white text-sm font-medium">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-primary-900 text-sm truncate">{fullName}</div>
                          <div className="text-xs text-primary-600 truncate">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-primary-500 truncate">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 lg:px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(status)}`}>
                        <StatusIcon className="h-3.5 w-3.5" weight="light" />
                        <span>{status === "active" ? "Actif" : "Inactif"}</span>
                      </span>
                    </td>

                    <td className="px-4 lg:px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </td>

                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm font-medium text-primary-900">{user.total_reservations || 0}</div>
                      <div className="text-xs text-primary-600">réservations</div>
                    </td>

                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-sm font-medium text-primary-900">
                        {new Date(user.date_joined).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-primary-600">
                        {new Date(user.date_joined).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                          title="Voir les détails"
                          onClick={() => fetchUserDetails(user.id)}
                        >
                          <Eye className="h-4 w-4" weight="light" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                          title="Modifier"
                          onClick={() => openEditModal(user)}
                        >
                          <PencilSimple className="h-4 w-4" weight="light" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash className="h-4 w-4" weight="light" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {paginatedUsers.length === 0 && !loading && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-primary-300 mx-auto mb-3" weight="light" />
            <p className="text-sm text-primary-500">Aucun utilisateur à afficher</p>
          </div>
        )}
      </motion.div>

      {/* Pagination améliorée */}
      {filteredUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-primary-100 p-4 lg:p-6"
        >
          <div className="text-sm text-primary-600">
            Affichage de <span className="font-medium text-primary-900">{startIndex + 1}</span> à{' '}
            <span className="font-medium text-primary-900">{Math.min(endIndex, filteredUsers.length)}</span> sur{' '}
            <span className="font-medium text-primary-900">{filteredUsers.length}</span> utilisateurs
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </motion.button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                    currentPage === i + 1 
                      ? 'bg-primary-900 text-white shadow-lg' 
                      : 'border border-primary-200 text-primary-600 hover:bg-primary-50'
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 border border-primary-200 rounded-xl text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* État vide */}
      {!loading && filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-100 p-12 text-center"
        >
          <Users className="h-16 w-16 text-primary-300 mx-auto mb-4" weight="light" />
          <h3 className="text-lg font-medium text-primary-900 mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-sm text-primary-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter un utilisateur'}
          </p>
        </motion.div>
      )}

      {/* Modal d'ajout d'utilisateur */}
      <AddUserModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Recharger la liste des utilisateurs
          const fetchUsers = async () => {
            try {
              const token = localStorage.getItem('auth-token');
              const { response, data } = await apiFetch('/api/auth/users/', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response && response.ok) {
                const responseData = data as { success?: boolean; data?: User[]; total?: number };
                if (responseData.success) {
                  setUsers(responseData.data || []);
                }
              }
            } catch (error) {
              console.error("Erreur lors du rechargement des utilisateurs :", error);
            }
          };
          fetchUsers();
        }}
      />
    </div>
  );
}

