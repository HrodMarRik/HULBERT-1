import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BudgetTransaction } from '../../../../models/budget.model';
import { BudgetAnalysis, BudgetAlert, ProjectPricingCalculation } from '../../../../models/project.model';
import { ProjectBudgetService } from '../services/project-budget.service';

@Component({
  selector: 'app-project-budget-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-budget">
      <!-- Budget Summary -->
      <div class="budget-summary" *ngIf="budgetAnalysis">
        <div class="summary-card">
          <div class="summary-item">
            <div class="summary-value income">{{ getTotalIncome() | currency:'EUR':'symbol':'1.0-0' }}</div>
            <div class="summary-label">Revenus</div>
          </div>
          <div class="summary-item">
            <div class="summary-value expense">{{ getTotalExpenses() | currency:'EUR':'symbol':'1.0-0' }}</div>
            <div class="summary-label">Dépenses</div>
          </div>
          <div class="summary-item">
            <div class="summary-value profit" [class.negative]="getNetProfit() < 0">{{ getNetProfit() | currency:'EUR':'symbol':'1.0-0' }}</div>
            <div class="summary-label">Bénéfice Net</div>
          </div>
          <div class="summary-item">
            <div class="summary-value margin" [class.negative]="getProfitMargin() < 0">{{ getProfitMargin() | number:'1.1-1' }}%</div>
            <div class="summary-label">Marge</div>
          </div>
        </div>
      </div>

      <!-- Budget Controls -->
      <div class="budget-controls">
        <div class="filters">
          <select [(ngModel)]="selectedTransactionFilter" (ngModelChange)="onTransactionFilterChange()">
            <option value="all">Toutes les transactions</option>
            <option value="income">Revenus</option>
            <option value="expense">Dépenses</option>
          </select>
          
          <select [(ngModel)]="selectedCategoryFilter" (ngModelChange)="onCategoryFilterChange()">
            <option value="all">Toutes les catégories</option>
            <option value="labor">Main d'œuvre</option>
            <option value="materials">Matériaux</option>
            <option value="equipment">Équipement</option>
            <option value="other">Autres</option>
          </select>
        </div>
        
        <div class="actions">
          <button class="btn-primary" (click)="onAddTransaction()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Ajouter Transaction
          </button>
          
          <button class="btn-secondary" (click)="onTogglePricingCalculator()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13 12.5,13H11.5C10.04,13 9,13.9 9,15H7C7,12.79 8.79,11 11,11H13C15.21,11 17,12.79 17,15C17,17.21 15.21,19 13,19H11C8.79,19 7,17.21 7,15M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,7A1,1 0 0,0 11,8A1,1 0 0,0 12,9A1,1 0 0,0 13,8A1,1 0 0,0 12,7Z"/>
            </svg>
            Calculateur de Prix
          </button>
        </div>
      </div>

      <!-- Pricing Calculator -->
      <div class="pricing-calculator" *ngIf="showPricingCalculator">
        <div class="calculator-header">
          <h3>Calculateur de Prix</h3>
          <button class="close-btn" (click)="onTogglePricingCalculator()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <div class="calculator-form">
          <div class="form-group">
            <label>Heures estimées:</label>
            <input type="number" [(ngModel)]="pricingParams.estimatedHours" placeholder="40">
          </div>
          
          <div class="form-group">
            <label>Taux horaire (€):</label>
            <input type="number" [(ngModel)]="pricingParams.hourlyRate" placeholder="50">
          </div>
          
          <div class="form-group">
            <label>Dépenses (€):</label>
            <input type="number" [(ngModel)]="pricingParams.expenses" placeholder="500">
          </div>
          
          <div class="form-group">
            <label>Marge (%):</label>
            <input type="number" [(ngModel)]="pricingParams.marginPercentage" placeholder="30">
          </div>
          
          <button class="btn-primary" (click)="onCalculatePricing()">Calculer</button>
        </div>
        
        <div class="calculator-results" *ngIf="pricingCalculation">
          <div class="result-item">
            <span class="result-label">Coût main d'œuvre:</span>
            <span class="result-value">{{ pricingCalculation.laborCost | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Coût total:</span>
            <span class="result-value">{{ pricingCalculation.totalCost | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Marge:</span>
            <span class="result-value">{{ pricingCalculation.marginAmount | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="result-item highlight">
            <span class="result-label">Prix total:</span>
            <span class="result-value">{{ pricingCalculation.totalPrice | currency:'EUR':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="transactions-section">
        <div class="section-header">
          <h3>Transactions ({{ getFilteredTransactions().length }})</h3>
        </div>
        
        <div class="transactions-list">
          <div class="transaction-item" *ngFor="let transaction of getFilteredTransactions()">
            <div class="transaction-info">
              <div class="transaction-description">{{ transaction.description }}</div>
              <div class="transaction-meta">
                <span class="transaction-date">{{ transaction.transaction_date | date:'dd/MM/yyyy' }}</span>
                <span class="transaction-category">{{ transaction.category }}</span>
              </div>
            </div>
            
            <div class="transaction-amount" [class]="transaction.transaction_type">
              {{ transaction.amount | currency:'EUR':'symbol':'1.0-0' }}
            </div>
            
            <div class="transaction-actions">
              <button class="action-btn edit" (click)="onEditTransaction(transaction)" title="Modifier">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
              </button>
              <button class="action-btn delete" (click)="onDeleteTransaction(transaction)" title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="no-transactions" *ngIf="getFilteredTransactions().length === 0">
            <div class="no-transactions-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13 12.5,13H11.5C10.04,13 9,13.9 9,15H7C7,12.79 8.79,11 11,11H13C15.21,11 17,12.79 17,15C17,17.21 15.21,19 13,19H11C8.79,19 7,17.21 7,15M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,7A1,1 0 0,0 11,8A1,1 0 0,0 12,9A1,1 0 0,0 13,8A1,1 0 0,0 12,7Z"/>
              </svg>
            </div>
            <h4>Aucune transaction</h4>
            <p>Commencez par ajouter votre première transaction.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-budget {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .budget-summary {
      margin-bottom: 32px;
    }

    .summary-card {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 24px;
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
    }

    .summary-item {
      text-align: center;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .summary-value.income {
      color: #10b981;
    }

    .summary-value.expense {
      color: #ef4444;
    }

    .summary-value.profit {
      color: #3b82f6;
    }

    .summary-value.profit.negative {
      color: #ef4444;
    }

    .summary-value.margin {
      color: #8b5cf6;
    }

    .summary-value.margin.negative {
      color: #ef4444;
    }

    .summary-label {
      font-size: 14px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .budget-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .filters {
      display: flex;
      gap: 12px;
    }

    .filters select {
      padding: 8px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary,
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .pricing-calculator {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .calculator-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
    }

    .calculator-header h3 {
      margin: 0;
      color: #f3f4f6;
    }

    .close-btn {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #374151;
      color: #f3f4f6;
    }

    .calculator-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .form-group input {
      padding: 10px 12px;
      background: #374151;
      color: #f3f4f6;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
    }

    .calculator-results {
      padding: 24px;
      background: #1a1a1a;
      border-top: 1px solid #404040;
    }

    .result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #333;
    }

    .result-item:last-child {
      border-bottom: none;
    }

    .result-item.highlight {
      background: #2d2d2d;
      margin: 0 -24px;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 700;
    }

    .result-label {
      color: #d1d5db;
    }

    .result-value {
      color: #3b82f6;
      font-weight: 600;
    }

    .transactions-section {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      overflow: hidden;
    }

    .section-header {
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
    }

    .section-header h3 {
      margin: 0;
      color: #f3f4f6;
    }

    .transactions-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .transaction-item {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #333;
      transition: background-color 0.2s;
    }

    .transaction-item:hover {
      background: #374151;
    }

    .transaction-item:last-child {
      border-bottom: none;
    }

    .transaction-info {
      flex: 1;
    }

    .transaction-description {
      font-weight: 600;
      color: #f3f4f6;
      margin-bottom: 4px;
    }

    .transaction-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #9ca3af;
    }

    .transaction-amount {
      font-size: 16px;
      font-weight: 700;
      margin: 0 16px;
    }

    .transaction-amount.income {
      color: #10b981;
    }

    .transaction-amount.expense {
      color: #ef4444;
    }

    .transaction-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.edit {
      background: #3b82f6;
      color: white;
    }

    .action-btn.edit:hover {
      background: #2563eb;
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    .no-transactions {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
    }

    .no-transactions-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-transactions h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-transactions p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .project-budget {
        padding: 16px;
      }

      .budget-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .filters {
        justify-content: center;
      }

      .actions {
        justify-content: center;
      }

      .summary-card {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .calculator-form {
        grid-template-columns: 1fr;
      }

      .transaction-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .transaction-amount {
        margin: 0;
        text-align: center;
      }

      .transaction-actions {
        justify-content: center;
      }
    }
  `]
})
export class ProjectBudgetTabComponent implements OnInit, OnDestroy {
  @Input() projectId: number = 0;
  @Output() addTransaction = new EventEmitter<void>();
  @Output() editTransaction = new EventEmitter<BudgetTransaction>();
  @Output() deleteTransaction = new EventEmitter<BudgetTransaction>();

  private destroy$ = new Subject<void>();

  // State from service
  transactions: BudgetTransaction[] = [];
  budgetAnalysis: BudgetAnalysis | null = null;
  pricingCalculation: ProjectPricingCalculation | null = null;
  selectedTransactionFilter = 'all';
  selectedCategoryFilter = 'all';
  showPricingCalculator = false;

  // Pricing calculator form
  pricingParams = {
    estimatedHours: 40,
    hourlyRate: 50,
    expenses: 500,
    marginPercentage: 30
  };

  constructor(private projectBudgetService: ProjectBudgetService) {}

  ngOnInit(): void {
    // Subscribe to budget state changes
    this.projectBudgetService.budgetState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.transactions = state.transactions;
        this.budgetAnalysis = state.analysis;
        this.pricingCalculation = state.pricingCalculation;
        this.selectedTransactionFilter = state.selectedTransactionFilter;
        this.selectedCategoryFilter = state.selectedCategoryFilter;
        this.showPricingCalculator = state.showPricingCalculator;
      });

    // Load budget analysis for the project
    if (this.projectId) {
      this.projectBudgetService.triggerLoadBudgetAnalysis(this.projectId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Computed properties
  getTotalIncome(): number {
    return this.projectBudgetService.getTotalIncome();
  }

  getTotalExpenses(): number {
    return this.projectBudgetService.getTotalExpenses();
  }

  getNetProfit(): number {
    return this.projectBudgetService.getNetProfit();
  }

  getProfitMargin(): number {
    return this.projectBudgetService.getProfitMargin();
  }

  getFilteredTransactions(): BudgetTransaction[] {
    return this.projectBudgetService.getFilteredTransactions();
  }

  // Event handlers
  onTransactionFilterChange(): void {
    this.projectBudgetService.setTransactionFilter(this.selectedTransactionFilter);
  }

  onCategoryFilterChange(): void {
    this.projectBudgetService.setCategoryFilter(this.selectedCategoryFilter);
  }

  onAddTransaction(): void {
    this.addTransaction.emit();
  }

  onEditTransaction(transaction: BudgetTransaction): void {
    this.editTransaction.emit(transaction);
  }

  onDeleteTransaction(transaction: BudgetTransaction): void {
    this.deleteTransaction.emit(transaction);
  }

  onTogglePricingCalculator(): void {
    this.projectBudgetService.setShowPricingCalculator(!this.showPricingCalculator);
  }

  onCalculatePricing(): void {
    const calculation = this.projectBudgetService.calculateProjectPricing(this.pricingParams);
    this.projectBudgetService.setPricingCalculation(calculation);
  }
}
