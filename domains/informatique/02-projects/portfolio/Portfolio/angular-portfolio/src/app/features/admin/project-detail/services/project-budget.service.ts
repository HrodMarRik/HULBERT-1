import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BudgetTransaction } from '../../../../models/budget.model';
import { BudgetAnalysis, BudgetAlert, ProjectPricingCalculation } from '../../../../models/project.model';

export interface BudgetState {
  transactions: BudgetTransaction[];
  analysis: BudgetAnalysis | null;
  alerts: BudgetAlert[];
  pricingCalculation: ProjectPricingCalculation | null;
  selectedTransactionFilter: string;
  selectedCategoryFilter: string;
  customMarginPercentage: number;
  customMarginAmount: number;
  showPricingCalculator: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectBudgetService {
  // State subjects
  private budgetStateSubject = new BehaviorSubject<BudgetState>({
    transactions: [],
    analysis: null,
    alerts: [],
    pricingCalculation: null,
    selectedTransactionFilter: 'all',
    selectedCategoryFilter: 'all',
    customMarginPercentage: 30,
    customMarginAmount: 0,
    showPricingCalculator: false,
    isLoading: false,
    error: null
  });

  // Public observables
  public budgetState$ = this.budgetStateSubject.asObservable();

  // Action subjects
  private loadBudgetAnalysisSubject = new Subject<number>();
  private addTransactionSubject = new Subject<{projectId: number, transaction: any}>();
  private deleteTransactionSubject = new Subject<{projectId: number, transactionId: number}>();
  private calculatePricingSubject = new Subject<{projectId: number, params: any}>();

  public loadBudgetAnalysis$ = this.loadBudgetAnalysisSubject.asObservable();
  public addTransaction$ = this.addTransactionSubject.asObservable();
  public deleteTransaction$ = this.deleteTransactionSubject.asObservable();
  public calculatePricing$ = this.calculatePricingSubject.asObservable();

  constructor() {}

  // State management methods
  getCurrentState(): BudgetState {
    return this.budgetStateSubject.value;
  }

  setTransactions(transactions: BudgetTransaction[]): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      transactions,
      error: null
    });
  }

  setAnalysis(analysis: BudgetAnalysis | null): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      analysis
    });
  }

  setAlerts(alerts: BudgetAlert[]): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      alerts
    });
  }

  setPricingCalculation(calculation: ProjectPricingCalculation | null): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      pricingCalculation: calculation
    });
  }

  setTransactionFilter(filter: string): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      selectedTransactionFilter: filter
    });
  }

  setCategoryFilter(filter: string): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      selectedCategoryFilter: filter
    });
  }

  setCustomMarginPercentage(percentage: number): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      customMarginPercentage: percentage
    });
  }

  setCustomMarginAmount(amount: number): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      customMarginAmount: amount
    });
  }

  setShowPricingCalculator(show: boolean): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      showPricingCalculator: show
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      isLoading: loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.getCurrentState();
    this.budgetStateSubject.next({
      ...currentState,
      error
    });
  }

  // Action triggers
  triggerLoadBudgetAnalysis(projectId: number): void {
    this.loadBudgetAnalysisSubject.next(projectId);
  }

  triggerAddTransaction(projectId: number, transaction: any): void {
    this.addTransactionSubject.next({ projectId, transaction });
  }

  triggerDeleteTransaction(projectId: number, transactionId: number): void {
    this.deleteTransactionSubject.next({ projectId, transactionId });
  }

  triggerCalculatePricing(projectId: number, params: any): void {
    this.calculatePricingSubject.next({ projectId, params });
  }

  // Utility methods
  addTransaction(transaction: BudgetTransaction): void {
    const currentState = this.getCurrentState();
    this.setTransactions([...currentState.transactions, transaction]);
  }

  removeTransaction(transactionId: number): void {
    const currentState = this.getCurrentState();
    this.setTransactions(currentState.transactions.filter(t => t.id !== transactionId));
  }

  updateTransaction(transactionId: number, updates: Partial<BudgetTransaction>): void {
    const currentState = this.getCurrentState();
    const updatedTransactions = currentState.transactions.map(t => 
      t.id === transactionId ? { ...t, ...updates } : t
    );
    this.setTransactions(updatedTransactions);
  }

  // Computed properties
  getTransactions(): BudgetTransaction[] {
    return this.getCurrentState().transactions;
  }

  getFilteredTransactions(): BudgetTransaction[] {
    const state = this.getCurrentState();
    let filtered = state.transactions;

    // Filter by transaction type
    if (state.selectedTransactionFilter !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === state.selectedTransactionFilter);
    }

    // Filter by category
    if (state.selectedCategoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === state.selectedCategoryFilter);
    }

    return filtered;
  }

  getAnalysis(): BudgetAnalysis | null {
    return this.getCurrentState().analysis;
  }

  getAlerts(): BudgetAlert[] {
    return this.getCurrentState().alerts;
  }

  getPricingCalculation(): ProjectPricingCalculation | null {
    return this.getCurrentState().pricingCalculation;
  }

  getTotalIncome(): number {
    return this.getTransactions()
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses(): number {
    return this.getTransactions()
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNetProfit(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  getProfitMargin(): number {
    const income = this.getTotalIncome();
    if (income === 0) return 0;
    return (this.getNetProfit() / income) * 100;
  }

  // Budget validation
  validateTransaction(transaction: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!transaction.description || transaction.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push('Transaction type must be income or expense');
    }

    if (!transaction.date) {
      errors.push('Date is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Pricing calculations
  calculateProjectPricing(params: {
    estimatedHours: number;
    hourlyRate: number;
    expenses: number;
    marginPercentage?: number;
  }): ProjectPricingCalculation {
    const { estimatedHours, hourlyRate, expenses, marginPercentage = this.getCurrentState().customMarginPercentage } = params;
    
    const laborCost = estimatedHours * hourlyRate;
    const totalCost = laborCost + expenses;
    const marginAmount = totalCost * (marginPercentage / 100);
    const totalPrice = totalCost + marginAmount;
    const profitMargin = (marginAmount / totalPrice) * 100;

    return {
      project_id: 0, // Will be set when saving
      base_price: 0,
      daily_rate: 0,
      monthly_rate: 0,
      annual_rate: 0,
      currency: 'EUR',
      calculation_method: 'hourly',
      estimated_hours: estimatedHours,
      total_calculated_price: totalPrice,
      hourlyRate,
      laborCost,
      expenses,
      totalCost,
      marginPercentage,
      marginAmount,
      totalPrice,
      profitMargin,
      breakEvenHours: expenses / hourlyRate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Reset state
  resetState(): void {
    this.budgetStateSubject.next({
      transactions: [],
      analysis: null,
      alerts: [],
      pricingCalculation: null,
      selectedTransactionFilter: 'all',
      selectedCategoryFilter: 'all',
      customMarginPercentage: 30,
      customMarginAmount: 0,
      showPricingCalculator: false,
      isLoading: false,
      error: null
    });
  }
}
