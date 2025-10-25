# Exercices Pratiques - Tutoriel Angular n-tier

## Module 1: Bases Angular

### Exercice 1.1: Créer un composant simple
**Objectif**: Créer un composant Angular basique avec input/output.

**Instructions**:
1. Créer un composant `HelloWorldComponent`
2. Ajouter une propriété `name` avec une valeur par défaut
3. Créer un template qui affiche "Bonjour, {name}!"
4. Ajouter un bouton pour changer le nom

**Solution**:
```typescript
// hello-world.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-hello-world',
  template: `
    <div>
      <h2>Bonjour, {{name}}!</h2>
      <button (click)="changeName()">Changer le nom</button>
    </div>
  `
})
export class HelloWorldComponent {
  name = 'Monde';

  changeName() {
    this.name = this.name === 'Monde' ? 'Angular' : 'Monde';
  }
}
```

### Exercice 1.2: Utiliser les directives
**Objectif**: Implémenter les directives structurelles et d'attribut.

**Instructions**:
1. Créer une liste d'éléments
2. Utiliser `*ngFor` pour afficher la liste
3. Utiliser `*ngIf` pour afficher/masquer des éléments
4. Utiliser `[ngClass]` pour appliquer des styles conditionnels

**Solution**:
```typescript
// list.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-list',
  template: `
    <div>
      <h3>Liste des éléments</h3>
      <ul>
        <li *ngFor="let item of items; let i = index" 
            [ngClass]="{'highlight': item.important}">
          {{i + 1}}. {{item.name}}
        </li>
      </ul>
      <p *ngIf="items.length === 0">Aucun élément dans la liste</p>
    </div>
  `,
  styles: [`
    .highlight {
      background-color: yellow;
      font-weight: bold;
    }
  `]
})
export class ListComponent {
  items = [
    { name: 'Élément 1', important: true },
    { name: 'Élément 2', important: false },
    { name: 'Élément 3', important: true }
  ];
}
```

## Module 2: Routing & Navigation

### Exercice 2.1: Configuration des routes
**Objectif**: Configurer un système de routage basique.

**Instructions**:
1. Créer des composants pour différentes pages
2. Configurer les routes dans `app.routes.ts`
3. Ajouter la navigation dans le template principal
4. Implémenter la navigation programmatique

**Solution**:
```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: '' }
];
```

```typescript
// navigation.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  template: `
    <nav>
      <a routerLink="/" routerLinkActive="active">Accueil</a>
      <a routerLink="/about" routerLinkActive="active">À propos</a>
      <a routerLink="/contact" routerLinkActive="active">Contact</a>
      <button (click)="goToAbout()">Aller à À propos</button>
    </nav>
  `
})
export class NavigationComponent {
  constructor(private router: Router) {}

  goToAbout() {
    this.router.navigate(['/about']);
  }
}
```

### Exercice 2.2: Routes avec paramètres
**Objectif**: Implémenter des routes avec paramètres dynamiques.

**Instructions**:
1. Créer une route avec paramètre `:id`
2. Récupérer le paramètre dans le composant
3. Utiliser `ActivatedRoute` pour accéder aux paramètres
4. Implémenter la navigation avec paramètres

**Solution**:
```typescript
// user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  template: `
    <div>
      <h2>Détails de l'utilisateur</h2>
      <p>ID: {{userId}}</p>
      <p>Nom: {{userName}}</p>
    </div>
  `
})
export class UserDetailComponent implements OnInit {
  userId: string = '';
  userName: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.userName = this.getUserName(this.userId);
  }

  private getUserName(id: string): string {
    // Logique pour récupérer le nom de l'utilisateur
    return `Utilisateur ${id}`;
  }
}
```

## Module 3: Services & Dependency Injection

### Exercice 3.1: Créer un service de données
**Objectif**: Créer un service pour gérer les données de l'application.

**Instructions**:
1. Créer un service `DataService`
2. Implémenter des méthodes CRUD
3. Utiliser le service dans un composant
4. Gérer les erreurs et les états de chargement

