# Module 7 : Features avancées et optimisation

## Objectifs
- Maîtriser les features avancées d'Angular
- Comprendre les techniques d'optimisation
- Implémenter des patterns avancés
- Gérer les performances et la scalabilité

## 7.1 Signals et Reactivity avancée

### 7.1.1 Signals composés
```typescript
// src/app/core/services/signal.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignalService {
  // Signal primitif
  private count = signal(0);
  private name = signal('Angular');
  
  // Signal computed
  public doubleCount = computed(() => this.count() * 2);
  public greeting = computed(() => `Hello ${this.name()}!`);
  
  // Signal effect
  constructor() {
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
    });
  }
  
  // Méthodes pour modifier les signals
  increment() {
    this.count.update(value => value + 1);
  }
  
  setName(newName: string) {
    this.name.set(newName);
  }
  
  // Getters pour accéder aux signals
  get countValue() {
    return this.count();
  }
  
  get nameValue() {
    return this.name();
  }
}
```

### 7.1.2 Signal-based State Management
```typescript
// src/app/core/store/app.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';

export interface AppState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppStore {
  // État initial
  private state = signal<AppState>({
    user: null,
    isLoading: false,
    error: null
  });
  
  // Selectors computed
  public user = computed(() => this.state().user);
  public isLoading = computed(() => this.state().isLoading);
  public error = computed(() => this.state().error);
  public isAuthenticated = computed(() => !!this.state().user);
  
  // Actions
  setUser(user: User | null) {
    this.state.update(current => ({ ...current, user }));
  }
  
  setLoading(loading: boolean) {
    this.state.update(current => ({ ...current, isLoading: loading }));
  }
  
  setError(error: string | null) {
    this.state.update(current => ({ ...current, error }));
  }
  
  // Action composée
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
      error: null
    }));
  }
}
```

## 7.2 Change Detection avancée

### 7.2.1 OnPush Strategy
```typescript
// src/app/features/products/components/product-list/product-list.component.ts
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  @Input() products: Product[] = [];
  @Output() productSelected = new EventEmitter<Product>();
  @Output() productDeleted = new EventEmitter<number>();
  
  onProductSelect(product: Product) {
    this.productSelected.emit(product);
  }
  
  onProductDelete(id: number) {
    this.productDeleted.emit(id);
  }
  
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
```

### 7.2.2 Custom Change Detection
```typescript
// src/app/core/directives/change-detection.directive.ts
import { Directive, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';

@Directive({
  selector: '[appChangeDetection]'
})
export class ChangeDetectionDirective implements OnChanges {
  @Input() appChangeDetection: any;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['appChangeDetection']) {
      // Détection de changement personnalisée
      this.cdr.markForCheck();
    }
  }
}
```

## 7.3 Lazy Loading et Code Splitting

### 7.3.1 Module Lazy Loading
```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then(m => m.PRODUCTS_ROUTES)
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
```

### 7.3.2 Preloading Strategy
```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    )
  ]
};
```

## 7.4 Performance et Optimisation

### 7.4.1 Virtual Scrolling
```typescript
// src/app/features/products/components/virtual-product-list/virtual-product-list.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-virtual-product-list',
  templateUrl: './virtual-product-list.component.html',
  styleUrls: ['./virtual-product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualProductListComponent {
  @Input() products: Product[] = [];
  
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
```

```html
<!-- virtual-product-list.component.html -->
<cdk-virtual-scroll-viewport itemSize="100" class="viewport">
  <div *cdkVirtualFor="let product of products; trackBy: trackByProductId" 
       class="product-item">
    <h3>{{ product.name }}</h3>
    <p>{{ product.description }}</p>
    <span class="price">{{ product.price | currency }}</span>
  </div>
</cdk-virtual-scroll-viewport>
```

### 7.4.2 Image Lazy Loading
```typescript
// src/app/shared/directives/lazy-image.directive.ts
import { Directive, Input, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyImage]'
})
export class LazyImageDirective implements OnInit {
  @Input() appLazyImage: string = '';
  
  constructor(private el: ElementRef<HTMLImageElement>) {}
  
  ngOnInit() {
    const img = this.el.nativeElement;
    
    // Intersection Observer pour le lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = this.appLazyImage;
          observer.unobserve(img);
        }
      });
    });
    
    observer.observe(img);
  }
}
```

### 7.4.3 Service Worker
```typescript
// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly VAPID_PUBLIC_KEY = 'your-vapid-public-key';
  
  constructor(private swPush: SwPush) {}
  
  async subscribeToNotifications() {
    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      });
      
      // Envoyer la subscription au serveur
      console.log('Subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Subscription failed:', error);
      throw error;
    }
  }
  
  listenToNotifications() {
    this.swPush.messages.subscribe(message => {
      console.log('Received notification:', message);
    });
  }
}
```

## 7.5 Testing avancé

