import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home-container">
      <h1>Bienvenue dans le Tutoriel Angular N-Tier</h1>
      <p>Ceci est la page d'accueil de votre application Angular.</p>
      <div class="features">
        <h2>Fonctionnalités disponibles :</h2>
        <ul>
          <li>Authentification (Login/Register)</li>
          <li>Gestion des utilisateurs</li>
          <li>Gestion des produits</li>
          <li>Gestion des commandes</li>
          <li>Interface d'administration</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    h1 {
      color: #1976d2;
      text-align: center;
    }
    
    .features {
      margin-top: 2rem;
    }
    
    ul {
      list-style-type: disc;
      padding-left: 2rem;
    }
    
    li {
      margin: 0.5rem 0;
    }
  `]
})
export class HomeComponent {}
