import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management">
      <h2>Gestion des utilisateurs</h2>
      
      <!-- Formulaire d'ajout -->
      <div class="add-user-form">
        <h3>Ajouter un utilisateur</h3>
        <input [(ngModel)]="newUserName" placeholder="Nom" class="form-input">
        <input [(ngModel)]="newUserEmail" placeholder="Email" class="form-input">
        <button (click)="addUser()" [disabled]="!canAddUser()" class="btn btn-primary">
          Ajouter
        </button>
      </div>
      
      <!-- Filtres -->
      <div class="filters">
        <input [(ngModel)]="searchTerm" placeholder="Rechercher..." class="form-input">
        <select [(ngModel)]="statusFilter" class="form-select">
          <option value="">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>
      
      <!-- Liste des utilisateurs -->
      <div class="user-list">
        <div *ngFor="let user of filteredUsers(); trackBy: trackByUserId" 
             class="user-item" 
             [class.active]="user.isActive"
             [class.inactive]="!user.isActive">
          
          <div class="user-info">
            <h4>{{ user.name }}</h4>
            <p>{{ user.email }}</p>
            <span class="status" [ngClass]="user.isActive ? 'active' : 'inactive'">
              {{ user.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          
          <div class="user-actions">
            <button (click)="toggleUserStatus(user)" class="btn btn-sm">
              {{ user.isActive ? 'Désactiver' : 'Activer' }}
            </button>
            <button (click)="deleteUser(user.id)" class="btn btn-sm btn-danger">
              Supprimer
            </button>
          </div>
        </div>
      </div>
      
      <!-- Statistiques -->
      <div class="stats">
        <p>Total: {{ totalUsers() }}</p>
        <p>Actifs: {{ activeUsers() }}</p>
        <p>Inactifs: {{ inactiveUsers() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .user-management {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .add-user-form, .filters {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .form-input, .form-select {
      width: 100%;
      padding: 8px 12px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .user-item.active {
      border-left: 4px solid #28a745;
    }
    
    .user-item.inactive {
      border-left: 4px solid #dc3545;
      opacity: 0.7;
    }
    
    .user-info h4 {
      margin: 0 0 5px 0;
    }
    
    .user-info p {
      margin: 0 0 5px 0;
      color: #666;
    }
    
    .status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status.active {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .stats {
      background: #e9ecef;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
  `]
})
export class UserManagementComponent {
  // Signals pour les données
  users = signal<User[]>([
    { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
    { id: 2, name: 'Bob', email: 'bob@example.com', isActive: false },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', isActive: true }
  ]);
  
  // Signals pour le formulaire
  newUserName = signal('');
  newUserEmail = signal('');
  searchTerm = signal('');
  statusFilter = signal('');
  
  // Signals calculés
  filteredUsers = computed(() => {
    let filtered = this.users();
    
    // Filtrage par terme de recherche
    const search = this.searchTerm();
    if (search) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filtrage par statut
    const status = this.statusFilter();
    if (status === 'active') {
      filtered = filtered.filter(user => user.isActive);
    } else if (status === 'inactive') {
      filtered = filtered.filter(user => !user.isActive);
    }
    
    return filtered;
  });
  
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(user => user.isActive).length);
  inactiveUsers = computed(() => this.users().filter(user => !user.isActive).length);
  
  canAddUser = computed(() => {
    const name = this.newUserName();
    const email = this.newUserEmail();
    return name.trim().length > 0 && email.trim().length > 0;
  });
  
  // Méthodes
  addUser() {
    if (!this.canAddUser()) return;
    
    const newUser: User = {
      id: Math.max(...this.users().map(u => u.id)) + 1,
      name: this.newUserName(),
      email: this.newUserEmail(),
      isActive: true
    };
    
    this.users.update(users => [...users, newUser]);
    this.newUserName.set('');
    this.newUserEmail.set('');
  }
  
  toggleUserStatus(user: User) {
    this.users.update(users => 
      users.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      )
    );
  }
  
  deleteUser(userId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.users.update(users => users.filter(u => u.id !== userId));
    }
  }
  
  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
