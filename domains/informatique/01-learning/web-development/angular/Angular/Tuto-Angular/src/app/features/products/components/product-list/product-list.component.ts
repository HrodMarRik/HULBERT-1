import { Component } from '@angular/core';

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: `
    <div class="product-list-container">
      <h1>Liste des Produits</h1>
      <p>Gérez vos produits ici.</p>
      <div class="product-grid">
        <div class="product-card" *ngFor="let product of products">
          <h3>{{ product.name }}</h3>
          <p>{{ product.description }}</p>
          <p class="price">{{ product.price }}€</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-list-container {
      padding: 2rem;
    }
    
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .product-card {
      border: 1px solid #ddd;
      padding: 1rem;
      border-radius: 8px;
      background: white;
    }
    
    .price {
      font-weight: bold;
      color: #1976d2;
    }
  `]
})
export class ProductListComponent {
  products = [
    { id: 1, name: 'Produit 1', description: 'Description du produit 1', price: 29.99 },
    { id: 2, name: 'Produit 2', description: 'Description du produit 2', price: 39.99 },
    { id: 3, name: 'Produit 3', description: 'Description du produit 3', price: 49.99 }
  ];
}
