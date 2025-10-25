# Module 1: Bases Angular - Components, Binding, Directives, Signals

## Vue d'ensemble

Ce module couvre les fondamentaux d'Angular : les composants standalone, le data binding, les directives, les pipes et les signals (nouvelle approche réactive d'Angular 20).

## 1. Composants Standalone

### Qu'est-ce qu'un composant standalone ?

Un composant standalone est un composant qui peut être utilisé indépendamment, sans être déclaré dans un module NgModule. C'est la nouvelle approche recommandée dans Angular 20.

### Structure d'un composant

```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>{{ title() }}</h2>
      <p>Compteur: {{ count() }}</p>
      <button (click)="increment()">Incrémenter</button>
    </div>
  `,
  styles: [`
    div {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class ExampleComponent {
  // Signal pour le titre
  title = signal('Mon Composant Angular');
  
  // Signal pour le compteur
  count = signal(0);
  
  // Signal calculé
  doubleCount = computed(() => this.count() * 2);
  
  // Méthode pour incrémenter
  increment() {
    this.count.update(value => value + 1);
  }
}
```

### Comparaison avec les composants traditionnels

```typescript
// Ancienne approche (avec modules)
@Component({
  selector: 'app-old-component',
  templateUrl: './old-component.component.html',
  styleUrls: ['./old-component.component.css']
})
export class OldComponent {
  title = 'Mon Titre';
  count = 0;
  
  increment() {
    this.count++;
  }
}

// Nouvelle approche (standalone)
@Component({
  selector: 'app-new-component',
  standalone: true,
  template: `...`,
  styles: [`...`]
})
export class NewComponent {
  title = signal('Mon Titre');
  count = signal(0);
  
  increment() {
    this.count.update(value => value + 1);
  }
}
```

## 2. Data Binding

### Types de data binding

#### 1. Interpolation ({{ }})
```typescript
@Component({
  standalone: true,
  template: `
    <h1>{{ title() }}</h1>
    <p>Utilisateur: {{ user().name }}</p>
    <p>Calcul: {{ 2 + 2 }}</p>
    <p>Date: {{ currentDate() | date:'short' }}</p>
  `
})
export class InterpolationComponent {
  title = signal('Interpolation');
  user = signal({ name: 'Alice', age: 25 });
  currentDate = signal(new Date());
}
```

#### 2. Property Binding ([property])
```typescript
@Component({
  standalone: true,
  template: `
    <img [src]="imageUrl()" [alt]="imageAlt()">
    <button [disabled]="isDisabled()">Cliquer</button>
    <div [class.active]="isActive()">Contenu</div>
    <input [value]="inputValue()" [placeholder]="placeholder()">
  `
})
export class PropertyBindingComponent {
  imageUrl = signal('/assets/image.jpg');
  imageAlt = signal('Description de l\'image');
  isDisabled = signal(false);
  isActive = signal(true);
  inputValue = signal('Valeur par défaut');
  placeholder = signal('Tapez quelque chose...');
}
```

#### 3. Event Binding ((event))
```typescript
@Component({
  standalone: true,
  template: `
    <button (click)="onClick()">Cliquer</button>
    <input (input)="onInput($event)" (keyup.enter)="onEnter()">
    <div (mouseover)="onMouseOver()" (mouseout)="onMouseOut()">
      Survolez-moi
    </div>
  `
})
export class EventBindingComponent {
  onClick() {
    console.log('Bouton cliqué !');
  }
  
  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    console.log('Valeur:', target.value);
  }
  
  onEnter() {
    console.log('Entrée pressée !');
  }
  
  onMouseOver() {
    console.log('Souris sur l\'élément');
  }
  
  onMouseOut() {
    console.log('Souris sortie de l\'élément');
  }
}
```

#### 4. Two-way Binding ([(ngModel)])
```typescript
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="name" placeholder="Votre nom">
    <p>Bonjour {{ name }} !</p>
    
    <input [(ngModel)]="email" type="email" placeholder="Votre email">
    <p>Email: {{ email }}</p>
  `
})
export class TwoWayBindingComponent {
  name = '';
  email = '';
}
```

## 3. Directives

### Directives structurelles

#### *ngIf
```typescript
@Component({
  standalone: true,
  template: `
    <div *ngIf="isLoggedIn()">
      <h2>Bienvenue {{ user().name }} !</h2>
      <button (click)="logout()">Déconnexion</button>
    </div>
    
    <div *ngIf="!isLoggedIn()">
      <h2>Veuillez vous connecter</h2>
      <button (click)="login()">Connexion</button>
    </div>
    
    <!-- Avec else -->
    <div *ngIf="hasData(); else noData">
      <p>Données disponibles</p>
    </div>
    
    <ng-template #noData>
      <p>Aucune donnée disponible</p>
    </ng-template>
  `
})
export class NgIfComponent {
  isLoggedIn = signal(false);
  user = signal({ name: 'Alice' });
  hasData = signal(true);
  
