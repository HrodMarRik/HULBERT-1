import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tag {
  id: number;
  name: string;
  entity_type: string;
  usage_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private apiUrl = `${environment.apiUrl}/projects/tags`;

  // Tags statiques pour l'instant
  private staticTags: Tag[] = [
    { id: 1, name: 'urgent', entity_type: 'project', usage_count: 5 },
    { id: 2, name: 'important', entity_type: 'project', usage_count: 3 },
    { id: 3, name: 'web-development', entity_type: 'project', usage_count: 8 },
    { id: 4, name: 'mobile-app', entity_type: 'project', usage_count: 2 },
    { id: 5, name: 'design', entity_type: 'project', usage_count: 6 },
    { id: 6, name: 'frontend', entity_type: 'project', usage_count: 4 },
    { id: 7, name: 'backend', entity_type: 'project', usage_count: 3 },
    { id: 8, name: 'database', entity_type: 'project', usage_count: 2 },
    { id: 9, name: 'api', entity_type: 'project', usage_count: 4 },
    { id: 10, name: 'testing', entity_type: 'project', usage_count: 1 },
  ];

  constructor(private http: HttpClient) {}

  getTags(): Observable<Tag[]> {
    // Utiliser l'API réelle maintenant que le backend fonctionne
    return this.http.get<Tag[]>(this.apiUrl);
    
    // Code de fallback avec données statiques :
    // return of(this.staticTags);
  }

  getTagSuggestions(query?: string): Observable<Tag[]> {
    const params = query ? `?search=${encodeURIComponent(query)}` : '';
    return this.http.get<Tag[]>(`${this.apiUrl}/suggestions${params}`);
    
    // Code de fallback avec données statiques :
    // if (!query) {
    //   return of(this.staticTags.slice(0, 5));
    // }
    // const filteredTags = this.staticTags.filter(tag => 
    //   tag.name.toLowerCase().includes(query.toLowerCase())
    // );
    // return of(filteredTags.slice(0, 10));
  }
}
