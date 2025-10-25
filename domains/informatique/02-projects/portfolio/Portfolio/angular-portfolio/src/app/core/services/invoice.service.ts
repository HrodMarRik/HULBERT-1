import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface Invoice {
  id: number;
  invoice_number: string;
  document_type: string;
  client_company_id?: number;
  client_contact_id?: number;
  client_name: string;
  client_address?: string;
  client_email?: string;
  issue_date: Date;
  due_date?: Date;
  payment_date?: Date;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  currency: string;
  status: string;
  notes?: string;
  payment_terms?: string;
  reference_number?: string;
  auto_generated: boolean;
  template_id?: number;
  recurring_schedule?: string;
  project_id?: number;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number;
  invoice_lines: InvoiceLine[];
}

export interface InvoiceLine {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
}

export interface InvoiceCreate {
  invoice_number: string;
  document_type: string;
  client_company_id?: number;
  client_contact_id?: number;
  client_name: string;
  client_address?: string;
  client_email?: string;
  issue_date: Date;
  due_date?: Date;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  currency: string;
  notes?: string;
  payment_terms?: string;
  reference_number?: string;
  auto_generated: boolean;
  template_id?: number;
  recurring_schedule?: string;
  project_id?: number;
  invoice_lines: InvoiceLineCreate[];
}

export interface InvoiceLineCreate {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/api/invoicing`;

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`);
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(invoice: InvoiceCreate): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices`, invoice);
  }

  updateInvoice(id: number, invoice: Partial<InvoiceCreate>): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/invoices/${id}`, invoice);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/invoices/${id}`);
  }

  markAsPaid(id: number, paymentDate?: Date): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/invoices/${id}/mark-paid`, { payment_date: paymentDate });
  }

  generateFromProjects(projectIds: number[]): Observable<Invoice[]> {
    return this.http.post<Invoice[]>(`${this.apiUrl}/invoices/generate-from-projects`, { project_ids: projectIds });
  }

  sendPaymentReminder(id: number, reminderType: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/invoices/${id}/send-reminder`, { reminder_type: reminderType });
  }

  downloadPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoices/${id}/pdf`, { responseType: 'blob' });
  }

  getStatistics(startDate?: Date, endDate?: Date): Observable<any> {
    const params: any = {};
    if (startDate) params.start_date = startDate.toISOString();
    if (endDate) params.end_date = endDate.toISOString();
    return this.http.get<any>(`${this.apiUrl}/statistics`, { params });
  }
}
