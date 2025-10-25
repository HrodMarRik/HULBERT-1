# Guide TypeScript pour Angular - De JavaScript à TypeScript

## Table des matières
1. [Introduction et différences avec JavaScript](#introduction)
2. [Types de base](#types-de-base)
3. [Interfaces et Types](#interfaces-et-types)
4. [Classes et Héritage](#classes-et-héritage)
5. [Génériques](#génériques)
6. [Décorateurs (essentiels pour Angular)](#décorateurs)
7. [Async/Await et Promises](#async-await-et-promises)
8. [Types utilitaires Angular](#types-utilitaires-angular)

---

## Introduction {#introduction}

TypeScript est JavaScript avec des **types statiques**. Si vous connaissez JavaScript, vous connaissez déjà 90% de TypeScript !

### Comparaison JavaScript vs TypeScript

```javascript
// JavaScript (ce que vous connaissez)
function calculerPrix(prix, taxe) {
    return prix + (prix * taxe);
}

const resultat = calculerPrix(100, 0.2); // 120
const erreur = calculerPrix("100", 0.2); // "10020" (bug !)
```

```typescript
// TypeScript (avec types)
function calculerPrix(prix: number, taxe: number): number {
    return prix + (prix * taxe);
}

const resultat = calculerPrix(100, 0.2); // ✅ 120
const erreur = calculerPrix("100", 0.2); // ❌ Erreur TypeScript !
```

### Analogie avec Python

```python
# Python (typage optionnel)
def calculer_prix(prix: float, taxe: float) -> float:
    return prix + (prix * taxe)
```

TypeScript apporte la même sécurité de types que Python, mais pour JavaScript !

---

## Types de base {#types-de-base}

### Types primitifs

```typescript
// Types de base
let nom: string = "Jean";
let age: number = 25;
let estActif: boolean = true;
let donnees: any = "peut être n'importe quoi";

// Type null et undefined
let valeur: null = null;
let nonDefini: undefined = undefined;

// Type void (pour les fonctions qui ne retournent rien)
function afficherMessage(): void {
    console.log("Bonjour !");
}
```

### Arrays et Tuples

```typescript
// Arrays typés
let nombres: number[] = [1, 2, 3, 4];
let noms: string[] = ["Alice", "Bob", "Charlie"];

// Syntaxe alternative
let produits: Array<string> = ["Laptop", "Souris", "Clavier"];

// Tuples (comme en Python)
let personne: [string, number] = ["Jean", 25];
let coordonnees: [number, number] = [10, 20];
```

### Types Union (comme les unions en Python)

```typescript
// Union de types
let id: string | number = "abc123";
id = 123; // ✅ Valide

// Union avec null/undefined
let nomUtilisateur: string | null = null;
nomUtilisateur = "Alice"; // ✅ Valide
```

---

## Interfaces et Types {#interfaces-et-types}

### Interfaces (comme les classes abstraites en Python)

```typescript
// Interface pour définir la structure d'un objet
interface Utilisateur {
    id: number;
    nom: string;
    email: string;
    age?: number; // Propriété optionnelle
}

// Utilisation
const utilisateur: Utilisateur = {
    id: 1,
    nom: "Alice",
    email: "alice@example.com"
    // age est optionnel
};

// Interface avec méthodes
interface Calculatrice {
    additionner(a: number, b: number): number;
    soustraire(a: number, b: number): number;
}
```

### Types personnalisés

```typescript
// Type alias
type Status = "en_attente" | "en_cours" | "termine";
type ID = string | number;

// Type pour une fonction
type EventHandler = (event: Event) => void;

// Utilisation
let statutCommande: Status = "en_attente";
let identifiant: ID = "cmd-123";
```

### Comparaison avec Python

```python
# Python - Typing
from typing import Optional, Union, Protocol

class Utilisateur(Protocol):
    id: int
    nom: str
    email: str
    age: Optional[int] = None

Status = Union["en_attente", "en_cours", "termine"]
```

---

## Classes et Héritage {#classes-et-héritage}

### Classes de base

```typescript
class Personne {
    // Propriétés publiques
    public nom: string;
    public age: number;
    
    // Propriété privée
    private _id: number;
    
    // Propriété protégée
    protected email: string;
    
    // Constructeur
    constructor(nom: string, age: number, email: string) {
        this.nom = nom;
        this.age = age;
        this.email = email;
        this._id = Math.random();
    }
    
    // Méthode publique
    public sePresenter(): string {
        return `Je suis ${this.nom}, j'ai ${this.age} ans`;
    }
    
    // Getter
    get id(): number {
        return this._id;
    }
    
    // Setter
    set id(nouvelId: number) {
        if (nouvelId > 0) {
            this._id = nouvelId;
        }
    }
}

// Utilisation
const personne = new Personne("Alice", 25, "alice@example.com");
console.log(personne.sePresenter());
```

### Héritage

```typescript
class Employe extends Personne {
    private salaire: number;
    private poste: string;
    
    constructor(nom: string, age: number, email: string, salaire: number, poste: string) {
        super(nom, age, email); // Appel du constructeur parent
        this.salaire = salaire;
        this.poste = poste;
    }
    
    // Méthode spécialisée
    public sePresenter(): string {
        return `${super.sePresenter()} et je suis ${this.poste}`;
    }
    
    // Méthode privée
    private calculerPrime(): number {
        return this.salaire * 0.1;
    }
}

const employe = new Employe("Bob", 30, "bob@company.com", 50000, "Développeur");
console.log(employe.sePresenter());
```

### Comparaison avec Python

```python
# Python équivalent
class Personne:
    def __init__(self, nom: str, age: int, email: str):
        self.nom = nom
        self.age = age
        self._email = email  # Convention privée
        self._id = random.random()
    
    def se_presenter(self) -> str:
        return f"Je suis {self.nom}, j'ai {self.age} ans"

class Employe(Personne):
    def __init__(self, nom: str, age: int, email: str, salaire: float, poste: str):
        super().__init__(nom, age, email)
        self._salaire = salaire
        self._poste = poste
```

---

## Génériques {#génériques}

Les génériques permettent de créer des composants réutilisables avec des types variables.

### Génériques de base

```typescript
// Fonction générique
function obtenirPremierElement<T>(tableau: T[]): T | undefined {
    return tableau.length > 0 ? tableau[0] : undefined;
}

// Utilisation
const premierNombre = obtenirPremierElement([1, 2, 3]); // Type: number
const premierNom = obtenirPremierElement(["Alice", "Bob"]); // Type: string

// Interface générique
interface Reponse<T> {
    data: T;
    status: number;
    message: string;
}

// Utilisation
const reponseUtilisateur: Reponse<Utilisateur> = {
    data: { id: 1, nom: "Alice", email: "alice@example.com" },
    status: 200,
    message: "Succès"
};
```

### Génériques avec contraintes

```typescript
// Contrainte sur le type générique
interface AvecId {
    id: number;
}

function obtenirParId<T extends AvecId>(elements: T[], id: number): T | undefined {
    return elements.find(element => element.id === id);
}

// Utilisation
const utilisateurs: Utilisateur[] = [
    { id: 1, nom: "Alice", email: "alice@example.com" },
    { id: 2, nom: "Bob", email: "bob@example.com" }
];

const utilisateur = obtenirParId(utilisateurs, 1);
```

---

## Décorateurs {#décorateurs}

Les décorateurs sont essentiels en Angular ! Ils permettent de modifier le comportement des classes, méthodes et propriétés.

### Décorateurs de base

```typescript
// Décorateur simple
function MonDecorateur(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log(`Méthode ${propertyKey} décorée`);
}

class MaClasse {
    @MonDecorateur
    maMethode() {
        console.log("Méthode exécutée");
    }
}
```

### Décorateurs Angular (exemples)

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-utilisateur',
    template: `
        <div>
            <h3>{{ utilisateur.nom }}</h3>
            <p>{{ utilisateur.email }}</p>
            <button (click)="onSupprimer()">Supprimer</button>
        </div>
    `
})
export class UtilisateurComponent {
    @Input() utilisateur!: Utilisateur; // Propriété d'entrée
    @Output() supprimer = new EventEmitter<number>(); // Événement de sortie
    
    onSupprimer() {
        this.supprimer.emit(this.utilisateur.id);
    }
}
```

### Analogie avec Python

```python
# Python - Décorateurs
def mon_decorateur(func):
    def wrapper(*args, **kwargs):
        print(f"Fonction {func.__name__} décorée")
        return func(*args, **kwargs)
    return wrapper

@mon_decorateur
def ma_fonction():
    print("Fonction exécutée")
```

---

## Async/Await et Promises {#async-await-et-promises}

### Promises typées

```typescript
// Promise avec type de retour
function chargerUtilisateur(id: number): Promise<Utilisateur> {
    return new Promise((resolve, reject) => {
        // Simulation d'appel API
        setTimeout(() => {
            if (id > 0) {
                resolve({
                    id: id,
                    nom: `Utilisateur ${id}`,
                    email: `user${id}@example.com`
                });
            } else {
                reject(new Error("ID invalide"));
            }
        }, 1000);
    });
}

// Utilisation avec async/await
async function afficherUtilisateur(id: number): Promise<void> {
    try {
        const utilisateur = await chargerUtilisateur(id);
        console.log(`Utilisateur chargé: ${utilisateur.nom}`);
    } catch (error) {
        console.error("Erreur:", error);
    }
}
```

### HttpClient Angular (exemple)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UtilisateurService {
    private apiUrl = 'https://api.example.com/users';
    
    constructor(private http: HttpClient) {}
    
    // GET avec Observable
    obtenirUtilisateurs(): Observable<Utilisateur[]> {
        return this.http.get<Utilisateur[]>(this.apiUrl);
    }
    
    // POST avec Promise
    async creerUtilisateur(utilisateur: Utilisateur): Promise<Utilisateur> {
        return this.http.post<Utilisateur>(this.apiUrl, utilisateur).toPromise();
    }
}
```

---

## Types utilitaires Angular {#types-utilitaires-angular}

### Types Angular courants

```typescript
// Types pour les formulaires
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';

interface FormulaireUtilisateur {
    nom: FormControl<string>;
    email: FormControl<string>;
    age: FormControl<number>;
}

// Types pour le routing
import { ActivatedRoute, Router } from '@angular/router';

interface ParametresRoute {
    id: string;
    action: string;
}

// Types pour les observables
import { Observable, Subject, BehaviorSubject } from 'rxjs';

class GestionnaireEtat {
    private _utilisateurActuel = new BehaviorSubject<Utilisateur | null>(null);
    
    get utilisateurActuel$(): Observable<Utilisateur | null> {
        return this._utilisateurActuel.asObservable();
    }
    
    setUtilisateurActuel(utilisateur: Utilisateur): void {
        this._utilisateurActuel.next(utilisateur);
    }
}
```

### Types pour les composants

```typescript
// Types pour les événements
interface EvenementClic {
    target: HTMLElement;
    preventDefault(): void;
    stopPropagation(): void;
}

// Types pour les propriétés de composant
interface ProprietesComposant {
    [key: string]: any;
}

// Types pour les hooks de cycle de vie
interface OnInit {
    ngOnInit(): void;
}

interface OnDestroy {
    ngOnDestroy(): void;
}
```

---

## Exercices pratiques

### Exercice 1: Types de base
Créez une interface `Produit` avec les propriétés suivantes :
- `id: number`
- `nom: string`
- `prix: number`
- `description?: string` (optionnel)
- `categorie: string`

### Exercice 2: Classes et héritage
Créez une classe `Vehicule` de base et une classe `Voiture` qui hérite de `Vehicule`.

### Exercice 3: Génériques
Créez une fonction générique `filtrer` qui prend un tableau et une fonction de filtrage.

### Exercice 4: Async/Await
Créez une fonction qui simule un appel API pour récupérer une liste d'utilisateurs.

---

## Prochaines étapes

Maintenant que vous maîtrisez TypeScript, vous êtes prêt pour Angular ! Les concepts suivants vous seront familiers :

1. **Composants Angular** = Classes TypeScript avec décorateurs
2. **Services Angular** = Classes TypeScript injectables
3. **Interfaces** = Modèles de données pour vos API
4. **Génériques** = Services réutilisables avec HttpClient

Continuez avec le guide Angular Basics pour voir ces concepts en action !
