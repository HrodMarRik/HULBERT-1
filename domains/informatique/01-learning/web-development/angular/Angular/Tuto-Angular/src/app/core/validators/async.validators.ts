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
