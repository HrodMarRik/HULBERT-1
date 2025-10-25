import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="portfolio-layout">
      <!-- Header -->
      <header class="portfolio-header">
        <div class="container">
          <div class="header-content">
            <div class="logo">
              <a routerLink="/portfolio" class="logo-link">
                <span class="logo-icon">👨‍💻</span>
                <span class="logo-text">Votre Dev</span>
              </a>
            </div>
            <nav class="main-nav">
              <a routerLink="/portfolio" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
                Accueil
              </a>
              <a routerLink="/portfolio/about" routerLinkActive="active" class="nav-link">
                À propos
              </a>
              <a routerLink="/portfolio/projects" routerLinkActive="active" class="nav-link">
                Projets
              </a>
              <a routerLink="/portfolio/blog" routerLinkActive="active" class="nav-link">
                Blog
              </a>
              <a routerLink="/portfolio/contact" routerLinkActive="active" class="nav-link">
                Contact
              </a>
            </nav>
            <div class="header-actions">
              <a routerLink="/admin" class="btn btn-outline">
                <span class="btn-icon">⚙️</span>
                Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="portfolio-main">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="portfolio-footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <div class="footer-logo">
                <span class="logo-icon">👨‍💻</span>
                <span class="logo-text">Votre Dev</span>
              </div>
              <p class="footer-description">
                Développeur full-stack passionné, créateur d'expériences digitales innovantes.
              </p>
              <div class="social-links">
                <a href="#" class="social-link">
                  <span class="social-icon">💼</span>
                  LinkedIn
                </a>
                <a href="#" class="social-link">
                  <span class="social-icon">📁</span>
                  GitHub
                </a>
                <a href="#" class="social-link">
                  <span class="social-icon">🐦</span>
                  Twitter
                </a>
              </div>
            </div>
            <div class="footer-section">
              <h3 class="footer-title">Navigation</h3>
              <ul class="footer-links">
                <li><a routerLink="/portfolio" class="footer-link">Accueil</a></li>
                <li><a routerLink="/portfolio/about" class="footer-link">À propos</a></li>
                <li><a routerLink="/portfolio/projects" class="footer-link">Projets</a></li>
                <li><a routerLink="/portfolio/blog" class="footer-link">Blog</a></li>
                <li><a routerLink="/portfolio/contact" class="footer-link">Contact</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3 class="footer-title">Services</h3>
              <ul class="footer-links">
                <li><a href="#" class="footer-link">Développement Web</a></li>
                <li><a href="#" class="footer-link">Applications Mobile</a></li>
                <li><a href="#" class="footer-link">Consulting</a></li>
                <li><a href="#" class="footer-link">Formation</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3 class="footer-title">Contact</h3>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-icon">📧</span>
                  <span class="contact-text">contact@votredev.com</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">📍</span>
                  <span class="contact-text">France</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">⏰</span>
                  <span class="contact-text">Lun-Ven, 9h-18h</span>
                </div>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <div class="footer-copyright">
              <p>&copy; 2024 Votre Dev. Tous droits réservés.</p>
            </div>
            <div class="footer-legal">
              <a href="#" class="legal-link">Mentions légales</a>
              <a href="#" class="legal-link">Politique de confidentialité</a>
              <a href="#" class="legal-link">CGV</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .portfolio-layout {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    .portfolio-header {
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
    }

    .logo-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #f1f5f9;
      font-weight: 700;
      font-size: 1.3rem;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .main-nav {
      display: flex;
      gap: 32px;
    }

    .nav-link {
      color: #94a3b8;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
      position: relative;
    }

    .nav-link:hover,
    .nav-link.active {
      color: #60a5fa;
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -16px;
      left: 0;
      right: 0;
      height: 2px;
      background: #60a5fa;
    }

    .header-actions {
      display: flex;
      gap: 16px;
    }

    /* Main Content */
    .portfolio-main {
      min-height: calc(100vh - 200px);
    }

    /* Footer */
    .portfolio-footer {
      background: #0f172a;
      border-top: 1px solid #334155;
      padding: 60px 0 20px;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .footer-section h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f1f5f9;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .footer-description {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .social-links {
      display: flex;
      gap: 16px;
    }

    .social-link {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .social-link:hover {
      color: #60a5fa;
    }

    .social-icon {
      font-size: 1.2em;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 12px;
    }

    .footer-link {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: #60a5fa;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .contact-icon {
      font-size: 1.1em;
    }

    .contact-text {
      color: #94a3b8;
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }

    .footer-copyright p {
      color: #94a3b8;
      margin: 0;
    }

    .footer-legal {
      display: flex;
      gap: 24px;
    }

    .legal-link {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s ease;
    }

    .legal-link:hover {
      color: #60a5fa;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }

    .btn-outline {
      background: transparent;
      color: #60a5fa;
      border: 1px solid #60a5fa;
    }

    .btn-outline:hover {
      background: #60a5fa;
      color: white;
    }

    .btn-icon {
      font-size: 1.1em;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 20px;
      }

      .main-nav {
        gap: 20px;
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: 30px;
      }

      .footer-bottom {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }

      .footer-legal {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .main-nav {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .nav-link.active::after {
        display: none;
      }
    }
  `]
})
export class PortfolioComponent {
  // This component serves as the main layout for the portfolio
}
