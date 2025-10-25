# Exercices pratiques - Solutions

## Module 1 : Bases d'Angular

### Exercice 1.1 : Composant Counter
**Objectif** : Créer un composant counter avec signals

**Solution** :
```typescript
// src/app/shared/components/counter/counter.component.ts
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div class="counter">
      <h3>Counter: {{ count() }}</h3>
      <p>Double: {{ doubleCount() }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  `,
  styles: [`
    .counter {
      text-align: center;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      margin: 20px;
    }
    button {
      margin: 0 5px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
  `]
})
export class CounterComponent {
  private count = signal(0);
  
  // Computed signal
  doubleCount = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(value => value + 1);
  }
  
  decrement() {
    this.count.update(value => value - 1);
  }
  
  reset() {
    this.count.set(0);
  }
}
```

### Exercice 1.2 : Service de données
**Objectif** : Créer un service pour gérer des données

**Solution** :
```typescript
// src/app/core/services/data.service.ts
import { Injectable, signal } from '@angular/core';

export interface Item {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private items = signal<Item[]>([
    { id: 1, name: 'Item 1', description: 'Description 1' },
    { id: 2, name: 'Item 2', description: 'Description 2' }
  ]);
  
  getItems() {
    return this.items.asReadonly();
  }
  
  addItem(item: Omit<Item, 'id'>) {
    const newItem: Item = {
      ...item,
      id: Math.max(...this.items().map(i => i.id)) + 1
    };
    this.items.update(items => [...items, newItem]);
  }
  
  removeItem(id: number) {
    this.items.update(items => items.filter(item => item.id !== id));
  }
  
  updateItem(id: number, updates: Partial<Item>) {
    this.items.update(items => 
      items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }
}
```

## Module 2 : Routing et navigation

### Exercice 2.1 : Navigation avec paramètres
**Objectif** : Créer une navigation avec paramètres de route

**Solution** :
```typescript
// src/app/features/products/components/product-detail/product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  template: `
    <div class="product-detail" *ngIf="product">
      <h2>{{ product.name }}</h2>
      <p>{{ product.description }}</p>
      <p class="price">{{ product.price | currency }}</p>
      <button (click)="goBack()">Retour</button>
      <button (click)="editProduct()">Modifier</button>
    </div>
    <div *ngIf="!product" class="loading">
      Chargement...
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadProduct(id);
    });
  }
  
  private loadProduct(id: number) {
    // Simuler le chargement d'un produit
    this.product = {
      id,
      name: `Product ${id}`,
      description: `Description for product ${id}`,
      price: 100 * id
    };
  }
  
  goBack() {
    this.router.navigate(['/products']);
  }
  
  editProduct() {
    this.router.navigate(['/products', this.product!.id, 'edit']);
  }
}
```

### Exercice 2.2 : Guard de navigation
**Objectif** : Créer un guard pour protéger les routes

**Solution** :
```typescript
// src/app/core/guards/can-edit.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CanEditGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
}
```

## Module 3 : Services et HTTP

### Exercice 3.1 : Service HTTP avec retry
**Objectif** : Créer un service HTTP avec gestion des erreurs et retry

**Solution** :
```typescript
// src/app/core/services/http-retry.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, retryWhen, delayWhen, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HttpRetryService {
  constructor(private http: HttpClient) {}
  
  get<T>(url: string, retryCount: number = 3): Observable<T> {
    return this.http.get<T>(url).pipe(
      retryWhen(errors => 
        errors.pipe(
          delayWhen(() => timer(1000)),
          take(retryCount)
        )
      ),
      catchError(this.handleError)
    );
  }
  
  post<T>(url: string, data: any, retryCount: number = 3): Observable<T> {
    return this.http.post<T>(url, data).pipe(
      retryWhen(errors => 
        errors.pipe(
          delayWhen(() => timer(1000)),
          take(retryCount)
        )
      ),
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Code: ${error.status}, Message: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => errorMessage);
  }
}
```

### Exercice 3.2 : Interceptor de cache
**Objectif** : Créer un interceptor pour mettre en cache les requêtes GET

**Solution** :
```typescript
// src/app/core/interceptors/cache.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne mettre en cache que les requêtes GET
    if (req.method !== 'GET') {
      return next.handle(req);
    }
    
    const cachedResponse = this.cache.get(req.url);
    if (cachedResponse) {
      return of(cachedResponse);
    }
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.url, event);
        }
      })
    );
  }
  
  clearCache() {
    this.cache.clear();
  }
}
```

## Module 4 : Forms et validation

### Exercice 4.1 : Formulaire de contact
**Objectif** : Créer un formulaire de contact avec validation

**Solution** :
```typescript
// src/app/features/contact/components/contact-form/contact-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="name">Nom *</label>
        <input 
          id="name" 
          type="text" 
          formControlName="name"
          [class.error]="isFieldInvalid('name')">
        <div *ngIf="isFieldInvalid('name')" class="error-message">
          <span *ngIf="contactForm.get('name')?.errors?.['required']">
            Le nom est requis
          </span>
          <span *ngIf="contactForm.get('name')?.errors?.['minlength']">
            Le nom doit contenir au moins 2 caractères
          </span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="email">Email *</label>
        <input 
          id="email" 
          type="email" 
          formControlName="email"
          [class.error]="isFieldInvalid('email')">
        <div *ngIf="isFieldInvalid('email')" class="error-message">
          <span *ngIf="contactForm.get('email')?.errors?.['required']">
            L'email est requis
          </span>
          <span *ngIf="contactForm.get('email')?.errors?.['email']">
            Format d'email invalide
          </span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="message">Message *</label>
        <textarea 
          id="message" 
          formControlName="message"
          rows="5"
          [class.error]="isFieldInvalid('message')"></textarea>
        <div *ngIf="isFieldInvalid('message')" class="error-message">
          <span *ngIf="contactForm.get('message')?.errors?.['required']">
            Le message est requis
          </span>
          <span *ngIf="contactForm.get('message')?.errors?.['minlength']">
            Le message doit contenir au moins 10 caractères
          </span>
        </div>
      </div>
      
      <button type="submit" [disabled]="contactForm.invalid">
        Envoyer
      </button>
    </form>
  `
})
export class ContactFormComponent implements OnInit {
  contactForm: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }
  
  ngOnInit() {}
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Form submitted:', this.contactForm.value);
      // Ici vous pouvez envoyer les données au serveur
    }
  }
}
```