### 7.5.1 Component Testing avec Signals
```typescript
// src/app/features/products/components/product-list/product-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { Product } from '../../../../core/models/product.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  
  const mockProducts: Product[] = [
    { id: 1, name: 'Product 1', description: 'Description 1', price: 100 },
    { id: 2, name: 'Product 2', description: 'Description 2', price: 200 }
  ];
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    component.products = mockProducts;
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should emit productSelected when product is clicked', () => {
    spyOn(component.productSelected, 'emit');
    
    const product = mockProducts[0];
    component.onProductSelect(product);
    
    expect(component.productSelected.emit).toHaveBeenCalledWith(product);
  });
  
  it('should track products by id', () => {
    const trackByResult = component.trackByProductId(0, mockProducts[0]);
    expect(trackByResult).toBe(1);
  });
});
```

### 7.5.2 Service Testing avec Mocks
```typescript
// src/app/core/services/product.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('should fetch products', () => {
    const mockProducts: Product[] = [
      { id: 1, name: 'Product 1', description: 'Description 1', price: 100 }
    ];
    
    service.getProducts().subscribe(products => {
      expect(products).toEqual(mockProducts);
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });
  
  it('should create product', () => {
    const newProduct: Product = { id: 0, name: 'New Product', description: 'New Description', price: 150 };
    const createdProduct: Product = { ...newProduct, id: 1 };
    
    service.createProduct(newProduct).subscribe(product => {
      expect(product).toEqual(createdProduct);
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/products`);
    expect(req.request.method).toBe('POST');
    req.flush(createdProduct);
  });
});
```

## 7.6 Internationalization (i18n)

### 7.6.1 Configuration i18n
```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    ),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideAnimations()
  ]
};
```

### 7.6.2 Translation Service
```typescript
// src/app/core/services/translation.service.ts
import { Injectable, signal } from '@angular/core';

export interface Translation {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal('en');
  private translations = signal<{ [lang: string]: Translation }>({
    en: {
      'welcome': 'Welcome',
      'products': 'Products',
      'users': 'Users',
      'login': 'Login',
      'logout': 'Logout'
    },
    fr: {
      'welcome': 'Bienvenue',
      'products': 'Produits',
      'users': 'Utilisateurs',
      'login': 'Connexion',
      'logout': 'Déconnexion'
    }
  });
  
  public currentLang = this.currentLanguage.asReadonly();
  
  translate(key: string): string {
    const lang = this.currentLanguage();
    const translation = this.translations()[lang];
    return translation?.[key] || key;
  }
  
  setLanguage(lang: string) {
    this.currentLanguage.set(lang);
  }
  
  getAvailableLanguages(): string[] {
    return Object.keys(this.translations());
  }
}
```

### 7.6.3 Translation Pipe
```typescript
// src/app/shared/pipes/translate.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  
  transform(key: string): string {
    return this.translationService.translate(key);
  }
}
```

## 7.7 PWA (Progressive Web App)

### 7.7.1 PWA Configuration
```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    ),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
```

### 7.7.2 Offline Support
```typescript
// src/app/core/services/offline.service.ts
import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  constructor(private swUpdate: SwUpdate) {
    this.checkForUpdates();
  }
  
  private checkForUpdates() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(event => {
        if (confirm('New version available. Load new version?')) {
          window.location.reload();
        }
      });
    }
  }
  
  isOnline(): boolean {
    return navigator.onLine;
  }
  
  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}
```

## 7.8 Exercices pratiques

### Exercice 1 : Signal Store
Créez un store basé sur les signals pour gérer l'état de l'application.

### Exercice 2 : Virtual Scrolling
Implémentez une liste virtuelle pour afficher une grande quantité de données.

### Exercice 3 : PWA
Transformez l'application en PWA avec support offline.

### Exercice 4 : i18n
Ajoutez le support multilingue à l'application.

### Exercice 5 : Performance
Optimisez les performances avec OnPush et trackBy functions.

## 7.9 Bonnes pratiques

### Performance
- Utilisez OnPush change detection strategy
- Implémentez trackBy functions pour les listes
- Utilisez le lazy loading pour les modules
- Optimisez les images avec lazy loading

### Scalabilité
- Structurez le code en modules feature
- Utilisez les services pour la logique métier
- Implémentez des guards pour la sécurité
- Utilisez les interceptors pour les requêtes HTTP

### Maintenance
- Écrivez des tests unitaires et d'intégration
- Documentez le code
- Utilisez TypeScript strict mode
- Suivez les conventions Angular

## 7.10 Ressources supplémentaires

- [Angular Signals](https://angular.io/guide/signals)
- [Angular Performance](https://angular.io/guide/performance)
- [Angular PWA](https://angular.io/guide/service-worker-intro)
- [Angular i18n](https://angular.io/guide/i18n)
- [Angular Testing](https://angular.io/guide/testing)

---

**Prochain module** : Module 8 - Déploiement et production