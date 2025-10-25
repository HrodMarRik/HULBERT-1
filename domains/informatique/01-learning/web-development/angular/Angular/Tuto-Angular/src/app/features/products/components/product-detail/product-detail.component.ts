import { Component } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  template: `
    <div class="product-detail-container">
      <h1>Détails du Produit</h1>
      <div class="product-info">
        <h2>{{ product.name }}</h2>
        <p class="description">{{ product.description }}</p>
        <p class="price">{{ product.price }}€</p>
        <p class="stock">Stock: {{ product.stock }} unités</p>
      </div>
    </div>
  `,
  styles: [`
    .product-detail-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .product-info {
      background: #f5f5f5;
      padding: 2rem;
      border-radius: 8px;
    }
    
    .price {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1976d2;
    }
    
    .stock {
      color: #666;
    }
  `]
})
export class ProductDetailComponent {
  product = {
    id: 1,
    name: 'Produit Exemple',
    description: 'Description détaillée du produit',
    price: 29.99,
    stock: 50
  };
}
