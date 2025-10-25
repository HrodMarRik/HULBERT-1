import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { UserLogin } from '../../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>Connexion</h2>
          <p>Connectez-vous à votre compte</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Nom d'utilisateur ou email</label>
            <input 
              id="username"
              type="text" 
              formControlName="username"
              class="form-control"
              [class.error]="usernameControl.invalid && usernameControl.touched"
              placeholder="Votre nom d'utilisateur ou email"
              autocomplete="username">
            
            <div *ngIf="usernameControl.invalid && usernameControl.touched" class="error-message">
              <span *ngIf="usernameControl.errors?.['required']">Le nom d'utilisateur est requis</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="password-input">
              <input 
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="form-control"
                [class.error]="passwordControl.invalid && passwordControl.touched"
                placeholder="Votre mot de passe"
                autocomplete="current-password">
              
              <button 
                type="button" 
                (click)="togglePasswordVisibility()"
                class="password-toggle"
                [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            
            <div *ngIf="passwordControl.invalid && passwordControl.touched" class="error-message">
              <span *ngIf="passwordControl.errors?.['required']">Le mot de passe est requis</span>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                formControlName="rememberMe"
                class="checkbox">
              <span class="checkmark"></span>
              Se souvenir de moi
            </label>

            <a routerLink="/auth/forgot-password" class="forgot-password-link">
              Mot de passe oublié ?
            </a>
          </div>

          <div *ngIf="loginError" class="error-message error-summary">
            {{ loginError }}
          </div>

          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isSubmitting"
            class="btn btn-primary btn-full">
            <span *ngIf="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <div class="login-footer">
          <p>Pas encore de compte ? 
            <a routerLink="/auth/register" class="register-link">
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-header h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }
    
    .login-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }
    
    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .form-control.error {
      border-color: #dc3545;
    }
    
    .password-input {
      position: relative;
    }
    
    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
    }
    
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      color: #666;
    }
    
    .checkbox {
      margin-right: 8px;
    }
    
    .forgot-password-link {
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
    }
    
    .forgot-password-link:hover {
      text-decoration: underline;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .error-summary {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-primary {
      background-color: #667eea;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: #5a6fd8;
    }
    
    .btn-full {
      width: 100%;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .login-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e1e5e9;
    }
    
    .login-footer p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .register-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    .register-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isSubmitting = false;
  loginError = '';
  showPassword = false;
  returnUrl = '/';
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.createForm();
    
    // Récupérer l'URL de retour depuis les query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.returnUrl = params['returnUrl'] || '/';
      });

    // S'abonner au loading global
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isSubmitting = loading;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm() {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      rememberMe: new FormControl(false)
    });
  }

  get usernameControl() { return this.loginForm.get('username')!; }
  get passwordControl() { return this.loginForm.get('password')!; }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loginError = '';
      
      const loginData: UserLogin = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (token) => {
            console.log('Login successful');
            this.router.navigate([this.returnUrl]);
          },
          error: (error) => {
            console.error('Login error:', error);
            this.loginError = this.getErrorMessage(error);
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Nom d\'utilisateur ou mot de passe incorrect';
    } else if (error.status === 403) {
      return 'Compte désactivé. Contactez l\'administrateur';
    } else if (error.status === 429) {
      return 'Trop de tentatives de connexion. Réessayez plus tard';
    } else {
      return 'Une erreur est survenue. Réessayez plus tard';
    }
  }
}
