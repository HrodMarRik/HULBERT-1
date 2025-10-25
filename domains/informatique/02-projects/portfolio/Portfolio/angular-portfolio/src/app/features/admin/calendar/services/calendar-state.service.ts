import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CalendarEventResponse } from '../../../../models/calendar.model';

// Temporary interfaces (should be moved to models)
interface TicketResponse {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  theme?: string;
}

interface LogResponse {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  user: string;
  entity_type: 'ticket' | 'event' | 'system';
  entity_id?: number;
}

export interface CalendarFilters {
  category: string;
  status: string;
  search: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CalendarViewState {
  currentView: 'month' | 'week' | 'day' | 'list';
  currentDate: Date;
  viewMode: 'calendar' | 'list';
  showEvents: boolean;
  showTickets: boolean;
  showLogs: boolean;
  filters: CalendarFilters;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarStateService {
  // State subjects
  private eventsSubject = new BehaviorSubject<CalendarEventResponse[]>([]);
  private ticketsSubject = new BehaviorSubject<TicketResponse[]>([]);
  private logsSubject = new BehaviorSubject<LogResponse[]>([]);
  private viewStateSubject = new BehaviorSubject<CalendarViewState>({
    currentView: 'month',
    currentDate: new Date(),
    viewMode: 'calendar',
    showEvents: true,
    showTickets: true,
    showLogs: true,
    filters: {
      category: 'all',
      status: 'all',
      search: ''
    }
  });

  // Public observables
  public events$ = this.eventsSubject.asObservable();
  public tickets$ = this.ticketsSubject.asObservable();
  public logs$ = this.logsSubject.asObservable();
  public viewState$ = this.viewStateSubject.asObservable();

  // Action subjects for component communication
  private loadEventsSubject = new Subject<void>();
  private loadTicketsSubject = new Subject<void>();
  private loadLogsSubject = new Subject<void>();
  private refreshCalendarSubject = new Subject<void>();

  public loadEvents$ = this.loadEventsSubject.asObservable();
  public loadTickets$ = this.loadTicketsSubject.asObservable();
  public loadLogs$ = this.loadLogsSubject.asObservable();
  public refreshCalendar$ = this.refreshCalendarSubject.asObservable();

  constructor() {}

  // Events management
  setEvents(events: CalendarEventResponse[]): void {
    this.eventsSubject.next(events);
  }

  getEvents(): CalendarEventResponse[] {
    return this.eventsSubject.value;
  }

  addEvent(event: CalendarEventResponse): void {
    const currentEvents = this.getEvents();
    this.setEvents([...currentEvents, event]);
  }

  updateEvent(updatedEvent: CalendarEventResponse): void {
    const currentEvents = this.getEvents();
    const index = currentEvents.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      currentEvents[index] = updatedEvent;
      this.setEvents([...currentEvents]);
    }
  }

  removeEvent(eventId: number): void {
    const currentEvents = this.getEvents();
    this.setEvents(currentEvents.filter(e => e.id !== eventId));
  }

  // Tickets management
  setTickets(tickets: TicketResponse[]): void {
    this.ticketsSubject.next(tickets);
  }

  getTickets(): TicketResponse[] {
    return this.ticketsSubject.value;
  }

  // Logs management
  setLogs(logs: LogResponse[]): void {
    this.logsSubject.next(logs);
  }

  getLogs(): LogResponse[] {
    return this.logsSubject.value;
  }

  // View state management
  setViewState(state: Partial<CalendarViewState>): void {
    const currentState = this.viewStateSubject.value;
    this.viewStateSubject.next({ ...currentState, ...state });
  }

  getViewState(): CalendarViewState {
    return this.viewStateSubject.value;
  }

  // Specific view state methods
  setCurrentView(view: 'month' | 'week' | 'day' | 'list'): void {
    this.setViewState({ currentView: view });
  }

  setCurrentDate(date: Date): void {
    this.setViewState({ currentDate: date });
  }

  setViewMode(mode: 'calendar' | 'list'): void {
    this.setViewState({ viewMode: mode });
  }

  toggleShowEvents(): void {
    const currentState = this.getViewState();
    this.setViewState({ showEvents: !currentState.showEvents });
  }

  toggleShowTickets(): void {
    const currentState = this.getViewState();
    this.setViewState({ showTickets: !currentState.showTickets });
  }

  toggleShowLogs(): void {
    const currentState = this.getViewState();
    this.setViewState({ showLogs: !currentState.showLogs });
  }

  setFilters(filters: Partial<CalendarFilters>): void {
    const currentState = this.getViewState();
    this.setViewState({ 
      filters: { ...currentState.filters, ...filters }
    });
  }

  // Action triggers
  triggerLoadEvents(): void {
    this.loadEventsSubject.next();
  }

  triggerLoadTickets(): void {
    this.loadTicketsSubject.next();
  }

  triggerLoadLogs(): void {
    this.loadLogsSubject.next();
  }

  triggerRefreshCalendar(): void {
    this.refreshCalendarSubject.next();
  }

  // Navigation methods
  previousMonth(): void {
    const currentState = this.getViewState();
    const newDate = new Date(currentState.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.setCurrentDate(newDate);
  }

  nextMonth(): void {
    const currentState = this.getViewState();
    const newDate = new Date(currentState.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.setCurrentDate(newDate);
  }

  previousWeek(): void {
    const currentState = this.getViewState();
    const newDate = new Date(currentState.currentDate);
    newDate.setDate(newDate.getDate() - 7);
    this.setCurrentDate(newDate);
  }

  nextWeek(): void {
    const currentState = this.getViewState();
    const newDate = new Date(currentState.currentDate);
    newDate.setDate(newDate.getDate() + 7);
    this.setCurrentDate(newDate);
  }

  previousDay(): void {
    const currentState = this.getViewState();
    const newDate = new Date(currentState.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    this.setCurrentDate(newDate);
  }

  nextDay(): void {
    const currentState = this.getViewState();
    const newDate = new Date(currentState.currentDate);
    newDate.setDate(newDate.getDate() + 1);
    this.setCurrentDate(newDate);
  }

  goToToday(): void {
    this.setCurrentDate(new Date());
  }

  // Utility methods
  getEventsForDate(date: Date): CalendarEventResponse[] {
    const events = this.getEvents();
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getFilteredEvents(): CalendarEventResponse[] {
    const events = this.getEvents();
    const filters = this.getViewState().filters;
    
    return events.filter(event => {
      // Category filter
      if (filters.category !== 'all' && event.category !== filters.category) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && event.status !== filters.status) {
        return false;
      }
      
      // Search filter
      if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(event.description?.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }
      
      return true;
    });
  }
}
