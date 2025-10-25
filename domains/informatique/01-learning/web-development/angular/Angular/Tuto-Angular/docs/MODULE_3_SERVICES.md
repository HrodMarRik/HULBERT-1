# Module 3: Services & Dependency Injection avec intégration API

## Vue d'ensemble

Les services Angular sont des classes qui encapsulent la logique métier et permettent le partage de données entre composants. Ce module couvre la création de services, l'injection de dépendances, l'intégration avec les APIs, et la gestion d'état avec RxJS.

## 1. Introduction aux Services

### Qu'est-ce qu'un service ?

Un service Angular est une classe avec le décorateur `@Injectable` qui peut être injectée dans d'autres classes. Les services sont utilisés pour :

- Partager des données entre composants
- Encapsuler la logique métier
- Communiquer avec des APIs externes
- Gérer l'état de l'application

### Création d'un service de base

```typescript
// core/services/data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Service singleton disponible dans toute l'application
})
export class DataService {
  private dataSubject = new BehaviorSubject<string[]>([]);
  public data$ = this.dataSubject.asObservable();

  constructor() {
    console.log('DataService créé');
  }

  // Méthode pour ajouter des données
  addData(item: string): void {
    const currentData = this.dataSubject.value;
    this.dataSubject.next([...currentData, item]);
  }

  // Méthode pour obtenir les données
  getData(): string[] {
    return this.dataSubject.value;
  }

  // Méthode pour effacer les données
  clearData(): void {
    this.dataSubject.next([]);
  }
}
```

### Utilisation dans un composant

```typescript
// components/data-display.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-data-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-container">
      <h3>Données partagées</h3>
      
      <div class="data-list">
        <div *ngFor="let item of data; let i = index" class="data-item">
          {{ i + 1 }}. {{ item }}
        </div>
      </div>
      
      <div class="data-actions">
        <button (click)="addRandomData()" class="btn btn-primary">
          Ajouter une donnée
        </button>
        <button (click)="clearData()" class="btn btn-danger">
          Effacer tout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .data-container {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 20px;
    }
    
    .data-list {
      margin: 20px 0;
      min-height: 100px;
      border: 1px solid #eee;
      padding: 10px;
      border-radius: 4px;
    }
    
    .data-item {
      padding: 5px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .data-item:last-child {
      border-bottom: none;
    }
    
    .btn {
      padding: 8px 16px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
  `]
})
export class DataDisplayComponent implements OnInit, OnDestroy {
  data: string[] = [];
  private subscription?: Subscription;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    // S'abonner aux changements de données
    this.subscription = this.dataService.data$.subscribe(data => {
      this.data = data;
    });
  }

  ngOnDestroy() {
    // Se désabonner pour éviter les fuites mémoire
    this.subscription?.unsubscribe();
  }

  addRandomData() {
    const randomItem = `Donnée ${Date.now()}`;
    this.dataService.addData(randomItem);
  }

  clearData() {
    this.dataService.clearData();
  }
}
```

## 2. Injection de dépendances

### Types d'injection

#### 1. Injection dans le constructeur (recommandé)

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  template: `...`
})
export class ExampleComponent {
  constructor(
    private userService: UserService,
    private productService: ProductService,
    private router: Router
  ) {}
}
```

#### 2. Injection avec inject() (Angular 14+)

```typescript
import { inject } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `...`
})
export class ExampleComponent {
  private userService = inject(UserService);
  private productService = inject(ProductService);
  private router = inject(Router);
}
```

### Niveaux de fourniture des services

```typescript
// 1. Singleton au niveau racine (recommandé pour la plupart des services)
@Injectable({
  providedIn: 'root'
})
export class GlobalService {}

// 2. Au niveau du composant
@Component({
  selector: 'app-example',
  providers: [LocalService] // Nouvelle instance pour chaque composant
})
export class ExampleComponent {}

// 3. Au niveau du module (avec NgModule)
@NgModule({
  providers: [ModuleService]
})
export class FeatureModule {}
```

## 3. Services avec HttpClient

### Configuration HttpClient

