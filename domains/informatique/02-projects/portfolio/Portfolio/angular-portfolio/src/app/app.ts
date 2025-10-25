import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { ThemeService, Theme } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent
  ],
  template: `
    <div class="app-container" [class.loaded]="isLoaded">
      <app-header></app-header>
      <main class="main-content" [class.with-header]="!isAdminRoute()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      transition: all 0.5s ease-in-out;
    }

    /* Masquer le contenu pendant le chargement initial pour éviter le flash */
    .app-container:not(.loaded) {
      opacity: 0;
      background: #1a1a1a; /* Fond sombre pendant le chargement */
    }

    .app-container.loaded {
      opacity: 1;
      transition: opacity 0.2s ease-in-out;
    }

    .main-content {
      /* Account for fixed header - only when header is visible */
    }

    .main-content.with-header {
      padding-top: 100px;
    }

    .portfolio-section {
      transition: all 0.5s ease-in-out;
    }

    .dev-portfolio {
      background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
    }

    .gaming-portfolio {
      background: linear-gradient(135deg, #0f1923, #1a252f);
    }

    /* Smooth transitions between themes */
    .dev-portfolio,
    .gaming-portfolio {
      animation: fadeInUp 0.5s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .main-content.with-header {
        padding-top: 80px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  currentTheme: Theme = 'dev';
  isLoaded = false;

  constructor(private themeService: ThemeService, private router: Router) {
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit() {
    // Marquer comme chargé après l'initialisation du composant
    setTimeout(() => {
      this.isLoaded = true;
    }, 50);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+0 to go to admin login page
    if (event.ctrlKey && event.key === '0') {
      event.preventDefault();
      this.router.navigate(['/admin-portal/login']);
    }
  }

  isAdminRoute(): boolean {
    const url = this.router.url || '';
    return url.startsWith('/admin');
  }
}