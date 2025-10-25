import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accounting-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accounting-reports">
      <div class="page-header">
        <h1>Rapports Comptables</h1>
        <button class="btn-primary">Générer Rapport</button>
      </div>
      <div class="coming-soon">
        <h2>🚧 Module en cours de développement</h2>
        <p>Les rapports comptables seront bientôt disponibles.</p>
      </div>
    </div>
  `,
  styles: [`
    .accounting-reports { padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .coming-soon { text-align: center; padding: 4rem; background: #f8fafc; border-radius: 8px; }
    .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; }
  `]
})
export class AccountingReportsComponent {}
