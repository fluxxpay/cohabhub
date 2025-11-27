'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import AdminExpensesView from './AdminExpensesView';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  FinancialApiService,
  FinancialAllocationConfig,
  FinancialBudget,
  FinancialCategory,
  FinancialSummaryEntry,
  BudgetProgressEntry,
  Expense,
} from '@/lib/services/financial';

const defaultConfigForm = {
  name: '',
  description: '',
  effective_from: format(new Date(), 'yyyy-MM-dd'),
  is_active: false,
};

export default function FinancialManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [configs, setConfigs] = useState<FinancialAllocationConfig[]>([]);
  const [budgets, setBudgets] = useState<FinancialBudget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryEntry[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgressEntry[]>([]);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    is_expense_only: false,
  });

  const [configForm, setConfigForm] = useState(defaultConfigForm);
  const [configItems, setConfigItems] = useState<Record<number, number>>({});

  const [budgetForm, setBudgetForm] = useState({
    category_id: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category_id: 0,
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    attachment: null as File | null,
  });

  const [summaryFilters, setSummaryFilters] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const [progressFilters, setProgressFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const totalAllocation = useMemo(
    () => summary.reduce((acc, entry) => acc + entry.allocated_amount, 0),
    [summary]
  );
  const totalExpenses = useMemo(
    () => summary.reduce((acc, entry) => acc + entry.expenses, 0),
    [summary]
  );

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cats, cfgs, buds, exp] = await Promise.all([
        FinancialApiService.getCategories(),
        FinancialApiService.getConfigs(),
        FinancialApiService.getBudgets(),
        FinancialApiService.getExpenses(),
      ]);
      setCategories(cats);
      setConfigs(cfgs);
      setBudgets(buds);
      setExpenses(exp);
      await fetchSummary(summaryFilters.start, summaryFilters.end);
      await fetchBudgetProgress(progressFilters.year, progressFilters.month);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors du chargement des données financières');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (start: string, end: string) => {
    try {
      const response = await FinancialApiService.getSummary({ start, end });
      setSummary(response.summary || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors du chargement du résumé financier');
    }
  };

  const fetchBudgetProgress = async (year: number, month?: number) => {
    try {
      const response = await FinancialApiService.getBudgetProgress({ year, month });
      setBudgetProgress(response.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors du chargement des budgets');
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCategorySubmit = async () => {
    try {
      if (!categoryForm.name || !categoryForm.slug) {
        toast.error('Nom et slug sont requis');
        return;
      }
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
        is_expense_only: categoryForm.is_expense_only,
      };
      await FinancialApiService.createCategory(payload);
      toast.success('Catégorie créée');
      setCategoryForm({ name: '', slug: '', description: '', is_expense_only: false });
      fetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  const handleConfigSubmit = async () => {
    try {
      const items = Object.entries(configItems)
        .filter(([_, percentage]) => Number(percentage) > 0)
        .map(([categoryId, percentage]) => ({
          category_id: Number(categoryId),
          percentage: Number(percentage),
        }));

      if (!items.length) {
        toast.error('Ajoutez au moins une ligne avec un pourcentage');
        return;
      }

      await FinancialApiService.createConfig({
        ...configForm,
        items,
      });
      toast.success('Configuration créée');
      setConfigForm(defaultConfigForm);
      setConfigItems({});
      fetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la création de la configuration');
    }
  };

  const handleBudgetSubmit = async () => {
    try {
      if (!budgetForm.category_id) {
        toast.error('Choisissez une catégorie');
        return;
      }
      await FinancialApiService.createBudget({
        category_id: budgetForm.category_id,
        year: budgetForm.year,
        month: budgetForm.month,
        amount: Number(budgetForm.amount),
      });
      toast.success('Budget enregistré');
      setBudgetForm({
        category_id: 0,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        amount: '',
      });
      fetchAll();
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors de la sauvegarde du budget');
    }
  };

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

  const renderSummaryTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Résumé des allocations</CardTitle>
          <div className="flex gap-2">
            <Input
              type="date"
              value={summaryFilters.start}
              onChange={(e) => setSummaryFilters((prev) => ({ ...prev, start: e.target.value }))}
            />
            <Input
              type="date"
              value={summaryFilters.end}
              onChange={(e) => setSummaryFilters((prev) => ({ ...prev, end: e.target.value }))}
            />
            <Button
              variant="outline"
              onClick={() => fetchSummary(summaryFilters.start, summaryFilters.end)}
            >
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Total ventilé</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{totalAllocation.toLocaleString()} XOF</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Dépenses enregistrées</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{totalExpenses.toLocaleString()} XOF</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Différence</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {(totalAllocation - totalExpenses).toLocaleString()} XOF
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">Catégorie</th>
                  <th className="py-2">Montant théorique</th>
                  <th className="py-2">Dépenses</th>
                  <th className="py-2">Écart</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((entry) => (
                  <tr key={entry.category_id} className="border-b last:border-none">
                    <td className="py-2">{entry.category_name}</td>
                    <td className="py-2">{entry.allocated_amount.toLocaleString()} XOF</td>
                    <td className="py-2">{entry.expenses.toLocaleString()} XOF</td>
                    <td className="py-2">
                      {(entry.allocated_amount - entry.expenses).toLocaleString()} XOF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Budgets</CardTitle>
            <p className="text-sm text-muted-foreground">Suivi des budgets par catégorie</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={progressFilters.year}
              onChange={(e) =>
                setProgressFilters((prev) => ({ ...prev, year: Number(e.target.value) }))
              }
              className="w-24"
            />
            <Input
              type="number"
              value={progressFilters.month}
              onChange={(e) =>
                setProgressFilters((prev) => ({ ...prev, month: Number(e.target.value) }))
              }
              className="w-20"
            />
            <Button
              variant="outline"
              onClick={() => fetchBudgetProgress(progressFilters.year, progressFilters.month)}
            >
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budgetProgress.map((entry) => {
              const percent = entry.budget > 0 ? Math.min((entry.spent / entry.budget) * 100, 100) : 0;
              return (
                <div key={entry.category_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{entry.category_name}</span>
                    <span className="text-muted-foreground">
                      {entry.spent.toLocaleString()} / {entry.budget.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Catégories existantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-3 border rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">{category.slug}</p>
              </div>
              <div className="flex gap-2">
                {category.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {category.is_expense_only && <Badge variant="outline">Dépenses</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle catégorie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nom</Label>
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Loyer, Communication..."
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="rent, communication..."
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optionnel"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="category-expense-only"
              type="checkbox"
              checked={categoryForm.is_expense_only}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, is_expense_only: e.target.checked }))
              }
            />
            <Label htmlFor="category-expense-only">Catégorie réservée aux dépenses</Label>
          </div>
          <Button onClick={handleCategorySubmit} className="w-full">
            Ajouter la catégorie
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfigTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Configurations existantes</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchAll}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {configs.map((config) => (
            <div key={config.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{config.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Effectif dès {format(new Date(config.effective_from), 'dd/MM/yyyy')}
                  </p>
                </div>
                {config.is_active && <Badge>Active</Badge>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {config.items.map((item) => (
                  <div key={item.id} className="p-2 bg-muted rounded-md">
                    <p className="font-medium">{item.category.name}</p>
                    <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={configForm.name}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ventilation 2025"
              />
            </div>
            <div>
              <Label>Date d'effet</Label>
              <Input
                type="date"
                value={configForm.effective_from}
                onChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, effective_from: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="config-active"
                type="checkbox"
                checked={configForm.is_active}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              <Label htmlFor="config-active">Activer automatiquement</Label>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={configForm.description}
              onChange={(e) =>
                setConfigForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Pourcentages par catégorie</p>
            {categories
              .filter((cat) => !cat.is_expense_only && cat.is_active)
              .map((cat) => (
                <div key={cat.id} className="flex items-center gap-4">
                  <span className="w-48 text-sm">{cat.name}</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={configItems[cat.id] ?? ''}
                    onChange={(e) =>
                      setConfigItems((prev) => ({
                        ...prev,
                        [cat.id]: Number(e.target.value),
                      }))
                    }
                    className="w-32"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ))}
          </div>
          <Button onClick={handleConfigSubmit}>Enregistrer la configuration</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderBudgetsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Budgets existants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {budgets.map((budget) => (
            <div key={budget.id} className="border rounded-lg p-3">
              <p className="font-medium">{budget.category.name}</p>
              <p className="text-sm text-muted-foreground">
                {budget.month ? `${budget.month}/${budget.year}` : budget.year}
              </p>
              <p className="text-sm font-semibold">{Number(budget.amount).toLocaleString()} XOF</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Catégorie</Label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={budgetForm.category_id}
              onChange={(e) => setBudgetForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
            >
              <option value={0}>Sélectionnez une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Année</Label>
              <Input
                type="number"
                value={budgetForm.year}
                onChange={(e) =>
                  setBudgetForm((prev) => ({ ...prev, year: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex-1">
              <Label>Mois (optionnel)</Label>
              <Input
                type="number"
                value={budgetForm.month}
                onChange={(e) =>
                  setBudgetForm((prev) => ({ ...prev, month: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Montant</Label>
            <Input
              type="number"
              value={budgetForm.amount}
              onChange={(e) => setBudgetForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <Button onClick={handleBudgetSubmit}>Enregistrer le budget</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpensesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dépenses enregistrées (tous administrateurs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {expenses.map((expense) => (
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
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle dépense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Catégorie</Label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={expenseForm.category_id}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
            >
              <option value={0}>Sélectionnez une catégorie</option>
              {categories
                .filter((cat) => cat.is_expense_only || !cat.is_expense_only)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Label>Montant (XOF)</Label>
            <Input
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Date</Label>
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
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
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
  );

  // Si l'utilisateur n'est pas Super Admin, afficher uniquement la vue dépenses
  if (!user?.is_superuser) {
    return <AdminExpensesView />;
  }

  // Vue complète pour Super Admin
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Gestion financière et allocations</p>
          <h1 className="text-3xl font-semibold">Ressources financières</h1>
        </div>
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chargement des données financières...
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">{renderSummaryTab()}</TabsContent>
          <TabsContent value="allocations">{renderConfigTab()}</TabsContent>
          <TabsContent value="budgets">{renderBudgetsTab()}</TabsContent>
          <TabsContent value="categories">{renderCategoriesTab()}</TabsContent>
          <TabsContent value="expenses">{renderExpensesTab()}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}

