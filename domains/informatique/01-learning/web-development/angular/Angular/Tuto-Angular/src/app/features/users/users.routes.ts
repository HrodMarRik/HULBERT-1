import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/user-form/user-form.component').then(m => m.UserFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  }
];
