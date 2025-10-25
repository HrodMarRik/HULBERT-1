import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoice-list">
      <div class="page-header">
        <h1>Gestion des Factures</h1>
        <button class="btn-primary">Nouvelle Facture</button>
      </div>
      <div class="coming-soon">
        <h2>🚧 Module en cours de développement</h2>
        <p>La gestion complète des factures sera bientôt disponible.</p>
      </div>
    </div>
  `,
  styles: [`
    .invoice-list { padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .coming-soon { text-align: center; padding: 4rem; background: #f8fafc; border-radius: 8px; }
    .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; }
  `]
})
export class InvoiceListComponent {}
