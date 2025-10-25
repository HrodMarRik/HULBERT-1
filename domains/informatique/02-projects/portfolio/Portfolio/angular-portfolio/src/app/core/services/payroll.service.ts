import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: Date;
  social_security_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country: string;
  position: string;
  department?: string;
  employment_type: string;
  start_date: Date;
  end_date?: Date;
  probation_period_end?: Date;
  gross_salary_monthly: number;
  working_hours_per_week: number;
  working_hours_percentage: number;
  iban?: string;
  bic?: string;
  status: string;
  manager_id?: number;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number;
}

export interface PayrollEntry {
  id: number;
  employee_id: number;
  period_year: number;
  period_month: number;
  gross_salary: number;
  net_salary: number;
  social_charges: number;
  income_tax: number;
  other_deductions: number;
  status: string;
  generated_at: Date;
  generated_by_user_id: number;
  employee: Employee;
}

export interface EmployeeCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: Date;
  social_security_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country: string;
  position: string;
  department?: string;
  employment_type: string;
  start_date: Date;
  end_date?: Date;
  probation_period_end?: Date;
  gross_salary_monthly: number;
  working_hours_per_week: number;
  working_hours_percentage: number;
  iban?: string;
  bic?: string;
  manager_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/api/payroll`;

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees`);
  }

  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`);
  }

  createEmployee(employee: EmployeeCreate): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees`, employee);
  }

  updateEmployee(id: number, employee: Partial<EmployeeCreate>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/employees/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/employees/${id}`);
  }

  generatePayslips(periodYear: number, periodMonth: number, employeeIds?: number[]): Observable<PayrollEntry[]> {
    const body: any = { period_year: periodYear, period_month: periodMonth };
    if (employeeIds) body.employee_ids = employeeIds;
    return this.http.post<PayrollEntry[]>(`${this.apiUrl}/payslips/generate`, body);
  }

  getPayslips(employeeId?: number, periodYear?: number, periodMonth?: number): Observable<PayrollEntry[]> {
    const params: any = {};
    if (employeeId) params.employee_id = employeeId;
    if (periodYear) params.period_year = periodYear;
    if (periodMonth) params.period_month = periodMonth;
    return this.http.get<PayrollEntry[]>(`${this.apiUrl}/payslips`, { params });
  }

  downloadPayslipPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payslips/${id}/pdf`, { responseType: 'blob' });
  }

  calculateNetSalary(grossSalary: number): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/calculate-net-salary`, { gross_salary: grossSalary });
  }
}
