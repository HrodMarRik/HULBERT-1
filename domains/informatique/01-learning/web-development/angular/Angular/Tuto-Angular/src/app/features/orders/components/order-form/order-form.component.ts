import { Component } from '@angular/core';

@Component({
  selector: 'app-order-form',
  standalone: true,
  template: `
    <div class="order-form-container">
      <h1>Créer une Commande</h1>
      <form>
        <div class="form-group">
          <label for="customer">Client :</label>
          <input type="text" id="customer" name="customer" required>
        </div>
        <div class="form-group">
          <label for="products">Produits :</label>
          <select id="products" name="products" multiple>
            <option value="1">Produit 1</option>
            <option value="2">Produit 2</option>
            <option value="3">Produit 3</option>
          </select>
        </div>
        <div class="form-group">
          <label for="total">Total :</label>
          <input type="number" id="total" name="total" step="0.01" required>
        </div>
        <button type="submit" class="submit-btn">Créer la commande</button>
      </form>
    </div>
  `,
  styles: [`
    .order-form-container {
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
    
    input, select {
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
export class OrderFormComponent {}
