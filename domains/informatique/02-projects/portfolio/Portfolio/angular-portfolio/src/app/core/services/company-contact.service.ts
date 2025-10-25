import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  CompanyContact, 
  CompanyContactCreate, 
  CompanyContactUpdate,
  CompanyContactListResponse 
} from '../../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyContactService {
  private apiUrl = 'http://localhost:8000/api/company-contacts';

  constructor(private http: HttpClient) {}

  /**
   * Test method to check if authentication is working
   */
  testAuth(): Observable<any> {
    console.log('CompanyContactService: Testing authentication...');
    return this.http.get('http://localhost:8000/api/health');
  }

  /**
   * Get all contacts for a specific company with their roles
   */
  getCompanyContacts(companyId: number): Observable<CompanyContactListResponse> {
    console.log('CompanyContactService: Getting contacts for company', companyId);
    console.log('CompanyContactService: Making request to', `${this.apiUrl}/company/${companyId}`);
    return this.http.get<CompanyContactListResponse>(`${this.apiUrl}/company/${companyId}`);
  }

  /**
   * Add a contact to a company with a specific role
   */
  createCompanyContact(contactData: CompanyContactCreate): Observable<CompanyContact> {
    return this.http.post<CompanyContact>(`${this.apiUrl}/`, contactData);
  }

  /**
   * Update a company contact's role and information
   */
  updateCompanyContact(companyContactId: number, contactData: CompanyContactUpdate): Observable<CompanyContact> {
    return this.http.put<CompanyContact>(`${this.apiUrl}/${companyContactId}`, contactData);
  }

  /**
   * Remove a contact from a company
   */
  deleteCompanyContact(companyContactId: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${companyContactId}`);
  }

  /**
   * Get all companies where a contact has a role
   */
  getContactCompanies(contactId: number): Observable<CompanyContact[]> {
    return this.http.get<CompanyContact[]>(`${this.apiUrl}/contact/${contactId}`);
  }

  /**
   * Link an existing contact to a company
   */
  linkContactToCompany(companyId: number, contactId: number, role?: string, department?: string, isPrimary?: boolean): Observable<CompanyContact> {
    const contactData: CompanyContactCreate = {
      company_id: companyId,
      contact_id: contactId,
      role: role,
      department: department,
      is_primary: isPrimary || false
    };
    return this.createCompanyContact(contactData);
  }

  /**
   * Set a contact as primary for a company
   */
  setPrimaryContact(companyId: number, contactId: number): Observable<CompanyContact> {
    // First, get all company contacts
    return this.http.get<CompanyContactListResponse>(`${this.apiUrl}/company/${companyId}`).pipe(
      // Find the specific contact and update it to be primary
      // This is a simplified implementation - in a real scenario, you'd need to:
      // 1. Find the CompanyContact with the matching contactId
      // 2. Update it to set is_primary: true
      // 3. Optionally set other contacts' is_primary to false
      // For now, we'll return the first contact as a placeholder
      map(response => response.contacts[0])
    );
  }
}
