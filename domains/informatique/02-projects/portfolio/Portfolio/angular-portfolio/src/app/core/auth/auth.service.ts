import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';

interface TempTokenResponse { tempToken?: string; accessToken?: string }
interface TokenResponse { accessToken: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken$ = new BehaviorSubject<string | null>(null);
  private refreshToken: string | null = null;
  private apiBase = (window as any)["API_BASE_URL"] || 'http://localhost:8000';

  constructor(private http: HttpClient) {
    const at = localStorage.getItem('accessToken');
    const rt = localStorage.getItem('refreshToken');
    if (at) this.accessToken$.next(at);
    if (rt) this.refreshToken = rt;
  }

  get accessToken() {
    return this.accessToken$.value;
  }

  login(username: string, password: string) {
    return this.http.post<TempTokenResponse>(`${this.apiBase}/api/auth/login`, { username, password }, { withCredentials: true }).pipe(
      map((res) => {
        if ((res as any).accessToken) {
          this.setAccess((res as any).accessToken!);
          console.log('Login successful, token stored:', (res as any).accessToken!.substring(0, 20) + '...');
        }
        return res;
      })
    );
  }

  verifyTotp(tempToken: string, code: string) {
    return this.http.post<TokenResponse>(`${this.apiBase}/api/auth/totp/verify`, { tempToken, code });
  }

  private setAccess(access: string) {
    this.accessToken$.next(access);
    localStorage.setItem('accessToken', access);
  }

  clearTokens() {
    this.accessToken$.next(null);
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  logout() {
    this.http.post(`${this.apiBase}/api/auth/logout`, {}, { withCredentials: true }).subscribe({ complete: () => {} });
    this.clearTokens();
  }

  refresh() {
    return this.http.post<TokenResponse>(`${this.apiBase}/api/auth/refresh`, {}, { withCredentials: true }).pipe(
      map((r) => {
        this.setAccess(r.accessToken);
        return r.accessToken;
      })
    );
  }
}