  login() {
    this.isLoggedIn.set(true);
  }
  
  logout() {
    this.isLoggedIn.set(false);
  }
}
```

#### *ngFor
```typescript
@Component({
  standalone: true,
  template: `
    <h3>Liste des utilisateurs</h3>
    <ul>
      <li *ngFor="let user of users(); trackBy: trackByUserId; let i = index">
        {{ i + 1 }}. {{ user.name }} ({{ user.email }})
      </li>
    </ul>
    
    <h3>Liste des produits</h3>
    <div *ngFor="let product of products(); let isFirst = first; let isLast = last">
      <div [class.first]="isFirst" [class.last]="isLast">
        {{ product.name }} - {{ product.price | currency }}
      </div>
    </div>
  `
})
export class NgForComponent {
  users = signal([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ]);
  
  products = signal([
    { id: 1, name: 'Laptop', price: 999.99 },
    { id: 2, name: 'Souris', price: 29.99 },
    { id: 3, name: 'Clavier', price: 79.99 }
  ]);
  
  trackByUserId(index: number, user: any): number {
    return user.id;
  }
}
```

#### *ngSwitch
```typescript
@Component({
  standalone: true,
  template: `
    <div [ngSwitch]="status()">
      <div *ngSwitchCase="'loading'">
        <p>Chargement en cours...</p>
      </div>
      <div *ngSwitchCase="'success'">
        <p>✅ Succès !</p>
      </div>
      <div *ngSwitchCase="'error'">
        <p>❌ Erreur !</p>
      </div>
      <div *ngSwitchDefault>
        <p>État inconnu</p>
      </div>
    </div>
    
    <button (click)="changeStatus('loading')">Chargement</button>
    <button (click)="changeStatus('success')">Succès</button>
    <button (click)="changeStatus('error')">Erreur</button>
  `
})
export class NgSwitchComponent {
  status = signal('loading');
  
  changeStatus(newStatus: string) {
    this.status.set(newStatus);
  }
}
```

### Directives d'attribut

#### ngClass
```typescript
@Component({
  standalone: true,
  template: `
    <div [ngClass]="getClasses()">
      Contenu avec classes dynamiques
    </div>
    
    <div [ngClass]="{
      'active': isActive(),
      'disabled': isDisabled(),
      'highlight': isHighlighted()
    }">
      Contenu avec classes conditionnelles
    </div>
  `
})
export class NgClassComponent {
  isActive = signal(true);
  isDisabled = signal(false);
  isHighlighted = signal(true);
  
  getClasses() {
    return {
      'btn': true,
      'btn-primary': this.isActive(),
      'btn-disabled': this.isDisabled()
    };
  }
}
```

#### ngStyle
```typescript
@Component({
  standalone: true,
  template: `
    <div [ngStyle]="getStyles()">
      Contenu avec styles dynamiques
    </div>
    
    <div [ngStyle]="{
      'color': textColor(),
      'font-size': fontSize() + 'px',
      'background-color': backgroundColor()
    }">
      Contenu avec styles conditionnels
    </div>
  `
})
export class NgStyleComponent {
  textColor = signal('blue');
  fontSize = signal(16);
  backgroundColor = signal('lightgray');
  
