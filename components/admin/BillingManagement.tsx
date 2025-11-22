'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { toast } from 'sonner';
import {
  Receipt,
  Download,
  Eye,
  TrendUp,
  CheckCircle,
  Warning,
  Clock,
  CurrencyEur,
  Buildings,
  X,
  FileText,
  Envelope,
  User,
  Calendar,
  Users,
  Tag
} from '@phosphor-icons/react';

interface InvoiceItem {
  id: number;
  name: string;
  description: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  status: 'paid' | 'draft' | 'overdue' | 'cancelled';
  description: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  items: InvoiceItem[];
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  space_name?: string;
  event_name?: string;
  reservation_time?: string;
  reservation_date?: string;
  reservation?: number;
  user_details?: {
    name: string;
    email?: string;
  };
  space_details?: {
    name: string;
  };
}

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  results: T[];
}

const downloadInvoice = async (invoiceId: number): Promise<Blob> => {
  try {
    const token = localStorage.getItem('auth-token');
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/admin/invoices/${invoiceId}/download/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

const fetchInvoices = async (
  page: number = 1,
  perPage: number = 20,
  filters: {
    status?: string;
    user_id?: number;
    search?: string;
    ordering?: string;
  } = {}
): Promise<PaginatedResponse<Invoice>> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(filters.ordering && { ordering: filters.ordering }),
    });

    if (filters.user_id) {
      params.append('user_id', filters.user_id.toString());
    }

    const { response, data } = await apiFetch(`/api/admin/invoices/?${params}`, {
      method: 'GET',
    });

    if (!response || !response.ok) {
      throw new Error('Erreur lors de la récupération des factures');
    }

    const jsonData = data as any;

    return {
      results: jsonData.results ?? [],
      count: jsonData.count ?? 0,
      total_pages: jsonData.total_pages ?? 0,
      current_page: jsonData.current_page ?? 1,
    };
  } catch (error) {
    console.error('Fetch invoices error:', error);
    throw error;
  }
};

const fetchInvoiceDetail = async (invoiceId: number): Promise<Invoice> => {
  try {
    const { response, data } = await apiFetch(`/api/admin/invoices/${invoiceId}/`, {
      method: 'GET',
    });

    if (!response || !response.ok) {
      throw new Error('Erreur lors de la récupération des détails');
    }

    const invoiceData = data as Invoice;

    if (!invoiceData.items) {
      console.warn('Invoice detail incomplete:', invoiceData);
      invoiceData.items = [];
    }

    return invoiceData;
  } catch (error) {
    console.error('Fetch invoice detail error:', error);
    throw error;
  }
};

