import { Component } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    <div class="user-detail-container">
      <h1>Détails de l'Utilisateur</h1>
      <div class="user-info">
        <h2>{{ user.name }}</h2>
        <p><strong>Email :</strong> {{ user.email }}</p>
        <p><strong>Rôle :</strong> {{ user.role }}</p>
        <p><strong>Date de création :</strong> {{ user.createdAt }}</p>
        <p><strong>Statut :</strong> {{ user.isActive ? 'Actif' : 'Inactif' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .user-detail-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .user-info {
      background: #f5f5f5;
      padding: 2rem;
      border-radius: 8px;
    }
    
    p {
      margin: 0.5rem 0;
    }
  `]
})
export class UserDetailComponent {
  user = {
    id: 1,
    name: 'Jean Dupont',
    email: 'jean@example.com',
    role: 'Admin',
    createdAt: '2024-01-15',
    isActive: true
  };
}
