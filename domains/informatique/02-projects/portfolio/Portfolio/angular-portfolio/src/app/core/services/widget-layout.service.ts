import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, debounceTime, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface WidgetPosition {
  id: string;
  order: number;
  cols: number;
  rows: number;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetLayoutService {
  private readonly STORAGE_KEY = 'dashboard-widget-layout';
  private layoutSubject = new BehaviorSubject<WidgetPosition[]>([]);
  public layout$ = this.layoutSubject.asObservable();
  
  private saveQueue$ = new BehaviorSubject<WidgetPosition[] | null>(null);

  constructor(private http: HttpClient) {
    // Débouncer la sauvegarde API (500ms)
    this.saveQueue$.pipe(
      debounceTime(500)
    ).subscribe(layout => {
      if (layout) {
        this.saveToAPI(layout).subscribe();
      }
    });
  }

  /**
   * Charger le layout depuis LocalStorage ou API
   */
  loadLayout(): WidgetPosition[] {
    // 1. Essayer de charger depuis LocalStorage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const layout = JSON.parse(stored);
        this.layoutSubject.next(layout);
        return layout;
      } catch (e) {
        console.error('Error parsing stored layout:', e);
      }
    }

    // 2. Charger depuis l'API en arrière-plan
    this.loadFromAPI().subscribe(layout => {
      if (layout && layout.length > 0) {
        this.layoutSubject.next(layout);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layout));
      }
    });

    // 3. Retourner le layout par défaut
    return this.getDefaultLayout();
  }

  /**
   * Sauvegarder le layout
   */
  saveLayout(layout: WidgetPosition[]): void {
    // 1. Sauvegarder immédiatement dans LocalStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layout));
    this.layoutSubject.next(layout);

    // 2. Débouncer la sauvegarde API
    this.saveQueue$.next(layout);
  }

  /**
   * Réinitialiser le layout aux valeurs par défaut
   */
  resetLayout(): WidgetPosition[] {
    const defaultLayout = this.getDefaultLayout();
    localStorage.removeItem(this.STORAGE_KEY);
    this.layoutSubject.next(defaultLayout);
    
    // Supprimer aussi sur l'API
    this.deleteFromAPI().subscribe();
    
    return defaultLayout;
  }

  /**
   * Layout par défaut (ordre de fréquence d'utilisation)
   */
  private getDefaultLayout(): WidgetPosition[] {
    return [
      { id: 'projects', order: 0, cols: 1, rows: 1 },      // Projets (1x1)
      { id: 'invoicing', order: 1, cols: 2, rows: 1 },     // Facturation (2x1)
      { id: 'tickets', order: 2, cols: 1, rows: 1 },      // Tickets (1x1)
      { id: 'calendar', order: 3, cols: 1, rows: 1 },     // Calendrier (1x1)
      { id: 'todo', order: 4, cols: 1, rows: 1 },        // Todo (1x1)
      { id: 'contacts', order: 5, cols: 1, rows: 1 },     // Contacts (1x1)
      { id: 'companies', order: 6, cols: 1, rows: 1 },    // Companies (1x1)
      { id: 'errors', order: 7, cols: 1, rows: 1 },      // Erreurs (1x1)
      { id: 'agents', order: 8, cols: 1, rows: 1 },       // Agents (1x1)
      { id: 'weather', order: 9, cols: 1, rows: 1 },     // Météo (1x1)
      { id: 'rss', order: 10, cols: 1, rows: 1 },         // RSS (1x1)
      { id: 'email-security', order: 11, cols: 1, rows: 1 }, // Email Security (1x1)
      { id: 'portfolio', order: 12, cols: 1, rows: 1 },   // Portfolio (1x1)
      { id: 'wishlist', order: 13, cols: 1, rows: 1 },    // Wishlist (1x1)
      { id: 'email-campaigns', order: 14, cols: 1, rows: 1 }, // Email Campaigns (1x1)
    ];
  }

  /**
   * Charger depuis l'API
   */
  private loadFromAPI(): Observable<WidgetPosition[]> {
    return this.http.get<WidgetPosition[]>(`${environment.apiUrl}/dashboard/widget-layout`).pipe(
      catchError(error => {
        console.error('Error loading layout from API:', error);
        return of([]);
      })
    );
  }

  /**
   * Sauvegarder sur l'API
   */
  private saveToAPI(layout: WidgetPosition[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/dashboard/widget-layout`, layout).pipe(
      catchError(error => {
        console.error('Error saving layout to API:', error);
        return of(null);
      })
    );
  }

  /**
   * Supprimer de l'API
   */
  private deleteFromAPI(): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/dashboard/widget-layout`).pipe(
      catchError(error => {
        console.error('Error deleting layout from API:', error);
        return of(null);
      })
    );
  }
}

