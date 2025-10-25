import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `
    <div class="register-container">
      <h1>Inscription</h1>
      <p>Créez votre compte pour accéder à l'application.</p>
      <div class="form-container">
        <form>
          <div class="form-group">
            <label for="username">Nom d'utilisateur :</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="email">Email :</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Mot de passe :</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" class="submit-btn">S'inscrire</button>
        </form>
        <p class="login-link">
          Déjà un compte ? <a routerLink="/auth/login">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
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
export class RegisterComponent {}
