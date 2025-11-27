'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import {
  FinancialApiService,
  FinancialCategory,
  Expense,
} from '@/lib/services/financial';
import { useAuth } from '@/providers/auth-provider';

export default function ExpensesAdmin() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    category_id: 0,
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    attachment: null as File | null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, exp] = await Promise.all([
        FinancialApiService.getCategories(),
        FinancialApiService.getExpenses(),
      ]);
      setCategories(cats.filter((cat) => cat.is_active));
      setExpenses(exp);
    } catch (error: any) {
      console.error(error);
      toast.error('Erreur lors du chargement des dépenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.category_id || !form.amount) {
      toast.error('Veuillez remplir les champs requis');
      return;
    }

    try {
      await FinancialApiService.createExpense({
        category_id: form.category_id,
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        attachment: form.attachment,
      });
      toast.success('Dépense enregistrée');
      setForm({
        category_id: 0,
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        attachment: null,
      });
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de la création de la dépense');
    }
  };

  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Vous n'avez pas accès à ce module.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enregistrer une dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Catégorie</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={form.category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
              >
                <option value={0}>Choisir une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Montant</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optionnel"
              />
            </div>
            <div>
              <Label>Justificatif (PDF / image)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    attachment: e.target.files ? e.target.files[0] : null,
                  }))
                }
              />
            </div>
            <Button type="submit" className="w-full">
              Enregistrer la dépense
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des dépenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : expenses.length === 0 ? (
            <p className="text-muted-foreground">Aucune dépense enregistrée</p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-3 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{expense.category.name}</p>
                  <p className="text-xs text-muted-foreground">{expense.date}</p>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{Number(expense.amount).toLocaleString()} XOF</p>
                  {expense.attachment && (
                    <Badge variant="outline">
                      <a href={expense.attachment} target="_blank" rel="noopener noreferrer">
                        Justificatif
                      </a>
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

