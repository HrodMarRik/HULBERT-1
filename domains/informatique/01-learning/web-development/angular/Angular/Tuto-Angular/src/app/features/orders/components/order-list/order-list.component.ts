import { Component } from '@angular/core';

@Component({
  selector: 'app-order-list',
  standalone: true,
  template: `
    <div class="order-list-container">
      <h1>Liste des Commandes</h1>
      <div class="order-grid">
        <div class="order-card" *ngFor="let order of orders">
          <h3>Commande #{{ order.id }}</h3>
          <p><strong>Client :</strong> {{ order.customer }}</p>
          <p><strong>Date :</strong> {{ order.date }}</p>
          <p><strong>Total :</strong> {{ order.total }}€</p>
          <p><strong>Statut :</strong> {{ order.status }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-list-container {
      padding: 2rem;
    }
    
    .order-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .order-card {
      border: 1px solid #ddd;
      padding: 1rem;
      border-radius: 8px;
      background: white;
    }
  `]
})
export class OrderListComponent {
  orders = [
    { id: 1, customer: 'Jean Dupont', date: '2024-01-15', total: 89.99, status: 'Livré' },
    { id: 2, customer: 'Marie Martin', date: '2024-01-16', total: 45.50, status: 'En cours' },
    { id: 3, customer: 'Pierre Durand', date: '2024-01-17', total: 120.00, status: 'En attente' }
  ];
}
