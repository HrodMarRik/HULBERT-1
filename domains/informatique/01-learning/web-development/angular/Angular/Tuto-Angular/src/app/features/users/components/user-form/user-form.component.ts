import { Component } from '@angular/core';

@Component({
  selector: 'app-user-form',
  standalone: true,
  template: `
    <div class="user-form-container">
      <h1>Créer un Utilisateur</h1>
      <form>
        <div class="form-group">
          <label for="name">Nom :</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="email">Email :</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="role">Rôle :</label>
          <select id="role" name="role">
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <button type="submit" class="submit-btn">Créer l'utilisateur</button>
      </form>
    </div>
  `,
  styles: [`
    .user-form-container {
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
export class UserFormComponent {}
