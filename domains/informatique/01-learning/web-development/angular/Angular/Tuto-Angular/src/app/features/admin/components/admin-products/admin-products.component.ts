import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  template: `
    <div class="admin-products-container">
      <h1>Gestion des Produits</h1>
      <p>Interface d'administration pour gérer les produits.</p>
    </div>
  `,
  styles: [`
    .admin-products-container {
      padding: 2rem;
    }
  `]
})
export class AdminProductsComponent {}
