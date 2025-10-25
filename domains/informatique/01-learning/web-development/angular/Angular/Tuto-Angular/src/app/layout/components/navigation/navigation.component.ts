import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <a routerLink="/" class="brand-link">Angular Tutorial</a>
      </div>
      
      <ul class="nav-menu">
        <li class="nav-item">
          <a routerLink="/home" 
             routerLinkActive="active" 
             [routerLinkActiveOptions]="{exact: true}"
             class="nav-link">
            Accueil
          </a>
        </li>
        
        <li class="nav-item">
          <a routerLink="/products" 
             routerLinkActive="active"
             class="nav-link">
            Produits
          </a>
        </li>
        
        <li class="nav-item">
          <a routerLink="/users" 
             routerLinkActive="active"
             class="nav-link">
            Utilisateurs
          </a>
        </li>
        
        <li class="nav-item">
          <a routerLink="/orders" 
             routerLinkActive="active"
             class="nav-link">
            Commandes
          </a>
        </li>
      </ul>
      
      <div class="nav-actions">
        <a routerLink="/auth/login" class="btn btn-outline">Connexion</a>
        <a routerLink="/auth/register" class="btn btn-primary">S'inscrire</a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .nav-menu {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .nav-item {
      margin: 0 1rem;
    }
    
    .nav-link {
      text-decoration: none;
      color: #333;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover {
      background-color: #f8f9fa;
    }
    
    .nav-link.active {
      background-color: #007bff;
      color: white;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      margin-left: 0.5rem;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-outline {
      border: 1px solid #007bff;
      color: #007bff;
    }
  `]
})
export class NavigationComponent {}
