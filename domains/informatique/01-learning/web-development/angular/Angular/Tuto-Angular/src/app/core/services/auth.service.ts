import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserCreate, UserUpdate, UserLogin, Token, UserPasswordChange } from '../models/user.model';
import { API_CONFIG } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadUserFromStorage();
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
  updateProfile(userData: UserUpdate): Observable<User> {
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
   * Stocker le token
   */
  private storeToken(token: Token): void {
    localStorage.setItem('access_token', token.access_token);
    localStorage.setItem('token_type', token.token_type);
    localStorage.setItem('expires_in', token.expires_in.toString());
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
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
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
}