```typescript
// app.config.ts
import { ApplicationConfig, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

### Service API de base

```typescript
// core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_CONFIG } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET request
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    this.setLoading(true);
    return this.http.get<T>(`${API_CONFIG.BASE_URL}${endpoint}`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // POST request
  post<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.post<T>(`${API_CONFIG.BASE_URL}${endpoint}`, data)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // PUT request
  put<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.put<T>(`${API_CONFIG.BASE_URL}${endpoint}`, data)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // DELETE request
  delete<T>(endpoint: string): Observable<T> {
    this.setLoading(true);
    return this.http.delete<T>(`${API_CONFIG.BASE_URL}${endpoint}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // Gestionnaire d'erreurs
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Requête invalide';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
```

## 4. Service de gestion des produits

```typescript
// core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductCreate, ProductUpdate, ProductSearch } from '../models/product.model';
import { API_CONFIG } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private selectedProductSubject = new BehaviorSubject<Product | null>(null);
  public selectedProduct$ = this.selectedProductSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Obtenir tous les produits
  getProducts(skip: number = 0, limit: number = 100): Observable<Product[]> {
    const params = this.apiService.createParams({ skip, limit });
    
    return this.apiService.get<Product[]>(API_CONFIG.ENDPOINTS.PRODUCTS.BASE, params)
      .pipe(
        tap(products => {
          this.productsSubject.next(products);
        }),
        catchError(error => {
          console.error('Error fetching products:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir un produit par ID
  getProduct(id: number): Observable<Product> {
    return this.apiService.get<Product>(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`)
      .pipe(
        tap(product => {
          this.selectedProductSubject.next(product);
        }),
        catchError(error => {
          console.error(`Error fetching product ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Créer un nouveau produit
  createProduct(productData: ProductCreate): Observable<Product> {
    return this.apiService.post<Product>(API_CONFIG.ENDPOINTS.PRODUCTS.BASE, productData)
      .pipe(
        tap(newProduct => {
          const currentProducts = this.productsSubject.value;
          this.productsSubject.next([...currentProducts, newProduct]);
        }),
        catchError(error => {
          console.error('Error creating product:', error);
          return throwError(() => error);
        })
      );
  }

  // Mettre à jour un produit
  updateProduct(id: number, productData: ProductUpdate): Observable<Product> {
    return this.apiService.put<Product>(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`, productData)
      .pipe(
        tap(updatedProduct => {
          const currentProducts = this.productsSubject.value;
          const index = currentProducts.findIndex(p => p.id === id);
          if (index !== -1) {
            currentProducts[index] = updatedProduct;
            this.productsSubject.next([...currentProducts]);
          }
          this.selectedProductSubject.next(updatedProduct);
        }),
        catchError(error => {
          console.error(`Error updating product ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Supprimer un produit
  deleteProduct(id: number): Observable<any> {
    return this.apiService.delete(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${id}`)
      .pipe(
        tap(() => {
          const currentProducts = this.productsSubject.value;
          const filteredProducts = currentProducts.filter(p => p.id !== id);
          this.productsSubject.next(filteredProducts);
        }),
        catchError(error => {
          console.error(`Error deleting product ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Rechercher des produits
  searchProducts(searchParams: ProductSearch): Observable<Product[]> {
    const params = this.apiService.createParams(searchParams);
    
    return this.apiService.get<Product[]>(API_CONFIG.ENDPOINTS.PRODUCTS.SEARCH, params)
      .pipe(
        catchError(error => {
          console.error('Error searching products:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les produits par catégorie
  getProductsByCategory(category: string, skip: number = 0, limit: number = 100): Observable<Product[]> {
    const params = this.apiService.createParams({ skip, limit });
    
    return this.apiService.get<Product[]>(`${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/category/${category}`, params)
      .pipe(
        catchError(error => {
          console.error(`Error fetching products for category ${category}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les catégories
  getCategories(): Observable<string[]> {
    return this.apiService.get<string[]>(API_CONFIG.ENDPOINTS.PRODUCTS.CATEGORIES)
      .pipe(
        catchError(error => {
          console.error('Error fetching categories:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les produits en rupture de stock
  getLowStockProducts(threshold: number = 10): Observable<Product[]> {
    const params = this.apiService.createParams({ threshold });
    
    return this.apiService.get<Product[]>(API_CONFIG.ENDPOINTS.PRODUCTS.LOW_STOCK, params)
      .pipe(
        catchError(error => {
          console.error('Error fetching low stock products:', error);
          return throwError(() => error);
        })
      );
  }

  // Mettre à jour le stock
  updateStock(productId: number, quantityChange: number): Observable<Product> {
    return this.apiService.patch<Product>(
      `${API_CONFIG.ENDPOINTS.PRODUCTS.BASE}/${productId}/stock`,
      { quantity_change: quantityChange }
    ).pipe(
      tap(updatedProduct => {
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
          currentProducts[index] = updatedProduct;
          this.productsSubject.next([...currentProducts]);
        }
      }),
      catchError(error => {
        console.error(`Error updating stock for product ${productId}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Obtenir les produits actuels
  getCurrentProducts(): Product[] {
    return this.productsSubject.value;
  }

  // Obtenir le produit sélectionné
  getSelectedProduct(): Product | null {
    return this.selectedProductSubject.value;
  }

  // Effacer le cache des produits
  clearProductsCache(): void {
    this.productsSubject.next([]);
    this.selectedProductSubject.next(null);
  }
}
```

## 5. Interceptors HTTP

### Interceptor d'authentification

```typescript
// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};
```

### Interceptor de gestion d'erreurs

```typescript
// core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expiré ou invalide
        authService.logout();
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        // Accès interdit
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};
```

### Interceptor de loading

```typescript
// core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Ignorer les requêtes de loading
  if (req.url.includes('loading')) {
    return next(req);
  }

  loadingService.setLoading(true);

  return next(req).pipe(
    finalize(() => {
      loadingService.setLoading(false);
    })
  );
};
```

## 6. Service de gestion du loading

```typescript
// core/services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private loadingCount = 0;

  setLoading(loading: boolean): void {
    if (loading) {
      this.loadingCount++;
    } else {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
    }

    this.loadingSubject.next(this.loadingCount > 0);
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  resetLoading(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }
}
```

## 7. Exemple complet : Composant avec services

```typescript
// features/products/components/product-list/product-list.component.ts
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { Product, ProductSearch } from '../../../../core/models/product.model';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TruncatePipe],
  template: `
    <div class="product-list-container">
      <div class="product-header">
        <h2>Liste des produits</h2>
        
        <div class="product-actions">
          <button (click)="loadProducts()" 
                  [disabled]="isLoading()"
                  class="btn btn-primary">
            {{ isLoading() ? 'Chargement...' : 'Actualiser' }}
          </button>
          
          <a routerLink="/products/new" class="btn btn-success">
            Nouveau produit
          </a>
        </div>
      </div>

      <!-- Filtres de recherche -->
      <div class="search-filters">
        <div class="search-input">
          <input [(ngModel)]="searchQuery" 
                 placeholder="Rechercher un produit..."
                 (input)="onSearchChange()"
                 class="form-control">
        </div>
        
        <div class="category-filter">
          <select [(ngModel)]="selectedCategory" 
                  (change)="onCategoryChange()"
                  class="form-control">
            <option value="">Toutes les catégories</option>
            <option *ngFor="let category of categories()" [value]="category">
              {{ category }}
            </option>
          </select>
        </div>
        
        <div class="price-filter">
          <input [(ngModel)]="minPrice" 
                 type="number" 
                 placeholder="Prix min"
                 (input)="onPriceChange()"
                 class="form-control">
          <input [(ngModel)]="maxPrice" 
                 type="number" 
                 placeholder="Prix max"
                 (input)="onPriceChange()"
                 class="form-control">
        </div>
      </div>

      <!-- Liste des produits -->
      <div class="products-grid" *ngIf="!isLoading() && products().length > 0">
        <div *ngFor="let product of products(); trackBy: trackByProductId" 
             class="product-card">
          
          <div class="product-image">
            <img [src]="product.image || '/assets/no-image.png'" 
                 [alt]="product.name"
                 (error)="onImageError($event)">
          </div>
          
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.description | truncate:100 }}</p>
            <p class="product-category">{{ product.category }}</p>
            <p class="product-price">{{ product.price | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="product-stock" 
               [class.low-stock]="product.stock_quantity < 10"
               [class.out-of-stock]="product.stock_quantity === 0">
              Stock: {{ product.stock_quantity }}
            </p>
          </div>
          
          <div class="product-actions">
            <a [routerLink]="['/products', product.id]" 
               class="btn btn-outline btn-sm">
              Voir détails
            </a>
            
            <button (click)="editProduct(product.id)" 
                    class="btn btn-primary btn-sm">
              Modifier
            </button>
            
            <button (click)="deleteProduct(product.id)" 
                    class="btn btn-danger btn-sm">
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- État de chargement -->
      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des produits...</p>
      </div>

      <!-- État vide -->
      <div *ngIf="!isLoading() && products().length === 0" class="empty-state">
        <p>Aucun produit trouvé</p>
        <button (click)="loadProducts()" class="btn btn-primary">
          Recharger
        </button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalProducts() > pageSize()">
        <button (click)="previousPage()" 
                [disabled]="currentPage() === 0"
                class="btn btn-outline">
          Précédent
        </button>
        
        <span class="page-info">
          Page {{ currentPage() + 1 }} sur {{ totalPages() }}
        </span>
        
        <button (click)="nextPage()" 
                [disabled]="currentPage() >= totalPages() - 1"
                class="btn btn-outline">
          Suivant
        </button>
      </div>
    </div>
  `,
  styles: [`
    .product-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .search-filters {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .product-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: white;
      transition: all 0.3s ease;
    }
    
    .product-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    
    .product-image img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .product-name {
      margin: 10px 0 5px 0;
      font-size: 1.2em;
      font-weight: bold;
    }
    
    .product-price {
      font-size: 1.3em;
      font-weight: bold;
      color: #28a745;
      margin: 10px 0;
    }
    
    .product-stock.low-stock {
      color: #ffc107;
      font-weight: bold;
    }
    
    .product-stock.out-of-stock {
      color: #dc3545;
      font-weight: bold;
    }
    
    .product-actions {
      margin-top: 15px;
      display: flex;
      gap: 5px;
    }
    
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-outline {
      border: 1px solid #007bff;
      color: #007bff;
      background: white;
    }
    
    .btn-success {
      background-color: #28a745;
      color: white;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .loading-state, .empty-state {
      text-align: center;
      padding: 40px;
    }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
    }
    
    .page-info {
      font-weight: bold;
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Signals pour l'état local
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);
  isLoading = signal(false);
  currentPage = signal(0);
  pageSize = signal(10);
  totalProducts = signal(0);
  
  // Propriétés pour les filtres
  searchQuery = '';
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    
    // S'abonner au loading global
    this.subscriptions.push(
      this.loadingService.loading$.subscribe(loading => {
        this.isLoading.set(loading);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Signals calculés
  totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize()));

  loadProducts() {
    const searchParams: ProductSearch = {
      query: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      min_price: this.minPrice || undefined,
      max_price: this.maxPrice || undefined,
      skip: this.currentPage() * this.pageSize(),
      limit: this.pageSize()
    };

    this.subscriptions.push(
      this.productService.searchProducts(searchParams).subscribe({
        next: (products) => {
          this.products.set(products);
          // En production, vous obtiendriez le total depuis l'API
          this.totalProducts.set(products.length);
        },
        error: (error) => {
          console.error('Error loading products:', error);
        }
      })
    );
  }

  loadCategories() {
    this.subscriptions.push(
      this.productService.getCategories().subscribe({
        next: (categories) => {
          this.categories.set(categories);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      })
    );
  }

  onSearchChange() {
    this.currentPage.set(0);
    this.loadProducts();
  }

  onCategoryChange() {
    this.currentPage.set(0);
    this.loadProducts();
  }

  onPriceChange() {
    this.currentPage.set(0);
    this.loadProducts();
  }

  editProduct(productId: number) {
    // Navigation vers la page d'édition
    // this.router.navigate(['/products', productId, 'edit']);
  }

  deleteProduct(productId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.subscriptions.push(
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
          }
        })
      );
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(page => page - 1);
      this.loadProducts();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(page => page + 1);
      this.loadProducts();
    }
  }

  onImageError(event: any) {
    event.target.src = '/assets/no-image.png';
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
```

## Exercices pratiques

### Exercice 1: Service de données
Créez un service pour gérer une liste de tâches avec ajout, suppression et modification.

### Exercice 2: Service API
Implémentez un service pour communiquer avec une API REST externe.

### Exercice 3: Gestion d'état
Créez un service de gestion d'état global pour une application de e-commerce.

## Prochaines étapes

Maintenant que vous maîtrisez les services et l'injection de dépendances, nous passerons au Module 4 : Formulaires réactifs avec validation pour apprendre à créer des formulaires robustes et sécurisés.
