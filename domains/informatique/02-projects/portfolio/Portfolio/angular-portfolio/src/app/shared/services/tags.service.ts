import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';

export interface Tag {
  id: number;
  name: string;
  entity_type?: string;
  usage_count?: number;
  created_at: string;
}

export interface TagSuggestion {
  name: string;
  usage_count: number;
}

export interface TagCreate {
  name: string;
  entity_type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private apiUrl = 'http://localhost:8000/api/tags';
  private tagsCache$ = new BehaviorSubject<Tag[]>([]);
  private suggestionsCache = new Map<string, TagSuggestion[]>();

  constructor(private http: HttpClient) {
    this.loadAllTags();
  }

  /**
   * Charge tous les tags depuis l'API
   */
  private loadAllTags(): void {
    this.http.get<Tag[]>(this.apiUrl)
      .pipe(
        tap(tags => this.tagsCache$.next(tags)),
        shareReplay(1)
      )
      .subscribe({
        error: (error) => {
          console.error('Error loading tags:', error);
          // En cas d'erreur, utiliser des tags par défaut
          this.tagsCache$.next(this.getDefaultTags());
        }
      });
  }

  /**
   * Retourne tous les tags disponibles
   */
  getAllTags(): Observable<Tag[]> {
    return this.tagsCache$.asObservable();
  }

  /**
   * Obtient les suggestions de tags pour un type d'entité
   */
  getSuggestions(entityType?: string, query?: string): Observable<TagSuggestion[]> {
    const cacheKey = `${entityType || 'all'}_${query || ''}`;
    
    if (this.suggestionsCache.has(cacheKey)) {
      return new Observable(observer => {
        observer.next(this.suggestionsCache.get(cacheKey)!);
        observer.complete();
      });
    }

    let url = `${this.apiUrl}/suggestions`;
    const params: any = {};
    
    if (entityType) {
      params.entity_type = entityType;
    }
    if (query) {
      params.query = query;
    }

    return this.http.get<TagSuggestion[]>(url, { params })
      .pipe(
        tap(suggestions => {
          this.suggestionsCache.set(cacheKey, suggestions);
        }),
        shareReplay(1)
      );
  }

  /**
   * Crée un nouveau tag
   */
  createTag(tagData: TagCreate): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, tagData)
      .pipe(
        tap(newTag => {
          // Ajouter le nouveau tag au cache
          const currentTags = this.tagsCache$.value;
          this.tagsCache$.next([...currentTags, newTag]);
          
          // Invalider le cache des suggestions
          this.suggestionsCache.clear();
        })
      );
  }

  /**
   * Recherche des tags par nom
   */
  searchTags(query: string, entityType?: string): Observable<Tag[]> {
    return this.getAllTags().pipe(
      map(tags => {
        let filteredTags = tags;
        
        if (entityType) {
          filteredTags = filteredTags.filter(tag => 
            !tag.entity_type || tag.entity_type === entityType
          );
        }
        
        if (query) {
          const lowerQuery = query.toLowerCase();
          filteredTags = filteredTags.filter(tag => 
            tag.name.toLowerCase().includes(lowerQuery)
          );
        }
        
        return filteredTags.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
      })
    );
  }

  /**
   * Parse une chaîne de tags séparés par virgules
   */
  parseTagsString(tagsString: string): string[] {
    if (!tagsString || tagsString.trim() === '') {
      return [];
    }
    
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Formate un tableau de tags en chaîne
   */
  formatTagsArray(tags: string[]): string {
    return tags.join(', ');
  }

  /**
   * Valide un nom de tag
   */
  validateTagName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Le nom du tag ne peut pas être vide' };
    }
    
    if (name.length > 50) {
      return { valid: false, error: 'Le nom du tag ne peut pas dépasser 50 caractères' };
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { valid: false, error: 'Le nom du tag ne peut contenir que des lettres, chiffres, espaces, tirets et underscores' };
    }
    
    return { valid: true };
  }

  /**
   * Tags par défaut en cas d'erreur API
   */
  private getDefaultTags(): Tag[] {
    return [
      { id: 1, name: 'urgent', entity_type: 'ticket', usage_count: 5, created_at: new Date().toISOString() },
      { id: 2, name: 'bug', entity_type: 'ticket', usage_count: 10, created_at: new Date().toISOString() },
      { id: 3, name: 'feature', entity_type: 'ticket', usage_count: 8, created_at: new Date().toISOString() },
      { id: 4, name: 'client', entity_type: 'company', usage_count: 15, created_at: new Date().toISOString() },
      { id: 5, name: 'prospect', entity_type: 'company', usage_count: 7, created_at: new Date().toISOString() },
      { id: 6, name: 'important', entity_type: 'project', usage_count: 12, created_at: new Date().toISOString() },
      { id: 7, name: 'meeting', entity_type: 'event', usage_count: 20, created_at: new Date().toISOString() },
      { id: 8, name: 'deadline', entity_type: 'event', usage_count: 6, created_at: new Date().toISOString() }
    ];
  }

  /**
   * Incrémente le compteur d'utilisation des tags
   */
  incrementTagUsage(tagNames: string[], entityType?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/increment-usage`, {
      tag_names: tagNames,
      entity_type: entityType
    });
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.suggestionsCache.clear();
    this.loadAllTags();
  }
}
