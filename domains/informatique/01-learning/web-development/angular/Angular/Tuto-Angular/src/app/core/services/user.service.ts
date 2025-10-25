import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserCreate, UserUpdate } from '../models/user.model';
import { API_CONFIG } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Obtenir tous les utilisateurs
   */
  getUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
    const params = this.apiService.createParams({ skip, limit });
    
    return this.apiService.get<User[]>(API_CONFIG.ENDPOINTS.USERS.BASE, params)
      .pipe(
        tap(users => {
          this.usersSubject.next(users);
        }),
        catchError(error => {
          console.error('Error fetching users:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir un utilisateur par ID
   */
  getUser(id: number): Observable<User> {
    return this.apiService.get<User>(`${API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching user ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer un nouvel utilisateur
   */
  createUser(userData: UserCreate): Observable<User> {
    return this.apiService.post<User>(API_CONFIG.ENDPOINTS.USERS.BASE, userData)
      .pipe(
        tap(user => {
          const currentUsers = this.usersSubject.value;
          this.usersSubject.next([...currentUsers, user]);
        }),
        catchError(error => {
          console.error('Error creating user:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUser(id: number, userData: UserUpdate): Observable<User> {
    return this.apiService.put<User>(`${API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`, userData)
      .pipe(
        tap(updatedUser => {
          const currentUsers = this.usersSubject.value;
          const index = currentUsers.findIndex(user => user.id === id);
          if (index !== -1) {
            currentUsers[index] = updatedUser;
            this.usersSubject.next([...currentUsers]);
          }
        }),
        catchError(error => {
          console.error(`Error updating user ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(id: number): Observable<any> {
    return this.apiService.delete(`${API_CONFIG.ENDPOINTS.USERS.BASE}/${id}`)
      .pipe(
        tap(() => {
          const currentUsers = this.usersSubject.value;
          const filteredUsers = currentUsers.filter(user => user.id !== id);
          this.usersSubject.next(filteredUsers);
        }),
        catchError(error => {
          console.error(`Error deleting user ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Rechercher des utilisateurs
   */
  searchUsers(query: string, skip: number = 0, limit: number = 100): Observable<User[]> {
    const params = this.apiService.createParams({ 
      query, 
      skip, 
      limit 
    });
    
    return this.apiService.get<User[]>(API_CONFIG.ENDPOINTS.USERS.SEARCH, params)
      .pipe(
        catchError(error => {
          console.error('Error searching users:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les utilisateurs actifs
   */
  getActiveUsers(skip: number = 0, limit: number = 100): Observable<User[]> {
    const params = this.apiService.createParams({ 
      is_active: true,
      skip, 
      limit 
    });
    
    return this.apiService.get<User[]>(API_CONFIG.ENDPOINTS.USERS.BASE, params)
      .pipe(
        catchError(error => {
          console.error('Error fetching active users:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  getUserStats(): Observable<any> {
    return this.apiService.get(API_CONFIG.ENDPOINTS.USERS.STATS)
      .pipe(
        catchError(error => {
          console.error('Error fetching user stats:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Activer un utilisateur
   */
  activateUser(id: number): Observable<User> {
    return this.updateUser(id, { is_active: true })
      .pipe(
        catchError(error => {
          console.error(`Error activating user ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Désactiver un utilisateur
   */
  deactivateUser(id: number): Observable<User> {
    return this.updateUser(id, { is_active: false })
      .pipe(
        catchError(error => {
          console.error(`Error deactivating user ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir les utilisateurs avec pagination
   */
  getUsersPaginated(page: number = 0, size: number = 10): Observable<{items: User[], total: number}> {
    return this.apiService.getPaginated<User>(API_CONFIG.ENDPOINTS.USERS.BASE, page, size)
      .pipe(
        catchError(error => {
          console.error('Error fetching paginated users:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtenir la liste actuelle des utilisateurs
   */
  getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }

  /**
   * Effacer le cache des utilisateurs
   */
  clearUsersCache(): void {
    this.usersSubject.next([]);
  }
}
