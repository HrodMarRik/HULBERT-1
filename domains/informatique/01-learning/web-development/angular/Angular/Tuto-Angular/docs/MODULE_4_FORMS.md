# Module 4: Formulaires réactifs avec validation

## Vue d'ensemble

Les formulaires réactifs Angular offrent une approche déclarative pour gérer les formulaires avec une validation robuste et une gestion d'état avancée. Ce module couvre la création de formulaires réactifs, la validation personnalisée, la gestion des erreurs, et l'intégration avec les APIs.

## 1. Introduction aux formulaires réactifs

### Avantages des formulaires réactifs

- **Prévisibilité** : Flux de données unidirectionnel
- **Testabilité** : Facile à tester unitairement
- **Validation** : Validation synchrone et asynchrone
- **Performance** : Changement de détection optimisé
- **Flexibilité** : Contrôle total sur la structure du formulaire

### Configuration de base

```typescript
// app.config.ts
import { ApplicationConfig, provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations() // Pour les animations de validation
  ]
};
```

## 2. Formulaires réactifs de base

### FormControl simple

```typescript
// components/simple-form.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-simple-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <h3>Formulaire simple</h3>
      
      <form [formGroup]="simpleForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Nom :</label>
          <input 
            id="name"
            type="text" 
            formControlName="name"
            class="form-control"
            [class.error]="nameControl.invalid && nameControl.touched">
          
          <div *ngIf="nameControl.invalid && nameControl.touched" class="error-message">
            <span *ngIf="nameControl.errors?.['required']">Le nom est requis</span>
            <span *ngIf="nameControl.errors?.['minlength']">
              Le nom doit contenir au moins {{ nameControl.errors?.['minlength'].requiredLength }} caractères
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="email">Email :</label>
          <input 
            id="email"
            type="email" 
            formControlName="email"
            class="form-control"
            [class.error]="emailControl.invalid && emailControl.touched">
          
          <div *ngIf="emailControl.invalid && emailControl.touched" class="error-message">
            <span *ngIf="emailControl.errors?.['required']">L'email est requis</span>
            <span *ngIf="emailControl.errors?.['email']">Format d'email invalide</span>
          </div>
        </div>
        
        <button 
          type="submit" 
          [disabled]="simpleForm.invalid"
          class="btn btn-primary">
          Soumettre
        </button>
      </form>
      
      <div class="form-debug">
        <h4>État du formulaire :</h4>
        <p>Valid: {{ simpleForm.valid }}</p>
        <p>Invalid: {{ simpleForm.invalid }}</p>
        <p>Pending: {{ simpleForm.pending }}</p>
        <p>Value: {{ simpleForm.value | json }}</p>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-control.error {
      border-color: #dc3545;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    
    .form-debug {
      margin-top: 30px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
  `]
})
export class SimpleFormComponent {
  // FormControl avec validation
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(2)
  ]);
  
  emailControl = new FormControl('', [
    Validators.required,
    Validators.email
  ]);
  
  // FormGroup
  simpleForm = new FormGroup({
    name: this.nameControl,
    email: this.emailControl
  });
  
  onSubmit() {
    if (this.simpleForm.valid) {
      console.log('Formulaire soumis:', this.simpleForm.value);
      // Traitement des données...
    } else {
      console.log('Formulaire invalide');
      // Marquer tous les champs comme touchés
      this.simpleForm.markAllAsTouched();
    }
  }
}
```

## 3. FormGroup et FormArray

### FormGroup complexe

```typescript
// components/user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { UserCreate } from '../../core/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <h3>Formulaire utilisateur</h3>
      
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <!-- Informations de base -->
        <fieldset class="form-section">
          <legend>Informations de base</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label for="username">Nom d'utilisateur :</label>
              <input 
                id="username"
                type="text" 
                formControlName="username"
                class="form-control"
                [class.error]="usernameControl.invalid && usernameControl.touched">
              
              <div *ngIf="usernameControl.invalid && usernameControl.touched" class="error-message">
                <span *ngIf="usernameControl.errors?.['required']">Le nom d'utilisateur est requis</span>
                <span *ngIf="usernameControl.errors?.['minlength']">
                  Minimum {{ usernameControl.errors?.['minlength'].requiredLength }} caractères
                </span>
                <span *ngIf="usernameControl.errors?.['pattern']">
                  Seuls les lettres, chiffres et _ sont autorisés
                </span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="email">Email :</label>
              <input 
                id="email"
                type="email" 
                formControlName="email"
                class="form-control"
                [class.error]="emailControl.invalid && emailControl.touched">
              
              <div *ngIf="emailControl.invalid && emailControl.touched" class="error-message">
                <span *ngIf="emailControl.errors?.['required']">L'email est requis</span>
                <span *ngIf="emailControl.errors?.['email']">Format d'email invalide</span>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Prénom :</label>
              <input 
                id="firstName"
                type="text" 
                formControlName="firstName"
                class="form-control">
            </div>
            
            <div class="form-group">
              <label for="lastName">Nom :</label>
              <input 
                id="lastName"
                type="text" 
                formControlName="lastName"
                class="form-control">
            </div>
          </div>
        </fieldset>
        
        <!-- Mot de passe -->
        <fieldset class="form-section">
          <legend>Mot de passe</legend>
          
          <div class="form-group">
            <label for="password">Mot de passe :</label>
            <input 
              id="password"
              type="password" 
              formControlName="password"
              class="form-control"
              [class.error]="passwordControl.invalid && passwordControl.touched">
            
            <div *ngIf="passwordControl.invalid && passwordControl.touched" class="error-message">
              <span *ngIf="passwordControl.errors?.['required']">Le mot de passe est requis</span>
              <span *ngIf="passwordControl.errors?.['minlength']">
                Minimum {{ passwordControl.errors?.['minlength'].requiredLength }} caractères
              </span>
              <span *ngIf="passwordControl.errors?.['pattern']">
                Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre
              </span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe :</label>
            <input 
              id="confirmPassword"
              type="password" 
              formControlName="confirmPassword"
              class="form-control"
              [class.error]="confirmPasswordControl.invalid && confirmPasswordControl.touched">
            
            <div *ngIf="confirmPasswordControl.invalid && confirmPasswordControl.touched" class="error-message">
              <span *ngIf="confirmPasswordControl.errors?.['required']">La confirmation est requise</span>
              <span *ngIf="confirmPasswordControl.errors?.['passwordMismatch']">
                Les mots de passe ne correspondent pas
              </span>
            </div>
          </div>
        </fieldset>
        
        <!-- Compétences -->
        <fieldset class="form-section">
          <legend>Compétences</legend>
          
          <div formArrayName="skills">
            <div *ngFor="let skillControl of skillsArray.controls; let i = index" 
                 class="skill-item">
              <input 
                [formControlName]="i"
                placeholder="Compétence {{ i + 1 }}"
                class="form-control skill-input">
              
              <button 
                type="button" 
                (click)="removeSkill(i)"
                class="btn btn-danger btn-sm"
                [disabled]="skillsArray.length <= 1">
                Supprimer
              </button>
            </div>
          </div>
          
          <button 
            type="button" 
            (click)="addSkill()"
            class="btn btn-outline">
            Ajouter une compétence
          </button>
        </fieldset>
        
        <!-- Boutons d'action -->
        <div class="form-actions">
          <button 
            type="submit" 
            [disabled]="userForm.invalid || isSubmitting"
            class="btn btn-primary">
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
          
          <button 
            type="button" 
            (click)="resetForm()"
            class="btn btn-secondary">
            Réinitialiser
          </button>
        </div>
      </form>
      
      <!-- Debug -->
      <div class="form-debug" *ngIf="showDebug">
        <h4>État du formulaire :</h4>
        <pre>{{ userForm.value | json }}</pre>
        <h4>Erreurs :</h4>
        <pre>{{ getFormErrors() | json }}</pre>
      </div>
      
      <button 
        type="button" 
        (click)="toggleDebug()"
        class="btn btn-outline btn-sm">
        {{ showDebug ? 'Masquer' : 'Afficher' }} debug
      </button>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-section {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .form-section legend {
      font-weight: bold;
      padding: 0 10px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-control.error {
      border-color: #dc3545;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .skill-item {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      align-items: center;
    }
    
    .skill-input {
      flex: 1;
    }
    
    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
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
    
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .form-debug {
      margin-top: 30px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
    
    .form-debug pre {
      background-color: #e9ecef;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isSubmitting = false;
  showDebug = false;
  
  // Getters pour accéder aux contrôles
  get usernameControl() { return this.userForm.get('username')!; }
  get emailControl() { return this.userForm.get('email')!; }
  get passwordControl() { return this.userForm.get('password')!; }
  get confirmPasswordControl() { return this.userForm.get('confirmPassword')!; }
  get skillsArray() { return this.userForm.get('skills') as FormArray; }
  
  ngOnInit() {
    this.createForm();
  }
  
  createForm() {
    this.userForm = new FormGroup({
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]),
      confirmPassword: new FormControl('', [
        Validators.required
      ]),
      skills: new FormArray([
        new FormControl('', Validators.required)
      ])
    }, { validators: this.passwordMatchValidator });
  }
  
  // Validateur personnalisé pour vérifier la correspondance des mots de passe
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }
  
  addSkill() {
    this.skillsArray.push(new FormControl('', Validators.required));
  }
  
  removeSkill(index: number) {
    if (this.skillsArray.length > 1) {
      this.skillsArray.removeAt(index);
    }
  }
  
  onSubmit() {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      
      const userData: UserCreate = {
        username: this.userForm.value.username,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        first_name: this.userForm.value.firstName,
        last_name: this.userForm.value.lastName
      };
      
      console.log('Données utilisateur:', userData);
      console.log('Compétences:', this.userForm.value.skills);
      
      // Simulation d'un appel API
      setTimeout(() => {
        this.isSubmitting = false;
        console.log('Utilisateur créé avec succès !');
        this.resetForm();
      }, 2000);
    } else {
      console.log('Formulaire invalide');
      this.userForm.markAllAsTouched();
    }
  }
  
  resetForm() {
    this.userForm.reset();
    this.skillsArray.clear();
    this.addSkill(); // Ajouter au moins une compétence
  }
  
  toggleDebug() {
    this.showDebug = !this.showDebug;
  }
  
  getFormErrors() {
    const errors: any = {};
    
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    
    return errors;
  }
}
```

## 4. Validateurs personnalisés

### Validateurs synchrones

```typescript
// core/validators/custom.validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  // Validateur pour vérifier la correspondance des mots de passe
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordField);
      const confirmPassword = control.get(confirmPasswordField);
      
      if (password && confirmPassword && password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }
      
      return null;
    };
  }
  
  // Validateur pour les numéros de téléphone français
  static frenchPhoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      
      if (!phoneRegex.test(control.value)) {
        return { frenchPhoneNumber: true };
      }
      
      return null;
    };
  }
  
  // Validateur pour les codes postaux français
  static frenchPostalCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const postalCodeRegex = /^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/;
      
      if (!postalCodeRegex.test(control.value)) {
        return { frenchPostalCode: true };
      }
      
      return null;
    };
  }
  
  // Validateur pour les mots de passe forts
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const password = control.value;
      const errors: ValidationErrors = {};
      
      if (password.length < 8) {
        errors.minLength = { requiredLength: 8, actualLength: password.length };
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.noUppercase = true;
      }
      
      if (!/[a-z]/.test(password)) {
        errors.noLowercase = true;
      }
      
      if (!/\d/.test(password)) {
        errors.noDigit = true;
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.noSpecialChar = true;
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }
  
  // Validateur pour les âges
  static ageRange(minAge: number, maxAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const age = control.value;
      
      if (age < minAge || age > maxAge) {
        return { ageRange: { minAge, maxAge, actualAge: age } };
      }
      
      return null;
    };
  }
  
  // Validateur pour les URLs
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: true };
      }
    };
  }
  
  // Validateur pour les nombres pairs
  static evenNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const number = Number(control.value);
      
      if (isNaN(number) || number % 2 !== 0) {
        return { evenNumber: true };
      }
      
      return null;
    };
  }
  
  // Validateur pour les nombres impairs
  static oddNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const number = Number(control.value);
      
      if (isNaN(number) || number % 2 === 0) {
        return { oddNumber: true };
      }
      
      return null;
    };
  }
}
```

### Validateurs asynchrones

```typescript
// core/validators/async.validators.ts
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';

