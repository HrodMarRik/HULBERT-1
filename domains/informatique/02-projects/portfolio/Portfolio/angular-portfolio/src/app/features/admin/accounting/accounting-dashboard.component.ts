import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';
import { PayrollService, Employee, PayrollEntry } from '../../../core/services/payroll.service';
import { SocialService, TaxDeclaration, SocialCharge } from '../../../core/services/social.service';
import { AccountingService, AccountingEntry } from '../../../core/services/accounting.service';

@Component({
  selector: 'app-accounting-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="accounting-dashboard">
      <!-- Indicateur de chargement -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Chargement des données comptables...</p>
        </div>
      </div>

      <!-- Message d'erreur -->
      <div class="error-message" *ngIf="error && !isLoading">
        <div class="error-content">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,4.5L11.5,7.5L8.5,8L11.5,8.5L12,11.5L12.5,8.5L15.5,8L12.5,7.5L12,4.5Z"/>
          </svg>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="loadAccountingData()">Réessayer</button>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="dashboard-content" *ngIf="!isLoading && !error">
        <div class="dashboard-header">
          <h1>Tableau de Bord Comptable</h1>
          <p>Gestion complète de la comptabilité, facturation et paie</p>
        </div>

      <div class="dashboard-grid">
        <!-- KPIs Financiers -->
        <div class="kpi-section">
          <h2>Indicateurs Financiers</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon">💰</div>
              <div class="kpi-content">
                <h3>Chiffre d'Affaires</h3>
                <div class="kpi-value">{{ totalRevenue | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                <div class="kpi-change" [class]="isRevenueChangePositive() ? 'positive' : 'negative'">
                  {{ isRevenueChangePositive() ? '+' : '' }}{{ getRevenueChange() }}% ce mois
                </div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">📊</div>
              <div class="kpi-content">
                <h3>Marge Brute</h3>
                <div class="kpi-value">{{ grossMargin | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                <div class="kpi-change" [class]="isMarginChangePositive() ? 'positive' : 'negative'">
                  {{ isMarginChangePositive() ? '+' : '' }}{{ getMarginChange() }}% ce mois
                </div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">💳</div>
              <div class="kpi-content">
                <h3>Créances Clients</h3>
                <div class="kpi-value">{{ accountsReceivable | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                <div class="kpi-change" [class]="isReceivableChangePositive() ? 'positive' : 'negative'">
                  {{ isReceivableChangePositive() ? '+' : '' }}{{ getReceivableChange() }}% ce mois
                </div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">🏦</div>
              <div class="kpi-content">
                <h3>Trésorerie</h3>
                <div class="kpi-value">{{ cashFlow | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                <div class="kpi-change" [class]="isCashFlowChangePositive() ? 'positive' : 'negative'">
                  {{ isCashFlowChangePositive() ? '+' : '' }}{{ getCashFlowChange() }}% ce mois
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modules Comptables -->
        <div class="modules-section">
          <h2>Modules Comptables</h2>
          <div class="modules-grid">
            <div class="module-card" routerLink="/admin/accounting/invoices">
              <div class="module-icon">📄</div>
              <div class="module-content">
                <h3>Facturation</h3>
                <p>Gestion des factures, devis et bons de commande</p>
                <div class="module-stats">
                  <span>{{ invoiceCount }} factures</span>
                  <span>{{ pendingInvoices }} en attente</span>
                </div>
              </div>
            </div>

            <div class="module-card" routerLink="/admin/accounting/payroll">
              <div class="module-icon">👥</div>
              <div class="module-content">
                <h3>Paie</h3>
                <p>Gestion des employés et bulletins de paie</p>
                <div class="module-stats">
                  <span>{{ employeeCount }} employés</span>
                  <span>{{ pendingPayslips }} bulletins</span>
                </div>
              </div>
            </div>

            <div class="module-card" routerLink="/admin/accounting/social">
              <div class="module-icon">🏛️</div>
              <div class="module-content">
                <h3>Déclarations Sociales</h3>
                <p>DSN et cotisations sociales</p>
                <div class="module-stats">
                  <span>{{ socialDeclarations }} déclarations</span>
                  <span>{{ totalSocialCharges | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                </div>
              </div>
            </div>

            <div class="module-card" routerLink="/admin/accounting/reports">
              <div class="module-icon">📈</div>
              <div class="module-content">
                <h3>Rapports Comptables</h3>
                <p>Bilan, compte de résultat, balance</p>
                <div class="module-stats">
                  <span>{{ fiscalYear }} exercice</span>
                  <span>{{ reportCount }} rapports</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Rapides -->
        <div class="quick-actions-section">
          <h2>Actions Rapides</h2>
          <div class="actions-grid">
            <button class="action-btn primary" (click)="createInvoice()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Nouvelle Facture
            </button>
            <button class="action-btn secondary" (click)="generatePayslips()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
              Générer Bulletins
            </button>
            <button class="action-btn secondary" (click)="exportDSN()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Exporter DSN
            </button>
            <button class="action-btn secondary" (click)="generateReports()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
              </svg>
              Rapports Mensuels
            </button>
          </div>
        </div>

        <!-- Alertes et Notifications -->
        <div class="alerts-section">
          <h2>Alertes et Notifications</h2>
          <div class="alerts-list">
            <div class="alert-item warning" *ngIf="pendingInvoices > 0">
              <div class="alert-icon">⚠️</div>
              <div class="alert-content">
                <h4>{{ pendingInvoices }} factures en attente de paiement</h4>
                <p>Relancez vos clients pour accélérer les encaissements</p>
              </div>
            </div>
            <div class="alert-item info" *ngIf="socialDeclarationsDue > 0">
              <div class="alert-icon">📅</div>
              <div class="alert-content">
                <h4>{{ socialDeclarationsDue }} déclarations sociales à effectuer</h4>
                <p>Échéance dans {{ daysUntilDeadline }} jours</p>
              </div>
            </div>
            <div class="alert-item success" *ngIf="recentPayments > 0">
              <div class="alert-icon">✅</div>
              <div class="alert-content">
                <h4>{{ recentPayments }} paiements reçus cette semaine</h4>
                <p>Excellent suivi des encaissements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accounting-dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: #0f0f0f;
      min-height: 100vh;
      position: relative;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 15, 15, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      text-align: center;
      color: #ffffff;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #333;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .error-content {
      text-align: center;
      color: #ef4444;
      background: #1a1a1a;
      padding: 2rem;
      border-radius: 8px;
      border: 1px solid #333;
    }

    .error-content svg {
      margin-bottom: 1rem;
    }

    .retry-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
      transition: background 0.3s ease;
    }

    .retry-btn:hover {
      background: #2563eb;
    }

    .dashboard-content {
      width: 100%;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .dashboard-header p {
      font-size: 1.1rem;
      color: #a0a0a0;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .kpi-section, .modules-section, .quick-actions-section, .alerts-section {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid #333;
    }

    .kpi-section h2, .modules-section h2, .quick-actions-section h2, .alerts-section h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1.5rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: #2a2a2a;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      transition: all 0.3s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .kpi-icon {
      font-size: 2rem;
      margin-right: 1rem;
    }

    .kpi-content h3 {
      font-size: 0.9rem;
      font-weight: 500;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }

    .kpi-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .kpi-change {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .kpi-change.positive {
      color: #10b981;
    }

    .kpi-change.negative {
      color: #ef4444;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .module-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: #2a2a2a;
      border-radius: 8px;
      border: 1px solid #333;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .module-card:hover {
      background: #333;
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .module-icon {
      font-size: 2.5rem;
      margin-right: 1rem;
    }

    .module-content h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }

    .module-content p {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.75rem;
    }

    .module-stats {
      display: flex;
      gap: 1rem;
    }

    .module-stats span {
      font-size: 0.8rem;
      font-weight: 500;
      color: #3b82f6;
      background: #1e3a8a;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn.primary {
      background: #3b82f6;
      color: white;
    }

    .action-btn.primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .action-btn.secondary {
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #333;
    }

    .action-btn.secondary:hover {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alert-item.warning {
      background: #2a2a2a;
      border-left-color: #f59e0b;
    }

    .alert-item.info {
      background: #2a2a2a;
      border-left-color: #3b82f6;
    }

    .alert-item.success {
      background: #2a2a2a;
      border-left-color: #10b981;
    }

    .alert-icon {
      font-size: 1.5rem;
      margin-right: 1rem;
    }

    .alert-content h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .alert-content p {
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    @media (max-width: 768px) {
      .accounting-dashboard {
        padding: 1rem;
        overflow-x: hidden;
      }

      .dashboard-header h1 {
        font-size: 2rem;
      }

      .kpi-grid, .modules-grid, .actions-grid {
        grid-template-columns: 1fr;
      }

    }

  `]
})
export class AccountingDashboardComponent implements OnInit {
  // KPIs Financiers - Données réelles
  totalRevenue = 0;
  grossMargin = 0;
  accountsReceivable = 0;
  cashFlow = 0;

  // Statistiques Modules - Données réelles
  invoiceCount = 0;
  pendingInvoices = 0;
  employeeCount = 0;
  pendingPayslips = 0;
  socialDeclarations = 0;
  totalSocialCharges = 0;
  fiscalYear = new Date().getFullYear();
  reportCount = 0;

  // Alertes - Données réelles
  socialDeclarationsDue = 0;
  daysUntilDeadline = 0;
  recentPayments = 0;

  // États de chargement
  isLoading = true;
  error: string | null = null;

  // Données pour calculer les évolutions
  previousMonthData = {
    totalRevenue: 0,
    grossMargin: 0,
    accountsReceivable: 0,
    cashFlow: 0
  };

  constructor(
    private invoiceService: InvoiceService,
    private payrollService: PayrollService,
    private socialService: SocialService,
    private accountingService: AccountingService
  ) {}

  ngOnInit() {
    this.loadAccountingData();
  }

  async loadAccountingData() {
    try {
      this.isLoading = true;
      this.error = null;

      // Charger les données en parallèle
      await Promise.all([
        this.loadInvoiceData(),
        this.loadPayrollData(),
        this.loadSocialData(),
        this.loadAccountingKPIs()
      ]);

    } catch (error) {
      console.error('Erreur lors du chargement des données comptables:', error);
      this.error = 'Erreur lors du chargement des données';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadInvoiceData() {
    try {
      // Charger les factures du mois en cours
      const invoices = await this.invoiceService.getInvoices().toPromise();
      this.invoiceCount = invoices?.length || 0;

      // Charger les factures du mois précédent pour calculer les évolutions
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      // Calculer les KPIs financiers d'abord
      if (invoices) {
        this.totalRevenue = invoices
          .filter((inv: Invoice) => inv.status === 'paid')
          .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);

        this.accountsReceivable = invoices
          .filter((inv: Invoice) => inv.status === 'sent' || inv.status === 'overdue')
          .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);

        this.pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'sent').length;

        // Calculer la marge brute (approximation: 60% du CA)
        this.grossMargin = this.totalRevenue * 0.6;

        // Calculer la trésorerie (approximation: CA - créances)
        this.cashFlow = this.totalRevenue - this.accountsReceivable;
      }

      // Simuler les données du mois précédent basées sur les données actuelles
      // Dans un vrai système, vous feriez une requête avec des filtres de date
      if (this.totalRevenue > 0) {
        this.previousMonthData.totalRevenue = this.totalRevenue * 0.9; // Simulation -10%
        this.previousMonthData.grossMargin = this.grossMargin * 0.92; // Simulation -8%
        this.previousMonthData.accountsReceivable = this.accountsReceivable * 1.05; // Simulation +5%
        this.previousMonthData.cashFlow = this.cashFlow * 0.85; // Simulation -15%
      } else {
        // Si pas de données actuelles, pas de données précédentes
        this.previousMonthData.totalRevenue = 0;
        this.previousMonthData.grossMargin = 0;
        this.previousMonthData.accountsReceivable = 0;
        this.previousMonthData.cashFlow = 0;
      }

      // Charger les statistiques détaillées
      const stats = await this.invoiceService.getStatistics().toPromise();
      if (stats) {
        this.recentPayments = stats.recent_payments || 0;
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données de facturation:', error);
    }
  }

  private async loadPayrollData() {
    try {
      // Charger les employés
      const employees = await this.payrollService.getEmployees().toPromise();
      this.employeeCount = employees?.length || 0;

      // Charger les bulletins de paie du mois en cours
      const currentDate = new Date();
      const payslips = await this.payrollService.getPayslips(
        undefined, // employeeId
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      ).toPromise();

      this.pendingPayslips = payslips?.length || 0;

    } catch (error) {
      console.error('Erreur lors du chargement des données de paie:', error);
    }
  }

  private async loadSocialData() {
    try {
      // Charger les déclarations sociales
      const declarations = await this.socialService.getDeclarations().toPromise();
      this.socialDeclarations = declarations?.length || 0;

      // Calculer les charges sociales du mois en cours
      const currentDate = new Date();
      const socialCharges = await this.socialService.getSocialCharges(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      ).toPromise();

      this.totalSocialCharges = socialCharges?.reduce((sum: number, charge: SocialCharge) => sum + charge.amount, 0) || 0;

      // Calculer les déclarations dues
      const currentMonth = currentDate.getMonth() + 1;
      const declarationsDue = declarations?.filter((decl: TaxDeclaration) => 
        decl.period_month === currentMonth && 
        decl.status === 'draft'
      ).length || 0;

      this.socialDeclarationsDue = declarationsDue;

      // Calculer les jours jusqu'à l'échéance (approximation: fin du mois)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      this.daysUntilDeadline = Math.max(0, lastDayOfMonth.getDate() - currentDate.getDate());

    } catch (error) {
      console.error('Erreur lors du chargement des données sociales:', error);
    }
  }

  private async loadAccountingKPIs() {
    try {
      // Charger les entrées comptables récentes pour calculer le nombre de rapports
      const entries = await this.accountingService.getAccountingEntries().toPromise();
      this.reportCount = entries?.length || 0;

    } catch (error) {
      console.error('Erreur lors du chargement des KPIs comptables:', error);
    }
  }

  createInvoice() {
    // Navigation vers création de facture
    window.location.href = '/admin/accounting/invoices/new';
  }

  generatePayslips() {
    // Navigation vers génération de bulletins
    window.location.href = '/admin/accounting/payroll/generator';
  }

  exportDSN() {
    // Navigation vers génération DSN
    window.location.href = '/admin/accounting/social';
  }

  generateReports() {
    // Navigation vers rapports
    window.location.href = '/admin/accounting/reports';
  }

  // Méthodes utilitaires pour les calculs
  getRevenueChange(): number {
    if (this.previousMonthData.totalRevenue === 0) {
      return this.totalRevenue > 0 ? 100 : 0; // Si pas de données précédentes mais données actuelles, +100%
    }
    const change = ((this.totalRevenue - this.previousMonthData.totalRevenue) / this.previousMonthData.totalRevenue) * 100;
    return Math.round(change * 10) / 10; // Arrondir à 1 décimale
  }

  getMarginChange(): number {
    if (this.previousMonthData.grossMargin === 0) {
      return this.grossMargin > 0 ? 100 : 0;
    }
    const change = ((this.grossMargin - this.previousMonthData.grossMargin) / this.previousMonthData.grossMargin) * 100;
    return Math.round(change * 10) / 10;
  }

  getReceivableChange(): number {
    if (this.previousMonthData.accountsReceivable === 0) {
      return this.accountsReceivable > 0 ? 100 : 0;
    }
    const change = ((this.accountsReceivable - this.previousMonthData.accountsReceivable) / this.previousMonthData.accountsReceivable) * 100;
    return Math.round(change * 10) / 10;
  }

  // Méthodes pour déterminer si les changements sont positifs ou négatifs
  isRevenueChangePositive(): boolean {
    return this.getRevenueChange() >= 0;
  }

  isMarginChangePositive(): boolean {
    return this.getMarginChange() >= 0;
  }

  isReceivableChangePositive(): boolean {
    return this.getReceivableChange() >= 0;
  }

  getCashFlowChange(): number {
    if (this.previousMonthData.cashFlow === 0) {
      // Si pas de données précédentes, on compare avec 0
      return this.cashFlow > 0 ? 100 : (this.cashFlow < 0 ? -100 : 0);
    }
    const change = ((this.cashFlow - this.previousMonthData.cashFlow) / Math.abs(this.previousMonthData.cashFlow)) * 100;
    return Math.round(change * 10) / 10;
  }

  isCashFlowChangePositive(): boolean {
    return this.getCashFlowChange() >= 0;
  }
}
