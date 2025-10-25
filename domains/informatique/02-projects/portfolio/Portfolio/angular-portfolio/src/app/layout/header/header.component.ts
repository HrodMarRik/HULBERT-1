import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ToggleButtonComponent],
  template: `
    <header class="header" *ngIf="!isAdminRoute()">
      <div class="header-content">
        <div class="logo">
          <h1>{{ title }}</h1>
          <p class="subtitle">{{ subtitle }}</p>
        </div>
        <app-toggle-button></app-toggle-button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999;
      padding: 20px 0;
      transition: all 0.3s ease;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      transition: all 0.3s ease;
    }

    .subtitle {
      margin: 5px 0 0 0;
      font-size: 1rem;
      opacity: 0.8;
      transition: all 0.3s ease;
    }

    :host-context(.dev-theme) .header {
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.95), rgba(44, 62, 80, 0.95));
      backdrop-filter: blur(10px);
    }

    :host-context(.dev-theme) .logo h1 {
      color: white;
    }

    :host-context(.dev-theme) .subtitle {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.gaming-theme) .header {
      background: linear-gradient(135deg, rgba(255, 70, 85, 0.95), rgba(15, 25, 35, 0.95));
      backdrop-filter: blur(10px);
    }

    :host-context(.gaming-theme) .logo h1 {
      color: white;
    }

    :host-context(.gaming-theme) .subtitle {
      color: rgba(255, 255, 255, 0.9);
    }

    @media (max-width: 768px) {
      .header {
        padding: 15px 0;
      }
      
      .header-content {
        padding: 0 15px;
      }
      
      .logo h1 {
        font-size: 1.5rem;
      }
      
      .subtitle {
        font-size: 0.9rem;
      }
    }
  `]
})
export class HeaderComponent {
  title = 'Portfolio';
  subtitle = 'Developer & Valorant Player';
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigateByUrl('/__admin-portal/login');
  }

  isAdminRoute(): boolean {
    const url = this.router.url || '';
    return url.startsWith('/__admin-portal') || url.startsWith('/admin-portal') || url.startsWith('/domains') || url.startsWith('/agents') || url.startsWith('/admin');
  }
}