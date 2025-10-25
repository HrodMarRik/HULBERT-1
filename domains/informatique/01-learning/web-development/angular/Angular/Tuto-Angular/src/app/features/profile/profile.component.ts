import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="profile-container">
      <h1>Mon Profil</h1>
      <p>Gérez vos informations personnelles ici.</p>
      <div class="profile-info">
        <p><strong>Nom :</strong> Utilisateur</p>
        <p><strong>Email :</strong> user&#64;example.com</p>
        <p><strong>Rôle :</strong> Utilisateur</p>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    h1 {
      color: #1976d2;
    }
    
    .profile-info {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    p {
      margin: 0.5rem 0;
    }
  `]
})
export class ProfileComponent {}
