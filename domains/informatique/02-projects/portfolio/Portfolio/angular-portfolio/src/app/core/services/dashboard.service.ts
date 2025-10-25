import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardWidgetsData {
  projects_stats: {
    total: number;
    by_status: {
      planning: number;
      active: number;
      'on-hold': number;
      completed: number;
      cancelled: number;
    };
    total_budget: number;
    average_progress: number;
  };
  tickets_stats: {
    total: number;
    by_status: {
      open: number;
      in_progress: number;
      resolved: number;
      closed: number;
    };
  };
  companies_stats: {
    total: number;
    by_status: {
      client: number;
      prospect: number;
      archived: number;
    };
  };
  contacts_stats: {
    total: number;
    by_status: {
      active: number;
      inactive: number;
    };
  };
  invoicing_stats: {
    invoices: {
      total_count: number;
      paid_count: number;
      paid_percentage: number;
    };
    quotes: {
      total_count: number;
      accepted_count: number;
      conversion_rate: number;
    };
  };
  calendar_stats: {
    total: number;
    upcoming: number;
  };
  todos_stats: {
    total: number;
    by_status: {
      pending: number;
      in_progress: number;
      completed: number;
    };
  };
  recent_errors: Array<{
    timestamp: string;
    level: string;
    module: string;
    message: string;
    request_id?: string;
  }>;
  recent_activity: Array<{
    id: number;
    action: string;
    target: string;
    created_at: string;
    user_id: number;
  }>;
  budget_overview: {
    total_spent: number;
    total_income: number;
    net_income: number;
  };
  agent_metrics: Array<{
    agent_id: string;
    agent_name: string;
    jobs_completed: number;
    jobs_failed: number;
    success_rate: number;
    last_activity?: string;
  }>;
}

export interface RecentError {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  request_id?: string;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  project_id?: number;
  ticket_id?: number;
}

export interface TodoCreate {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  project_id?: number;
  ticket_id?: number;
}

export interface TodoUpdate {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  project_id?: number;
  ticket_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:8000';
  private readonly REFRESH_INTERVAL = 30000; // 30 secondes

  private widgetsDataSubject = new BehaviorSubject<DashboardWidgetsData | null>(null);
  public widgetsData$ = this.widgetsDataSubject.asObservable();

  private refreshInterval$ = interval(this.REFRESH_INTERVAL);

  constructor(private http: HttpClient) {
    // Auto-refresh des données toutes les 30 secondes
    this.refreshInterval$.subscribe(() => {
      this.refreshWidgetsData();
    });
  }

  /**
   * Récupère toutes les données des widgets en une seule requête
   */
  getWidgetsData(): Observable<DashboardWidgetsData> {
    return this.http.get<DashboardWidgetsData>(`${this.API_URL}/api/dashboard/widgets`).pipe(
      map(data => {
        this.widgetsDataSubject.next(data);
        return data;
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des données des widgets:', error);
        throw error;
      })
    );
  }

  /**
   * Rafraîchit les données des widgets
   */
  refreshWidgetsData(): void {
    this.getWidgetsData().subscribe();
  }

  /**
   * Récupère les erreurs récentes
   */
  getRecentErrors(limit: number = 10): Observable<RecentError[]> {
    return this.http.get<RecentError[]>(`${this.API_URL}/api/dashboard/recent-errors?limit=${limit}`);
  }

  /**
   * Récupère la liste des todos
   */
  getTodos(status?: string, priority?: string, overdue?: boolean): Observable<Todo[]> {
    let params: any = {};
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (overdue !== undefined) params.overdue = overdue;

    return this.http.get<Todo[]>(`${this.API_URL}/api/todos`, { params });
  }

  /**
   * Crée un nouveau todo
   */
  createTodo(todo: TodoCreate): Observable<Todo> {
    return this.http.post<Todo>(`${this.API_URL}/api/todos`, todo);
  }

  /**
   * Met à jour un todo
   */
  updateTodo(id: number, todo: TodoUpdate): Observable<Todo> {
    return this.http.patch<Todo>(`${this.API_URL}/api/todos/${id}`, todo);
  }

  /**
   * Supprime un todo
   */
  deleteTodo(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/api/todos/${id}`);
  }

  /**
   * Marque un todo comme terminé
   */
  completeTodo(id: number): Observable<{ message: string; todo: Todo }> {
    return this.http.post<{ message: string; todo: Todo }>(`${this.API_URL}/api/todos/${id}/complete`, {});
  }

  /**
   * Récupère les statistiques des todos
   */
  getTodosStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/todos/stats/summary`);
  }

  /**
   * Sauvegarde la configuration du dashboard
   */
  saveDashboardConfig(userId: number, config: any): Observable<any> {
    return this.http.post(`${this.API_URL}/api/dashboard/users/${userId}/config`, {
      config_json: config
    });
  }

  /**
   * Récupère la configuration du dashboard
   */
  getDashboardConfig(userId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/api/dashboard/users/${userId}/config`);
  }

  /**
   * Supprime la configuration du dashboard
   */
  deleteDashboardConfig(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/api/dashboard/users/${userId}/config`);
  }

  /**
   * Méthode utilitaire pour formater les montants
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Méthode utilitaire pour formater les dates
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Méthode utilitaire pour obtenir la couleur selon le statut
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'completed': '#10b981', // green
      'resolved': '#10b981',
      'paid': '#10b981',
      'accepted': '#10b981',
      'active': '#3b82f6', // blue
      'in_progress': '#3b82f6',
      'open': '#f59e0b', // amber
      'pending': '#f59e0b',
      'planning': '#f59e0b',
      'on-hold': '#f59e0b',
      'cancelled': '#ef4444', // red
      'closed': '#6b7280', // gray
      'overdue': '#ef4444',
      'critical': '#ef4444',
      'high': '#f59e0b',
      'medium': '#3b82f6',
      'low': '#10b981'
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Méthode utilitaire pour obtenir l'icône selon le type
   */
  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'projects': '📊',
      'tickets': '🎫',
      'companies': '🏢',
      'contacts': '👥',
      'invoicing': '💰',
      'calendar': '📅',
      'todos': '✅',
      'errors': '❌',
      'activity': '📈',
      'budget': '💳',
      'agents': '🤖'
    };
    return icons[type] || '📊';
  }
}
