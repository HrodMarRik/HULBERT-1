import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./components/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./components/admin-products/admin-products.component').then(m => m.AdminProductsComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./components/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
  }
];
