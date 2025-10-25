import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '@core/services/accounting.service';

@Component({
  selector: 'app-accounting-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accounting-reports">
      <div class="header">
        <h1>Rapports Comptables</h1>
        <p>Génération et consultation des rapports financiers</p>
      </div>

      <div class="reports-grid">
        <div class="report-card" (click)="generateReport('balance-sheet')">
          <div class="report-icon">📊</div>
          <div class="report-content">
            <h3>Bilan</h3>
            <p>État de la situation financière</p>
            <div class="report-date">Au {{ reportDate | date:'dd/MM/yyyy' }}</div>
          </div>
        </div>

        <div class="report-card" (click)="generateReport('income-statement')">
          <div class="report-icon">📈</div>
          <div class="report-content">
            <h3>Compte de Résultat</h3>
            <p>Résultat d'exploitation</p>
            <div class="report-period">{{ startDate | date:'MM/yyyy' }} - {{ endDate | date:'MM/yyyy' }}</div>
          </div>
        </div>

        <div class="report-card" (click)="generateReport('cash-flow')">
          <div class="report-icon">💰</div>
          <div class="report-content">
            <h3>Tableau de Flux de Trésorerie</h3>
            <p>Mouvements de liquidités</p>
            <div class="report-period">{{ startDate | date:'MM/yyyy' }} - {{ endDate | date:'MM/yyyy' }}</div>
          </div>
        </div>

        <div class="report-card" (click)="generateReport('project-analysis')">
          <div class="report-icon">🎯</div>
          <div class="report-content">
            <h3>Analyse par Projet</h3>
            <p>Performance des projets</p>
            <div class="report-period">{{ startDate | date:'MM/yyyy' }} - {{ endDate | date:'MM/yyyy' }}</div>
          </div>
        </div>

        <div class="report-card" (click)="generateReport('client-analysis')">
          <div class="report-icon">👥</div>
          <div class="report-content">
            <h3>Analyse par Client</h3>
            <p>Rentabilité des clients</p>
            <div class="report-period">{{ startDate | date:'MM/yyyy' }} - {{ endDate | date:'MM/yyyy' }}</div>
          </div>
        </div>
      </div>

      <div class="report-filters">
        <h2>Période d'Analyse</h2>
        <div class="filters">
          <div class="filter-group">
            <label>Date de Début</label>
            <input type="date" [(ngModel)]="startDate" (change)="updateEndDate()">
          </div>
          <div class="filter-group">
            <label>Date de Fin</label>
            <input type="date" [(ngModel)]="endDate">
          </div>
          <div class="filter-group">
            <label>Date du Bilan</label>
            <input type="date" [(ngModel)]="reportDate">
          </div>
        </div>
      </div>

      <div class="loading-indicator" *ngIf="loading">
        <div class="spinner"></div>
        <p>Génération du rapport en cours...</p>
      </div>

      <div class="generated-reports" *ngIf="generatedReports.length > 0">
        <h2>Rapports Générés ({{ generatedReports.length }})</h2>
        <div class="reports-list">
          <div class="report-item" *ngFor="let report of generatedReports">
            <div class="report-info">
              <div class="report-name">{{ report.name }}</div>
              <div class="report-details">{{ report.description }}</div>
              <div class="report-meta">
                <span>Généré le {{ report.generated_at | date:'dd/MM/yyyy HH:mm' }}</span>
                <span>{{ report.period }}</span>
              </div>
            </div>
            <div class="report-actions">
              <button class="btn-icon" (click)="downloadReport(report.id)" title="Télécharger PDF">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </button>
              <button class="btn-icon" (click)="viewReport(report.id)" title="Voir le rapport">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="saved-reports" *ngIf="savedReports.length > 0">
        <h2>Rapports Sauvegardés ({{ savedReports.length }})</h2>
        <div class="reports-list">
          <div class="report-item" *ngFor="let report of savedReports">
            <div class="report-info">
              <div class="report-name">{{ report.report_name }}</div>
              <div class="report-details">{{ report.report_description }}</div>
              <div class="report-meta">
                <span>Sauvegardé le {{ report.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                <span>{{ getReportPeriod(report) }}</span>
              </div>
            </div>
            <div class="report-actions">
              <button class="btn-icon" (click)="viewSavedReport(report)" title="Voir le rapport">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                </svg>
              </button>
              <button class="btn-icon" (click)="downloadSavedReport(report)" title="Télécharger PDF">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </button>
              <button class="btn-icon btn-danger" (click)="deleteSavedReport(report.id)" title="Supprimer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accounting-reports {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: #0f0f0f;
      min-height: 100vh;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
    }

    .header p {
      font-size: 1.1rem;
      color: #a0a0a0;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .report-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .report-card:hover {
      background: #2a2a2a;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .report-icon {
      font-size: 2.5rem;
    }

    .report-content {
      flex: 1;
    }

    .report-content h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }

    .report-content p {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }

    .report-date,
    .report-period {
      font-size: 0.8rem;
      color: #3b82f6;
      font-weight: 500;
    }

    .report-filters {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .report-filters h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .filters {
      display: flex;
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #a0a0a0;
    }

    .filter-group input {
      padding: 0.75rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .filter-group input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .generated-reports {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .generated-reports h2, .saved-reports h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .saved-reports {
      margin-top: 2rem;
      background: #1e3a8a;
      border: 1px solid #3b82f6;
    }

    .saved-reports h2 {
      color: #93c5fd;
    }

    .reports-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .report-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 8px;
    }

    .report-info {
      flex: 1;
    }

    .report-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .report-details {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.25rem;
    }

    .report-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #6b7280;
    }

    .report-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #3b82f6;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-icon:hover {
      background: #2563eb;
    }

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #333;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-indicator p {
      color: #a0a0a0;
      font-size: 1rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
      }
      
      .report-item {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class AccountingReportsComponent implements OnInit {
  generatedReports: any[] = [];
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  endDate = new Date();
  reportDate = new Date();
  loading = false;
  savedReports: any[] = [];

  constructor(private accountingService: AccountingService) {}

  ngOnInit() {
    this.updateEndDate();
    this.loadSavedReports();
  }

  updateEndDate() {
    this.endDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth() + 1, 0);
  }

  loadSavedReports() {
    this.accountingService.getSavedReports().subscribe({
      next: (reports) => {
        this.savedReports = reports;
        console.log('Loaded saved reports:', reports);
      },
      error: (error) => {
        console.error('Error loading saved reports:', error);
      }
    });
  }

  saveReport(report: any) {
    const reportData = {
      report_type: report.type,
      report_name: report.name,
      report_description: report.description,
      start_date: report.startDate ? report.startDate.toISOString() : null,
      end_date: report.endDate ? report.endDate.toISOString() : null,
      as_of_date: report.asOfDate ? report.asOfDate.toISOString() : null,
      report_data: JSON.stringify(report.data)
    };

    this.accountingService.saveReport(reportData).subscribe({
      next: (savedReport) => {
        console.log('Report saved successfully:', savedReport);
        this.loadSavedReports(); // Reload the list
      },
      error: (error) => {
        console.error('Error saving report:', error);
      }
    });
  }

  deleteSavedReport(reportId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      this.accountingService.deleteSavedReport(reportId).subscribe({
        next: () => {
          console.log('Report deleted successfully');
          this.loadSavedReports(); // Reload the list
          alert('Rapport supprimé avec succès !');
        },
        error: (error) => {
          console.error('Error deleting report:', error);
          alert('Erreur lors de la suppression du rapport');
        }
      });
    }
  }

  getReportPeriod(report: any): string {
    if (report.as_of_date) {
      return `Au ${new Date(report.as_of_date).toLocaleDateString('fr-FR')}`;
    } else if (report.start_date && report.end_date) {
      return `${new Date(report.start_date).toLocaleDateString('fr-FR')} - ${new Date(report.end_date).toLocaleDateString('fr-FR')}`;
    }
    return 'Période non définie';
  }

  viewSavedReport(report: any) {
    const reportData = {
      name: report.report_name,
      description: report.report_description,
      period: this.getReportPeriod(report),
      data: JSON.parse(report.report_data),
      generated_at: new Date(report.created_at),
      type: report.report_type
    };
    this.viewReportData(reportData);
  }

  downloadSavedReport(report: any) {
    const reportData = {
      name: report.report_name,
      description: report.report_description,
      period: this.getReportPeriod(report),
      data: JSON.parse(report.report_data),
      generated_at: new Date(report.created_at),
      type: report.report_type
    };
    this.downloadReportData(reportData);
  }

  addReport(report: any) {
    this.generatedReports.push(report);
  }

  viewReportData(report: any) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
      padding: 2rem;
      color: white;
    `;
    
    // Add CSS styles for report formatting
    const style = document.createElement('style');
    style.textContent = `
      .report-content {
        background: #2a2a2a;
        padding: 1rem;
        border-radius: 4px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .balance-sheet, .income-statement, .cash-flow {
        color: white;
      }
      
      .balance-sheet h3, .income-statement h3, .cash-flow h3 {
        color: #3b82f6;
        margin-bottom: 1.5rem;
        text-align: center;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 0.5rem;
      }
      
      .balance-section, .income-section, .cash-section {
        margin-bottom: 2rem;
      }
      
      .balance-section h4, .income-section h4, .cash-section h4 {
        color: #60a5fa;
        margin-bottom: 1rem;
        font-size: 1.1rem;
      }
      
      .balance-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      
      .balance-table th, .balance-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #444;
      }
      
      .balance-table th {
        background: #333;
        color: #60a5fa;
        font-weight: 600;
      }
      
      .balance-table td {
        color: #e0e0e0;
      }
      
      .amount {
        text-align: right;
        font-weight: 500;
        color: #10b981;
      }
      
      .amount-large {
        font-size: 1.5rem;
        font-weight: 700;
        text-align: center;
        padding: 1rem;
        background: #333;
        border-radius: 4px;
        margin-bottom: 1rem;
        color: #10b981;
      }
      
      .amount-large.positive {
        color: #10b981;
      }
      
      .amount-large.negative {
        color: #ef4444;
      }
      
      .balance-totals {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 2px solid #444;
      }
      
      .total-row {
        padding: 0.5rem 0;
        font-size: 1.1rem;
        color: #60a5fa;
      }
      
      /* Income Statement Styles */
      .income-details, .cash-details {
        margin-top: 1rem;
        background: #333;
        padding: 1rem;
        border-radius: 4px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #444;
      }
      
      .detail-item:last-child {
        border-bottom: none;
      }
      
      .income-summary, .cash-summary {
        margin-top: 1rem;
        padding: 1rem;
        background: #1e3a8a;
        border-radius: 4px;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-weight: 600;
      }
      
      .income-total, .cash-total {
        border-top: 3px solid #3b82f6;
        padding-top: 1rem;
        margin-top: 2rem;
      }
      
      /* Enhanced Visual Styles */
      .income-statement, .cash-flow, .project-analysis, .client-analysis {
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border-radius: 12px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid #333;
      }
      
      .income-statement h3, .cash-flow h3, .project-analysis h3, .client-analysis h3 {
        color: #3b82f6;
        margin-bottom: 1.5rem;
        text-align: center;
        position: relative;
        font-size: 1.8rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      }
      
      .income-statement h3::after, .cash-flow h3::after, .project-analysis h3::after, .client-analysis h3::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #1e40af);
        border-radius: 2px;
      }
      
      .income-section, .cash-section {
        background: rgba(59, 130, 246, 0.05);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border-left: 4px solid #3b82f6;
        transition: all 0.3s ease;
      }
      
      .income-section:hover, .cash-section:hover {
        background: rgba(59, 130, 246, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
      }
      
      .income-section h4, .cash-section h4 {
        color: #60a5fa;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
      }
      
      .income-section h4::before, .cash-section h4::before {
        content: '●';
        color: #3b82f6;
        margin-right: 0.5rem;
        font-size: 0.8rem;
      }
      
      .amount-large {
        font-size: 2rem;
        font-weight: 800;
        text-align: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #333 0%, #444 100%);
        border-radius: 8px;
        margin-bottom: 1.5rem;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .amount-large::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
      }
      
      .amount-large:hover::before {
        left: 100%;
      }
      
      .amount-large.positive {
        color: #10b981;
        border-color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      }
      
      .amount-large.negative {
        color: #ef4444;
        border-color: #ef4444;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
      }
      
      .income-details, .cash-details {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        padding: 1rem;
        margin-top: 1rem;
        border: 1px solid #444;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
      }
      
      .detail-item:hover {
        background: rgba(255, 255, 255, 0.05);
        padding-left: 0.5rem;
        border-radius: 4px;
      }
      
      .detail-item:last-child {
        border-bottom: none;
      }
      
      .detail-item span:first-child {
        color: #e0e0e0;
        font-weight: 500;
      }
      
      .detail-item .amount {
        color: #10b981;
        font-weight: 600;
        font-size: 1.1rem;
      }
      
      .income-summary, .cash-summary {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border-radius: 6px;
        padding: 1.5rem;
        margin-top: 1.5rem;
        border: 1px solid #3b82f6;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        font-weight: 600;
        font-size: 1.1rem;
      }
      
      .summary-item span:first-child {
        color: #e0e0e0;
      }
      
      .summary-item .amount {
        color: #60a5fa;
        font-weight: 700;
      }
      
      .income-total, .cash-total {
        border-top: 3px solid #3b82f6;
        padding-top: 2rem;
        margin-top: 2rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%);
        border-radius: 8px;
      }
      
      /* Project Analysis Enhanced Styles */
      .analysis-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .summary-card {
        background: linear-gradient(135deg, #333 0%, #444 100%);
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .summary-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #1e40af);
      }
      
      .summary-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        border-color: #3b82f6;
      }
      
      .summary-card h4 {
        color: #60a5fa;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .summary-card .amount-large {
        font-size: 1.8rem;
        font-weight: 800;
        margin-bottom: 0;
        padding: 0.5rem;
        background: transparent;
        border: none;
        box-shadow: none;
      }
      
      .projects-table, .clients-table {
        background: linear-gradient(135deg, #2a2a2a 0%, #333 100%);
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid #444;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }
      
      .project-header, .client-header {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        color: white;
        font-weight: 700;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .project-row, .client-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        align-items: center;
        transition: all 0.2s ease;
      }
      
      .project-row:hover, .client-row:hover {
        background: rgba(59, 130, 246, 0.1);
        transform: scale(1.01);
      }
      
      .project-row:last-child, .client-row:last-child {
        border-bottom: none;
      }
      
      .project-name, .client-name {
        font-weight: 700;
        color: #60a5fa;
        font-size: 1.1rem;
      }
      
      .project-status {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        text-align: center;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .project-status.active {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }
      
      .project-status.completed {
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
      
      .project-status.cancelled {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }
      
      .project-status.unknown {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: white;
      }
      
      .profitability {
        font-weight: 700;
        text-align: center;
        font-size: 1.1rem;
      }
      
      .profitability.positive {
        color: #10b981;
      }
      
      .profitability.negative {
        color: #ef4444;
      }
      
      .count {
        text-align: center;
        font-weight: 600;
        color: #e0e0e0;
      }
      
      .date {
        text-align: center;
        font-size: 0.9rem;
        color: #a0a0a0;
      }
      
      .no-data {
        padding: 3rem;
        text-align: center;
        color: #9ca3af;
        font-style: italic;
        font-size: 1.1rem;
        background: rgba(0, 0, 0, 0.2);
      }
      
      /* JSON Report Styles */
      .json-report {
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border-radius: 12px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid #333;
      }
      
      .json-report h4 {
        color: #60a5fa;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .json-report pre {
        background: #2a2a2a;
        padding: 1.5rem;
        border-radius: 8px;
        overflow-x: auto;
        color: #e0e0e0;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        border: 1px solid #444;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .error {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 600;
        text-align: center;
        border: 1px solid #ef4444;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .project-header, .client-header, .project-row, .client-row {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        
        .analysis-summary {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .income-statement, .cash-flow, .project-analysis, .client-analysis {
          padding: 1rem;
        }
      }
    `;
    modalContent.appendChild(style);

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="margin: 0; color: #ffffff;">${report.name}</h2>
        <button onclick="this.closest('.modal').remove()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Fermer</button>
      </div>
      <div style="margin-bottom: 1rem; color: #a0a0a0;">
        ${report.description} - ${report.period}
      </div>
      <div class="report-content">${this.formatReportData(report.data, report.type)}</div>
    `;

    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  downloadReportData(report: any) {
    const html = this.generateReportHTML(report);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateReport(type: string) {
    this.loading = true;
    
    switch (type) {
      case 'balance-sheet':
        this.accountingService.generateBalanceSheet(this.reportDate).subscribe({
          next: (data) => {
            const report = {
              type: 'balance_sheet',
              name: 'Bilan',
              description: 'État de la situation financière',
              period: `Au ${this.reportDate.toLocaleDateString('fr-FR')}`,
              data: data,
              generated_at: new Date(),
              asOfDate: this.reportDate
            };
            this.addReport(report);
            this.saveReport(report); // Auto-save the report
            this.loading = false;
          },
          error: (error) => {
            console.error('Error generating balance sheet:', error);
            this.loading = false;
          }
        });
        break;
      case 'income-statement':
        this.accountingService.generateIncomeStatement(this.startDate, this.endDate).subscribe({
          next: (data) => {
            const report = {
              type: 'income_statement',
              name: 'Compte de Résultat',
              description: 'Résultat d\'exploitation',
              period: `${this.startDate.toLocaleDateString('fr-FR')} - ${this.endDate.toLocaleDateString('fr-FR')}`,
              data: data,
              generated_at: new Date(),
              startDate: this.startDate,
              endDate: this.endDate
            };
            this.addReport(report);
            this.saveReport(report); // Auto-save the report
            this.loading = false;
          },
          error: (error) => {
            console.error('Error generating income statement:', error);
            this.loading = false;
          }
        });
        break;
      case 'cash-flow':
        this.accountingService.generateCashFlow(this.startDate, this.endDate).subscribe({
          next: (data) => {
            const report = {
              type: 'cash_flow',
              name: 'Tableau de Flux de Trésorerie',
              description: 'Mouvements de liquidités',
              period: `${this.startDate.toLocaleDateString('fr-FR')} - ${this.endDate.toLocaleDateString('fr-FR')}`,
              data: data,
              generated_at: new Date(),
              startDate: this.startDate,
              endDate: this.endDate
            };
            this.addReport(report);
            this.saveReport(report); // Auto-save the report
            this.loading = false;
          },
          error: (error) => {
            console.error('Error generating cash flow:', error);
            this.loading = false;
          }
        });
        break;
      case 'project-analysis':
        this.accountingService.generateProjectAnalysis(this.startDate, this.endDate).subscribe({
          next: (data) => {
            const report = {
              type: 'project_analysis',
              name: 'Analyse par Projet',
              description: 'Performance des projets',
              period: `${this.startDate.toLocaleDateString('fr-FR')} - ${this.endDate.toLocaleDateString('fr-FR')}`,
              data: data,
              generated_at: new Date(),
              startDate: this.startDate,
              endDate: this.endDate
            };
            this.addReport(report);
            this.saveReport(report); // Auto-save the report
            this.loading = false;
          },
          error: (error) => {
            console.error('Error generating project analysis:', error);
            this.loading = false;
          }
        });
        break;
      case 'client-analysis':
        this.accountingService.generateClientAnalysis(this.startDate, this.endDate).subscribe({
          next: (data) => {
            const report = {
              type: 'client_analysis',
              name: 'Analyse par Client',
              description: 'Rentabilité des clients',
              period: `${this.startDate.toLocaleDateString('fr-FR')} - ${this.endDate.toLocaleDateString('fr-FR')}`,
              data: data,
              generated_at: new Date(),
              startDate: this.startDate,
              endDate: this.endDate
            };
            this.addReport(report);
            this.saveReport(report); // Auto-save the report
            this.loading = false;
          },
          error: (error) => {
            console.error('Error generating client analysis:', error);
            this.loading = false;
          }
        });
        break;
    }
  }

  addGeneratedReport(name: string, description: string, data: any) {
    const report = {
      id: Date.now(),
      name,
      description,
      data,
      generated_at: new Date(),
      period: `${this.startDate.toLocaleDateString('fr-FR')} - ${this.endDate.toLocaleDateString('fr-FR')}`
    };
    this.generatedReports.unshift(report);
  }

  downloadReport(id: number) {
    const report = this.generatedReports.find(r => r.id === id);
    if (report) {
      // Generate and download PDF
      this.generatePDF(report);
    }
  }

  viewReport(id: number) {
    const report = this.generatedReports.find(r => r.id === id);
    if (report) {
      // Open report in modal or new tab
      this.openReportModal(report);
    }
  }

  private generatePDF(report: any) {
    // Create a simple HTML content for the report
    const htmlContent = this.generateReportHTML(report);
    
    // Create a new window with the report content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  private openReportModal(report: any) {
    // Create a modal-like overlay to display the report
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
      padding: 2rem;
      color: white;
    `;
    
    // Add CSS styles for report formatting
    const style = document.createElement('style');
    style.textContent = `
      .report-content {
        background: #2a2a2a;
        padding: 1rem;
        border-radius: 4px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .balance-sheet, .income-statement, .cash-flow {
        color: white;
      }
      
      .balance-sheet h3, .income-statement h3, .cash-flow h3 {
        color: #3b82f6;
        margin-bottom: 1.5rem;
        text-align: center;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 0.5rem;
      }
      
      .balance-section, .income-section, .cash-section {
        margin-bottom: 2rem;
      }
      
      .balance-section h4, .income-section h4, .cash-section h4 {
        color: #60a5fa;
        margin-bottom: 1rem;
        font-size: 1.1rem;
      }
      
      .balance-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      
      .balance-table th, .balance-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #444;
      }
      
      .balance-table th {
        background: #333;
        color: #60a5fa;
        font-weight: 600;
      }
      
      .balance-table td {
        color: #e0e0e0;
      }
      
      .amount {
        text-align: right;
        font-weight: 500;
        color: #10b981;
      }
      
      .amount-large {
        font-size: 1.5rem;
        font-weight: 700;
        text-align: center;
        padding: 1rem;
        background: #333;
        border-radius: 4px;
        margin-bottom: 1rem;
        color: #10b981;
      }
      
      .amount-large.positive {
        color: #10b981;
      }
      
      .amount-large.negative {
        color: #ef4444;
      }
      
      .balance-totals {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 2px solid #444;
      }
      
      .total-row {
        padding: 0.5rem 0;
        font-size: 1.1rem;
        color: #60a5fa;
      }
      
      /* Income Statement Styles */
      .income-details, .cash-details {
        margin-top: 1rem;
        background: #333;
        padding: 1rem;
        border-radius: 4px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #444;
      }
      
      .detail-item:last-child {
        border-bottom: none;
      }
      
      .income-summary, .cash-summary {
        margin-top: 1rem;
        padding: 1rem;
        background: #1e3a8a;
        border-radius: 4px;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-weight: 600;
      }
      
      .income-total, .cash-total {
        border-top: 3px solid #3b82f6;
        padding-top: 1rem;
        margin-top: 2rem;
      }
      
      /* Enhanced Visual Styles */
      .income-statement, .cash-flow, .project-analysis, .client-analysis {
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border-radius: 12px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid #333;
      }
      
      .income-statement h3, .cash-flow h3, .project-analysis h3, .client-analysis h3 {
        color: #3b82f6;
        margin-bottom: 1.5rem;
        text-align: center;
        position: relative;
        font-size: 1.8rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      }
      
      .income-statement h3::after, .cash-flow h3::after, .project-analysis h3::after, .client-analysis h3::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #1e40af);
        border-radius: 2px;
      }
      
      .income-section, .cash-section {
        background: rgba(59, 130, 246, 0.05);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border-left: 4px solid #3b82f6;
        transition: all 0.3s ease;
      }
      
      .income-section:hover, .cash-section:hover {
        background: rgba(59, 130, 246, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
      }
      
      .income-section h4, .cash-section h4 {
        color: #60a5fa;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
      }
      
      .income-section h4::before, .cash-section h4::before {
        content: '●';
        color: #3b82f6;
        margin-right: 0.5rem;
        font-size: 0.8rem;
      }
      
      .amount-large {
        font-size: 2rem;
        font-weight: 800;
        text-align: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #333 0%, #444 100%);
        border-radius: 8px;
        margin-bottom: 1.5rem;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .amount-large::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
      }
      
      .amount-large:hover::before {
        left: 100%;
      }
      
      .amount-large.positive {
        color: #10b981;
        border-color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      }
      
      .amount-large.negative {
        color: #ef4444;
        border-color: #ef4444;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
      }
      
      .income-details, .cash-details {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        padding: 1rem;
        margin-top: 1rem;
        border: 1px solid #444;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
      }
      
      .detail-item:hover {
        background: rgba(255, 255, 255, 0.05);
        padding-left: 0.5rem;
        border-radius: 4px;
      }
      
      .detail-item:last-child {
        border-bottom: none;
      }
      
      .detail-item span:first-child {
        color: #e0e0e0;
        font-weight: 500;
      }
      
      .detail-item .amount {
        color: #10b981;
        font-weight: 600;
        font-size: 1.1rem;
      }
      
      .income-summary, .cash-summary {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border-radius: 6px;
        padding: 1.5rem;
        margin-top: 1.5rem;
        border: 1px solid #3b82f6;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        font-weight: 600;
        font-size: 1.1rem;
      }
      
      .summary-item span:first-child {
        color: #e0e0e0;
      }
      
      .summary-item .amount {
        color: #60a5fa;
        font-weight: 700;
      }
      
      .income-total, .cash-total {
        border-top: 3px solid #3b82f6;
        padding-top: 2rem;
        margin-top: 2rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%);
        border-radius: 8px;
      }
      
      /* Project Analysis Enhanced Styles */
      .analysis-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .summary-card {
        background: linear-gradient(135deg, #333 0%, #444 100%);
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .summary-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #1e40af);
      }
      
      .summary-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        border-color: #3b82f6;
      }
      
      .summary-card h4 {
        color: #60a5fa;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .summary-card .amount-large {
        font-size: 1.8rem;
        font-weight: 800;
        margin-bottom: 0;
        padding: 0.5rem;
        background: transparent;
        border: none;
        box-shadow: none;
      }
      
      .projects-table, .clients-table {
        background: linear-gradient(135deg, #2a2a2a 0%, #333 100%);
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid #444;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }
      
      .project-header, .client-header {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        color: white;
        font-weight: 700;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .project-row, .client-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        align-items: center;
        transition: all 0.2s ease;
      }
      
      .project-row:hover, .client-row:hover {
        background: rgba(59, 130, 246, 0.1);
        transform: scale(1.01);
      }
      
      .project-row:last-child, .client-row:last-child {
        border-bottom: none;
      }
      
      .project-name, .client-name {
        font-weight: 700;
        color: #60a5fa;
        font-size: 1.1rem;
      }
      
      .project-status {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        text-align: center;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .project-status.active {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }
      
      .project-status.completed {
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
      
      .project-status.cancelled {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }
      
      .project-status.unknown {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: white;
      }
      
      .profitability {
        font-weight: 700;
        text-align: center;
        font-size: 1.1rem;
      }
      
      .profitability.positive {
        color: #10b981;
      }
      
      .profitability.negative {
        color: #ef4444;
      }
      
      .count {
        text-align: center;
        font-weight: 600;
        color: #e0e0e0;
      }
      
      .date {
        text-align: center;
        font-size: 0.9rem;
        color: #a0a0a0;
      }
      
      .no-data {
        padding: 3rem;
        text-align: center;
        color: #9ca3af;
        font-style: italic;
        font-size: 1.1rem;
        background: rgba(0, 0, 0, 0.2);
      }
      
      /* JSON Report Styles */
      .json-report {
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border-radius: 12px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid #333;
      }
      
      .json-report h4 {
        color: #60a5fa;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .json-report pre {
        background: #2a2a2a;
        padding: 1.5rem;
        border-radius: 8px;
        overflow-x: auto;
        color: #e0e0e0;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        border: 1px solid #444;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .error {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 600;
        text-align: center;
        border: 1px solid #ef4444;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .project-header, .client-header, .project-row, .client-row {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        
        .analysis-summary {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .income-statement, .cash-flow, .project-analysis, .client-analysis {
          padding: 1rem;
        }
      }
    `;
    modalContent.appendChild(style);

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="margin: 0; color: #ffffff;">${report.name}</h2>
        <button onclick="this.closest('.modal').remove()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Fermer</button>
      </div>
      <div style="margin-bottom: 1rem; color: #a0a0a0;">
        ${report.description} - ${report.period}
      </div>
      <div class="report-content">${this.formatReportData(report.data, report.type)}</div>
    `;

    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  private generateReportHTML(report: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.name}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 2rem; 
            color: #333; 
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 2rem; 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 1rem; 
          }
          .header h1 {
            color: #3b82f6;
            margin-bottom: 0.5rem;
          }
          .content { 
            margin-top: 2rem; 
          }
          .report-content {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
          }
          
          /* Balance Sheet Styles */
          .balance-sheet h3 {
            color: #3b82f6;
            margin-bottom: 1.5rem;
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.5rem;
          }
          
          .balance-section {
            margin-bottom: 2rem;
          }
          
          .balance-section h4 {
            color: #1e40af;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            background: #e0e7ff;
            padding: 0.5rem;
            border-radius: 4px;
          }
          
          .balance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
            background: white;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .balance-table th, .balance-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .balance-table th {
            background: #3b82f6;
            color: white;
            font-weight: 600;
          }
          
          .balance-table td {
            color: #374151;
          }
          
          .amount {
            text-align: right;
            font-weight: 500;
            color: #059669;
          }
          
          .balance-totals {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 2px solid #3b82f6;
            background: #f0f9ff;
            padding: 1rem;
            border-radius: 4px;
          }
          
          .total-row {
            padding: 0.5rem 0;
            font-size: 1.1rem;
            color: #1e40af;
            font-weight: 600;
          }
          
          /* Income Statement Styles */
          .income-statement h3 {
            color: #3b82f6;
            margin-bottom: 1.5rem;
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.5rem;
          }
          
          .income-section {
            margin-bottom: 2rem;
            text-align: center;
          }
          
          .income-section h4 {
            color: #1e40af;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            background: #e0e7ff;
            padding: 0.5rem;
            border-radius: 4px;
          }
          
          .amount-large {
            font-size: 1.8rem;
            font-weight: 700;
            padding: 1rem;
            background: #f0f9ff;
            border-radius: 8px;
            margin-bottom: 1rem;
            color: #059669;
            border: 2px solid #3b82f6;
          }
          
          .amount-large.positive {
            color: #059669;
          }
          
          .amount-large.negative {
            color: #dc2626;
          }
          
          /* Cash Flow Styles */
          .cash-flow h3 {
            color: #3b82f6;
            margin-bottom: 1.5rem;
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.5rem;
          }
          
          .cash-section {
            margin-bottom: 2rem;
            text-align: center;
          }
          
          .cash-section h4 {
            color: #1e40af;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            background: #e0e7ff;
            padding: 0.5rem;
            border-radius: 4px;
          }
          
          .cash-details {
            margin-top: 1rem;
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            text-align: left;
          }
          
          .cash-summary {
            margin-top: 1rem;
            padding: 1rem;
            background: #e0f2fe;
            border-radius: 4px;
            text-align: left;
          }
          
          .cash-total {
            border-top: 3px solid #3b82f6;
            padding-top: 1rem;
            margin-top: 2rem;
          }
          
          /* Project Analysis Styles */
          .project-analysis h3, .client-analysis h3 {
            color: #3b82f6;
            margin-bottom: 1.5rem;
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.5rem;
          }
          
          .analysis-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
          }
          
          .summary-card {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #3b82f6;
          }
          
          .summary-card h4 {
            color: #1e40af;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          }
          
          .projects-table, .clients-table {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #3b82f6;
            margin-top: 1rem;
          }
          
          .project-header, .client-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
            gap: 1rem;
            padding: 1rem;
            background: #3b82f6;
            color: white;
            font-weight: 600;
            font-size: 0.9rem;
          }
          
          .project-row, .client-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
            gap: 1rem;
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            align-items: center;
          }
          
          .project-row:last-child, .client-row:last-child {
            border-bottom: none;
          }
          
          .project-name, .client-name {
            font-weight: 600;
            color: #1e40af;
          }
          
          .project-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            text-align: center;
          }
          
          .project-status.active {
            background: #10b981;
            color: white;
          }
          
          .project-status.completed {
            background: #3b82f6;
            color: white;
          }
          
          .project-status.cancelled {
            background: #dc2626;
            color: white;
          }
          
          .project-status.unknown {
            background: #6b7280;
            color: white;
          }
          
          .profitability {
            font-weight: 600;
            text-align: center;
          }
          
          .count {
            text-align: center;
          }
          
          .date {
            text-align: center;
            font-size: 0.9rem;
          }
          
          .no-data {
            padding: 2rem;
            text-align: center;
            color: #6b7280;
            font-style: italic;
          }
          
          @media print { 
            body { margin: 0; }
            .balance-table { page-break-inside: avoid; }
            .balance-section { page-break-inside: avoid; }
            .projects-table { page-break-inside: avoid; }
            .clients-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.name}</h1>
          <p><strong>${report.description}</strong></p>
          <p>Période: ${report.period}</p>
          <p>Généré le: ${report.generated_at.toLocaleDateString('fr-FR')} à ${report.generated_at.toLocaleTimeString('fr-FR')}</p>
        </div>
        <div class="content">
          <div class="report-content">${this.formatReportData(report.data, report.type)}</div>
        </div>
      </body>
      </html>
    `;
  }

  private formatReportData(data: any, reportType?: string): string {
    if (!data) return 'Aucune donnée disponible';
    
    try {
      // Use report type if available, otherwise detect from data structure
      if (reportType) {
        switch (reportType) {
          case 'balance_sheet':
            return this.formatBalanceSheet(data);
          case 'income_statement':
            return this.formatIncomeStatement(data);
          case 'cash_flow':
            return this.formatCashFlow(data);
          case 'project_analysis':
            return this.formatProjectAnalysis(data);
          case 'client_analysis':
            return this.formatClientAnalysis(data);
          default:
            return this.detectAndFormatReport(data);
        }
      } else {
        return this.detectAndFormatReport(data);
      }
    } catch (error) {
      console.error('Error formatting report data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return `<div class="error">Erreur lors du formatage du rapport: ${errorMessage}</div>`;
    }
  }

  private detectAndFormatReport(data: any): string {
    // Format specific report types based on data structure
    if (data.as_of_date && data.assets) {
      return this.formatBalanceSheet(data);
    } else if (data.start_date && data.end_date && data.revenue) {
      return this.formatIncomeStatement(data);
    } else if (data.start_date && data.end_date && data.operating_cash_flow) {
      return this.formatCashFlow(data);
    } else if (data.start_date && data.end_date && data.projects) {
      return this.formatProjectAnalysis(data);
    } else if (data.start_date && data.end_date && data.clients) {
      return this.formatClientAnalysis(data);
    } else {
      // Fallback: try to format as JSON with better styling
      return this.formatJSONData(data);
    }
  }

  private formatJSONData(data: any): string {
    const jsonString = JSON.stringify(data, null, 2);
    return `
      <div class="json-report">
        <h4>Données du rapport</h4>
        <pre style="background: #2a2a2a; padding: 1rem; border-radius: 4px; overflow-x: auto; color: #e0e0e0; font-family: 'Courier New', monospace;">${jsonString}</pre>
      </div>
    `;
  }

  private formatBalanceSheet(data: any): string {
    let html = `
      <div class="balance-sheet">
        <h3>Bilan au ${data.as_of_date}</h3>
        
        <div class="balance-section">
          <h4>ACTIFS</h4>
          <table class="balance-table">
            <thead>
              <tr>
                <th>Compte</th>
                <th>Libellé</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    data.assets.forEach((asset: any) => {
      html += `
        <tr>
          <td>${asset.account_number}</td>
          <td>${asset.account_name}</td>
          <td class="amount">${asset.balance.toLocaleString('fr-FR')} €</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
        
        <div class="balance-section">
          <h4>PASSIFS</h4>
          <table class="balance-table">
            <thead>
              <tr>
                <th>Compte</th>
                <th>Libellé</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    data.liabilities.forEach((liability: any) => {
      html += `
        <tr>
          <td>${liability.account_number}</td>
          <td>${liability.account_name}</td>
          <td class="amount">${liability.balance.toLocaleString('fr-FR')} €</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
        
        <div class="balance-section">
          <h4>CAPITAUX PROPRES</h4>
          <table class="balance-table">
            <thead>
              <tr>
                <th>Compte</th>
                <th>Libellé</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    data.equity.forEach((equity: any) => {
      html += `
        <tr>
          <td>${equity.account_number}</td>
          <td>${equity.account_name}</td>
          <td class="amount">${equity.balance.toLocaleString('fr-FR')} €</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
        
        <div class="balance-totals">
          <div class="total-row">
            <strong>TOTAL ACTIFS: ${data.totals.total_assets.toLocaleString('fr-FR')} €</strong>
          </div>
          <div class="total-row">
            <strong>TOTAL PASSIFS: ${data.totals.total_liabilities.toLocaleString('fr-FR')} €</strong>
          </div>
          <div class="total-row">
            <strong>TOTAL CAPITAUX PROPRES: ${data.totals.total_equity.toLocaleString('fr-FR')} €</strong>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  private formatIncomeStatement(data: any): string {
    let html = `
      <div class="income-statement">
        <h3>Compte de Résultat du ${data.start_date} au ${data.end_date}</h3>
        
        <div class="income-section">
          <h4>CHIFFRE D'AFFAIRES</h4>
          <div class="amount-large positive">${data.revenue?.toLocaleString('fr-FR') || '0'} €</div>
          <div class="income-details">
            <div class="detail-item">
              <span>Ventes de produits:</span>
              <span class="amount">${data.product_sales?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Prestations de services:</span>
              <span class="amount">${data.service_revenue?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Autres produits:</span>
              <span class="amount">${data.other_revenue?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
        
        <div class="income-section">
          <h4>CHARGES D'EXPLOITATION</h4>
          <div class="amount-large negative">${data.operating_expenses?.toLocaleString('fr-FR') || '0'} €</div>
          <div class="income-details">
            <div class="detail-item">
              <span>Achats de matières premières:</span>
              <span class="amount">${data.raw_materials?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Charges de personnel:</span>
              <span class="amount">${data.staff_costs?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Charges externes:</span>
              <span class="amount">${data.external_charges?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Autres charges:</span>
              <span class="amount">${data.other_expenses?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
        
        <div class="income-section">
          <h4>RÉSULTAT D'EXPLOITATION</h4>
          <div class="amount-large ${(data.operating_result || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.operating_result?.toLocaleString('fr-FR') || '0'} €
          </div>
        </div>
        
        <div class="income-section">
          <h4>RÉSULTAT FINANCIER</h4>
          <div class="amount-large ${(data.financial_result || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.financial_result?.toLocaleString('fr-FR') || '0'} €
          </div>
          <div class="income-details">
            <div class="detail-item">
              <span>Produits financiers:</span>
              <span class="amount">${data.financial_income?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Charges financières:</span>
              <span class="amount">${data.financial_expenses?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
        
        <div class="income-section income-total">
          <h4>RÉSULTAT NET</h4>
          <div class="amount-large ${(data.net_income || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.net_income?.toLocaleString('fr-FR') || '0'} €
          </div>
          <div class="income-summary">
            <div class="summary-item">
              <span>Marge brute:</span>
              <span class="amount">${data.gross_margin?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="summary-item">
              <span>Taux de marge:</span>
              <span class="amount">${data.margin_rate?.toFixed(1) || '0'}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  private formatCashFlow(data: any): string {
    let html = `
      <div class="cash-flow">
        <h3>Tableau de Flux de Trésorerie du ${data.start_date} au ${data.end_date}</h3>
        
        <div class="cash-section">
          <h4>FLUX D'EXPLOITATION</h4>
          <div class="amount-large ${(data.operating_cash_flow || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.operating_cash_flow?.toLocaleString('fr-FR') || '0'} €
          </div>
          <div class="cash-details">
            <div class="detail-item">
              <span>Chiffre d'affaires encaissé:</span>
              <span class="amount">${data.cash_revenue?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Charges payées:</span>
              <span class="amount">${data.cash_expenses?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
        
        <div class="cash-section">
          <h4>FLUX D'INVESTISSEMENT</h4>
          <div class="amount-large ${(data.investing_cash_flow || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.investing_cash_flow?.toLocaleString('fr-FR') || '0'} €
          </div>
          <div class="cash-details">
            <div class="detail-item">
              <span>Acquisitions d'immobilisations:</span>
              <span class="amount">${data.acquisitions?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Cessions d'immobilisations:</span>
              <span class="amount">${data.disposals?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
        
        <div class="cash-section">
          <h4>FLUX DE FINANCEMENT</h4>
          <div class="amount-large ${(data.financing_cash_flow || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.financing_cash_flow?.toLocaleString('fr-FR') || '0'} €
          </div>
          <div class="cash-details">
            <div class="detail-item">
              <span>Emprunts:</span>
              <span class="amount">${data.loans_received?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="detail-item">
              <span>Remboursements:</span>
              <span class="amount">${data.loan_repayments?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
        
        <div class="cash-section cash-total">
          <h4>VARIATION DE TRÉSORERIE</h4>
          <div class="amount-large ${(data.net_cash_flow || 0) >= 0 ? 'positive' : 'negative'}">
            ${data.net_cash_flow?.toLocaleString('fr-FR') || '0'} €
          </div>
          <div class="cash-summary">
            <div class="summary-item">
              <span>Trésorerie début:</span>
              <span class="amount">${data.cash_start?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
            <div class="summary-item">
              <span>Trésorerie fin:</span>
              <span class="amount">${data.cash_end?.toLocaleString('fr-FR') || '0'} €</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  private formatProjectAnalysis(data: any): string {
    let html = `
      <div class="project-analysis">
        <h3>Analyse par Projet du ${data.start_date} au ${data.end_date}</h3>
        
        <div class="analysis-summary">
          <div class="summary-card">
            <h4>Total Projets</h4>
            <div class="amount-large">${data.total_projects || '0'}</div>
          </div>
          <div class="summary-card">
            <h4>Chiffre d'Affaires Total</h4>
            <div class="amount-large positive">${data.total_revenue?.toLocaleString('fr-FR') || '0'} €</div>
          </div>
          <div class="summary-card">
            <h4>Coûts Total</h4>
            <div class="amount-large negative">${data.total_costs?.toLocaleString('fr-FR') || '0'} €</div>
          </div>
          <div class="summary-card">
            <h4>Marge Totale</h4>
            <div class="amount-large ${(data.total_margin || 0) >= 0 ? 'positive' : 'negative'}">
              ${data.total_margin?.toLocaleString('fr-FR') || '0'} €
            </div>
          </div>
        </div>
        
        <div class="projects-list">
          <h4>Détail par Projet</h4>
          <div class="projects-table">
            <div class="project-header">
              <span>Projet</span>
              <span>Statut</span>
              <span>Chiffre d'Affaires</span>
              <span>Coûts</span>
              <span>Marge</span>
              <span>Rentabilité</span>
            </div>
    `;
    
    if (data.projects && data.projects.length > 0) {
      data.projects.forEach((project: any) => {
        const margin = (project.revenue || 0) - (project.costs || 0);
        const profitability = project.revenue > 0 ? ((margin / project.revenue) * 100).toFixed(1) : '0';
        
        html += `
          <div class="project-row">
            <span class="project-name">${project.name || 'Projet sans nom'}</span>
            <span class="project-status ${project.status?.toLowerCase() || 'unknown'}">${project.status || 'Inconnu'}</span>
            <span class="amount">${project.revenue?.toLocaleString('fr-FR') || '0'} €</span>
            <span class="amount">${project.costs?.toLocaleString('fr-FR') || '0'} €</span>
            <span class="amount ${margin >= 0 ? 'positive' : 'negative'}">${margin.toLocaleString('fr-FR')} €</span>
            <span class="profitability ${parseFloat(profitability) >= 0 ? 'positive' : 'negative'}">${profitability}%</span>
          </div>
        `;
      });
    } else {
      html += `
        <div class="no-data">
          <p>Aucun projet trouvé pour cette période</p>
        </div>
      `;
    }
    
    html += `
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  private formatClientAnalysis(data: any): string {
    let html = `
      <div class="client-analysis">
        <h3>Analyse par Client du ${data.start_date} au ${data.end_date}</h3>
        
        <div class="analysis-summary">
          <div class="summary-card">
            <h4>Total Clients</h4>
            <div class="amount-large">${data.total_clients || '0'}</div>
          </div>
          <div class="summary-card">
            <h4>Chiffre d'Affaires Total</h4>
            <div class="amount-large positive">${data.total_revenue?.toLocaleString('fr-FR') || '0'} €</div>
          </div>
          <div class="summary-card">
            <h4>Panier Moyen</h4>
            <div class="amount-large">${data.average_basket?.toLocaleString('fr-FR') || '0'} €</div>
          </div>
          <div class="summary-card">
            <h4>Clients Actifs</h4>
            <div class="amount-large">${data.active_clients || '0'}</div>
          </div>
        </div>
        
        <div class="clients-list">
          <h4>Top Clients</h4>
          <div class="clients-table">
            <div class="client-header">
              <span>Client</span>
              <span>Type</span>
              <span>Chiffre d'Affaires</span>
              <span>Nombre de Factures</span>
              <span>Panier Moyen</span>
              <span>Dernière Facture</span>
            </div>
    `;
    
    if (data.clients && data.clients.length > 0) {
      data.clients.forEach((client: any) => {
        const averageBasket = client.invoice_count > 0 ? (client.revenue / client.invoice_count) : 0;
        
        html += `
          <div class="client-row">
            <span class="client-name">${client.name || 'Client sans nom'}</span>
            <span class="client-type">${client.type || 'Particulier'}</span>
            <span class="amount">${client.revenue?.toLocaleString('fr-FR') || '0'} €</span>
            <span class="count">${client.invoice_count || '0'}</span>
            <span class="amount">${averageBasket.toLocaleString('fr-FR')} €</span>
            <span class="date">${client.last_invoice_date ? new Date(client.last_invoice_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>
        `;
      });
    } else {
      html += `
        <div class="no-data">
          <p>Aucun client trouvé pour cette période</p>
        </div>
      `;
    }
    
    html += `
          </div>
        </div>
      </div>
    `;
    
    return html;
  }
}
