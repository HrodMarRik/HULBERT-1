import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: `
    <div class="admin-dashboard-container">
      <h1>Tableau de Bord Administrateur</h1>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>{{ stats.users }}</h3>
          <p>Utilisateurs</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.products }}</h3>
          <p>Produits</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.orders }}</h3>
          <p>Commandes</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.revenue }}€</h3>
          <p>Chiffre d'affaires</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard-container {
      padding: 2rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .stat-card {
      background: #1976d2;
      color: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-card h3 {
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
    }
  `]
})
export class AdminDashboardComponent {
  stats = {
    users: 150,
    products: 25,
    orders: 89,
    revenue: 12500
  };
}
