import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact, ContactCreate, ContactUpdate, ContactStats, ContactDetailResponse } from '../../models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:8000/api/contacts';

  constructor(private http: HttpClient) {}

  // CRUD Operations
  getContacts(params?: any): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl, { params });
  }

  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  getContactDetail(id: number): Observable<ContactDetailResponse> {
    return this.http.get<ContactDetailResponse>(`${this.apiUrl}/${id}`);
  }

  createContact(contact: ContactCreate): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }

  updateContact(id: number, contact: ContactUpdate): Observable<Contact> {
    return this.http.patch<Contact>(`${this.apiUrl}/${id}`, contact);
  }

  updateContactField(contactId: number, field: string, value: any): Observable<Contact> {
    return this.http.patch<Contact>(`${this.apiUrl}/${contactId}`, { [field]: value });
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Stats
  getStats(): Observable<ContactStats> {
    return this.http.get<ContactStats>(`${this.apiUrl}/stats/summary`);
  }

  // Nested Operations
  addInteractionToContact(contactId: number, interaction: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${contactId}/interactions`, interaction);
  }

  addDocumentToContact(contactId: number, document: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${contactId}/documents`, document);
  }
}