export class AsyncValidators {
  
  // Validateur asynchrone pour vérifier l'unicité de l'email
  static uniqueEmail(userService: UserService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      
      // Délai pour éviter trop de requêtes
      return timer(500).pipe(
        switchMap(() => userService.checkEmailExists(control.value)),
        map(exists => exists ? { emailExists: true } : null),
        catchError(() => of(null))
      );
    };
  }
  
  // Validateur asynchrone pour vérifier l'unicité du nom d'utilisateur
  static uniqueUsername(userService: UserService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      
      return timer(500).pipe(
        switchMap(() => userService.checkUsernameExists(control.value)),
        map(exists => exists ? { usernameExists: true } : null),
        catchError(() => of(null))
      );
    };
  }
  
  // Validateur asynchrone pour vérifier la validité d'un code postal
  static validPostalCode(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      
      // Simulation d'un appel API pour vérifier le code postal
      return timer(1000).pipe(
        map(() => {
          // Simulation : codes postaux valides entre 1000 et 99999
          const postalCode = Number(control.value);
          return (postalCode >= 1000 && postalCode <= 99999) ? null : { invalidPostalCode: true };
        }),
        catchError(() => of(null))
      );
    };
  }
}
```

## 5. Composant de formulaire avec validation avancée

```typescript
// components/product-form.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Product, ProductCreate, ProductUpdate } from '../../core/models/product.model';
import { CustomValidators } from '../../core/validators/custom.validators';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <h3>{{ isEditMode ? 'Modifier le produit' : 'Nouveau produit' }}</h3>
      
      <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
        <!-- Informations de base -->
        <fieldset class="form-section">
          <legend>Informations de base</legend>
          
          <div class="form-group">
            <label for="name">Nom du produit *</label>
            <input 
              id="name"
              type="text" 
              formControlName="name"
              class="form-control"
              [class.error]="nameControl.invalid && nameControl.touched"
              placeholder="Nom du produit">
            
            <div *ngIf="nameControl.invalid && nameControl.touched" class="error-message">
              <span *ngIf="nameControl.errors?.['required']">Le nom est requis</span>
              <span *ngIf="nameControl.errors?.['minlength']">
                Minimum {{ nameControl.errors?.['minlength'].requiredLength }} caractères
              </span>
              <span *ngIf="nameControl.errors?.['maxlength']">
                Maximum {{ nameControl.errors?.['maxlength'].requiredLength }} caractères
              </span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description"
              formControlName="description"
              class="form-control"
              rows="4"
              placeholder="Description du produit"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="price">Prix *</label>
              <input 
                id="price"
                type="number" 
                formControlName="price"
                class="form-control"
                [class.error]="priceControl.invalid && priceControl.touched"
                step="0.01"
                min="0"
                placeholder="0.00">
              
              <div *ngIf="priceControl.invalid && priceControl.touched" class="error-message">
                <span *ngIf="priceControl.errors?.['required']">Le prix est requis</span>
                <span *ngIf="priceControl.errors?.['min']">
                  Le prix doit être supérieur à {{ priceControl.errors?.['min'].min }}
                </span>
                <span *ngIf="priceControl.errors?.['pattern']">Format de prix invalide</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="category">Catégorie *</label>
              <select 
                id="category"
                formControlName="category"
                class="form-control"
                [class.error]="categoryControl.invalid && categoryControl.touched">
                <option value="">Sélectionner une catégorie</option>
                <option *ngFor="let category of categories" [value]="category">
                  {{ category }}
                </option>
              </select>
              
              <div *ngIf="categoryControl.invalid && categoryControl.touched" class="error-message">
                <span *ngIf="categoryControl.errors?.['required']">La catégorie est requise</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="stockQuantity">Quantité en stock *</label>
            <input 
              id="stockQuantity"
              type="number" 
              formControlName="stockQuantity"
              class="form-control"
              [class.error]="stockQuantityControl.invalid && stockQuantityControl.touched"
              min="0"
              placeholder="0">
            
            <div *ngIf="stockQuantityControl.invalid && stockQuantityControl.touched" class="error-message">
              <span *ngIf="stockQuantityControl.errors?.['required']">La quantité est requise</span>
              <span *ngIf="stockQuantityControl.errors?.['min']">
                La quantité doit être supérieure ou égale à {{ stockQuantityControl.errors?.['min'].min }}
              </span>
            </div>
          </div>
        </fieldset>
        
        <!-- Images du produit -->
        <fieldset class="form-section">
          <legend>Images du produit</legend>
          
          <div formArrayName="images">
            <div *ngFor="let imageControl of imagesArray.controls; let i = index" 
                 class="image-item">
              <input 
                [formControlName]="i"
                type="url"
                placeholder="URL de l'image {{ i + 1 }}"
                class="form-control image-input"
                [class.error]="imageControl.invalid && imageControl.touched">
              
              <div *ngIf="imageControl.value" class="image-preview">
                <img [src]="imageControl.value" 
                     [alt]="'Image ' + (i + 1)"
                     (error)="onImageError($event)">
              </div>
              
              <button 
                type="button" 
                (click)="removeImage(i)"
                class="btn btn-danger btn-sm"
                [disabled]="imagesArray.length <= 1">
                Supprimer
              </button>
            </div>
          </div>
          
          <button 
            type="button" 
            (click)="addImage()"
            class="btn btn-outline">
            Ajouter une image
          </button>
        </fieldset>
        
        <!-- Boutons d'action -->
        <div class="form-actions">
          <button 
            type="submit" 
            [disabled]="productForm.invalid || isSubmitting"
            class="btn btn-primary">
            {{ isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer') }}
          </button>
          
          <button 
            type="button" 
            (click)="resetForm()"
            class="btn btn-secondary">
            Réinitialiser
          </button>
          
          <button 
            type="button" 
            (click)="cancel()"
            class="btn btn-outline">
            Annuler
          </button>
        </div>
      </form>
      
      <!-- Messages de validation -->
      <div *ngIf="productForm.invalid && productForm.touched" class="validation-summary">
        <h4>Erreurs de validation :</h4>
        <ul>
          <li *ngFor="let error of getValidationErrors()">{{ error }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-section {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .form-section legend {
      font-weight: bold;
      padding: 0 10px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-control.error {
      border-color: #dc3545;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .image-item {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      align-items: flex-start;
    }
    
    .image-input {
      flex: 1;
    }
    
    .image-preview {
      width: 100px;
      height: 100px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-secondary {
      background-color: #6c757d;
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
    
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .validation-summary {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }
    
    .validation-summary h4 {
      color: #721c24;
      margin-top: 0;
    }
    
    .validation-summary ul {
      color: #721c24;
      margin: 0;
      padding-left: 20px;
    }
  `]
})
export class ProductFormComponent implements OnInit {
  @Input() product?: Product;
  @Input() isEditMode = false;
  
  productForm!: FormGroup;
  isSubmitting = false;
  
  categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Beauty',
    'Toys',
    'Automotive',
    'Food & Beverages',
    'Health & Wellness'
  ];
  
  // Getters pour accéder aux contrôles
  get nameControl() { return this.productForm.get('name')!; }
  get priceControl() { return this.productForm.get('price')!; }
  get categoryControl() { return this.productForm.get('category')!; }
  get stockQuantityControl() { return this.productForm.get('stockQuantity')!; }
  get imagesArray() { return this.productForm.get('images') as FormArray; }
  
  ngOnInit() {
    this.createForm();
    if (this.product) {
      this.populateForm();
    }
  }
  
  createForm() {
    this.productForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]),
      description: new FormControl(''),
      price: new FormControl(0, [
        Validators.required,
        Validators.min(0.01),
        Validators.pattern(/^\d+(\.\d{1,2})?$/)
      ]),
      category: new FormControl('', Validators.required),
      stockQuantity: new FormControl(0, [
        Validators.required,
        Validators.min(0)
      ]),
      images: new FormArray([
        new FormControl('', CustomValidators.url())
      ])
    });
  }
  
  populateForm() {
    if (this.product) {
      this.productForm.patchValue({
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        category: this.product.category,
        stockQuantity: this.product.stock_quantity
      });
      
      // Ajouter les images existantes
      this.imagesArray.clear();
      if (this.product.images && this.product.images.length > 0) {
        this.product.images.forEach(image => {
          this.imagesArray.push(new FormControl(image, CustomValidators.url()));
        });
      } else {
        this.addImage();
      }
    }
  }
  
  addImage() {
    this.imagesArray.push(new FormControl('', CustomValidators.url()));
  }
  
  removeImage(index: number) {
    if (this.imagesArray.length > 1) {
      this.imagesArray.removeAt(index);
    }
  }
  
  onSubmit() {
    if (this.productForm.valid) {
      this.isSubmitting = true;
      
      const productData: ProductCreate | ProductUpdate = {
        name: this.productForm.value.name,
        description: this.productForm.value.description,
        price: this.productForm.value.price,
        category: this.productForm.value.category,
        stock_quantity: this.productForm.value.stockQuantity
      };
      
      console.log('Données du produit:', productData);
      console.log('Images:', this.productForm.value.images);
      
      // Simulation d'un appel API
      setTimeout(() => {
        this.isSubmitting = false;
        console.log(this.isEditMode ? 'Produit mis à jour !' : 'Produit créé !');
        this.resetForm();
      }, 2000);
    } else {
      console.log('Formulaire invalide');
      this.productForm.markAllAsTouched();
    }
  }
  
  resetForm() {
    this.productForm.reset();
    this.imagesArray.clear();
    this.addImage();
  }
  
  cancel() {
    if (this.isEditMode) {
      this.populateForm();
    } else {
      this.resetForm();
    }
  }
  
  onImageError(event: any) {
    event.target.src = '/assets/no-image.png';
  }
  
  getValidationErrors(): string[] {
    const errors: string[] = [];
    
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control && control.invalid && control.touched) {
        Object.keys(control.errors || {}).forEach(errorKey => {
          switch (errorKey) {
            case 'required':
              errors.push(`${this.getFieldLabel(key)} est requis`);
              break;
            case 'minlength':
              errors.push(`${this.getFieldLabel(key)} doit contenir au moins ${control.errors?.[errorKey].requiredLength} caractères`);
              break;
            case 'maxlength':
              errors.push(`${this.getFieldLabel(key)} ne peut pas dépasser ${control.errors?.[errorKey].requiredLength} caractères`);
              break;
            case 'min':
              errors.push(`${this.getFieldLabel(key)} doit être supérieur à ${control.errors?.[errorKey].min}`);
              break;
            case 'pattern':
              errors.push(`Format de ${this.getFieldLabel(key)} invalide`);
              break;
            case 'url':
              errors.push(`${this.getFieldLabel(key)} doit être une URL valide`);
              break;
          }
        });
      }
    });
    
    return errors;
  }
  
  private getFieldLabel(key: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nom',
      description: 'Description',
      price: 'Prix',
      category: 'Catégorie',
      stockQuantity: 'Quantité en stock',
      images: 'Images'
    };
    return labels[key] || key;
  }
}
```

## Exercices pratiques

### Exercice 1: Formulaire de contact
Créez un formulaire de contact avec validation pour nom, email, sujet et message.

### Exercice 2: Formulaire de commande
Implémentez un formulaire de commande avec sélection de produits et calcul automatique du total.

### Exercice 3: Formulaire d'inscription
Créez un formulaire d'inscription avec validation asynchrone pour vérifier l'unicité de l'email.

## Prochaines étapes

Maintenant que vous maîtrisez les formulaires réactifs, nous passerons au Module 5 : Authentification JWT complète pour apprendre à sécuriser votre application.
