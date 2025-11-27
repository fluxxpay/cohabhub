import { apiFetch } from '../api';

export interface FinancialCategory {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  is_expense_only: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialAllocationItemPayload {
  category: number;
  percentage: number;
}

export interface FinancialAllocationConfig {
  id: number;
  name: string;
  description?: string | null;
  effective_from: string;
  is_active: boolean;
  created_at: string;
  created_by?: any;
  items: Array<{
    id: number;
    percentage: string;
    category: FinancialCategory;
  }>;
}

export interface FinancialBudget {
  id: number;
  category: FinancialCategory;
  year: number;
  month?: number | null;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  category: FinancialCategory;
  amount: string;
  date: string;
  description?: string | null;
  attachment?: string | null;
  created_by?: any;
  created_at: string;
}

export interface FinancialSummaryEntry {
  category_id: number;
  category_name: string;
  allocated_amount: number;
  expenses: number;
}

export interface FinancialSummaryResponse {
  start: string;
  end: string;
  summary: FinancialSummaryEntry[];
}

export interface BudgetProgressEntry {
  category_id: number;
  category_name: string;
  budget: number;
  spent: number;
}

export interface BudgetProgressResponse {
  year: number;
  month?: number | null;
  data: BudgetProgressEntry[];
}

export class FinancialApiService {
  static async getCategories(): Promise<FinancialCategory[]> {
    const result = await apiFetch<FinancialCategory[]>('/api/financial/categories/', { method: 'GET' });
    if (!result.response?.ok) {
      // Si l'utilisateur n'a pas accès (403), retourner un tableau vide
      return [];
    }
    return (result.data as FinancialCategory[]) || [];
  }

  static async getExpenseCategories(): Promise<FinancialCategory[]> {
    const result = await apiFetch<FinancialCategory[]>('/api/financial/expense-categories/', { method: 'GET' });
    if (!result.response?.ok) {
      const error: ApiError = result.data as ApiError;
      throw new Error(error.detail || 'Erreur lors du chargement des catégories de dépenses');
    }
    return (result.data as FinancialCategory[]) || [];
  }

  static async createCategory(payload: Partial<FinancialCategory>): Promise<FinancialCategory> {
    const result = await apiFetch<FinancialCategory>('/api/financial/categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.data as FinancialCategory;
  }

  static async updateCategory(id: number, payload: Partial<FinancialCategory>): Promise<FinancialCategory> {
    const result = await apiFetch<FinancialCategory>(`/api/financial/categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return result.data as FinancialCategory;
  }

  static async getConfigs(): Promise<FinancialAllocationConfig[]> {
    const result = await apiFetch<FinancialAllocationConfig[]>('/api/financial/configs/', { method: 'GET' });
    return result.data as FinancialAllocationConfig[];
  }

  static async createConfig(payload: {
    name: string;
    description?: string;
    effective_from: string;
    is_active: boolean;
    items: Array<{ category_id: number; percentage: number }>;
  }): Promise<FinancialAllocationConfig> {
    const result = await apiFetch<FinancialAllocationConfig>('/api/financial/configs/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.data as FinancialAllocationConfig;
  }

  static async getBudgets(): Promise<FinancialBudget[]> {
    const result = await apiFetch<FinancialBudget[]>('/api/financial/budgets/', { method: 'GET' });
    return result.data as FinancialBudget[];
  }

  static async createBudget(payload: { category_id: number; year: number; month?: number | null; amount: number }): Promise<FinancialBudget> {
    const result = await apiFetch<FinancialBudget>('/api/financial/budgets/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.data as FinancialBudget;
  }

  static async updateBudget(id: number, payload: Partial<{ year: number; month?: number | null; amount: number }>): Promise<FinancialBudget> {
    const result = await apiFetch<FinancialBudget>(`/api/financial/budgets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return result.data as FinancialBudget;
  }

  static async getSummary(params: { start?: string; end?: string } = {}): Promise<FinancialSummaryResponse> {
    const query = new URLSearchParams();
    if (params.start) query.append('start', params.start);
    if (params.end) query.append('end', params.end);
    const endpoint = `/api/financial/summary/${query.toString() ? `?${query.toString()}` : ''}`;
    const result = await apiFetch<FinancialSummaryResponse>(endpoint, { method: 'GET' });
    return result.data as FinancialSummaryResponse;
  }

  static async getBudgetProgress(params: { year: number; month?: number }): Promise<BudgetProgressResponse> {
    const query = new URLSearchParams({ year: String(params.year) });
    if (params.month) query.append('month', String(params.month));
    const result = await apiFetch<BudgetProgressResponse>(`/api/financial/budgets/progress/?${query.toString()}`, {
      method: 'GET',
    });
    return result.data as BudgetProgressResponse;
  }

  static async getExpenses(): Promise<Expense[]> {
    const result = await apiFetch<Expense[]>('/api/financial/expenses/', { method: 'GET' });
    return result.data as Expense[];
  }

  static async createExpense(payload: { category_id: number; amount: number; date: string; description?: string; attachment?: File | null }): Promise<Expense> {
    const formData = new FormData();
    formData.append('category_id', String(payload.category_id));
    formData.append('amount', String(payload.amount));
    formData.append('date', payload.date);
    if (payload.description) formData.append('description', payload.description);
    if (payload.attachment) formData.append('attachment', payload.attachment);

    const result = await apiFetch<Expense>('/api/financial/expenses/', {
      method: 'POST',
      body: formData,
    });
    return result.data as Expense;
  }

  static async getMyExpenseSummary(): Promise<{
    month: number;
    year: number;
    total_amount: number;
    total_count: number;
    by_category: Array<{
      category_id: number;
      category_name: string;
      total_amount: number;
      count: number;
    }>;
  }> {
    const result = await apiFetch<{
      month: number;
      year: number;
      total_amount: number;
      total_count: number;
      by_category: Array<{
        category_id: number;
        category_name: string;
        total_amount: number;
        count: number;
      }>;
    }>('/api/financial/my-expenses-summary/', { method: 'GET' });
    if (!result.response?.ok) {
      const error: ApiError = result.data as ApiError;
      throw new Error(error.detail || 'Erreur lors du chargement du résumé des dépenses');
    }
    return result.data as {
      month: number;
      year: number;
      total_amount: number;
      total_count: number;
      by_category: Array<{
        category_id: number;
        category_name: string;
        total_amount: number;
        count: number;
      }>;
    };
  }
}

