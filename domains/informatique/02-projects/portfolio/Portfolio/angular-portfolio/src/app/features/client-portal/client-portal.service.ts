import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClientTokenValidation {
  valid: boolean;
  contact: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  project_id?: number;
  requires_password: boolean;
}

export interface ClientTicket {
  id: number;
  title: string;
  description: string;
  theme: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTicketCreate {
  title: string;
  description: string;
  theme: string;
  priority: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientPortalService {
  private apiUrl = `${environment.apiUrl}/api/client-portal`;

  constructor(private http: HttpClient) {}

  /**
   * Valider un token
   */
  validateToken(token: string, password?: string): Observable<ClientTokenValidation> {
    let params = new HttpParams();
    if (password) {
      params = params.set('password', password);
    }
    return this.http.get<ClientTokenValidation>(`${this.apiUrl}/auth/${token}`, { params });
  }

  /**
   * Créer un ticket
   */
  createTicket(token: string, ticket: ClientTicketCreate, password?: string): Observable<ClientTicket> {
    let params = new HttpParams().set('token', token);
    if (password) {
      params = params.set('password', password);
    }
    return this.http.post<ClientTicket>(`${this.apiUrl}/tickets`, ticket, { params });
  }

  /**
   * Récupérer les tickets du client
   */
  getTickets(token: string, password?: string): Observable<ClientTicket[]> {
    let params = new HttpParams().set('token', token);
    if (password) {
      params = params.set('password', password);
    }
    return this.http.get<ClientTicket[]>(`${this.apiUrl}/tickets`, { params });
  }
}