### Exercice 4.2 : Validator personnalisé
**Objectif** : Créer un validateur personnalisé pour les mots de passe

**Solution** :
```typescript
// src/app/core/validators/password.validator.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    
    const password = control.value;
    const errors: ValidationErrors = {};
    
    // Au moins 8 caractères
    if (password.length < 8) {
      errors['minLength'] = { requiredLength: 8, actualLength: password.length };
    }
    
    // Au moins une majuscule
    if (!/[A-Z]/.test(password)) {
      errors['noUppercase'] = true;
    }
    
    // Au moins une minuscule
    if (!/[a-z]/.test(password)) {
      errors['noLowercase'] = true;
    }
    
    // Au moins un chiffre
    if (!/\d/.test(password)) {
      errors['noDigit'] = true;
    }
    
    // Au moins un caractère spécial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors['noSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };
}
```

## Module 5 : Authentification

### Exercice 5.1 : Service d'authentification complet
**Objectif** : Créer un service d'authentification avec gestion des tokens

**Solution** :
```typescript
// src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  // Signals pour la réactivité
  private isAuthenticatedSignal = signal(false);
  private currentUserSignal = signal<User | null>(null);
  
  // Computed signals
  public isAuthenticated = computed(() => this.isAuthenticatedSignal());
  public currentUser = computed(() => this.currentUserSignal());
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }
  
  private initializeAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.userSubject.next(JSON.parse(user));
      this.isAuthenticatedSignal.set(true);
      this.currentUserSignal.set(JSON.parse(user));
    }
  }
  
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        const { token, user } = response;
        
        // Stocker les données
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Mettre à jour les observables
        this.tokenSubject.next(token);
        this.userSubject.next(user);
        
        // Mettre à jour les signals
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(user);
      })
    );
  }
  
  register(userData: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData);
  }
  
  logout() {
    // Nettoyer le stockage local
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Réinitialiser les observables
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    
    // Réinitialiser les signals
    this.isAuthenticatedSignal.set(false);
    this.currentUserSignal.set(null);
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/login']);
  }
  
  getToken(): string | null {
    return this.tokenSubject.value;
  }
  
  getUser(): User | null {
    return this.userSubject.value;
  }
  
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
  
  refreshToken(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/refresh`, {
      token: this.getToken()
    }).pipe(
      tap(response => {
        const { token } = response;
        localStorage.setItem('token', token);
        this.tokenSubject.next(token);
      })
    );
  }
}
```

## Module 6 : Intégration API

### Exercice 6.1 : Service API générique
**Objectif** : Créer un service API générique pour toutes les entités

**Solution** :
```typescript
// src/app/core/services/generic-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class GenericApiService<T> {
  constructor(private http: HttpClient) {}
  
  protected get baseUrl(): string {
    return environment.apiUrl;
  }
  
  getAll(endpoint: string, params?: any): Observable<ApiResponse<T[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}/${endpoint}`, {
      params: httpParams
    });
  }
  
  getById(endpoint: string, id: number): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}/${id}`);
  }
  
  create(endpoint: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data);
  }
  
  update(endpoint: string, id: number, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}/${id}`, data);
  }
  
  delete(endpoint: string, id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${endpoint}/${id}`);
  }
  
  search(endpoint: string, query: string, params?: any): Observable<ApiResponse<T[]>> {
    let httpParams = new HttpParams().set('q', query);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}/${endpoint}/search`, {
      params: httpParams
    });
  }
  
  getPaginated(endpoint: string, page: number = 1, limit: number = 10, params?: any): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      params: httpParams
    });
  }
}
```

