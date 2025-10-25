import { Component } from '@angular/core';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <div class="user-list-container">
      <h1>Liste des Utilisateurs</h1>
      <div class="user-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .user-list-container {
      padding: 2rem;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2rem;
    }
    
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
  `]
})
export class UserListComponent {
  users = [
    { id: 1, name: 'Jean Dupont', email: 'jean@example.com', role: 'Admin' },
    { id: 2, name: 'Marie Martin', email: 'marie@example.com', role: 'User' },
    { id: 3, name: 'Pierre Durand', email: 'pierre@example.com', role: 'User' }
  ];
}
