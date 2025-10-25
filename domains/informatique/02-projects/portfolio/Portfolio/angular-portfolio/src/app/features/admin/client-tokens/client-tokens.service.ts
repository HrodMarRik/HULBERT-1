import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ClientToken {
  id: number;
  token: string;
  contact_id: number;
  project_id?: number;
  active: boolean;
  expires_at?: string;
  max_tickets?: number;
  created_at: string;
  last_used_at?: string;
}

export interface ClientTokenCreate {
  contact_id: number;
  project_id?: number;
  expires_at?: string;
  max_tickets?: number;
  password?: string;
}

export interface ClientTokenUpdate {
  active?: boolean;
  expires_at?: string;
  max_tickets?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientTokensService {
  private apiUrl = `${environment.apiUrl}/api/client-portal/tokens`;

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau token
   */
  createToken(data: ClientTokenCreate): Observable<ClientToken> {
    return this.http.post<ClientToken>(this.apiUrl, data);
  }

  /**
   * Lister les tokens
   */
  getTokens(
    contactId?: number,
    projectId?: number,
    active?: boolean
  ): Observable<ClientToken[]> {
    let params = new HttpParams();
    if (contactId) params = params.set('contact_id', contactId.toString());
    if (projectId) params = params.set('project_id', projectId.toString());
    if (active !== undefined) params = params.set('active', active.toString());
    
    return this.http.get<ClientToken[]>(this.apiUrl, { params });
  }

  /**
   * Récupérer un token par ID
   */
  getToken(id: number): Observable<ClientToken> {
    return this.http.get<ClientToken>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mettre à jour un token
   */
  updateToken(id: number, data: ClientTokenUpdate): Observable<ClientToken> {
    return this.http.patch<ClientToken>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Régénérer un token
   */
  regenerateToken(id: number): Observable<ClientToken> {
    return this.http.post<ClientToken>(`${this.apiUrl}/${id}/regenerate`, {});
  }

  /**
   * Désactiver un token
   */
  deactivateToken(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

