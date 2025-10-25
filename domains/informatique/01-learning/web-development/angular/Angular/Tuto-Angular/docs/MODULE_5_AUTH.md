# Module 5: Authentification JWT complète

## Vue d'ensemble

L'authentification JWT (JSON Web Token) est un standard pour sécuriser les communications entre le client et le serveur. Ce module couvre l'implémentation complète de l'authentification JWT dans Angular, incluant la connexion, l'inscription, la gestion des tokens, et la protection des routes.

## 1. Architecture d'authentification

### Flux d'authentification JWT

```
1. Utilisateur saisit ses identifiants
2. Angular envoie les données au backend
3. Backend vérifie les identifiants
4. Backend génère un JWT et le retourne
5. Angular stocke le token et l'utilise pour les requêtes
6. Token expiré → redirection vers login
```

### Structure des composants d'authentification

```
features/auth/
├── components/
│   ├── login/
│   │   ├── login.component.ts
│   │   └── login.component.html
│   ├── register/
│   │   ├── register.component.ts
│   │   └── register.component.html
│   ├── forgot-password/
│   │   ├── forgot-password.component.ts
│   │   └── forgot-password.component.html
│   └── reset-password/
│       ├── reset-password.component.ts
│       └── reset-password.component.html
├── services/
│   └── auth.service.ts
├── guards/
│   ├── auth.guard.ts
│   └── admin.guard.ts
└── auth.routes.ts
```

## 2. Service d'authentification avancé

```typescript
// core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, UserCreate, UserLogin, Token, UserPasswordChange } from '../models/user.model';
import { API_CONFIG } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private tokenRefreshTimer?: any;

  constructor(private apiService: ApiService) {
    this.loadUserFromStorage();
    this.setupTokenRefresh();
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: UserLogin): Observable<Token> {
    return this.apiService.post<Token>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials)
      .pipe(
        tap(token => {
          this.storeToken(token);
          this.loadCurrentUser();
          this.setupTokenRefresh();
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Enregistrement utilisateur
   */
  register(userData: UserCreate): Observable<User> {
    return this.apiService.post<User>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData)
      .pipe(
        tap(user => {
          console.log('User registered successfully:', user);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): Observable<any> {
    return this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {})
      .pipe(
        tap(() => {
          this.clearAuthData();
        }),
        catchError(error => {
          // Même en cas d'erreur, on déconnecte localement
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les informations de l'utilisateur actuel
   */
  getCurrentUser(): Observable<User> {
    return this.apiService.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          this.storeUser(user);
        }),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.apiService.put<User>(API_CONFIG.ENDPOINTS.AUTH.ME, userData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storeUser(user);
        }),
        catchError(error => {
          console.error('Profile update error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Changer le mot de passe
   */
  changePassword(passwordData: UserPasswordChange): Observable<any> {
    return this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.ME + '/change-password', passwordData)
      .pipe(
        tap(() => {
          console.log('Password changed successfully');
        }),
        catchError(error => {
          console.error('Password change error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  forgotPassword(email: string): Observable<any> {
    return this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      new_password: newPassword
    }).pipe(
      catchError(error => {
        console.error('Reset password error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est administrateur
   */
  isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.is_admin || false;
  }

  /**
   * Obtenir le token d'accès
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Rafraîchir le token
   */
  refreshToken(): Observable<Token> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.apiService.post<Token>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken
    }).pipe(
      tap(token => {
        this.storeToken(token);
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Stocker le token
   */
  private storeToken(token: Token): void {
    localStorage.setItem('access_token', token.access_token);
    localStorage.setItem('token_type', token.token_type);
    localStorage.setItem('expires_in', token.expires_in.toString());
    
    // Stocker le refresh token s'il est fourni
    if ('refresh_token' in token) {
      localStorage.setItem('refresh_token', (token as any).refresh_token);
    }
  }

  /**
   * Stocker les données utilisateur
   */
  private storeUser(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Charger l'utilisateur depuis le stockage local
   */
  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('user_data');
    const token = this.getToken();

    if (userData && token && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuthData();
      }
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Charger les informations de l'utilisateur actuel depuis l'API
   */
  private loadCurrentUser(): void {
    this.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Current user loaded:', user);
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.clearAuthData();
      }
    });
  }

  /**
   * Configurer le rafraîchissement automatique du token
   */
  private setupTokenRefresh(): void {
    const token = this.getToken();
    if (!token) return;

    const expiresIn = parseInt(localStorage.getItem('expires_in') || '0');
    const refreshTime = (expiresIn - 300) * 1000; // Rafraîchir 5 minutes avant expiration

    if (refreshTime > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => {
            console.log('Token refreshed successfully');
            this.setupTokenRefresh(); // Programmer le prochain rafraîchissement
          },
          error: (error) => {
            console.error('Token refresh failed:', error);
            this.clearAuthData();
          }
        });
      }, refreshTime);
    }
  }

  /**
   * Vérifier si le token est expiré
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  /**
   * Effacer toutes les données d'authentification
   */
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('user_data');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = undefined;
    }
  }
}
```

