import { Component } from '@angular/core';

@Component({
  selector: 'app-product-form',
  standalone: true,
  template: `
    <div class="product-form-container">
      <h1>Créer un Produit</h1>
      <form>
        <div class="form-group">
          <label for="name">Nom du produit :</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="description">Description :</label>
          <textarea id="description" name="description" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label for="price">Prix :</label>
          <input type="number" id="price" name="price" step="0.01" required>
        </div>
        <button type="submit" class="submit-btn">Créer le produit</button>
      </form>
    </div>
  `,
  styles: [`
    .product-form-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    
    input, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    
    .submit-btn {
      padding: 0.75rem 2rem;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class ProductFormComponent {}
