import { Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

export interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InlineEditService {
  private toastQueue: ToastNotification[] = [];
  private changeHistory: Array<{ timestamp: Date; field: string; oldValue: any; newValue: any }> = [];
  
  constructor() {}
  
  /**
   * Wrapper pour les appels API avec retry logic
   */
  saveWithRetry<T>(apiCall: Observable<T>, retryCount: number = 2): Observable<T> {
    return apiCall.pipe(
      retry({
        count: retryCount,
        delay: (error, retryCount) => {
          console.log(`Retry attempt ${retryCount} after error:`, error);
          return timer(1000 * retryCount); // Exponential backoff
        }
      }),
      catchError(error => {
        this.showToast({
          message: `Failed to save: ${error.error?.detail || error.message || 'Unknown error'}`,
          type: 'error',
          duration: 5000
        });
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Afficher une notification toast
   */
  showToast(notification: ToastNotification) {
    this.toastQueue.push(notification);
    console.log(`[Toast ${notification.type}]:`, notification.message);
    
    // Auto-remove after duration
    const duration = notification.duration || 3000;
    setTimeout(() => {
      const index = this.toastQueue.indexOf(notification);
      if (index > -1) {
        this.toastQueue.splice(index, 1);
      }
    }, duration);
  }
  
  /**
   * Logger un changement
   */
  logChange(field: string, oldValue: any, newValue: any) {
    this.changeHistory.push({
      timestamp: new Date(),
      field,
      oldValue,
      newValue
    });
    
    // Keep only last 50 changes
    if (this.changeHistory.length > 50) {
      this.changeHistory.shift();
    }
    
    console.log(`[Field Updated] ${field}: ${oldValue} -> ${newValue}`);
  }
  
  /**
   * Obtenir l'historique des changements
   */
  getChangeHistory() {
    return [...this.changeHistory];
  }
  
  /**
   * Obtenir les toasts actifs
   */
  getToasts() {
    return [...this.toastQueue];
  }
  
  /**
   * Effacer l'historique
   */
  clearHistory() {
    this.changeHistory = [];
  }
  
  /**
   * Valider une valeur selon le type
   */
  validateValue(value: any, type: string): { valid: boolean; error?: string } {
    if (value === null || value === undefined || value === '') {
      return { valid: true }; // Allow empty values
    }
    
    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, error: 'Invalid email format' };
        }
        break;
        
      case 'tel':
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
          return { valid: false, error: 'Invalid phone number format' };
        }
        break;
        
      case 'url':
        try {
          new URL(value);
        } catch {
          return { valid: false, error: 'Invalid URL format' };
        }
        break;
        
      case 'number':
      case 'currency':
        if (isNaN(Number(value))) {
          return { valid: false, error: 'Must be a valid number' };
        }
        break;
    }
    
    return { valid: true };
  }
  
  /**
   * Formater une valeur pour l'affichage
   */
  formatValue(value: any, type: string, options?: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    switch (type) {
      case 'currency':
        const symbol = options?.currencySymbol || '€';
        return `${Number(value).toFixed(2)} ${symbol}`;
        
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
        
      case 'number':
        return Number(value).toString();
        
      default:
        return String(value);
    }
  }
}

