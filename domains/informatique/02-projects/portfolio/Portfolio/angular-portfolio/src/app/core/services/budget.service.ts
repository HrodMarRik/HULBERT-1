import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ProjectBudget, 
  BudgetTransaction, 
  BudgetTransactionCreate, 
  BudgetTransactionUpdate,
  BudgetAnalysis,
  BudgetAlert,
  BudgetReport,
  ProjectPricingCalculation
} from '../../models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'http://localhost:8000/api/projects';

  constructor(private http: HttpClient) {}

  // Budget Management
  getProjectBudget(projectId: number): Observable<ProjectBudget> {
    return this.http.get<ProjectBudget>(`${this.apiUrl}/${projectId}/budget`);
  }

  updateProjectBudget(projectId: number, budget: Partial<ProjectBudget>): Observable<ProjectBudget> {
    return this.http.patch<ProjectBudget>(`${this.apiUrl}/${projectId}/budget`, budget);
  }

  // Transaction Management
  getProjectTransactions(projectId: number, filters?: {
    transaction_type?: string;
    category?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }): Observable<BudgetTransaction[]> {
    return this.http.get<BudgetTransaction[]>(`${this.apiUrl}/${projectId}/transactions`, { params: filters });
  }

  createTransaction(projectId: number, transaction: BudgetTransactionCreate): Observable<BudgetTransaction> {
    return this.http.post<BudgetTransaction>(`${this.apiUrl}/${projectId}/transactions`, transaction);
  }

  updateTransaction(projectId: number, transactionId: number, transaction: BudgetTransactionUpdate): Observable<BudgetTransaction> {
    return this.http.patch<BudgetTransaction>(`${this.apiUrl}/${projectId}/transactions/${transactionId}`, transaction);
  }

  deleteTransaction(projectId: number, transactionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/transactions/${transactionId}`);
  }

  approveTransaction(projectId: number, transactionId: number): Observable<BudgetTransaction> {
    return this.http.patch<BudgetTransaction>(`${this.apiUrl}/${projectId}/transactions/${transactionId}/approve`, {});
  }

  rejectTransaction(projectId: number, transactionId: number, reason?: string): Observable<BudgetTransaction> {
    return this.http.patch<BudgetTransaction>(`${this.apiUrl}/${projectId}/transactions/${transactionId}/reject`, { reason });
  }

  // Analysis & Reports
  getBudgetAnalysis(projectId: number): Observable<BudgetAnalysis> {
    return this.http.get<BudgetAnalysis>(`${this.apiUrl}/${projectId}/budget/analysis`);
  }

  getBudgetReport(projectId: number, startDate?: string, endDate?: string): Observable<BudgetReport> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return this.http.get<BudgetReport>(`${this.apiUrl}/${projectId}/budget/report`, { params });
  }

  // Alerts
  getBudgetAlerts(projectId: number): Observable<BudgetAlert[]> {
    return this.http.get<BudgetAlert[]>(`${this.apiUrl}/${projectId}/budget/alerts`);
  }

  markAlertAsRead(projectId: number, alertId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${projectId}/budget/alerts/${alertId}/read`, {});
  }

  // Utility methods
  calculateBudgetUtilization(spent: number, budget: number): number {
    if (budget === 0) return 0;
    return Math.round((spent / budget) * 100);
  }

  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  getBudgetStatusColor(status: string): string {
    switch (status) {
      case 'on-track': return '#10b981';
      case 'over-budget': return '#ef4444';
      case 'under-budget': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  getTransactionTypeIcon(type: string): string {
    switch (type) {
      case 'income': return '💰';
      case 'expense': return '💸';
      default: return '📊';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'labor': return '👥';
      case 'materials': return '📦';
      case 'equipment': return '🔧';
      case 'travel': return '✈️';
      case 'software': return '💻';
      case 'consulting': return '🎯';
      default: return '📋';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'paid': return '#059669';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // Pricing Calculation
  getPricingCalculation(projectId: number): Observable<ProjectPricingCalculation> {
    return this.http.get<ProjectPricingCalculation>(`${this.apiUrl}/${projectId}/pricing-calculator`);
  }
}