**Solution**:
```typescript
// data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Item {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private items: Item[] = [
    { id: 1, name: 'Item 1', description: 'Description 1' },
    { id: 2, name: 'Item 2', description: 'Description 2' }
  ];

  private itemsSubject = new BehaviorSubject<Item[]>(this.items);
  public items$ = this.itemsSubject.asObservable();

  getItems(): Observable<Item[]> {
    return this.items$;
  }

  getItem(id: number): Item | undefined {
    return this.items.find(item => item.id === id);
  }

  addItem(item: Omit<Item, 'id'>): void {
    const newItem: Item = {
      id: this.getNextId(),
      ...item
    };
    this.items.push(newItem);
    this.itemsSubject.next([...this.items]);
  }

  updateItem(id: number, updates: Partial<Item>): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates };
      this.itemsSubject.next([...this.items]);
    }
  }

  deleteItem(id: number): void {
    this.items = this.items.filter(item => item.id !== id);
    this.itemsSubject.next([...this.items]);
  }

  private getNextId(): number {
    return Math.max(...this.items.map(item => item.id)) + 1;
  }
}
```

### Exercice 3.2: Intercepteur HTTP
**Objectif**: Créer un intercepteur pour gérer les requêtes HTTP.

**Instructions**:
1. Créer un intercepteur `AuthInterceptor`
2. Ajouter automatiquement le token d'authentification
3. Gérer les erreurs HTTP
4. Implémenter un intercepteur de chargement

**Solution**:
```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

## Module 4: Formulaires Réactifs

### Exercice 4.1: Formulaire de contact
**Objectif**: Créer un formulaire réactif avec validation.

**Instructions**:
1. Créer un formulaire de contact
2. Implémenter la validation des champs
3. Gérer la soumission du formulaire
4. Afficher les messages d'erreur

**Solution**:
```typescript
// contact-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  template: `
    <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
      <div>
        <label>Nom:</label>
        <input formControlName="name" type="text">
        <div *ngIf="contactForm.get('name')?.hasError('required') && contactForm.get('name')?.touched">
          Le nom est requis
        </div>
      </div>
      
      <div>
        <label>Email:</label>
        <input formControlName="email" type="email">
        <div *ngIf="contactForm.get('email')?.hasError('email') && contactForm.get('email')?.touched">
          Email invalide
        </div>
      </div>
      
      <div>
        <label>Message:</label>
        <textarea formControlName="message"></textarea>
        <div *ngIf="contactForm.get('message')?.hasError('required') && contactForm.get('message')?.touched">
          Le message est requis
        </div>
      </div>
      
      <button type="submit" [disabled]="contactForm.invalid">Envoyer</button>
    </form>
  `
})
export class ContactFormComponent implements OnInit {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Formulaire soumis:', this.contactForm.value);
      // Logique de soumission
    }
  }
}
```

### Exercice 4.2: Validation personnalisée
**Objectif**: Créer des validateurs personnalisés.

**Instructions**:
1. Créer un validateur pour les mots de passe
2. Créer un validateur pour les numéros de téléphone
3. Implémenter un validateur asynchrone
4. Utiliser les validateurs dans un formulaire

**Solution**:
```typescript
// custom.validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && value.length >= 8;
    return valid ? null : { passwordStrength: true };
  };
}

export function phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(value) ? null : { phoneNumber: true };
  };
}
```

## Module 5: Authentification JWT

### Exercice 5.1: Service d'authentification
**Objectif**: Implémenter un service d'authentification complet.

**Instructions**:
1. Créer un service `AuthService`
2. Implémenter la connexion et la déconnexion
3. Gérer le stockage du token
4. Vérifier l'état d'authentification

**Solution**:
```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password })
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private loadUserFromStorage(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }
}
```

### Exercice 5.2: Guard d'authentification
**Objectif**: Créer un guard pour protéger les routes.

**Instructions**:
1. Créer un `AuthGuard`
2. Vérifier l'authentification avant l'accès aux routes
3. Rediriger vers la page de connexion si non authentifié
4. Implémenter un guard pour les rôles

**Solution**:
```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
```

## Module 6: Intégration API

### Exercice 6.1: Service API générique
**Objectif**: Créer un service API générique pour les opérations CRUD.

**Instructions**:
1. Créer un service `ApiService` générique
2. Implémenter les méthodes CRUD
3. Gérer les erreurs HTTP
4. Utiliser le service dans les composants

