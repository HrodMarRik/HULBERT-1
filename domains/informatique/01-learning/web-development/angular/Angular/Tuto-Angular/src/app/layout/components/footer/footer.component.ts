import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Angular Tutorial</h4>
          <p>Apprenez Angular avec une architecture n-tier complète</p>
        </div>
        
        <div class="footer-section">
          <h4>Liens utiles</h4>
          <ul>
            <li><a href="/home">Accueil</a></li>
            <li><a href="/products">Produits</a></li>
            <li><a href="/about">À propos</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Ressources</h4>
          <ul>
            <li><a href="https://angular.io" target="_blank">Documentation Angular</a></li>
            <li><a href="https://fastapi.tiangolo.com" target="_blank">Documentation FastAPI</a></li>
            <li><a href="https://www.postgresql.org" target="_blank">Documentation PostgreSQL</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Contact</h4>
          <p>Email: contact&#64;angular-tutorial.com</p>
          <p>Téléphone: +33 1 23 45 67 89</p>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2024 Angular Tutorial. Tous droits réservés.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #343a40;
      color: white;
      padding: 2rem 0 1rem;
      margin-top: auto;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }
    
    .footer-section h4 {
      margin-bottom: 1rem;
      color: #fff;
    }
    
    .footer-section ul {
      list-style: none;
      padding: 0;
    }
    
    .footer-section ul li {
      margin-bottom: 0.5rem;
    }
    
    .footer-section a {
      color: #adb5bd;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .footer-section a:hover {
      color: #fff;
    }
    
    .footer-bottom {
      border-top: 1px solid #495057;
      margin-top: 2rem;
      padding-top: 1rem;
      text-align: center;
      color: #adb5bd;
    }
  `]
})
export class FooterComponent {}