## Module 7 : Features avancées

### Exercice 7.1 : Store avec signals
**Objectif** : Créer un store global avec signals

**Solution** :
```typescript
// src/app/core/store/app.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';
import { Product } from '../models/product.model';

export interface AppState {
  user: User | null;
  products: Product[];
  cart: Product[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppStore {
  private state = signal<AppState>({
    user: null,
    products: [],
    cart: [],
    isLoading: false,
    error: null
  });
  
  // Selectors
  public user = computed(() => this.state().user);
  public products = computed(() => this.state().products);
  public cart = computed(() => this.state().cart);
  public isLoading = computed(() => this.state().isLoading);
  public error = computed(() => this.state().error);
  public isAuthenticated = computed(() => !!this.state().user);
  public cartCount = computed(() => this.state().cart.length);
  public cartTotal = computed(() => 
    this.state().cart.reduce((total, product) => total + product.price, 0)
  );
  
  // Actions
  setUser(user: User | null) {
    this.state.update(current => ({ ...current, user }));
  }
  
  setProducts(products: Product[]) {
    this.state.update(current => ({ ...current, products }));
  }
  
  addToCart(product: Product) {
    this.state.update(current => ({
      ...current,
      cart: [...current.cart, product]
    }));
  }
  
  removeFromCart(productId: number) {
    this.state.update(current => ({
      ...current,
      cart: current.cart.filter(p => p.id !== productId)
    }));
  }
  
  clearCart() {
    this.state.update(current => ({ ...current, cart: [] }));
  }
  
  setLoading(loading: boolean) {
    this.state.update(current => ({ ...current, isLoading: loading }));
  }
  
  setError(error: string | null) {
    this.state.update(current => ({ ...current, error }));
  }
  
  // Actions composées
  login(user: User) {
    this.state.update(current => ({
      ...current,
      user,
      isLoading: false,
      error: null
    }));
  }
  
  logout() {
    this.state.update(current => ({
      ...current,
      user: null,
      cart: [],
      error: null
    }));
  }
  
  loadProducts(products: Product[]) {
    this.state.update(current => ({
      ...current,
      products,
      isLoading: false,
      error: null
    }));
  }
}
```

## Module 8 : Déploiement

### Exercice 8.1 : Configuration Docker
**Objectif** : Créer une configuration Docker complète

**Solution** :
```dockerfile
# Dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:prod

FROM nginx:alpine AS production
COPY --from=build /app/dist/tuto-angular /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - API_URL=http://backend:8000
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/tuto_angular
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tuto_angular
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

**Félicitations !** Vous avez maintenant toutes les solutions pour les exercices pratiques. Utilisez ces exemples comme référence pour implémenter vos propres features.