**Solution**:
```typescript
// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params: httpParams });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`);
  }
}
```

### Exercice 6.2: Gestion des erreurs
**Objectif**: Implémenter une gestion d'erreurs robuste.

**Instructions**:
1. Créer un service `ErrorService`
2. Intercepter les erreurs HTTP
3. Afficher des messages d'erreur appropriés
4. Logger les erreurs pour le débogage

**Solution**:
```typescript
// error.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface ErrorMessage {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorsSubject = new BehaviorSubject<ErrorMessage[]>([]);
  public errors$ = this.errorsSubject.asObservable();

  handleError(error: HttpErrorResponse): void {
    let message = 'Une erreur inattendue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      message = error.error.message;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          message = 'Requête invalide';
          break;
        case 401:
          message = 'Non autorisé';
          break;
        case 403:
          message = 'Accès interdit';
          break;
        case 404:
          message = 'Ressource non trouvée';
          break;
        case 500:
          message = 'Erreur interne du serveur';
          break;
        default:
          message = `Erreur ${error.status}: ${error.message}`;
      }
    }

    this.addError(message, 'error');
  }

  addError(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    const errorMessage: ErrorMessage = {
      message,
      type,
      timestamp: new Date()
    };
    
    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next([...currentErrors, errorMessage]);
  }

  clearErrors(): void {
    this.errorsSubject.next([]);
  }
}
```

## Module 7: Features Avancées

### Exercice 7.1: State Management avec Signals
**Objectif**: Utiliser les signals Angular pour la gestion d'état.

**Instructions**:
1. Créer un service avec des signals
2. Implémenter des actions pour modifier l'état
3. Utiliser les signals dans les composants
4. Créer des computed signals

**Solution**:
```typescript
// state.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private todos = signal<Todo[]>([]);
  private filter = signal<'all' | 'active' | 'completed'>('all');

  // Computed signals
  filteredTodos = computed(() => {
    const todos = this.todos();
    const filter = this.filter();
    
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  });

  completedCount = computed(() => 
    this.todos().filter(todo => todo.completed).length
  );

  // Actions
  addTodo(text: string): void {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false
    };
    this.todos.update(todos => [...todos, newTodo]);
  }

  toggleTodo(id: number): void {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  deleteTodo(id: number): void {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.filter.set(filter);
  }
}
```

### Exercice 7.2: Performance Optimization
**Objectif**: Optimiser les performances de l'application.

**Instructions**:
1. Implémenter le lazy loading
2. Utiliser OnPush change detection
3. Optimiser les requêtes HTTP
4. Implémenter la virtualisation

**Solution**:
```typescript
// optimized-list.component.ts
import { Component, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';

@Component({
  selector: 'app-optimized-list',
  template: `
    <div class="list-container">
      <div *ngFor="let item of items; trackBy: trackByFn" class="list-item">
        {{item.name}}
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedListComponent {
  items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];

  trackByFn: TrackByFunction<any> = (index: number, item: any) => item.id;
}
```

## Exercices Bonus

### Exercice Bonus 1: PWA
**Objectif**: Convertir l'application en PWA.

**Instructions**:
1. Configurer le service worker
2. Créer un manifest
3. Implémenter le cache offline
4. Ajouter des notifications push

### Exercice Bonus 2: Tests Unitaires
**Objectif**: Écrire des tests unitaires complets.

**Instructions**:
1. Tester les composants
2. Tester les services
3. Tester les pipes
4. Tester les guards

**Solution**:
```typescript
// hello-world.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelloWorldComponent } from './hello-world.component';

describe('HelloWorldComponent', () => {
  let component: HelloWorldComponent;
  let fixture: ComponentFixture<HelloWorldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HelloWorldComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HelloWorldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default name', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Bonjour, Monde!');
  });

  it('should change name when button is clicked', () => {
    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('button');
    
    button.click();
    fixture.detectChanges();
    
    expect(compiled.textContent).toContain('Bonjour, Angular!');
  });
});
```

## Conseils pour les Exercices

1. **Commencez simple**: Commencez par les exercices de base et progressez vers les plus complexes.

2. **Testez régulièrement**: Testez votre code à chaque étape pour identifier les erreurs rapidement.

3. **Utilisez la documentation**: Consultez la documentation Angular officielle pour les détails d'implémentation.

4. **Pratiquez**: Répétez les exercices pour renforcer votre compréhension.

5. **Expérimentez**: N'hésitez pas à modifier les exercices pour explorer de nouvelles fonctionnalités.

6. **Demandez de l'aide**: Si vous êtes bloqué, consultez les solutions ou demandez de l'aide.

7. **Code propre**: Écrivez du code propre et bien documenté.

8. **Gestion d'erreurs**: Toujours gérer les erreurs de manière appropriée.

9. **Performance**: Gardez à l'esprit les performances lors de l'implémentation.

10. **Sécurité**: Respectez les bonnes pratiques de sécurité, surtout pour l'authentification.