## 3. Composant de connexion

```typescript
// features/auth/components/login/login.component.ts
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
```

## 4. Composant d'inscription

```typescript
// features/auth/components/register/register.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { UserCreate } from '../../../../core/models/user.model';
import { CustomValidators } from '../../../../core/validators/custom.validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h2>Créer un compte</h2>
          <p>Rejoignez notre communauté</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Prénom</label>
              <input 
                id="firstName"
                type="text" 
                formControlName="firstName"
                class="form-control"
                placeholder="Votre prénom">
            </div>
            
            <div class="form-group">
              <label for="lastName">Nom</label>
              <input 
                id="lastName"
                type="text" 
                formControlName="lastName"
                class="form-control"
                placeholder="Votre nom">
            </div>
          </div>

          <div class="form-group">
            <label for="username">Nom d'utilisateur *</label>
            <input 
              id="username"
              type="text" 
              formControlName="username"
              class="form-control"
              [class.error]="usernameControl.invalid && usernameControl.touched"
              placeholder="Choisissez un nom d'utilisateur">
            
            <div *ngIf="usernameControl.invalid && usernameControl.touched" class="error-message">
              <span *ngIf="usernameControl.errors?.['required']">Le nom d'utilisateur est requis</span>
              <span *ngIf="usernameControl.errors?.['minlength']">
                Minimum {{ usernameControl.errors?.['minlength'].requiredLength }} caractères
              </span>
              <span *ngIf="usernameControl.errors?.['pattern']">
                Seuls les lettres, chiffres et _ sont autorisés
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input 
              id="email"
              type="email" 
              formControlName="email"
              class="form-control"
              [class.error]="emailControl.invalid && emailControl.touched"
              placeholder="votre@email.com">
            
            <div *ngIf="emailControl.invalid && emailControl.touched" class="error-message">
              <span *ngIf="emailControl.errors?.['required']">L'email est requis</span>
              <span *ngIf="emailControl.errors?.['email']">Format d'email invalide</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe *</label>
            <div class="password-input">
              <input 
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="form-control"
                [class.error]="passwordControl.invalid && passwordControl.touched"
                placeholder="Choisissez un mot de passe sécurisé">
              
              <button 
                type="button" 
                (click)="togglePasswordVisibility()"
                class="password-toggle">
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            
            <div *ngIf="passwordControl.invalid && passwordControl.touched" class="error-message">
              <span *ngIf="passwordControl.errors?.['required']">Le mot de passe est requis</span>
              <span *ngIf="passwordControl.errors?.['minlength']">
                Minimum {{ passwordControl.errors?.['minlength'].requiredLength }} caractères
              </span>
              <span *ngIf="passwordControl.errors?.['pattern']">
                Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe *</label>
            <input 
              id="confirmPassword"
              type="password" 
              formControlName="confirmPassword"
              class="form-control"
              [class.error]="confirmPasswordControl.invalid && confirmPasswordControl.touched"
              placeholder="Confirmez votre mot de passe">
            
            <div *ngIf="confirmPasswordControl.invalid && confirmPasswordControl.touched" class="error-message">
              <span *ngIf="confirmPasswordControl.errors?.['required']">La confirmation est requise</span>
              <span *ngIf="confirmPasswordControl.errors?.['passwordMismatch']">
                Les mots de passe ne correspondent pas
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                formControlName="acceptTerms"
                class="checkbox">
              <span class="checkmark"></span>
              J'accepte les 
              <a href="/terms" target="_blank" class="terms-link">conditions d'utilisation</a>
              et la 
              <a href="/privacy" target="_blank" class="terms-link">politique de confidentialité</a>
            </label>
            
            <div *ngIf="acceptTermsControl.invalid && acceptTermsControl.touched" class="error-message">
              <span *ngIf="acceptTermsControl.errors?.['required']">
                Vous devez accepter les conditions d'utilisation
              </span>
            </div>
          </div>

          <div *ngIf="registerError" class="error-message error-summary">
            {{ registerError }}
          </div>

          <button 
            type="submit" 
            [disabled]="registerForm.invalid || isSubmitting"
            class="btn btn-primary btn-full">
            <span *ngIf="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Création...' : 'Créer mon compte' }}
          </button>
        </form>

        <div class="register-footer">
          <p>Déjà un compte ? 
            <a routerLink="/auth/login" class="login-link">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .register-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      padding: 40px;
      width: 100%;
      max-width: 500px;
    }
    
    .register-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .register-header h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }
    
    .register-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
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
    
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      line-height: 1.4;
    }
    
    .checkbox {
      margin-right: 8px;
      margin-top: 2px;
    }
    
    .terms-link {
      color: #667eea;
      text-decoration: none;
    }
    
    .terms-link:hover {
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
    
    .register-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e1e5e9;
    }
    
    .register-footer p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .login-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    .login-link:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isSubmitting = false;
  registerError = '';
  showPassword = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.createForm();

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
    this.registerForm = new FormGroup({
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
      acceptTerms: new FormControl(false, [Validators.requiredTrue])
    }, { validators: CustomValidators.passwordMatch('password', 'confirmPassword') });
  }

  get usernameControl() { return this.registerForm.get('username')!; }
  get emailControl() { return this.registerForm.get('email')!; }
  get passwordControl() { return this.registerForm.get('password')!; }
  get confirmPasswordControl() { return this.registerForm.get('confirmPassword')!; }
  get acceptTermsControl() { return this.registerForm.get('acceptTerms')!; }

  onSubmit() {
    if (this.registerForm.valid) {
      this.registerError = '';
      
      const userData: UserCreate = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        first_name: this.registerForm.value.firstName,
        last_name: this.registerForm.value.lastName
      };

      this.authService.register(userData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            console.log('Registration successful:', user);
            this.router.navigate(['/auth/login'], {
              queryParams: { registered: true }
            });
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.registerError = this.getErrorMessage(error);
          }
        });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private getErrorMessage(error: any): string {
    if (error.status === 409) {
      return 'Un compte avec cet email ou nom d\'utilisateur existe déjà';
    } else if (error.status === 400) {
      return 'Données invalides. Vérifiez vos informations';
    } else {
      return 'Une erreur est survenue. Réessayez plus tard';
    }
  }
}
```

## 5. Guards de protection des routes

### AuthGuard amélioré

```typescript
// core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    // Rediriger vers la page de connexion avec l'URL de retour
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}
```

### AdminGuard

```typescript
// core/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

## 6. Configuration des routes d'authentification

```typescript
// features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  }
];
```

## Exercices pratiques

### Exercice 1: Système de connexion complet
Implémentez un système de connexion avec gestion des tokens et rafraîchissement automatique.

### Exercice 2: Inscription avec validation
Créez un formulaire d'inscription avec validation asynchrone pour vérifier l'unicité de l'email.

### Exercice 3: Protection des routes
Protégez certaines routes avec des guards d'authentification et d'administration.

## Prochaines étapes

Maintenant que vous maîtrisez l'authentification JWT, nous passerons au Module 6 : Intégration complète avec API Python pour connecter votre frontend Angular à votre backend FastAPI.
