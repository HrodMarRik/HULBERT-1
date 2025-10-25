import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payroll-dashboard">
      <div class="page-header">
        <h1>Gestion de la Paie</h1>
        <button class="btn-primary">Générer Bulletins</button>
      </div>
      <div class="coming-soon">
        <h2>🚧 Module en cours de développement</h2>
        <p>La gestion complète de la paie sera bientôt disponible.</p>
      </div>
    </div>
  `,
  styles: [`
    .payroll-dashboard { padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .coming-soon { text-align: center; padding: 4rem; background: #f8fafc; border-radius: 8px; }
    .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; }
  `]
})
export class PayrollDashboardComponent {}
