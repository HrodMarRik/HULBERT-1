import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company, CompanyCreate, CompanyUpdate, CompanyStats, CompanyDetailResponse } from '../../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = 'http://localhost:8000/api/companies';

  constructor(private http: HttpClient) {}

  // CRUD Operations
  getCompanies(params?: any): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl, { params });
  }

  getCompany(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  getCompanyDetail(id: number): Observable<CompanyDetailResponse> {
    return this.http.get<CompanyDetailResponse>(`${this.apiUrl}/${id}`);
  }

  createCompany(company: CompanyCreate): Observable<Company> {
    return this.http.post<Company>(this.apiUrl, company);
  }

  updateCompany(id: number, company: CompanyUpdate): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${id}`, company);
  }

  updateCompanyField(companyId: number, field: string, value: any): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${companyId}`, { [field]: value });
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Stats
  getStats(): Observable<CompanyStats> {
    return this.http.get<CompanyStats>(`${this.apiUrl}/stats/summary`);
  }

  // Nested Operations
  addContactToCompany(companyId: number, contact: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${companyId}/contacts`, contact);
  }

  addProjectToCompany(companyId: number, project: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${companyId}/projects`, project);
  }

  addInteractionToCompany(companyId: number, interaction: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${companyId}/interactions`, interaction);
  }

  addDocumentToCompany(companyId: number, document: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${companyId}/documents`, document);
  }
}
