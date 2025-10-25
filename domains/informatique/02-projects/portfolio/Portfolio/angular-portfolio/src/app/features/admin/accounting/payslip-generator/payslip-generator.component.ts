import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService, Employee, PayrollEntry } from '@core/services/payroll.service';

@Component({
  selector: 'app-payslip-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payslip-generator">
      <div class="header">
        <h1>Génération des Bulletins de Paie</h1>
      </div>

      <div class="generator-form">
        <div class="form-section">
          <h2>Période</h2>
          <div class="form-group">
            <label>Année</label>
            <select [(ngModel)]="selectedYear" (change)="loadEmployees()">
              <option *ngFor="let year of years" [value]="year">{{ year }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Mois</label>
            <select [(ngModel)]="selectedMonth" (change)="loadEmployees()">
              <option *ngFor="let month of months" [value]="month.value">{{ month.label }}</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h2>Employés</h2>
          <div class="employee-selection">
            <div class="selection-header">
              <label>
                <input type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()">
                Sélectionner tous les employés actifs
              </label>
            </div>
            <div class="employee-list">
              <div class="employee-item" *ngFor="let employee of employees">
                <label>
                  <input type="checkbox" [(ngModel)]="employee.selected" (change)="updateSelection()">
                  <div class="employee-info">
                    <div class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</div>
                    <div class="employee-details">{{ employee.position }} - {{ employee.department }}</div>
                    <div class="employee-salary">{{ employee.gross_salary_monthly | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Actions</h2>
          <div class="actions">
            <button class="btn-primary" (click)="generatePayslips()" [disabled]="!hasSelectedEmployees()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Générer les Bulletins
            </button>
            <button class="btn-secondary" (click)="previewPayslips()" [disabled]="!hasSelectedEmployees()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
              </svg>
              Aperçu
            </button>
          </div>
        </div>
      </div>

      <div class="payslips-list" *ngIf="payslips.length > 0">
        <h2>Bulletins Générés</h2>
        <div class="payslip-grid">
          <div class="payslip-card" *ngFor="let payslip of payslips">
            <div class="payslip-header">
              <div class="payslip-employee">{{ payslip.employee.first_name }} {{ payslip.employee.last_name }}</div>
              <div class="payslip-period">{{ payslip.period_month }}/{{ payslip.period_year }}</div>
            </div>
            <div class="payslip-details">
              <div class="payslip-amount">{{ payslip.net_salary | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
              <div class="payslip-status" [class]="'status-' + payslip.status">
                {{ getStatusLabel(payslip.status) }}
              </div>
            </div>
            <div class="payslip-actions">
              <button class="btn-icon" (click)="downloadPayslip(payslip.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payslip-generator {
      padding: 2rem;
      max-width: 1200px;
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

    .generator-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .form-section {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .form-section h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }

    .form-group select {
      width: 100%;
      padding: 0.75rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .employee-selection {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 1rem;
    }

    .selection-header {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #333;
    }

    .selection-header label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #ffffff;
      cursor: pointer;
    }

    .employee-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .employee-item {
      margin-bottom: 0.5rem;
    }

    .employee-item label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background 0.3s ease;
    }

    .employee-item label:hover {
      background: #333;
    }

    .employee-info {
      flex: 1;
    }

    .employee-name {
      font-weight: 600;
      color: #ffffff;
    }

    .employee-details {
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    .employee-salary {
      font-size: 0.9rem;
      color: #3b82f6;
      font-weight: 600;
    }

    .actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .btn-primary:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #333;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .btn-secondary:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
    }

    .payslips-list {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .payslips-list h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .payslip-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .payslip-card {
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
    }

    .payslip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .payslip-employee {
      font-weight: 600;
      color: #ffffff;
    }

    .payslip-period {
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    .payslip-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .payslip-amount {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
    }

    .payslip-status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-draft {
      background: #374151;
      color: #ffffff;
    }

    .status-generated {
      background: #059669;
      color: #ffffff;
    }

    .payslip-actions {
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

    @media (max-width: 768px) {
      .generator-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PayslipGeneratorComponent implements OnInit {
  employees: (Employee & { selected: boolean })[] = [];
  payslips: PayrollEntry[] = [];
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  selectAll = false;

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  constructor(private payrollService: PayrollService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.payrollService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees.map(emp => ({ ...emp, selected: false }));
        this.selectAll = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  toggleSelectAll() {
    this.employees.forEach(emp => emp.selected = this.selectAll);
  }

  updateSelection() {
    this.selectAll = this.employees.every(emp => emp.selected);
  }

  hasSelectedEmployees(): boolean {
    return this.employees.some(emp => emp.selected);
  }

  getSelectedEmployeeIds(): number[] {
    return this.employees.filter(emp => emp.selected).map(emp => emp.id);
  }

  generatePayslips() {
    const employeeIds = this.getSelectedEmployeeIds();
    this.payrollService.generatePayslips(this.selectedYear, this.selectedMonth, employeeIds).subscribe({
      next: (payslips) => {
        this.payslips = payslips;
        console.log('Payslips generated:', payslips);
      },
      error: (error) => {
        console.error('Error generating payslips:', error);
      }
    });
  }

  previewPayslips() {
    // TODO: Implement preview functionality
    console.log('Preview payslips for selected employees');
  }

  downloadPayslip(id: number) {
    this.payrollService.downloadPayslipPDF(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading payslip:', error);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'generated': 'Généré',
      'sent': 'Envoyé',
      'paid': 'Payé'
    };
    return labels[status] || status;
  }
}
