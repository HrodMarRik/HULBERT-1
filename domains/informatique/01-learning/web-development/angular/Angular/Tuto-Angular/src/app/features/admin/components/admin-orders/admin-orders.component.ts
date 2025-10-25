import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  template: `
    <div class="admin-orders-container">
      <h1>Gestion des Commandes</h1>
      <p>Interface d'administration pour gérer les commandes.</p>
    </div>
  `,
  styles: [`
    .admin-orders-container {
      padding: 2rem;
    }
  `]
})
export class AdminOrdersComponent {}
