import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_CONFIG } from '../constants/api.constants';
import { ApiResponse, ApiError } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Effectuer une requête GET
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    this.setLoading(true);
    return this.http.get<ApiResponse<T>>(`${API_CONFIG.BASE_URL}${endpoint}`, { params })
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête POST
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.post<ApiResponse<T>>(`${API_CONFIG.BASE_URL}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête PUT
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.put<ApiResponse<T>>(`${API_CONFIG.BASE_URL}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête PATCH
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.patch<ApiResponse<T>>(`${API_CONFIG.BASE_URL}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête DELETE
   */
  delete<T>(endpoint: string): Observable<T> {
    this.setLoading(true);
    return this.http.delete<ApiResponse<T>>(`${API_CONFIG.BASE_URL}${endpoint}`)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête GET avec pagination
   */
  getPaginated<T>(endpoint: string, page: number = 0, size: number = 10, params?: HttpParams): Observable<{items: T[], total: number}> {
    this.setLoading(true);
    const paginationParams = new HttpParams()
      .set('skip', (page * size).toString())
      .set('limit', size.toString());

    const finalParams = params ? paginationParams.appendAll(params.toString()) : paginationParams;

    return this.http.get<ApiResponse<T[]>>(`${API_CONFIG.BASE_URL}${endpoint}`, { params: finalParams })
      .pipe(
        map(response => ({
          items: response.data,
          total: response.status // Utilisez le header X-Total-Count en production
        })),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Upload de fichier
   */
  uploadFile<T>(endpoint: string, file: File): Observable<T> {
    this.setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<T>>(`${API_CONFIG.BASE_URL}${endpoint}`, formData)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Download de fichier
   */
  downloadFile(endpoint: string, filename?: string): Observable<Blob> {
    this.setLoading(true);
    return this.http.get(`${API_CONFIG.BASE_URL}${endpoint}`, {
      responseType: 'blob'
    }).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Gestionnaire d'erreurs centralisé
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = 'Une erreur est survenue';
    let errorCode = error.status;

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Requête invalide';
            break;
          case 401:
            errorMessage = 'Non autorisé';
            break;
          case 403:
            errorMessage = 'Accès interdit';
            break;
          case 404:
            errorMessage = 'Ressource non trouvée';
            break;
          case 409:
            errorMessage = 'Conflit de données';
            break;
          case 422:
            errorMessage = 'Données non valides';
            break;
          case 500:
            errorMessage = 'Erreur serveur interne';
            break;
          default:
            errorMessage = `Erreur ${error.status}: ${error.statusText}`;
        }
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Gestion de l'état de chargement
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Obtenir l'état de chargement actuel
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Créer des paramètres HTTP
   */
  createParams(params: {[key: string]: any}): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return httpParams;
  }

  /**
   * Créer des headers HTTP
   */
  createHeaders(additionalHeaders?: {[key: string]: string}): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach(key => {
        headers = headers.set(key, additionalHeaders[key]);
      });
    }

    return headers;
  }
}
