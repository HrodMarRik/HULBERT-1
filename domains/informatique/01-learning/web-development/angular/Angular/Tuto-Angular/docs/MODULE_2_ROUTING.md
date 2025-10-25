# Module 2: Routing & Navigation Angular

## Vue d'ensemble

Le routing Angular permet de créer des applications Single Page Application (SPA) avec navigation entre différentes vues. Ce module couvre la configuration des routes, la navigation programmatique, les paramètres de route, et les guards de sécurité.

## 1. Configuration des routes

### Configuration de base

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
  { path: 'products', loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent) },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
  { path: '**', loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
```

### Configuration avec lazy loading

```typescript
// app.routes.ts
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
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'products', 
    loadChildren: () => import('./features/products/products.routes').then(m => m.productRoutes)
  }
];
```

## 2. Navigation dans les templates

### RouterLink et RouterLinkActive

```typescript
// navigation.component.ts
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
        <a routerLink="/" class="brand-link">Mon App</a>
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
          <a routerLink="/about" 
             routerLinkActive="active"
             class="nav-link">
            À propos
          </a>
        </li>
        
        <li class="nav-item">
          <a routerLink="/contact" 
             routerLinkActive="active"
             class="nav-link">
            Contact
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
```

## 3. Navigation programmatique

### Router service

```typescript
// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-detail" *ngIf="product()">
      <div class="product-header">
        <button (click)="goBack()" class="btn btn-secondary">
          ← Retour
        </button>
        <h1>{{ product()!.name }}</h1>
      </div>
      
      <div class="product-content">
        <div class="product-image">
          <img [src]="product()!.image || '/assets/no-image.png'" 
               [alt]="product()!.name">
        </div>
        
        <div class="product-info">
          <p class="price">{{ product()!.price | currency:'EUR':'symbol':'1.2-2' }}</p>
          <p class="description">{{ product()!.description }}</p>
          <p class="category">Catégorie: {{ product()!.category }}</p>
          <p class="stock">Stock: {{ product()!.stock_quantity }}</p>
          
          <div class="product-actions">
            <button (click)="addToCart()" 
                    [disabled]="product()!.stock_quantity === 0"
                    class="btn btn-primary">
              Ajouter au panier
            </button>
            
            <button (click)="editProduct()" 
                    *ngIf="isAdmin()"
                    class="btn btn-outline">
              Modifier
            </button>
            
            <button (click)="shareProduct()" 
                    class="btn btn-outline">
              Partager
            </button>
          </div>
        </div>
      </div>
      
      <div class="related-products">
        <h3>Produits similaires</h3>
        <div class="products-grid">
          <div *ngFor="let relatedProduct of relatedProducts()" 
               class="product-card"
               (click)="navigateToProduct(relatedProduct.id)">
            <img [src]="relatedProduct.image || '/assets/no-image.png'" 
                 [alt]="relatedProduct.name">
            <h4>{{ relatedProduct.name }}</h4>
            <p>{{ relatedProduct.price | currency:'EUR':'symbol':'1.2-2' }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div *ngIf="!product()" class="loading">
      <p>Chargement du produit...</p>
    </div>
  `,
  styles: [`
    .product-detail {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .product-header {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .product-header h1 {
      margin-left: 1rem;
    }
    
    .product-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .product-image img {
      width: 100%;
      height: 400px;
      object-fit: cover;
      border-radius: 8px;
    }
    
    .product-info .price {
      font-size: 2rem;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 1rem;
    }
    
    .product-actions {
      margin-top: 2rem;
    }
    
    .product-actions .btn {
      margin-right: 1rem;
    }
    
    .related-products {
      border-top: 1px solid #dee2e6;
      padding-top: 2rem;
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .product-card {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .product-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    
    .product-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 4px;
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    // Récupérer l'ID du produit depuis les paramètres de route
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.loadProduct(productId);
    });
    
    // Récupérer les query parameters
    this.route.queryParams.subscribe(queryParams => {
      console.log('Query params:', queryParams);
    });
  }
  
  loadProduct(id: number) {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loadRelatedProducts(product.category);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.navigateToNotFound();
      }
    });
  }
  
  loadRelatedProducts(category: string) {
    this.productService.getProductsByCategory(category, 0, 4).subscribe({
      next: (products) => {
        // Exclure le produit actuel
        const filtered = products.filter(p => p.id !== this.product()?.id);
        this.relatedProducts.set(filtered);
      }
    });
  }
  
  // Navigation programmatique
  goBack() {
    // Retour à la page précédente
    this.router.navigate(['/products']);
  }
  
  navigateToProduct(productId: number) {
    // Navigation avec paramètres
    this.router.navigate(['/products', productId]);
  }
  
  navigateToNotFound() {
    // Navigation vers la page 404
    this.router.navigate(['/not-found']);
  }
  
  addToCart() {
    // Navigation avec état
    const navigationExtras: NavigationExtras = {
      state: { 
        product: this.product(),
        action: 'add-to-cart'
      }
    };
    this.router.navigate(['/cart'], navigationExtras);
  }
  
  editProduct() {
    // Navigation avec query parameters
    this.router.navigate(['/admin/products', this.product()!.id, 'edit'], {
      queryParams: { 
        returnUrl: this.router.url,
        mode: 'edit'
      }
    });
  }
  
  shareProduct() {
    // Navigation avec fragment
    this.router.navigate(['/products', this.product()!.id], {
      fragment: 'share'
    });
  }
  
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
```

## 4. Paramètres de route

### Route parameters

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'users/:userId/posts/:postId', component: UserPostComponent },
  { path: 'categories/:categoryId/products/:productId', component: CategoryProductComponent }
];

// component.ts
export class ProductDetailComponent {
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    // Récupérer un paramètre
    const productId = this.route.snapshot.paramMap.get('id');
    
    // Ou avec subscription
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const categoryId = params.get('categoryId');
    });
  }
}
```

