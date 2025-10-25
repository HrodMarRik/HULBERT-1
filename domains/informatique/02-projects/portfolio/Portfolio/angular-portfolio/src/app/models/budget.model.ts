export interface ProjectBudget {
  id: number;
  project_id: number;
  total_budget: number;
  currency: string;
  spent_amount: number;
  remaining_amount: number;
  budget_status: 'on-track' | 'over-budget' | 'under-budget';
  created_at: string;
  updated_at: string;
}

export interface BudgetTransaction {
  id: number;
  project_id: number;
  transaction_type: 'income' | 'expense';
  category: 'labor' | 'materials' | 'equipment' | 'travel' | 'software' | 'consulting' | 'other';
  amount: number;
  currency: string;
  description: string;
  vendor_name?: string;
  invoice_number?: string;
  transaction_date: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  // Relations
  created_by_username?: string;
}

export interface BudgetTransactionCreate {
  project_id: number;
  transaction_type: 'income' | 'expense';
  category: 'labor' | 'materials' | 'equipment' | 'travel' | 'software' | 'consulting' | 'other';
  amount: number;
  currency: string;
  description: string;
  vendor_name?: string;
  invoice_number?: string;
  transaction_date: string;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
}

export interface BudgetTransactionUpdate {
  transaction_type?: 'income' | 'expense';
  category?: 'labor' | 'materials' | 'equipment' | 'travel' | 'software' | 'consulting' | 'other';
  amount?: number;
  currency?: string;
  description?: string;
  vendor_name?: string;
  invoice_number?: string;
  transaction_date?: string;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
}

export interface BudgetAnalysis {
  total_budget: number;
  total_spent: number;
  total_income: number;
  remaining_budget: number;
  budget_utilization_percentage: number;
  monthly_spending: Array<{
    month: string;
    amount: number;
    transactions_count: number;
  }>;
  category_breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    transaction_count: number;
  }>;
  status_trend: Array<{
    date: string;
    spent_amount: number;
    remaining_amount: number;
  }>;
  projected_completion: {
    estimated_total_cost: number;
    completion_date: string;
    budget_variance: number;
  };
}

export interface BudgetAlert {
  id: number;
  project_id: number;
  alert_type: 'budget_threshold' | 'overspend_warning' | 'approval_needed' | 'invoice_overdue';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
}

export interface BudgetReport {
  project_id: number;
  project_name: string;
  report_period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_budget: number;
    total_spent: number;
    total_income: number;
    net_profit_loss: number;
    budget_variance: number;
  };
  transactions: BudgetTransaction[];
  analysis: BudgetAnalysis;
  alerts: BudgetAlert[];
  generated_at: string;
  generated_by: string;
}

// Pricing Calculation Interfaces
export interface PricingSuggestion {
  cost_based: number;
  with_margin_20: number;
  with_margin_30: number;
}

export interface SalePriceSuggestions {
  with_margin_10: number;
  with_margin_20: number;
  with_margin_30: number;
  with_margin_50: number;
  custom: number;
}

export interface RentalRatesSuggestions {
  daily: PricingSuggestion;
  monthly: PricingSuggestion;
  annual: PricingSuggestion;
}

export interface ProjectPricingCalculation {
  total_hours_spent: number;
  total_days_spent: number;
  total_costs: number;
  total_income: number;
  net_cost: number;
  hourly_rate: number;
  daily_rate: number;
  suggested_sale_price: SalePriceSuggestions;
  suggested_rental_rates: RentalRatesSuggestions;
}