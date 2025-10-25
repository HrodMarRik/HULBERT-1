import { Component } from '@angular/core';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  template: `
    <div class="order-detail-container">
      <h1>Détails de la Commande</h1>
      <div class="order-info">
        <h2>Commande #{{ order.id }}</h2>
        <p><strong>Client :</strong> {{ order.customer }}</p>
        <p><strong>Date :</strong> {{ order.date }}</p>
        <p><strong>Total :</strong> {{ order.total }}€</p>
        <p><strong>Statut :</strong> {{ order.status }}</p>
        <div class="products">
          <h3>Produits :</h3>
          <ul>
            <li *ngFor="let product of order.products">{{ product.name }} - {{ product.price }}€</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-detail-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .order-info {
      background: #f5f5f5;
      padding: 2rem;
      border-radius: 8px;
    }
    
    .products {
      margin-top: 1rem;
    }
    
    ul {
      list-style-type: disc;
      padding-left: 2rem;
    }
  `]
})
export class OrderDetailComponent {
  order = {
    id: 1,
    customer: 'Jean Dupont',
    date: '2024-01-15',
    total: 89.99,
    status: 'Livré',
    products: [
      { name: 'Produit 1', price: 29.99 },
      { name: 'Produit 2', price: 60.00 }
    ]
  };
}
