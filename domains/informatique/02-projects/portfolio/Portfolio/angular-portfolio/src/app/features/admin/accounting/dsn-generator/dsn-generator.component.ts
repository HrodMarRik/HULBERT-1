import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService, TaxDeclaration, SocialCharge } from '@core/services/social.service';

@Component({
  selector: 'app-dsn-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dsn-generator">
      <div class="header">
        <h1>Génération DSN</h1>
        <p>Déclaration Sociale Nominative</p>
      </div>

      <div class="generator-form">
        <div class="form-section">
          <h2>Période</h2>
          <div class="form-group">
            <label>Année</label>
            <select [(ngModel)]="selectedYear" (change)="loadData()">
              <option *ngFor="let year of years" [value]="year">{{ year }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Mois</label>
            <select [(ngModel)]="selectedMonth" (change)="loadData()">
              <option *ngFor="let month of months" [value]="month.value">{{ month.label }}</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h2>Données Sociales</h2>
          <div class="social-data">
            <div class="data-item" *ngFor="let charge of socialCharges">
              <div class="charge-info">
                <div class="charge-type">{{ charge.charge_type }}</div>
                <div class="charge-details">
                  <span>Taux: {{ charge.rate }}%</span>
                  <span>Base: {{ charge.base_amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
                </div>
              </div>
              <div class="charge-amount">{{ charge.amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Actions</h2>
          <div class="actions">
            <button class="btn-primary" (click)="generateDSN()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Générer DSN
            </button>
            <button class="btn-secondary" (click)="previewDSN()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
              </svg>
              Aperçu
            </button>
          </div>
        </div>
      </div>

      <div class="declarations-list" *ngIf="declarations.length > 0">
        <h2>Déclarations Générées</h2>
        <div class="declaration-grid">
          <div class="declaration-card" *ngFor="let declaration of declarations">
            <div class="declaration-header">
              <div class="declaration-type">{{ declaration.declaration_type }}</div>
              <div class="declaration-period">{{ declaration.period_month }}/{{ declaration.period_year }}</div>
            </div>
            <div class="declaration-details">
              <div class="declaration-status" [class]="'status-' + declaration.status">
                {{ getStatusLabel(declaration.status) }}
              </div>
              <div class="declaration-date">{{ declaration.created_at | date:'dd/MM/yyyy' }}</div>
            </div>
            <div class="declaration-actions">
              <button class="btn-icon" (click)="downloadDeclaration(declaration.id)">
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
    .dsn-generator {
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

    .header p {
      font-size: 1.1rem;
      color: #a0a0a0;
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

    .social-data {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 1rem;
    }

    .data-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #333;
    }

    .data-item:last-child {
      border-bottom: none;
    }

    .charge-info {
      flex: 1;
    }

    .charge-type {
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .charge-details {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    .charge-amount {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
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

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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

    .declarations-list {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .declarations-list h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .declaration-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .declaration-card {
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
    }

    .declaration-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .declaration-type {
      font-weight: 600;
      color: #ffffff;
    }

    .declaration-period {
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    .declaration-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .declaration-status {
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

    .status-submitted {
      background: #3b82f6;
      color: #ffffff;
    }

    .declaration-date {
      font-size: 0.9rem;
      color: #a0a0a0;
    }

    .declaration-actions {
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
export class DsnGeneratorComponent implements OnInit {
  declarations: TaxDeclaration[] = [];
  socialCharges: SocialCharge[] = [];
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

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

  constructor(private socialService: SocialService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadDeclarations();
    this.loadSocialCharges();
  }

  loadDeclarations() {
    this.socialService.getDeclarations().subscribe({
      next: (declarations) => {
        this.declarations = declarations;
      },
      error: (error) => {
        console.error('Error loading declarations:', error);
      }
    });
  }

  loadSocialCharges() {
    this.socialService.getSocialCharges(this.selectedYear, this.selectedMonth).subscribe({
      next: (charges) => {
        this.socialCharges = charges;
      },
      error: (error) => {
        console.error('Error loading social charges:', error);
      }
    });
  }

  generateDSN() {
    this.socialService.generateDSN(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dsn-${this.selectedYear}-${this.selectedMonth}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loadDeclarations();
      },
      error: (error) => {
        console.error('Error generating DSN:', error);
      }
    });
  }

  previewDSN() {
    // TODO: Implement preview functionality
    console.log('Preview DSN for period:', this.selectedMonth, this.selectedYear);
  }

  downloadDeclaration(id: number) {
    // TODO: Implement download functionality
    console.log('Download declaration:', id);
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'generated': 'Généré',
      'submitted': 'Soumis',
      'validated': 'Validé'
    };
    return labels[status] || status;
  }
}
