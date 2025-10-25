import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PayrollService, Employee } from '@core/services/payroll.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="employee-list">
      <div class="header">
        <h1>Gestion des Employés</h1>
        <button class="btn-primary" routerLink="/admin/accounting/payroll/employees/new">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Nouvel Employé
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select [(ngModel)]="statusFilter" (change)="filterEmployees()">
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="on_leave">En congé</option>
            <option value="terminated">Terminé</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Département</label>
          <select [(ngModel)]="departmentFilter" (change)="filterEmployees()">
            <option value="">Tous</option>
            <option value="IT">IT</option>
            <option value="RH">RH</option>
            <option value="Comptabilité">Comptabilité</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Recherche</label>
          <input type="text" [(ngModel)]="searchTerm" (input)="filterEmployees()" placeholder="Nom, email...">
        </div>
      </div>

      <div class="employee-grid">
        <div class="employee-card" *ngFor="let employee of filteredEmployees" (click)="viewEmployee(employee.id)">
          <div class="employee-header">
            <div class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</div>
            <div class="employee-status" [class]="'status-' + employee.status">
              {{ getStatusLabel(employee.status) }}
            </div>
          </div>
          <div class="employee-details">
            <div class="employee-position">{{ employee.position }}</div>
            <div class="employee-department">{{ employee.department }}</div>
            <div class="employee-salary">{{ employee.gross_salary_monthly | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
          </div>
          <div class="employee-actions">
            <button class="btn-icon" (click)="editEmployee(employee.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
              </svg>
            </button>
            <button class="btn-icon" (click)="generatePayslip(employee.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>
            <button class="btn-icon" (click)="deleteEmployee(employee.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employee-list {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: #0f0f0f;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #1a1a1a;
      border-radius: 8px;
      border: 1px solid #333;
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

    .filter-group select,
    .filter-group input {
      padding: 0.5rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .employee-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .employee-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .employee-card:hover {
      background: #2a2a2a;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .employee-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .employee-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
    }

    .employee-status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-active {
      background: #059669;
      color: #ffffff;
    }

    .status-inactive {
      background: #374151;
      color: #ffffff;
    }

    .status-on_leave {
      background: #f59e0b;
      color: #ffffff;
    }

    .status-terminated {
      background: #dc2626;
      color: #ffffff;
    }

    .employee-details {
      margin-bottom: 1rem;
    }

    .employee-position {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.25rem;
    }

    .employee-department {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.25rem;
    }

    .employee-salary {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
    }

    .employee-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #a0a0a0;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-icon:hover {
      background: #333;
      color: #ffffff;
    }
  `]
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  statusFilter = '';
  departmentFilter = '';
  searchTerm = '';

  constructor(private payrollService: PayrollService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.payrollService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
        this.filteredEmployees = employees;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  filterEmployees() {
    this.filteredEmployees = this.employees.filter(employee => {
      const matchesStatus = !this.statusFilter || employee.status === this.statusFilter;
      const matchesDepartment = !this.departmentFilter || employee.department === this.departmentFilter;
      const matchesSearch = !this.searchTerm || 
        employee.first_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesDepartment && matchesSearch;
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'on_leave': 'En congé',
      'terminated': 'Terminé'
    };
    return labels[status] || status;
  }

  viewEmployee(id: number) {
    // TODO: Navigate to employee detail
    console.log('View employee:', id);
  }

  editEmployee(id: number, event: Event) {
    event.stopPropagation();
    // TODO: Navigate to employee edit
    console.log('Edit employee:', id);
  }

  generatePayslip(id: number, event: Event) {
    event.stopPropagation();
    // TODO: Generate payslip for employee
    console.log('Generate payslip for employee:', id);
  }

  deleteEmployee(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      this.payrollService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
        }
      });
    }
  }
}
