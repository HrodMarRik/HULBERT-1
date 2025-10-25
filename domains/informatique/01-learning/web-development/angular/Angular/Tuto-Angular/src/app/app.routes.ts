import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  { 
    path: 'products', 
    loadChildren: () => import('./features/products/products.routes').then(m => m.productRoutes)
  },
  { 
    path: 'users', 
    loadChildren: () => import('./features/users/users.routes').then(m => m.userRoutes)
  },
  { 
    path: 'orders', 
    loadChildren: () => import('./features/orders/orders.routes').then(m => m.orderRoutes)
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  { 
    path: '**', 
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];