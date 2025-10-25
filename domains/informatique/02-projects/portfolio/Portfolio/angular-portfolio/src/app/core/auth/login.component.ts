import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container" style="max-width:420px;margin:80px auto;">
    <h2>Admin Login</h2>

    <form (ngSubmit)="onLogin()">
      <label>Username</label>
      <input class="form-input" name="username" [(ngModel)]="username" [ngModelOptions]="{standalone: true}" />
      <label class="mt-2">Password</label>
      <input class="form-input" type="password" name="password" [(ngModel)]="password" [ngModelOptions]="{standalone: true}" />
      <button type="submit" class="btn btn-primary mt-3" [disabled]="loading">Login</button>
    </form>

    @if (error) {
      <div class="mt-2" style="color:#ff4655;">{{error}}</div>
    }
  </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin() {
    this.loading = true; 
    this.error = '';
    
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        // With 2FA disabled, login should directly return accessToken
        if (res && res.accessToken) {
          localStorage.setItem('accessToken', res.accessToken);
          this.loading = false;
          this.router.navigateByUrl('/admin');
          return;
        }
        this.error = 'Login failed - no access token received';
        this.loading = false;
      },
      error: (e) => { 
        this.error = 'Login failed: ' + (e.error?.detail || 'Invalid credentials'); 
        this.loading = false; 
      }
    });
  }
}
