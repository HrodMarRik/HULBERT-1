# Module 6: Intégration complète avec API Python

## Vue d'ensemble

Ce module couvre l'intégration complète entre votre frontend Angular et votre backend Python/FastAPI. Nous allons connecter tous les services Angular aux endpoints de l'API, gérer les erreurs, implémenter la pagination, et créer des composants fonctionnels pour chaque entité.

## 1. Configuration de l'environnement

### Variables d'environnement

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  appName: 'Angular Tutorial App',
  version: '1.0.0'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  appName: 'Angular Tutorial App',
  version: '1.0.0'
};
```

### Configuration HttpClient avec interceptors

```typescript
// app.config.ts
import { ApplicationConfig, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),
    provideAnimations()
  ]
};
```

## 2. Service API unifié

```typescript
// core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Effectuer une requête GET
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    this.setLoading(true);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête POST
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête PUT
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête PATCH
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête DELETE
   */
  delete<T>(endpoint: string): Observable<T> {
    this.setLoading(true);
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Effectuer une requête GET avec pagination
   */
  getPaginated<T>(endpoint: string, page: number = 0, size: number = 10, params?: HttpParams): Observable<PaginatedResponse<T>> {
    this.setLoading(true);
    const paginationParams = new HttpParams()
      .set('skip', (page * size).toString())
      .set('limit', size.toString());

    const finalParams = params ? paginationParams.appendAll(params) : paginationParams;

    return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}${endpoint}`, { 
      params: finalParams,
      observe: 'response'
    })
      .pipe(
        map(response => ({
          items: response.body?.data || [],
          total: parseInt(response.headers.get('X-Total-Count') || '0'),
          page: page,
          size: size,
          pages: Math.ceil(parseInt(response.headers.get('X-Total-Count') || '0') / size)
        })),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Upload de fichier
   */
  uploadFile<T>(endpoint: string, file: File): Observable<T> {
    this.setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        map(response => response.data),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Download de fichier
   */
  downloadFile(endpoint: string, filename?: string): Observable<Blob> {
    this.setLoading(true);
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob'
    }).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Gestionnaire d'erreurs centralisé
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let errorMessage = 'Une erreur est survenue';
    let errorCode = error.status;

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
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
          case 409:
            errorMessage = 'Conflit de données';
            break;
          case 422:
            errorMessage = 'Données non valides';
            break;
          case 500:
            errorMessage = 'Erreur serveur interne';
            break;
          default:
            errorMessage = `Erreur ${error.status}: ${error.statusText}`;
        }
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Gestion de l'état de chargement
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Obtenir l'état de chargement actuel
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Créer des paramètres HTTP
   */
  createParams(params: {[key: string]: any}): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return httpParams;
  }

  /**
   * Créer des headers HTTP
   */
  createHeaders(additionalHeaders?: {[key: string]: string}): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach(key => {
        headers = headers.set(key, additionalHeaders[key]);
      });
    }

    return headers;
  }
}
```

## 3. Service de gestion des produits complet

```typescript
// core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductCreate, ProductUpdate, ProductSearch } from '../models/product.model';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private selectedProductSubject = new BehaviorSubject<Product | null>(null);
  public selectedProduct$ = this.selectedProductSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<string[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Obtenir tous les produits avec pagination
  getProducts(page: number = 0, size: number = 10): Observable<PaginatedResponse<Product>> {
    return this.apiService.getPaginated<Product>('/products', page, size)
      .pipe(
        tap(response => {
          this.productsSubject.next(response.items);
        }),
        catchError(error => {
          console.error('Error fetching products:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir un produit par ID
  getProduct(id: number): Observable<Product> {
    return this.apiService.get<Product>(`/products/${id}`)
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
    return this.apiService.post<Product>('/products', productData)
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
    return this.apiService.put<Product>(`/products/${id}`, productData)
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
    return this.apiService.delete(`/products/${id}`)
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
    
    return this.apiService.get<Product[]>('/products/search', params)
      .pipe(
        catchError(error => {
          console.error('Error searching products:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les produits par catégorie avec pagination
  getProductsByCategory(category: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Product>> {
    const params = this.apiService.createParams({ category });
    
    return this.apiService.getPaginated<Product>('/products', page, size, params)
      .pipe(
        catchError(error => {
          console.error(`Error fetching products for category ${category}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir toutes les catégories
  getCategories(): Observable<string[]> {
    return this.apiService.get<string[]>('/products/categories')
      .pipe(
        tap(categories => {
          this.categoriesSubject.next(categories);
        }),
        catchError(error => {
          console.error('Error fetching categories:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les produits en rupture de stock
  getLowStockProducts(threshold: number = 10): Observable<Product[]> {
    const params = this.apiService.createParams({ threshold });
    
    return this.apiService.get<Product[]>('/products/low-stock/list', params)
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
      `/products/${productId}/stock`,
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

  // Obtenir les catégories actuelles
  getCurrentCategories(): string[] {
    return this.categoriesSubject.value;
  }

  // Effacer le cache des produits
  clearProductsCache(): void {
    this.productsSubject.next([]);
    this.selectedProductSubject.next(null);
  }

  // Effacer le cache des catégories
  clearCategoriesCache(): void {
    this.categoriesSubject.next([]);
  }
}
```

## 4. Service de gestion des commandes

```typescript
// core/services/order.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Order, OrderCreate, OrderUpdate, OrderWithItems, OrderStats } from '../models/order.model';
import { PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private selectedOrderSubject = new BehaviorSubject<OrderWithItems | null>(null);
  public selectedOrder$ = this.selectedOrderSubject.asObservable();

  private orderStatsSubject = new BehaviorSubject<OrderStats | null>(null);
  public orderStats$ = this.orderStatsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // Obtenir les commandes de l'utilisateur avec pagination
  getUserOrders(page: number = 0, size: number = 10, status?: string): Observable<PaginatedResponse<Order>> {
    let params = this.apiService.createParams({});
    if (status) {
      params = params.set('status', status);
    }

    return this.apiService.getPaginated<Order>('/orders', page, size, params)
      .pipe(
        tap(response => {
          this.ordersSubject.next(response.items);
        }),
        catchError(error => {
          console.error('Error fetching user orders:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir toutes les commandes (admin)
  getAllOrders(page: number = 0, size: number = 10, status?: string): Observable<PaginatedResponse<Order>> {
    let params = this.apiService.createParams({});
    if (status) {
      params = params.set('status', status);
    }

    return this.apiService.getPaginated<Order>('/orders/admin', page, size, params)
      .pipe(
        tap(response => {
          this.ordersSubject.next(response.items);
        }),
        catchError(error => {
          console.error('Error fetching all orders:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir une commande par ID avec ses éléments
  getOrderWithItems(id: number): Observable<OrderWithItems> {
    return this.apiService.get<OrderWithItems>(`/orders/${id}`)
      .pipe(
        tap(order => {
          this.selectedOrderSubject.next(order);
        }),
        catchError(error => {
          console.error(`Error fetching order ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Créer une nouvelle commande
  createOrder(orderData: OrderCreate): Observable<Order> {
    return this.apiService.post<Order>('/orders', orderData)
      .pipe(
        tap(newOrder => {
          const currentOrders = this.ordersSubject.value;
          this.ordersSubject.next([newOrder, ...currentOrders]);
        }),
        catchError(error => {
          console.error('Error creating order:', error);
          return throwError(() => error);
        })
      );
  }

  // Mettre à jour une commande
  updateOrder(id: number, orderData: OrderUpdate): Observable<Order> {
    return this.apiService.put<Order>(`/orders/${id}`, orderData)
      .pipe(
        tap(updatedOrder => {
          const currentOrders = this.ordersSubject.value;
          const index = currentOrders.findIndex(o => o.id === id);
          if (index !== -1) {
            currentOrders[index] = updatedOrder;
            this.ordersSubject.next([...currentOrders]);
          }
        }),
        catchError(error => {
          console.error(`Error updating order ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Mettre à jour le statut d'une commande (admin)
  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.apiService.patch<Order>(`/orders/${id}/status`, { status })
      .pipe(
        tap(updatedOrder => {
          const currentOrders = this.ordersSubject.value;
          const index = currentOrders.findIndex(o => o.id === id);
          if (index !== -1) {
            currentOrders[index] = updatedOrder;
            this.ordersSubject.next([...currentOrders]);
          }
        }),
        catchError(error => {
          console.error(`Error updating order status ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Annuler une commande
  cancelOrder(id: number): Observable<any> {
    return this.apiService.delete(`/orders/${id}`)
      .pipe(
        tap(() => {
          const currentOrders = this.ordersSubject.value;
          const filteredOrders = currentOrders.filter(o => o.id !== id);
          this.ordersSubject.next(filteredOrders);
        }),
        catchError(error => {
          console.error(`Error cancelling order ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les statistiques des commandes
  getOrderStats(): Observable<OrderStats> {
    return this.apiService.get<OrderStats>('/orders/stats')
      .pipe(
        tap(stats => {
          this.orderStatsSubject.next(stats);
        }),
        catchError(error => {
          console.error('Error fetching order stats:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtenir les commandes actuelles
  getCurrentOrders(): Order[] {
    return this.ordersSubject.value;
  }

  // Obtenir la commande sélectionnée
  getSelectedOrder(): OrderWithItems | null {
    return this.selectedOrderSubject.value;
  }

  // Obtenir les statistiques actuelles
  getCurrentOrderStats(): OrderStats | null {
    return this.orderStatsSubject.value;
  }

  // Effacer le cache des commandes
  clearOrdersCache(): void {
    this.ordersSubject.next([]);
    this.selectedOrderSubject.next(null);
  }

  // Effacer le cache des statistiques
  clearOrderStatsCache(): void {
    this.orderStatsSubject.next(null);
  }
}
```

## 5. Composant de liste des produits avec intégration API

```typescript
// features/products/components/product-list/product-list.component.ts
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { Product, ProductSearch } from '../../../../core/models/product.model';
import { PaginatedResponse } from '../../../../core/models/api-response.model';
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    
    // S'abonner au loading global
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading.set(loading);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Signals calculés
  totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize()));

  loadProducts() {
    if (this.searchQuery || this.selectedCategory || this.minPrice || this.maxPrice) {
      this.searchProducts();
    } else {
      this.productService.getProducts(this.currentPage(), this.pageSize())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: PaginatedResponse<Product>) => {
            this.products.set(response.items);
            this.totalProducts.set(response.total);
          },
          error: (error) => {
            console.error('Error loading products:', error);
          }
        });
    }
  }

  searchProducts() {
    const searchParams: ProductSearch = {
      query: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      min_price: this.minPrice || undefined,
      max_price: this.maxPrice || undefined,
      skip: this.currentPage() * this.pageSize(),
      limit: this.pageSize()
    };

    this.productService.searchProducts(searchParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          // En production, vous obtiendriez le total depuis l'API
          this.totalProducts.set(products.length);
        },
        error: (error) => {
          console.error('Error searching products:', error);
        }
      });
  }

  loadCategories() {
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
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
      this.productService.deleteProduct(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
          }
        });
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

## 6. Composant de détail de produit

```typescript
// features/products/components/product-detail/product-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-detail" *ngIf="product">
      <div class="product-header">
        <button (click)="goBack()" class="btn btn-secondary">
          ← Retour
        </button>
        <h1>{{ product.name }}</h1>
      </div>
      
      <div class="product-content">
        <div class="product-image">
          <img [src]="product.image || '/assets/no-image.png'" 
               [alt]="product.name"
               (error)="onImageError($event)">
        </div>
        
        <div class="product-info">
          <p class="price">{{ product.price | currency:'EUR':'symbol':'1.2-2' }}</p>
          <p class="description">{{ product.description }}</p>
          <p class="category">Catégorie: {{ product.category }}</p>
          <p class="stock" 
             [class.low-stock]="product.stock_quantity < 10"
             [class.out-of-stock]="product.stock_quantity === 0">
            Stock: {{ product.stock_quantity }}
          </p>
          
          <div class="product-actions">
            <button (click)="addToCart()" 
                    [disabled]="product.stock_quantity === 0"
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
      
      <div class="related-products" *ngIf="relatedProducts().length > 0">
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
    
    <div *ngIf="!product && !isLoading()" class="loading">
      <p>Produit non trouvé</p>
    </div>
    
    <div *ngIf="isLoading()" class="loading">
      <div class="spinner"></div>
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
    
    .product-stock.low-stock {
      color: #ffc107;
      font-weight: bold;
    }
    
    .product-stock.out-of-stock {
      color: #dc3545;
      font-weight: bold;
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
    
    .loading {
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
  `]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  relatedProducts = signal<Product[]>([]);
  isLoading = signal(false);
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private loadingService: LoadingService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Récupérer l'ID du produit depuis les paramètres de route
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const productId = +params['id'];
        this.loadProduct(productId);
      });
    
    // S'abonner au loading global
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading.set(loading);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(id: number) {
    this.productService.getProduct(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loadRelatedProducts(product.category);
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.product = null;
        }
      });
  }

  loadRelatedProducts(category: string) {
    this.productService.getProductsByCategory(category, 0, 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Exclure le produit actuel
          const filtered = response.items.filter(p => p.id !== this.product?.id);
          this.relatedProducts.set(filtered);
        },
        error: (error) => {
          console.error('Error loading related products:', error);
        }
      });
  }

  goBack() {
    this.router.navigate(['/products']);
  }

  navigateToProduct(productId: number) {
    this.router.navigate(['/products', productId]);
  }

  addToCart() {
    // Logique d'ajout au panier
    console.log('Ajout au panier:', this.product);
  }

  editProduct() {
    this.router.navigate(['/products', this.product!.id, 'edit']);
  }

  shareProduct() {
    if (navigator.share) {
      navigator.share({
        title: this.product!.name,
        text: this.product!.description,
        url: window.location.href
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Share
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  }

  onImageError(event: any) {
    event.target.src = '/assets/no-image.png';
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
```

## Exercices pratiques

### Exercice 1: Intégration API complète
Connectez tous vos services Angular aux endpoints de votre API Python.

### Exercice 2: Gestion d'erreurs avancée
Implémentez une gestion d'erreurs robuste avec retry automatique et notifications utilisateur.

### Exercice 3: Cache et optimisation
Ajoutez un système de cache pour optimiser les performances et réduire les appels API.

## Prochaines étapes

Maintenant que vous maîtrisez l'intégration API complète, nous passerons au Module 7 : Features avancées et optimisation pour finaliser votre application Angular professionnelle.
