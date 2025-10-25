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
