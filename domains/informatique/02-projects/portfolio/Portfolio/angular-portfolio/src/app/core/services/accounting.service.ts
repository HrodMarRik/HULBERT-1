import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface AccountingEntry {
  id: number;
  entry_date: Date;
  description: string;
  reference: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number;
}

export interface AccountingAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AccountingEntryCreate {
  entry_date: Date;
  description: string;
  reference: string;
  total_debit: number;
  total_credit: number;
}

export interface AccountingAccountCreate {
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id?: number;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = `${environment.apiUrl}/api/accounting`;

  constructor(private http: HttpClient) {}

  getAccountingEntries(): Observable<AccountingEntry[]> {
    return this.http.get<AccountingEntry[]>(`${this.apiUrl}/entries`);
  }

  getAccountingEntry(id: number): Observable<AccountingEntry> {
    return this.http.get<AccountingEntry>(`${this.apiUrl}/entries/${id}`);
  }

  createAccountingEntry(entry: AccountingEntryCreate): Observable<AccountingEntry> {
    return this.http.post<AccountingEntry>(`${this.apiUrl}/entries`, entry);
  }

  updateAccountingEntry(id: number, entry: Partial<AccountingEntryCreate>): Observable<AccountingEntry> {
    return this.http.put<AccountingEntry>(`${this.apiUrl}/entries/${id}`, entry);
  }

  deleteAccountingEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/entries/${id}`);
  }

  getAccountingAccounts(): Observable<AccountingAccount[]> {
    return this.http.get<AccountingAccount[]>(`${this.apiUrl}/accounts`);
  }

  getAccountingAccount(id: number): Observable<AccountingAccount> {
    return this.http.get<AccountingAccount>(`${this.apiUrl}/accounts/${id}`);
  }

  createAccountingAccount(account: AccountingAccountCreate): Observable<AccountingAccount> {
    return this.http.post<AccountingAccount>(`${this.apiUrl}/accounts`, account);
  }

  updateAccountingAccount(id: number, account: Partial<AccountingAccountCreate>): Observable<AccountingAccount> {
    return this.http.put<AccountingAccount>(`${this.apiUrl}/accounts/${id}`, account);
  }

  deleteAccountingAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/accounts/${id}`);
  }

  generateBalanceSheet(asOfDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/balance-sheet`, { 
      params: { as_of_date: asOfDate.toISOString() }
    });
  }

  generateIncomeStatement(startDate: Date, endDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/income-statement`, { 
      params: { 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });
  }

  generateCashFlow(startDate: Date, endDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/cash-flow`, { 
      params: { 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });
  }

  generateProjectAnalysis(startDate: Date, endDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/project-analysis`, { 
      params: { 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });
  }

  generateClientAnalysis(startDate: Date, endDate: Date): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/client-analysis`, { 
      params: { 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    });
  }

  // Report persistence methods
  saveReport(reportData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports/save`, reportData);
  }

  getSavedReports(reportType?: string): Observable<any[]> {
    const params: any = {};
    if (reportType) {
      params.report_type = reportType;
    }
    return this.http.get<any[]>(`${this.apiUrl}/reports/saved`, { params });
  }

  getSavedReport(reportId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/saved/${reportId}`);
  }

  deleteSavedReport(reportId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/reports/saved/${reportId}`);
  }
}
