import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  template: `
    <div class="reset-password-container">
      <h1>Réinitialiser le mot de passe</h1>
      <p>Entrez votre nouveau mot de passe.</p>
      <div class="form-container">
        <form>
          <div class="form-group">
            <label for="password">Nouveau mot de passe :</label>
            <input type="password" id="password" name="password" required>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe :</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required>
          </div>
          <button type="submit" class="submit-btn">Réinitialiser</button>
        </form>
        <p class="login-link">
          <a routerLink="/auth/login">Retour à la connexion</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
      padding: 2rem;
      max-width: 400px;
      margin: 0 auto;
    }
    
    h1 {
      color: #1976d2;
      text-align: center;
    }
    
    .form-container {
      margin-top: 2rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    
    .submit-btn {
      width: 100%;
      padding: 0.75rem;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    
    .submit-btn:hover {
      background-color: #1565c0;
    }
    
    .login-link {
      text-align: center;
      margin-top: 1rem;
    }
    
    a {
      color: #1976d2;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
  `],
  imports: [RouterLink]
})
export class ResetPasswordComponent {}
