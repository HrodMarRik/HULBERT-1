import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEventResponse } from '../../../../models/calendar.model';

export interface DayRightClickEvent {
  date: Date;
  time?: string;
}

@Component({
  selector: 'app-calendar-week-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="week-view-container">
      <!-- En-tête fixe avec les jours -->
      <div class="week-header-fixed">
        <div class="time-column-header"></div>
        <div class="days-header-row">
          <div 
            *ngFor="let day of weekDays" 
            class="day-header-cell"
            (click)="onDayClick(day.date)"
            (contextmenu)="onDayRightClick(day.date, $event)">
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.date.getDate() }}</div>
            <div class="day-counts">
              <span class="event-count" *ngIf="day.events.length > 0">{{ day.events.length }}</span>
              <span class="ticket-count" *ngIf="day.tickets.length > 0">{{ day.tickets.length }}</span>
              <span class="log-count" *ngIf="day.logs.length > 0">{{ day.logs.length }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Grille scrollable avec heures et événements -->
      <div class="week-grid-scrollable">
        <div class="week-grid-content">
          <!-- Colonne des heures (fixe à gauche) -->
          <div class="time-column-sticky">
            <div *ngFor="let hour of timeSlots" class="time-label">
              {{ hour }}:00
            </div>
          </div>
          
          <!-- Colonnes des jours avec événements -->
          <div class="days-grid">
            <div 
              *ngFor="let day of weekDays" 
              class="day-column"
              (contextmenu)="onDayRightClick(day.date, $event)">
              
              <!-- Fond avec lignes horaires -->
              <div class="hour-lines">
                <div *ngFor="let hour of timeSlots" class="hour-line"></div>
              </div>
              
              <!-- Événements positionnés -->
              <div 
                *ngFor="let event of day.events" 
                class="event-block"
                [style.top.px]="getEventTop(event, day.date)"
                [style.height.px]="getEventHeight(event, day.date)"
                (click)="onEventClick(event)"
                (contextmenu)="onEventEditClick(event, $event)">
                <div class="event-time">{{ formatTime(event.start_datetime) }}</div>
                <div class="event-title">{{ event.title }}</div>
              </div>
              
              <!-- Tickets positionnés -->
              <div 
                *ngFor="let ticket of day.tickets" 
                class="ticket-block"
                [style.top.px]="getTicketTop(ticket)"
                (click)="onTicketClick(ticket)">
                <span class="ticket-icon">🎫</span>
                <span class="ticket-title">{{ ticket.title || 'Ticket #' + ticket.id }}</span>
              </div>
              
              <!-- Logs positionnés -->
              <div 
                *ngFor="let log of day.logs" 
                class="log-block"
                [style.top.px]="getLogTop(log)"
                (click)="onLogClick(log)">
                <span class="log-icon">📋</span>
                <span class="log-title">{{ log.message || 'Log Entry' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .week-view-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .week-header-fixed {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #2d2d2d;
      border-bottom: 2px solid #404040;
      display: flex;
    }

    .time-column-header {
      width: 80px;
      background: #2d2d2d;
      border-right: 1px solid #404040;
    }

    .days-header-row {
      display: flex;
      flex: 1;
    }

    .day-header-cell {
      flex: 1;
      padding: 12px 8px;
      text-align: center;
      border-right: 1px solid #404040;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #2d2d2d;
    }

    .day-header-cell:hover {
      background: #374151;
      transform: translateY(-1px);
    }

    .day-name {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .day-date {
      font-size: 18px;
      color: #f3f4f6;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .day-counts {
      display: flex;
      justify-content: center;
      gap: 4px;
    }

    .event-count, .ticket-count, .log-count {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
    }

    .event-count {
      background: #3b82f6;
      color: white;
    }

    .ticket-count {
      background: #f59e0b;
      color: white;
    }

    .log-count {
      background: #10b981;
      color: white;
    }

    .week-grid-scrollable {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .week-grid-content {
      display: flex;
      min-height: 2400px; /* 30 heures × 80px pour avoir plus d'espace */
      height: auto;
    }

    .time-column-sticky {
      position: sticky;
      left: 0;
      width: 80px;
      background: #2d2d2d;
      border-right: 1px solid #404040;
      z-index: 10;
    }

    .time-label {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: #9ca3af;
      font-weight: 500;
      border-bottom: 1px solid #333;
      background: #2d2d2d;
    }

    .days-grid {
      display: flex;
      flex: 1;
    }

    .day-column {
      flex: 1;
      position: relative;
      border-right: 1px solid #333;
      cursor: context-menu;
    }

    .hour-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
    }

    .hour-line {
      height: 80px;
      border-bottom: 1px solid #333;
    }

    .hour-line:nth-child(4n) {
      border-bottom: 2px solid #404040;
    }

    .event-block {
      position: absolute;
      left: 4px;
      right: 4px;
      background: #3b82f6;
      color: white;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 20;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      min-height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      user-select: none;
    }

    .event-block:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .event-time {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 2px;
      opacity: 0.9;
    }

    .event-title {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.2;
    }

    .ticket-block {
      position: absolute;
      left: 4px;
      right: 4px;
      background: #f59e0b;
      color: white;
      border-radius: 4px;
      padding: 6px 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 15;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      height: 30px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ticket-block:hover {
      background: #d97706;
      transform: translateY(-1px);
    }

    .ticket-icon {
      font-size: 12px;
    }

    .ticket-title {
      font-size: 11px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .log-block {
      position: absolute;
      left: 4px;
      right: 4px;
      background: #10b981;
      color: white;
      border-radius: 4px;
      padding: 6px 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 15;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      height: 30px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .log-block:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    .log-icon {
      font-size: 12px;
    }

    .log-title {
      font-size: 11px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Scrollbar personnalisée */
    .week-grid-scrollable::-webkit-scrollbar {
      width: 16px;
    }

    .week-grid-scrollable::-webkit-scrollbar-track {
      background: #2d2d2d;
      border-radius: 8px;
    }

    .week-grid-scrollable::-webkit-scrollbar-thumb {
      background: #4b5563;
      border-radius: 8px;
      border: 2px solid #2d2d2d;
    }

    .week-grid-scrollable::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }
  `]
})
export class CalendarWeekViewComponent {
  @Input() weekDays: any[] = [];
  @Input() timeSlots: number[] = [];
  
  @Output() eventClick = new EventEmitter<CalendarEventResponse>();
  @Output() eventEditClick = new EventEmitter<CalendarEventResponse>();
  @Output() dayClick = new EventEmitter<Date>();
  @Output() dayRightClick = new EventEmitter<DayRightClickEvent>();
  @Output() ticketClick = new EventEmitter<any>();
  @Output() logClick = new EventEmitter<any>();

  formatTime(date: Date | string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  getEventTop(event: CalendarEventResponse, dayDate: Date): number {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime || event.start_datetime);
    
    // Normaliser les dates pour comparaison
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    let displayStart: Date;
    
    // Déterminer l'heure d'affichage selon le type d'événement
    if (eventStart >= dayStart && eventStart <= dayEnd) {
      // Événement commence ce jour
      displayStart = eventStart;
    } else if (eventStart < dayStart && eventEnd > dayEnd) {
      // Événement s'étend sur ce jour (commence avant et finit après)
      displayStart = dayStart; // Commencer à 00h00
    } else if (eventEnd >= dayStart && eventEnd <= dayEnd) {
      // Événement finit ce jour
      displayStart = dayStart; // Commencer à 00h00
    } else {
      // Fallback
      displayStart = eventStart;
    }
    
    const hours = displayStart.getHours();
    const minutes = displayStart.getMinutes();
    const top = (hours * 80) + (minutes * 80 / 60);
    console.log(`📍 Position WEEK événement "${event.title}": ${hours}h${minutes} → top: ${top}px`);
    return top;
  }

  getEventHeight(event: CalendarEventResponse, dayDate: Date): number {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime || event.start_datetime);
    
    // Normaliser les dates pour comparaison
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    let displayStart: Date;
    let displayEnd: Date;
    
    // Déterminer les heures d'affichage selon le type d'événement
    if (eventStart >= dayStart && eventStart <= dayEnd) {
      // Événement commence ce jour
      displayStart = eventStart;
      displayEnd = eventEnd <= dayEnd ? eventEnd : dayEnd;
    } else if (eventStart < dayStart && eventEnd > dayEnd) {
      // Événement s'étend sur ce jour (commence avant et finit après)
      displayStart = dayStart; // Commencer à 00h00
      displayEnd = dayEnd; // Finir à 23h59
    } else if (eventEnd >= dayStart && eventEnd <= dayEnd) {
      // Événement finit ce jour
      displayStart = dayStart; // Commencer à 00h00
      displayEnd = eventEnd;
    } else {
      // Fallback
      displayStart = eventStart;
      displayEnd = eventEnd;
    }
    
    // Validation supplémentaire pour éviter les hauteurs négatives
    if (displayEnd < displayStart) {
      console.warn(`⚠️ Calcul de hauteur pour événement invalide (ID: ${event.id})`);
      return 40; // Hauteur minimum
    }
    
    const duration = (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60); // minutes
    
    // S'assurer que la durée est positive
    const validDuration = Math.max(30, duration); // Minimum 30 minutes
    
    const height = Math.max(40, (validDuration * 80 / 60)); // Min 40px, 80px par heure
    
    console.log(`📏 Hauteur WEEK événement "${event.title}": ${duration}min → height: ${height}px`);
    return height;
  }

  getTicketTop(ticket: any): number {
    const date = new Date(ticket.created_at);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return (hours * 80) + (minutes * 80 / 60);
  }

  getLogTop(log: any): number {
    const date = new Date(log.timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return (hours * 80) + (minutes * 80 / 60);
  }

  onEventClick(event: CalendarEventResponse): void {
    this.eventClick.emit(event);
  }

  onEventEditClick(event: CalendarEventResponse, mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    console.log('🖱️ Clic droit sur événement WEEK:', event.title);
    console.log('🖱️ Événement WEEK détails:', event);
    this.eventEditClick.emit(event);
  }

  onDayClick(date: Date): void {
    this.dayClick.emit(date);
  }

  onDayRightClick(date: Date, event: MouseEvent): void {
    event.preventDefault();
    
    const target = event.target as HTMLElement;
    const dayColumn = target.closest('.day-column');
    
    if (dayColumn) {
      const rect = dayColumn.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      
      const hour = Math.floor(clickY / 80);
      const minutes = Math.floor((clickY % 80) / 80 * 60);
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      this.dayRightClick.emit({ date, time: timeString });
    } else {
      this.dayRightClick.emit({ date });
    }
  }

  onTicketClick(ticket: any): void {
    this.ticketClick.emit(ticket);
  }

  onLogClick(log: any): void {
    this.logClick.emit(log);
  }

  ngOnInit(): void {
    // Validation et correction des événements au chargement
    this.validateAndFixEvents();
  }

  private validateAndFixEvents(): void {
    console.log('🔍 Validation des événements WEEK:', this.weekDays.length, 'jours');
    
    this.weekDays.forEach((day, dayIndex) => {
      console.log(`📅 Jour ${dayIndex + 1}: ${day.events.length} événements`);
      
      day.events.forEach((event: CalendarEventResponse, eventIndex: number) => {
        const startDate = new Date(event.start_datetime);
        const endDate = new Date(event.end_datetime || event.start_datetime);
        
        // Vérifier si l'événement finit avant de commencer
        if (endDate < startDate) {
          console.warn(`⚠️ Événement invalide détecté (Jour ${dayIndex + 1}, ID: ${event.id}):`, {
            title: event.title,
            start: event.start_datetime,
            end: event.end_datetime,
            problem: 'L\'événement finit avant de commencer'
          });
          
          // Corriger automatiquement en définissant end_datetime = start_datetime + 1h
          const correctedEnd = new Date(startDate.getTime() + (60 * 60 * 1000)); // +1 heure
          event.end_datetime = correctedEnd;
          
          console.log(`✅ Événement corrigé (Jour ${dayIndex + 1}, ID: ${event.id}):`, {
            original_end: event.end_datetime,
            corrected_end: correctedEnd.toISOString()
          });
        }
        
        // Vérifier si l'événement a une durée négative ou nulle
        const duration = endDate.getTime() - startDate.getTime();
        if (duration <= 0) {
          console.warn(`⚠️ Événement sans durée (Jour ${dayIndex + 1}, ID: ${event.id}):`, {
            title: event.title,
            duration_minutes: duration / (1000 * 60)
          });
          
          // Corriger en ajoutant 30 minutes minimum
          const correctedEnd = new Date(startDate.getTime() + (30 * 60 * 1000)); // +30 minutes
          event.end_datetime = correctedEnd;
          
          console.log(`✅ Durée corrigée (Jour ${dayIndex + 1}, ID: ${event.id}):`, {
            new_duration_minutes: 30
          });
        }
      });
    });
  }
}