  getStyles() {
    return {
      'color': this.textColor(),
      'font-size': this.fontSize() + 'px',
      'background-color': this.backgroundColor(),
      'padding': '10px',
      'border-radius': '5px'
    };
  }
}
```

## 4. Pipes

### Pipes intégrés

```typescript
@Component({
  standalone: true,
  template: `
    <h3>Pipes intégrés</h3>
    
    <!-- Date -->
    <p>Date: {{ currentDate() | date:'short' }}</p>
    <p>Date complète: {{ currentDate() | date:'full' }}</p>
    
    <!-- Currency -->
    <p>Prix: {{ price() | currency:'EUR':'symbol':'1.2-2' }}</p>
    <p>Prix USD: {{ price() | currency:'USD' }}</p>
    
    <!-- Decimal -->
    <p>Nombre: {{ number() | number:'1.2-2' }}</p>
    <p>Pourcentage: {{ percentage() | percent:'1.2-2' }}</p>
    
    <!-- String -->
    <p>Texte: {{ text() | uppercase }}</p>
    <p>Texte: {{ text() | lowercase }}</p>
    <p>Texte: {{ text() | titlecase }}</p>
    
    <!-- Slice -->
    <p>Texte tronqué: {{ longText() | slice:0:50 }}...</p>
    
    <!-- JSON -->
    <pre>{{ user() | json }}</pre>
  `
})
export class PipesComponent {
  currentDate = signal(new Date());
  price = signal(99.99);
  number = signal(1234.5678);
  percentage = signal(0.75);
  text = signal('hello world');
  longText = signal('Ceci est un texte très long qui sera tronqué pour l\'affichage');
  user = signal({ name: 'Alice', age: 25, city: 'Paris' });
}
```

### Pipe personnalisé

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 50, suffix: string = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    return value.substring(0, limit) + suffix;
  }
}

// Utilisation
@Component({
  standalone: true,
  imports: [TruncatePipe],
  template: `
    <p>{{ longText() | truncate:30 }}</p>
    <p>{{ longText() | truncate:50:'...' }}</p>
  `
})
export class CustomPipeComponent {
  longText = signal('Ceci est un texte très long qui sera tronqué');
}
```

## 5. Signals (Angular 20)

### Introduction aux signals

Les signals sont la nouvelle approche réactive d'Angular 20. Ils offrent une meilleure performance et une syntaxe plus simple.

### Types de signals

#### Signal de base
```typescript
@Component({
  standalone: true,
  template: `
    <h2>{{ title() }}</h2>
    <p>Compteur: {{ count() }}</p>
    <button (click)="increment()">+</button>
    <button (click)="decrement()">-</button>
    <button (click)="reset()">Reset</button>
  `
})
export class BasicSignalComponent {
  // Signal en lecture seule
  title = signal('Mon Composant');
  
  // Signal modifiable
  count = signal(0);
  
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

#### Signal calculé (computed)
```typescript
@Component({
  standalone: true,
  template: `
    <h3>Calculatrice</h3>
    <input [(ngModel)]="a" type="number" placeholder="Nombre A">
    <input [(ngModel)]="b" type="number" placeholder="Nombre B">
    
    <div>
      <p>A + B = {{ sum() }}</p>
      <p>A - B = {{ difference() }}</p>
      <p>A × B = {{ product() }}</p>
      <p>A ÷ B = {{ quotient() }}</p>
    </div>
  `
})
export class ComputedSignalComponent {
  a = signal(0);
  b = signal(0);
  
  // Signals calculés
  sum = computed(() => this.a() + this.b());
  difference = computed(() => this.a() - this.b());
  product = computed(() => this.a() * this.b());
  quotient = computed(() => {
    const bValue = this.b();
    return bValue !== 0 ? this.a() / bValue : 0;
  });
}
```

#### Signal d'effet (effect)
```typescript
import { effect } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <h3>Effet de signal</h3>
    <input [(ngModel)]="name" placeholder="Votre nom">
    <p>Bonjour {{ name() }} !</p>
    <p>Nombre de caractères: {{ nameLength() }}</p>
  `
})
export class EffectSignalComponent {
  name = signal('');
  nameLength = signal(0);
  
  constructor() {
    // Effet qui se déclenche quand le signal change
    effect(() => {
      const nameValue = this.name();
      this.nameLength.set(nameValue.length);
      
      // Log dans la console
      console.log('Nom changé:', nameValue);
    });
  }
}
```

## 6. Exemple complet : Composant de gestion d'utilisateurs

