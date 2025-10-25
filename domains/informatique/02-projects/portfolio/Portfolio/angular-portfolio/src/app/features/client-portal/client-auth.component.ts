import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientPortalService, ClientTokenValidation } from './client-portal.service';

@Component({
  selector: 'app-client-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="client-auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">🔐</div>
          <h1 class="auth-title">Portail Client</h1>
          <p class="auth-subtitle">Accédez à vos tickets et demandes</p>
        </div>

        <div class="auth-content" *ngIf="!validating">
          <!-- Formulaire mot de passe si requis -->
          <div class="password-form" *ngIf="requiresPassword && !authenticated">
            <p class="password-info">Ce portail est protégé par mot de passe</p>
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input 
                type="password" 
                id="password"
                [(ngModel)]="password"
                (keyup.enter)="authenticate()"
                placeholder="Entrez votre mot de passe"
                class="form-input"
                autofocus
              />
            </div>
            <button 
              class="btn btn-primary" 
              (click)="authenticate()"
              [disabled]="!password"
            >
              Accéder
            </button>
          </div>

          <!-- Message d'erreur -->
          <div class="error-message" *ngIf="error">
            <div class="error-icon">⚠️</div>
            <div class="error-text">{{ error }}</div>
          </div>

          <!-- Message de bienvenue -->
          <div class="welcome-message" *ngIf="authenticated && tokenData">
            <div class="welcome-icon">👋</div>
            <h2 class="welcome-title">
              Bienvenue, {{ tokenData.contact.first_name }} {{ tokenData.contact.last_name }}
            </h2>
            <p class="welcome-text">Vous allez être redirigé vers vos tickets...</p>
          </div>
        </div>

        <div class="loading-state" *ngIf="validating">
          <div class="loading-spinner"></div>
          <p class="loading-text">Validation en cours...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .client-auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 450px;
      width: 100%;
      overflow: hidden;
    }

    .auth-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }

    .auth-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .auth-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .auth-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }

    .auth-content {
      padding: 40px 30px;
    }

    .password-form {
      text-align: center;
    }

    .password-info {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #334155;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn {
      width: 100%;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .error-icon {
      font-size: 24px;
    }

    .error-text {
      font-size: 14px;
      color: #dc2626;
      flex: 1;
    }

    .welcome-message {
      text-align: center;
    }

    .welcome-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .welcome-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .welcome-text {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .loading-state {
      padding: 60px 30px;
      text-align: center;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
  `]
})
export class ClientAuthComponent implements OnInit {
  token: string = '';
  password: string = '';
  requiresPassword: boolean = false;
  authenticated: boolean = false;
  validating: boolean = false;
  error: string = '';
  tokenData: ClientTokenValidation | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientPortalService: ClientPortalService
  ) {}

  ngOnInit() {
    // Récupérer le token depuis l'URL
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.error = 'Token manquant dans l\'URL';
      }
    });
  }

  validateToken() {
    this.validating = true;
    this.error = '';

    this.clientPortalService.validateToken(this.token).subscribe({
      next: (data) => {
        this.validating = false;
        this.tokenData = data;
        this.requiresPassword = data.requires_password;

        if (!this.requiresPassword) {
          // Pas de mot de passe requis, rediriger directement
          this.authenticated = true;
          this.redirectToTickets();
        }
      },
      error: (err) => {
        this.validating = false;
        this.error = err.error?.error || 'Token invalide ou expiré';
      }
    });
  }

  authenticate() {
    if (!this.password) return;

    this.validating = true;
    this.error = '';

    this.clientPortalService.validateToken(this.token, this.password).subscribe({
      next: (data) => {
        this.validating = false;
        this.tokenData = data;
        this.authenticated = true;
        
        // Stocker le token et le mot de passe dans sessionStorage
        sessionStorage.setItem('client_token', this.token);
        if (this.password) {
          sessionStorage.setItem('client_password', this.password);
        }

        this.redirectToTickets();
      },
      error: (err) => {
        this.validating = false;
        this.error = err.error?.error || 'Mot de passe incorrect';
      }
    });
  }

  redirectToTickets() {
    setTimeout(() => {
      this.router.navigate(['/client-portal', this.token, 'tickets']);
    }, 1500);
  }
}

