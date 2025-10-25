# Architecture n-tier Angular - Guide complet

## Vue d'ensemble

L'architecture n-tier (multi-couches) sépare les responsabilités de votre application Angular en couches distinctes et bien définies. Cette approche facilite la maintenance, les tests et la scalabilité.

## Structure du projet Angular

```
src/app/
├── core/                    # Services singleton, guards, interceptors
│   ├── models/             # Interfaces TypeScript (DTOs)
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── order.model.ts
│   │   └── api-response.model.ts
│   ├── services/           # Services métier
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   └── api.service.ts
│   ├── guards/             # Route guards
│   │   ├── auth.guard.ts
│   │   └── admin.guard.ts
│   ├── interceptors/       # HTTP interceptors
│   │   ├── auth.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── loading.interceptor.ts
│   ├── constants/          # Constantes globales
│   │   ├── api.constants.ts
│   │   └── app.constants.ts
│   └── utils/              # Utilitaires
│       ├── validators.ts
│       └── helpers.ts
├── features/               # Modules par fonctionnalité
│   ├── auth/              # Authentification
│   │   ├── components/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── services/
│   │   └── auth.routes.ts
│   ├── users/             # Gestion utilisateurs
│   │   ├── components/
│   │   │   ├── user-list/
│   │   │   ├── user-detail/
│   │   │   └── user-form/
│   │   ├── services/
│   │   └── users.routes.ts
│   ├── products/          # Gestion produits
│   │   ├── components/
│   │   │   ├── product-list/
│   │   │   ├── product-detail/
│   │   │   ├── product-form/
│   │   │   └── product-search/
│   │   ├── services/
│   │   └── products.routes.ts
│   └── orders/            # Gestion commandes
│       ├── components/
│       │   ├── order-list/
│       │   ├── order-detail/
│       │   └── order-form/
│       ├── services/
│       └── orders.routes.ts
├── shared/                # Composants/pipes/directives réutilisables
│   ├── components/
│   │   ├── loading-spinner/
│   │   ├── error-message/
│   │   ├── confirm-dialog/
│   │   └── data-table/
│   ├── pipes/
│   │   ├── currency.pipe.ts
│   │   ├── date.pipe.ts
│   │   └── truncate.pipe.ts
│   ├── directives/
│   │   ├── highlight.directive.ts
│   │   └── click-outside.directive.ts
│   └── validators/
│       ├── custom.validators.ts
│       └── async.validators.ts
└── layout/                # Layout de l'application
    ├── components/
    │   ├── header/
    │   ├── sidebar/
    │   ├── footer/
    │   └── main-layout/
    └── layout.routes.ts
```

## Les 4 couches n-tier

### 1. Couche Présentation (Presentation Layer)
**Localisation**: `features/*/components/`, `shared/components/`, `layout/components/`

**Responsabilités**:
- Affichage des données à l'utilisateur
- Gestion des interactions utilisateur
- Validation des formulaires côté client
- Navigation et routing

**Technologies**: Components Angular, Templates, Directives, Pipes

### 2. Couche Métier (Business Layer)
**Localisation**: `core/services/`, `features/*/services/`

**Responsabilités**:
- Logique métier de l'application
- Orchestration des appels API
- Gestion de l'état de l'application
- Transformation des données

**Technologies**: Services Angular, RxJS, State Management

### 3. Couche Accès Données (Data Access Layer)
**Localisation**: `core/services/api.service.ts`, `core/interceptors/`

**Responsabilités**:
- Communication avec l'API backend
- Gestion des erreurs HTTP
- Authentification et autorisation
- Cache et optimisation des requêtes

**Technologies**: HttpClient, Interceptors, Guards

### 4. Couche Données (Data Layer)
**Localisation**: `core/models/`, Backend API

**Responsabilités**:
- Définition des modèles de données
- Validation des données
- Persistance des données
- API REST backend

**Technologies**: Interfaces TypeScript, Pydantic schemas, PostgreSQL

## Avantages de cette architecture

### ✅ Séparation des responsabilités
- Chaque couche a un rôle bien défini
- Facilite la maintenance et les tests
- Réduit le couplage entre les composants

### ✅ Réutilisabilité
- Services partagés dans `core/`
- Composants réutilisables dans `shared/`
- Modèles communs

### ✅ Scalabilité
- Ajout facile de nouvelles fonctionnalités
- Modules indépendants
- Architecture modulaire

### ✅ Testabilité
- Tests unitaires par couche
- Mocking facilité
- Isolation des responsabilités

## Flux de données typique

```
1. User Action (Component) 
   ↓
2. Business Logic (Service)
   ↓
3. Data Access (HTTP Service)
   ↓
4. Backend API (Python/FastAPI)
   ↓
5. Database (PostgreSQL)
```

## Exemple concret : Création d'un produit

### 1. Couche Présentation
```typescript
// features/products/components/product-form/product-form.component.ts
export class ProductFormComponent {
  productForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, Validators.min(0)],
    category: ['', Validators.required]
  });

  onSubmit() {
    if (this.productForm.valid) {
      this.productService.createProduct(this.productForm.value)
        .subscribe(product => {
          this.router.navigate(['/products', product.id]);
        });
    }
  }
}
```

### 2. Couche Métier
```typescript
// core/services/product.service.ts
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private apiService: ApiService) {}

  createProduct(productData: ProductCreate): Observable<Product> {
    return this.apiService.post<Product>('/products', productData)
      .pipe(
        tap(product => console.log('Produit créé:', product)),
        catchError(this.handleError)
      );
  }
}
```

### 3. Couche Accès Données
```typescript
// core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${API_BASE_URL}${endpoint}`, data);
  }
}
```

### 4. Couche Données
```typescript
// core/models/product.model.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductCreate {
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
}
```

## Bonnes pratiques

### 1. Injection de dépendances
- Utilisez `providedIn: 'root'` pour les services singleton
- Injectez les dépendances dans le constructeur
- Évitez les services dans les composants

### 2. Gestion d'état
- Utilisez des services pour l'état global
- Implémentez des patterns comme Store ou BehaviorSubject
- Évitez le prop drilling

### 3. Gestion des erreurs
- Centralisez la gestion d'erreurs avec des interceptors
- Affichez des messages d'erreur utilisateur-friendly
- Loggez les erreurs pour le debugging

### 4. Performance
- Utilisez OnPush change detection
- Implémentez le lazy loading
- Optimisez les requêtes HTTP

## Prochaines étapes

Maintenant que vous comprenez l'architecture n-tier, nous allons l'implémenter dans votre projet Angular avec des exemples concrets pour chaque couche.