```typescript
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management">
      <h2>Gestion des utilisateurs</h2>
      
      <!-- Formulaire d'ajout -->
      <div class="add-user-form">
        <h3>Ajouter un utilisateur</h3>
        <input [(ngModel)]="newUserName" placeholder="Nom" class="form-input">
        <input [(ngModel)]="newUserEmail" placeholder="Email" class="form-input">
        <button (click)="addUser()" [disabled]="!canAddUser()" class="btn btn-primary">
          Ajouter
        </button>
      </div>
      
      <!-- Filtres -->
      <div class="filters">
        <input [(ngModel)]="searchTerm" placeholder="Rechercher..." class="form-input">
        <select [(ngModel)]="statusFilter" class="form-select">
          <option value="">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>
      
      <!-- Liste des utilisateurs -->
      <div class="user-list">
        <div *ngFor="let user of filteredUsers(); trackBy: trackByUserId" 
             class="user-item" 
             [class.active]="user.isActive"
             [class.inactive]="!user.isActive">
          
          <div class="user-info">
            <h4>{{ user.name }}</h4>
            <p>{{ user.email }}</p>
            <span class="status" [ngClass]="user.isActive ? 'active' : 'inactive'">
              {{ user.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          
          <div class="user-actions">
            <button (click)="toggleUserStatus(user)" class="btn btn-sm">
              {{ user.isActive ? 'Désactiver' : 'Activer' }}
            </button>
            <button (click)="deleteUser(user.id)" class="btn btn-sm btn-danger">
              Supprimer
            </button>
          </div>
        </div>
      </div>
      
      <!-- Statistiques -->
      <div class="stats">
        <p>Total: {{ totalUsers() }}</p>
        <p>Actifs: {{ activeUsers() }}</p>
        <p>Inactifs: {{ inactiveUsers() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .user-management {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .add-user-form, .filters {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .form-input, .form-select {
      width: 100%;
      padding: 8px 12px;
      margin: 5px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    
    .user-item.active {
      border-left: 4px solid #28a745;
    }
    
    .user-item.inactive {
      border-left: 4px solid #dc3545;
      opacity: 0.7;
    }
    
    .user-info h4 {
      margin: 0 0 5px 0;
    }
    
    .user-info p {
      margin: 0 0 5px 0;
      color: #666;
    }
    
    .status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status.active {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .stats {
      background: #e9ecef;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
  `]
})
export class UserManagementComponent {
  // Signals pour les données
  users = signal<User[]>([
    { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
    { id: 2, name: 'Bob', email: 'bob@example.com', isActive: false },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', isActive: true }
  ]);
  
  // Signals pour le formulaire
  newUserName = signal('');
  newUserEmail = signal('');
  searchTerm = signal('');
  statusFilter = signal('');
  
  // Signals calculés
  filteredUsers = computed(() => {
    let filtered = this.users();
    
    // Filtrage par terme de recherche
    const search = this.searchTerm();
    if (search) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filtrage par statut
    const status = this.statusFilter();
    if (status === 'active') {
      filtered = filtered.filter(user => user.isActive);
    } else if (status === 'inactive') {
      filtered = filtered.filter(user => !user.isActive);
    }
    
    return filtered;
  });
  
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(user => user.isActive).length);
  inactiveUsers = computed(() => this.users().filter(user => !user.isActive).length);
  
  canAddUser = computed(() => {
    const name = this.newUserName();
    const email = this.newUserEmail();
    return name.trim().length > 0 && email.trim().length > 0;
  });
  
  // Méthodes
  addUser() {
    if (!this.canAddUser()) return;
    
    const newUser: User = {
      id: Math.max(...this.users().map(u => u.id)) + 1,
      name: this.newUserName(),
      email: this.newUserEmail(),
      isActive: true
    };
    
    this.users.update(users => [...users, newUser]);
    this.newUserName.set('');
    this.newUserEmail.set('');
  }
  
  toggleUserStatus(user: User) {
    this.users.update(users => 
      users.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      )
    );
  }
  
  deleteUser(userId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.users.update(users => users.filter(u => u.id !== userId));
    }
  }
  
  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}
```

## Exercices pratiques

### Exercice 1: Composant de compteur
Créez un composant standalone avec un compteur qui peut être incrémenté, décrémenté et réinitialisé.

### Exercice 2: Liste de tâches
Créez un composant pour gérer une liste de tâches avec ajout, suppression et marquage comme terminé.

### Exercice 3: Filtrage de données
Créez un composant qui affiche une liste de produits avec des filtres par catégorie et prix.

## Prochaines étapes

Maintenant que vous maîtrisez les bases d'Angular, nous passerons au Module 2 : Routing & Navigation pour apprendre à naviguer entre les pages de votre application.
