'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  FinancialApiService,
  FinancialCategory,
  Expense,
} from '@/lib/services/financial';

export default function AdminExpensesView() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [expenseForm, setExpenseForm] = useState({
    category_id: 0,
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    attachment: null as File | null,
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cats, exp] = await Promise.all([
        FinancialApiService.getExpenseCategories(),
        FinancialApiService.getExpenses(),
      ]);
      // S'assurer que cats est un tableau
      const categoriesArray = Array.isArray(cats) ? cats : [];
      setCategories(categoriesArray);
      // S'assurer que exp est un tableau
      const expensesArray = Array.isArray(exp) ? exp : [];
      setExpenses(expensesArray);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors du chargement des données');
      // En cas d'erreur, initialiser avec des tableaux vides
      setCategories([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleExpenseSubmit = async () => {
    try {
      if (!expenseForm.category_id) {
        toast.error('Choisissez une catégorie');
        return;
      }
      if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
        toast.error('Montant invalide');
        return;
      }
      await FinancialApiService.createExpense({
        category_id: expenseForm.category_id,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description || undefined,
        attachment: expenseForm.attachment || null,
      });
      toast.success('Dépense enregistrée');
      setExpenseForm({
        category_id: 0,
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        attachment: null,
      });
      fetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la sauvegarde de la dépense');
    }
  };

  // Calculer le total des dépenses par catégorie pour le mois en cours
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const expensesThisMonth = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() + 1 === currentMonth && expDate.getFullYear() === currentYear;
  });

  const expensesByCategory = expensesThisMonth.reduce((acc, exp) => {
    const catName = exp.category.name;
    if (!acc[catName]) {
      acc[catName] = { total: 0, count: 0 };
    }
    acc[catName].total += Number(exp.amount);
    acc[catName].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const totalThisMonth = expensesThisMonth.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Gestion des dépenses</p>
          <h1 className="text-3xl font-semibold">Mes dépenses</h1>
        </div>
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chargement des données...
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Résumé mensuel */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Résumé du mois en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total dépenses</p>
                  <p className="text-2xl font-semibold">{totalThisMonth.toLocaleString()} XOF</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Nombre de dépenses</p>
                  <p className="text-2xl font-semibold">{expensesThisMonth.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Catégories utilisées</p>
                  <p className="text-2xl font-semibold">{Object.keys(expensesByCategory).length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Moyenne par dépense</p>
                  <p className="text-2xl font-semibold">
                    {expensesThisMonth.length > 0
                      ? (totalThisMonth / expensesThisMonth.length).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })
                      : 0}{' '}
                    XOF
                  </p>
                </div>
              </div>

              {Object.keys(expensesByCategory).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-3">Répartition par catégorie</p>
                  <div className="space-y-2">
                    {Object.entries(expensesByCategory)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{category}</span>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{data.total.toLocaleString()} XOF</p>
                            <p className="text-xs text-muted-foreground">{data.count} dépense(s)</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liste des dépenses */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Mes dépenses enregistrées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune dépense enregistrée
                </p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="border rounded-lg p-3 flex justify-between">
                    <div>
                      <p className="font-medium">{expense.category.name}</p>
                      <p className="text-xs text-muted-foreground">{expense.date}</p>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Number(expense.amount).toLocaleString()} XOF</p>
                      {expense.attachment && (
                        <a
                          href={expense.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Justificatif
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Formulaire de création */}
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle dépense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Catégorie *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={expenseForm.category_id}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))
                  }
                >
                  <option value={0}>Sélectionnez une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Montant (XOF) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Description de la dépense"
                  rows={3}
                />
              </div>
              <div>
                <Label>Justificatif (optionnel)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setExpenseForm((prev) => ({ ...prev, attachment: file }));
                  }}
                  className="cursor-pointer"
                />
                {expenseForm.attachment && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Fichier sélectionné: {expenseForm.attachment.name}
                  </p>
                )}
              </div>
              <Button onClick={handleExpenseSubmit} className="w-full">
                Enregistrer la dépense
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

