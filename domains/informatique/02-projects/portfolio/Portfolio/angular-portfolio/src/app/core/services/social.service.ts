import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface TaxDeclaration {
  id: number;
  declaration_type: string;
  period_year: number;
  period_month: number;
  declaration_data: any;
  status: string;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number;
}

export interface SocialCharge {
  id: number;
  charge_type: string;
  period_year: number;
  period_month: number;
  amount: number;
  rate: number;
  base_amount: number;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number;
}

export interface TaxDeclarationCreate {
  declaration_type: string;
  period_year: number;
  period_month: number;
  declaration_data: any;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private apiUrl = `${environment.apiUrl}/api/social`;

  constructor(private http: HttpClient) {}

  getDeclarations(): Observable<TaxDeclaration[]> {
    return this.http.get<TaxDeclaration[]>(`${this.apiUrl}/declarations`);
  }

  getDeclaration(id: number): Observable<TaxDeclaration> {
    return this.http.get<TaxDeclaration>(`${this.apiUrl}/declarations/${id}`);
  }

  createDeclaration(declaration: TaxDeclarationCreate): Observable<TaxDeclaration> {
    return this.http.post<TaxDeclaration>(`${this.apiUrl}/declarations`, declaration);
  }

  updateDeclaration(id: number, declaration: Partial<TaxDeclarationCreate>): Observable<TaxDeclaration> {
    return this.http.put<TaxDeclaration>(`${this.apiUrl}/declarations/${id}`, declaration);
  }

  deleteDeclaration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/declarations/${id}`);
  }

  generateDSN(periodYear: number, periodMonth: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/dsn/generate`, { 
      params: { period_year: periodYear.toString(), period_month: periodMonth.toString() },
      responseType: 'blob'
    });
  }

  getSocialCharges(periodYear: number, periodMonth?: number): Observable<SocialCharge[]> {
    const params: any = { period_year: periodYear.toString() };
    if (periodMonth) params.period_month = periodMonth.toString();
    return this.http.get<SocialCharge[]>(`${this.apiUrl}/charges`, { params });
  }

  getUrssafDeclaration(periodYear: number, periodMonth: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/urssaf-declaration`, { 
      params: { period_year: periodYear.toString(), period_month: periodMonth.toString() }
    });
  }
}