export default function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetchInvoices(1, 1000);
        setInvoices(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        toast.error('Erreur lors du chargement des factures');
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, []);

  const handleDownload = async (invoiceId: number) => {
    try {
      const blob = await downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Facture téléchargée avec succès');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleViewDetails = async (invoiceId: number) => {
    try {
      setModalLoading(true);
      const invoiceDetail = await fetchInvoiceDetail(invoiceId);
      setSelectedInvoice(invoiceDetail);
      setIsModalOpen(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement des détails';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    setFilteredInvoices(
      invoices.filter(invoice => {
        const userFullName = `${invoice.user_first_name ?? ''} ${invoice.user_last_name ?? ''}`.toLowerCase();
        const matchesSearch =
          userFullName.includes(lowerSearch) ||
          (invoice.invoice_number ?? '').toLowerCase().includes(lowerSearch) ||
          (invoice.space_name ?? '').toLowerCase().includes(lowerSearch);

        const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
        return matchesSearch && matchesStatus;
      })
    );
  }, [invoices, searchTerm, selectedStatus]);

  const displayedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'draft')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);

  const stats = [
    {
      title: 'Revenus totaux',
      value: `${totalRevenue.toLocaleString('fr-FR')} XOF`,
      change: '+23%',
      trend: 'up' as const,
      icon: CurrencyEur,
      color: 'bg-green-500'
    },
    {
      title: 'Factures payées',
      value: invoices.filter(inv => inv.status === 'paid').length.toString(),
      change: '+18%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'bg-blue-500'
    },
    {
      title: 'En attente',
      value: `${pendingAmount.toLocaleString('fr-FR')} XOF`,
      change: '-5%',
      trend: 'down' as const,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'En retard',
      value: `${overdueAmount.toLocaleString('fr-FR')} XOF`,
      change: '+12%',
      trend: 'up' as const,
      icon: Warning,
      color: 'bg-red-500'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'draft':
        return Clock;
      case 'overdue':
        return Warning;
      case 'cancelled':
        return Receipt;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'draft': return 'En attente';
      case 'overdue': return 'En retard';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-primary-900 mb-2">Gestion de la facturation</h1>
          <p className="text-primary-600">Gérez les paiements et factures</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" weight="light" />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendUp className="h-4 w-4" weight="light" />
                  <span>{stat.change}</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-primary-900 mb-1">{stat.value}</h3>
                <p className="text-primary-600 text-sm">{stat.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Résumé financier */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-light text-primary-900 mb-6">Résumé financier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{totalRevenue.toLocaleString('fr-FR')} XOF</div>
            <p className="text-primary-600 text-sm">Revenus totaux</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{pendingAmount.toLocaleString('fr-FR')} XOF</div>
            <p className="text-primary-600 text-sm">En attente</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{overdueAmount.toLocaleString('fr-FR')} XOF</div>
            <p className="text-primary-600 text-sm">En retard</p>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-400" weight="light" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="draft">En attente</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary-900">Facture</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary-900">Client</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary-900">Espace</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary-900">Montant</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-primary-900">Date</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-primary-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {displayedInvoices.map((invoice, index) => {
                const StatusIcon = getStatusIcon(invoice.status);
                const userName = invoice.user_details?.name || 
                  `${invoice.user_first_name || ''} ${invoice.user_last_name || ''}`.trim() || 
                  invoice.user_email || 
                  'N/A';
                const spaceName = invoice.space_details?.name || invoice.space_name || 'N/A';

                return (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-primary-900">{invoice.invoice_number}</div>
                        <div className="text-sm text-primary-600">{invoice.description || 'N/A'}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-900 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" weight="light" />
                        </div>
                        <span className="text-primary-900">{userName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Buildings className="h-4 w-4 text-primary-400" weight="light" />
                        <span className="text-primary-900">{spaceName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-primary-900">
                        {parseFloat(invoice.total_amount || '0').toLocaleString('fr-FR')} XOF
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        <StatusIcon className="h-3 w-3" weight="light" />
                        <span>{getStatusText(invoice.status)}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-primary-900">
                        {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      {invoice.due_date && (
                        <div className="text-xs text-primary-600">
                          Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-primary-400 hover:text-primary-600 transition-colors"
                          title="Voir la facture"
                          onClick={() => handleViewDetails(invoice.id)}
                        >
                          <Eye className="h-4 w-4" weight="light" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-primary-400 hover:text-primary-600 transition-colors"
                          title="Télécharger"
                          onClick={() => handleDownload(invoice.id)}
                        >
                          <Download className="h-4 w-4" weight="light" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`px-2 py-1 text-lg font-bold rounded ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-primary-900 hover:text-primary-700 transition'
          }`}
        >
          ←
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              page === currentPage
                ? 'bg-primary-900 text-white'
                : 'text-primary-900 hover:bg-primary-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 text-lg font-bold rounded ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-primary-900 hover:text-primary-700 transition'
          }`}
        >
          →
        </button>
      </div>

      {/* Modale de détails de facture */}
      <AnimatePresence>
        {isModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {modalLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-light text-primary-900">Facture #{selectedInvoice.invoice_number}</h2>
                        <p className="text-primary-600">{selectedInvoice.description}</p>
                      </div>
                      <button
                        onClick={closeModal}
                        className="p-2 text-primary-400 hover:text-primary-600 transition-colors"
                      >
                        <X className="h-6 w-6" weight="light" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-primary-50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-primary-600 mb-2">Client</h3>
                        <p className="text-primary-900">
                          {selectedInvoice.user_details?.name || 
                           `${selectedInvoice.user_first_name || ''} ${selectedInvoice.user_last_name || ''}`.trim() || 
                           selectedInvoice.user_email || 
                           'N/A'}
                        </p>
                        {selectedInvoice.user_email && (
                          <p className="text-sm text-primary-600">{selectedInvoice.user_email}</p>
                        )}
                      </div>

                      <div className="bg-primary-50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-primary-600 mb-2">Espace</h3>
                        <p className="text-primary-900">
                          {selectedInvoice.space_details?.name || selectedInvoice.space_name || 'N/A'}
                        </p>
                        {selectedInvoice.event_name && (
                          <p className="text-sm text-primary-600">Événement: {selectedInvoice.event_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-primary-900 mb-4">Articles</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-primary-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-primary-900">Description</th>
                              <th className="px-4 py-2 text-center text-sm font-medium text-primary-900">Quantité</th>
                              <th className="px-4 py-2 text-right text-sm font-medium text-primary-900">Prix unitaire</th>
                              <th className="px-4 py-2 text-right text-sm font-medium text-primary-900">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary-100">
                            {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                              selectedInvoice.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-2">
                                    <div className="font-medium text-primary-900">{item.name}</div>
                                    {item.description && (
                                      <div className="text-sm text-primary-600">{item.description}</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center text-primary-900">{item.quantity}</td>
                                  <td className="px-4 py-2 text-right text-primary-900">
                                    {parseFloat(item.unit_price || '0').toLocaleString('fr-FR')} XOF
                                  </td>
                                  <td className="px-4 py-2 text-right font-medium text-primary-900">
                                    {parseFloat(item.total_price || '0').toLocaleString('fr-FR')} XOF
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-4 text-center text-primary-600">
                                  Aucun article
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-primary-50">
                            <tr>
                              <td colSpan={3} className="px-4 py-4 text-right font-medium text-primary-900">
                                Total
                              </td>
                              <td className="px-4 py-4 text-right font-bold text-primary-900">
                                {parseFloat(selectedInvoice.total_amount || '0').toLocaleString('fr-FR')} XOF
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-primary-100">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDownload(selectedInvoice.id)}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
                      >
                        <Download className="h-5 w-5" weight="light" />
                        <span>Télécharger PDF</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={closeModal}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Fermer
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

