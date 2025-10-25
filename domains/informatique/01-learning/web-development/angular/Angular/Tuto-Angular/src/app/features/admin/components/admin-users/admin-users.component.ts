import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  template: `
    <div class="admin-users-container">
      <h1>Gestion des Utilisateurs</h1>
      <p>Interface d'administration pour gérer les utilisateurs.</p>
    </div>
  `,
  styles: [`
    .admin-users-container {
      padding: 2rem;
    }
  `]
})
export class AdminUsersComponent {}
