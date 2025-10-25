import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse, CalendarStats } from '../../models/calendar.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = 'http://localhost:8000/api/calendar';

  constructor(private http: HttpClient) {}

  getEvents(filters?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Observable<CalendarEventResponse[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.skip !== undefined) params = params.set('skip', filters.skip.toString());
      if (filters.limit !== undefined) params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get<CalendarEventResponse[]>(`${this.apiUrl}/events`, { params });
  }

  getUpcomingEvents(limit: number = 10): Observable<CalendarEventResponse[]> {
    return this.http.get<CalendarEventResponse[]>(`${this.apiUrl}/events/upcoming`, {
      params: { limit: limit.toString() }
    });
  }

  getEventById(id: number): Observable<CalendarEventResponse> {
    return this.http.get<CalendarEventResponse>(`${this.apiUrl}/events/${id}`);
  }

  createEvent(event: CalendarEventCreate): Observable<CalendarEventResponse> {
    return this.http.post<CalendarEventResponse>(`${this.apiUrl}/events`, event);
  }

  updateEvent(id: number, event: CalendarEventUpdate): Observable<CalendarEventResponse> {
    return this.http.put<CalendarEventResponse>(`${this.apiUrl}/events/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events/${id}`);
  }

  getStats(): Observable<CalendarStats> {
    return this.http.get<CalendarStats>(`${this.apiUrl}/stats/summary`);
  }
}

