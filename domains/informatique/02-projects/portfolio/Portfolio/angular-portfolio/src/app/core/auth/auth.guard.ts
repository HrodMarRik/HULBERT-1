import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    const token = this.auth.accessToken || localStorage.getItem('accessToken');
    if (!token) {
      this.router.navigateByUrl('/__admin-portal/login');
      return false;
    }
    return true;
  }
}
