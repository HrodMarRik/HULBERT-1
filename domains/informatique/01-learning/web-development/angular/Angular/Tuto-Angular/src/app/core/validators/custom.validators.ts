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
