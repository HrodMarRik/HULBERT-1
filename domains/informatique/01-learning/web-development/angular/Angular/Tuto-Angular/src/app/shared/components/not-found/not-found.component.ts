import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div class="not-found-container">
      <h1>404 - Page Non Trouvée</h1>
      <p>Désolé, la page que vous recherchez n'existe pas.</p>
      <a routerLink="/" class="home-link">Retour à l'accueil</a>
    </div>
  `,
  styles: [`
    .not-found-container {
      padding: 2rem;
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }
    
    h1 {
      color: #d32f2f;
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    
    .home-link {
      display: inline-block;
      padding: 1rem 2rem;
      background-color: #1976d2;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      transition: background-color 0.3s;
    }
    
    .home-link:hover {
      background-color: #1565c0;
    }
  `],
  imports: [RouterLink]
})
export class NotFoundComponent {}
