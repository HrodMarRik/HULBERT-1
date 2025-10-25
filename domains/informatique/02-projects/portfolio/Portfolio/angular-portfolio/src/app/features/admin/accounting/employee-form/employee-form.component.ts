import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PayrollService, EmployeeCreate } from '@core/services/payroll.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="employee-form">
      <div class="header">
        <h1>{{ isEdit ? 'Modifier l\'Employé' : 'Nouvel Employé' }}</h1>
        <button class="btn-secondary" routerLink="/admin/accounting/payroll">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
          </svg>
          Retour
        </button>
      </div>

      <form (ngSubmit)="saveEmployee()" #employeeForm="ngForm">
        <div class="form-grid">
          <div class="form-section">
            <h2>Informations Personnelles</h2>
            <div class="form-group">
              <label>Prénom</label>
              <input type="text" [(ngModel)]="employee.first_name" name="first_name" required>
            </div>
            <div class="form-group">
              <label>Nom</label>
              <input type="text" [(ngModel)]="employee.last_name" name="last_name" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="employee.email" name="email" required>
            </div>
            <div class="form-group">
              <label>Téléphone</label>
              <input type="tel" [(ngModel)]="employee.phone" name="phone">
            </div>
            <div class="form-group">
              <label>Date de Naissance</label>
              <input type="date" [(ngModel)]="employee.birth_date" name="birth_date">
            </div>
            <div class="form-group">
              <label>Numéro de Sécurité Sociale</label>
              <input type="text" [(ngModel)]="employee.social_security_number" name="social_security_number">
            </div>
          </div>

          <div class="form-section">
            <h2>Adresse</h2>
            <div class="form-group">
              <label>Ligne 1</label>
              <input type="text" [(ngModel)]="employee.address_line1" name="address_line1">
            </div>
            <div class="form-group">
              <label>Ligne 2</label>
              <input type="text" [(ngModel)]="employee.address_line2" name="address_line2">
            </div>
            <div class="form-group">
              <label>Ville</label>
              <input type="text" [(ngModel)]="employee.city" name="city">
            </div>
            <div class="form-group">
              <label>Code Postal</label>
              <input type="text" [(ngModel)]="employee.postal_code" name="postal_code">
            </div>
            <div class="form-group">
              <label>Pays</label>
              <input type="text" [(ngModel)]="employee.country" name="country" value="France">
            </div>
          </div>

          <div class="form-section">
            <h2>Informations Professionnelles</h2>
            <div class="form-group">
              <label>Poste</label>
              <input type="text" [(ngModel)]="employee.position" name="position" required>
            </div>
            <div class="form-group">
              <label>Département</label>
              <select [(ngModel)]="employee.department" name="department">
                <option value="">Sélectionner un département</option>
                <option value="IT">IT</option>
                <option value="RH">RH</option>
                <option value="Comptabilité">Comptabilité</option>
                <option value="Commercial">Commercial</option>
                <option value="Marketing">Marketing</option>
                <option value="Production">Production</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type de Contrat</label>
              <select [(ngModel)]="employee.employment_type" name="employment_type" required>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Alternance">Alternance</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date de Début</label>
              <input type="date" [(ngModel)]="employee.start_date" name="start_date" required>
            </div>
            <div class="form-group">
              <label>Date de Fin (CDD)</label>
              <input type="date" [(ngModel)]="employee.end_date" name="end_date">
            </div>
            <div class="form-group">
              <label>Fin de Période d'Essai</label>
              <input type="date" [(ngModel)]="employee.probation_period_end" name="probation_period_end">
            </div>
          </div>

          <div class="form-section">
            <h2>Informations Salariales</h2>
            <div class="form-group">
              <label>Salaire Brut Mensuel</label>
              <input type="number" [(ngModel)]="employee.gross_salary_monthly" name="gross_salary_monthly" required>
            </div>
            <div class="form-group">
              <label>Heures par Semaine</label>
              <input type="number" [(ngModel)]="employee.working_hours_per_week" name="working_hours_per_week" value="35">
            </div>
            <div class="form-group">
              <label>Pourcentage de Temps de Travail</label>
              <input type="number" [(ngModel)]="employee.working_hours_percentage" name="working_hours_percentage" value="100">
            </div>
          </div>

          <div class="form-section">
            <h2>Informations Bancaires</h2>
            <div class="form-group">
              <label>IBAN</label>
              <input type="text" [(ngModel)]="employee.iban" name="iban">
            </div>
            <div class="form-group">
              <label>BIC</label>
              <input type="text" [(ngModel)]="employee.bic" name="bic">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" routerLink="/admin/accounting/payroll">Annuler</button>
          <button type="submit" class="btn-primary" [disabled]="!employeeForm.form.valid">
            {{ isEdit ? 'Modifier' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .employee-form {
      padding: 2rem;
      max-width: 1200px;
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

    .btn-secondary:hover {
      background: #333;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .form-grid {
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
      margin-bottom: 2rem;
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

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmployeeFormComponent implements OnInit {
  employee: EmployeeCreate = {
    first_name: '',
    last_name: '',
    email: '',
    country: 'France',
    position: '',
    employment_type: 'CDI',
    start_date: new Date(),
    gross_salary_monthly: 0,
    working_hours_per_week: 35,
    working_hours_percentage: 100
  };
  isEdit = false;

  constructor(private payrollService: PayrollService) {}

  ngOnInit() {
    // TODO: Load employee data if editing
  }

  saveEmployee() {
    if (this.isEdit) {
      // TODO: Update employee
      console.log('Update employee:', this.employee);
    } else {
      this.payrollService.createEmployee(this.employee).subscribe({
        next: (employee) => {
          console.log('Employee created:', employee);
          // TODO: Navigate to employee list
        },
        error: (error) => {
          console.error('Error creating employee:', error);
        }
      });
    }
  }
}