### Query parameters

```typescript
// Navigation avec query parameters
this.router.navigate(['/products'], {
  queryParams: { 
    category: 'electronics',
    price: '100-500',
    sort: 'price'
  }
});

// Récupération des query parameters
export class ProductsComponent {
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      const priceRange = params['price'];
      const sortBy = params['sort'];
      
      this.loadProducts(category, priceRange, sortBy);
    });
  }
}
```

### Route data

```typescript
// app.routes.ts
export const routes: Routes = [
  { 
    path: 'admin', 
    component: AdminComponent,
    data: { 
      title: 'Administration',
      requiresAuth: true,
      roles: ['admin']
    }
  }
];

// component.ts
export class AdminComponent {
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    const routeData = this.route.snapshot.data;
    console.log('Title:', routeData['title']);
    console.log('Requires Auth:', routeData['requiresAuth']);
    console.log('Roles:', routeData['roles']);
  }
}
```

## 5. Guards de route

### AuthGuard

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    // Rediriger vers la page de connexion avec l'URL de retour
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}
```

### AdminGuard

```typescript
// admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

### CanDeactivateGuard

```typescript
// can-deactivate.guard.ts
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}

// Utilisation dans un composant
export class ProductFormComponent implements CanComponentDeactivate {
  hasUnsavedChanges = signal(false);
  
  canDeactivate(): boolean {
    if (this.hasUnsavedChanges()) {
      return confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?');
    }
    return true;
  }
}
```

## 6. Configuration complète des routes

### Structure des routes par feature

```typescript
// features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  }
];

// features/products/products.routes.ts
export const productRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  { 
    path: 'new', 
    loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: ':id', 
    loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  { 
    path: ':id/edit', 
    loadComponent: () => import('./components/product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [AuthGuard, AdminGuard],
    canDeactivate: [CanDeactivateGuard]
  }
];

// app.routes.ts
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
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: '**', 
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
```

## 7. Exemple complet : Application avec navigation

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { NavigationComponent } from './layout/components/navigation/navigation.component';
import { FooterComponent } from './layout/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, NavigationComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navigation></app-navigation>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .main-content {
      flex: 1;
      padding: 2rem 0;
    }
  `]
})
export class AppComponent {}
```

## Exercices pratiques

### Exercice 1: Navigation de base
Créez une application avec 4 pages (Accueil, À propos, Produits, Contact) et une navigation entre elles.

### Exercice 2: Paramètres de route
Créez une page de détail de produit qui récupère l'ID depuis l'URL.

### Exercice 3: Guards de sécurité
Implémentez un système d'authentification avec des routes protégées.

## Prochaines étapes

Maintenant que vous maîtrisez le routing Angular, nous passerons au Module 3 : Services & Dependency Injection pour apprendre à gérer la logique métier et la communication avec les APIs.
