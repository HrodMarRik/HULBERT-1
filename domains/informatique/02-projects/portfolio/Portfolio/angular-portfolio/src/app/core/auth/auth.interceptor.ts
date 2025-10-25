import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.accessToken || localStorage.getItem('accessToken');
    console.log('Auth interceptor - token found:', token ? token.substring(0, 20) + '...' : 'none');
    
    const withAuth = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    console.log('Auth interceptor - request headers:', withAuth.headers.get('Authorization') ? 'Bearer token present' : 'no token');

    return next.handle(withAuth).pipe(
      catchError((err: any) => {
        console.log('Auth interceptor - error:', err.status, err.message);
        if (err instanceof HttpErrorResponse && err.status === 401) {
          // try refresh
          return this.auth.refresh().pipe(
            switchMap((newToken) => {
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(retried);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}
