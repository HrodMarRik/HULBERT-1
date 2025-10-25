import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonitoredEmail {
  id: number;
  email: string;
  type: string;
  contact_id?: number;
  check_frequency: string;
  active: boolean;
  user_id: number;
  created_at: string;
}

export interface EmailSecurityCheck {
  id: number;
  monitored_email_id: number;
  checked_at: string;
  is_compromised: boolean;
  breach_count: number;
  breach_details?: Array<{
    hash_suffix: string;
    count: number;
  }>;
}

export interface EmailSecurityAlert {
  id: number;
  check_id: number;
  sent_at: string;
  acknowledged: boolean;
}

export interface EmailSecurityStats {
  total_monitored: number;
  active_monitored: number;
  compromised_emails: number;
  total_checks: number;
  unacknowledged_alerts: number;
}

export interface CreateMonitoredEmailRequest {
  email: string;
  type?: string;
  contact_id?: number;
  check_frequency?: string;
}

export interface UpdateMonitoredEmailRequest {
  type?: string;
  contact_id?: number;
  check_frequency?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmailSecurityService {
  private apiUrl = `${environment.apiUrl}/email-security`;

  constructor(private http: HttpClient) {}

  // --- Monitored Emails ---
  createMonitoredEmail(email: CreateMonitoredEmailRequest): Observable<MonitoredEmail> {
    return this.http.post<MonitoredEmail>(`${this.apiUrl}/emails`, email);
  }

  getMonitoredEmails(activeOnly: boolean = false): Observable<MonitoredEmail[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('active_only', 'true');
    }
    return this.http.get<MonitoredEmail[]>(`${this.apiUrl}/emails`, { params });
  }

  getMonitoredEmail(emailId: number): Observable<MonitoredEmail> {
    return this.http.get<MonitoredEmail>(`${this.apiUrl}/emails/${emailId}`);
  }

  updateMonitoredEmail(emailId: number, email: UpdateMonitoredEmailRequest): Observable<MonitoredEmail> {
    return this.http.patch<MonitoredEmail>(`${this.apiUrl}/emails/${emailId}`, email);
  }

  deleteMonitoredEmail(emailId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/emails/${emailId}`);
  }

  checkEmailSecurity(emailId: number): Observable<EmailSecurityCheck> {
    return this.http.post<EmailSecurityCheck>(`${this.apiUrl}/emails/${emailId}/check`, {});
  }

  // --- Security Checks ---
  getSecurityChecks(emailId?: number, limit: number = 50): Observable<EmailSecurityCheck[]> {
    let params = new HttpParams();
    if (emailId) {
      params = params.set('email_id', emailId.toString());
    }
    params = params.set('limit', limit.toString());
    return this.http.get<EmailSecurityCheck[]>(`${this.apiUrl}/checks`, { params });
  }

  getLatestCheck(emailId: number): Observable<EmailSecurityCheck> {
    return this.http.get<EmailSecurityCheck>(`${this.apiUrl}/checks/latest/${emailId}`);
  }

  // --- Alerts ---
  getAlerts(acknowledged?: boolean): Observable<EmailSecurityAlert[]> {
    let params = new HttpParams();
    if (acknowledged !== undefined) {
      params = params.set('acknowledged', acknowledged.toString());
    }
    return this.http.get<EmailSecurityAlert[]>(`${this.apiUrl}/alerts`, { params });
  }

  acknowledgeAlert(alertId: number): Observable<EmailSecurityAlert> {
    return this.http.post<EmailSecurityAlert>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {});
  }

  // --- Stats ---
  getStats(): Observable<EmailSecurityStats> {
    return this.http.get<EmailSecurityStats>(`${this.apiUrl}/stats`);
  }
}
