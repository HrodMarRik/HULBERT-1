import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEventResponse } from '../../../../models/calendar.model';

export interface DayRightClickEvent {
  date: Date;
  time?: string;
}

@Component({
  selector: 'app-calendar-day-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="day-view-container">
      <!-- En-tête du jour -->
      <div class="day-header-fixed">
        <div class="day-info">
          <h3>{{ currentDate | date:'fullDate':'fr-FR' }}</h3>
          <div class="counts">
            <span class="count-item events" *ngIf="dayEvents.length > 0">
              <span class="count-icon">📅</span>
              {{ dayEvents.length }} événement{{ dayEvents.length > 1 ? 's' : '' }}
            </span>
            <span class="count-item tickets" *ngIf="dayTickets.length > 0">
              <span class="count-icon">🎫</span>
              {{ dayTickets.length }} ticket{{ dayTickets.length > 1 ? 's' : '' }}
            </span>
            <span class="count-item logs" *ngIf="dayLogs.length > 0">
              <span class="count-icon">📋</span>
              {{ dayLogs.length }} log{{ dayLogs.length > 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <div class="day-actions">
          <button class="action-btn" (click)="onAddEvent()" title="Ajouter un événement">
            <span>+</span> Événement
          </button>
        </div>
      </div>
      
      <!-- Grille scrollable -->
      <div class="day-grid-scrollable">
        <div class="day-grid-content">
          <!-- Colonne des heures -->
          <div class="time-column">
            <div *ngFor="let hour of timeSlots" class="time-label">
              {{ hour }}:00
            </div>
          </div>
          
          <!-- Colonne du jour avec événements, tickets et logs -->
          <div class="day-content" (contextmenu)="onDayRightClick(currentDate, $event)">
            <!-- Fond avec lignes horaires -->
            <div class="hour-lines">
              <div *ngFor="let hour of timeSlots" class="hour-line"></div>
            </div>
            
            <!-- Événements -->
            <div 
              *ngFor="let event of dayEvents; let i = index" 
              class="event-block"
              [style.top.px]="getEventTop(event)"
              [style.height.px]="getEventHeight(event)"
              [style.left.px]="getEventLeft(event, i)"
              [style.width.px]="getEventWidth(event, i)"
              (click)="onEventClick(event)"
              (contextmenu)="onEventEditClick(event, $event)">
              <div class="event-content">
                <div class="event-header">
                  <div class="event-time">{{ formatTime(event.start_datetime) }}</div>
                  <div class="event-duration">{{ getEventDuration(event) }}</div>
                </div>
                <div class="event-title">{{ event.title }}</div>
                <div class="event-description" *ngIf="event.description">{{ event.description }}</div>
                <div class="event-location" *ngIf="event.location">
                  <span class="location-icon">📍</span>
                  {{ event.location }}
                </div>
              </div>
            </div>
            
            <!-- Tickets -->
            <div 
              *ngFor="let ticket of dayTickets; let i = index"
              class="ticket-block"
              [style.top.px]="getTicketTop(ticket)"
              [style.left.px]="getTicketLeft(ticket, i)"
              [style.width.px]="getTicketWidth(ticket, i)"
              (click)="onTicketClick(ticket)">
              <div class="ticket-content">
                <div class="ticket-header">
                  <span class="ticket-icon">🎫</span>
                  <span class="ticket-time">{{ formatTime(ticket.created_at) }}</span>
                </div>
                <div class="ticket-title">{{ ticket.title || 'Ticket #' + ticket.id }}</div>
                <div class="ticket-status" *ngIf="ticket.status">
                  <span class="status-badge" [class]="'status-' + ticket.status">{{ ticket.status }}</span>
                </div>
              </div>
            </div>
            
            <!-- Logs -->
            <div 
              *ngFor="let log of dayLogs; let i = index"
              class="log-block"
              [style.top.px]="getLogTop(log)"
              [style.left.px]="getLogLeft(log, i)"
              [style.width.px]="getLogWidth(log, i)"
              (click)="onLogClick(log)">
              <div class="log-content">
                <div class="log-header">
                  <span class="log-icon">📋</span>
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                </div>
                <div class="log-message">{{ log.message || 'Log Entry' }}</div>
                <div class="log-level" *ngIf="log.level">
                  <span class="level-badge" [class]="'level-' + log.level">{{ log.level }}</span>
                </div>
              </div>
            </div>
            
            <!-- Message si aucun élément -->
            <div 
              *ngIf="dayEvents.length === 0 && dayTickets.length === 0 && dayLogs.length === 0" 
              class="no-items">
              <div class="no-items-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                </svg>
              </div>
              <h3>Aucun élément aujourd'hui</h3>
              <p>Cliquez avec le bouton droit sur la timeline pour ajouter un événement à l'heure souhaitée.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .day-view-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .day-header-fixed {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #2d2d2d;
      border-bottom: 2px solid #404040;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .day-info h3 {
      margin: 0 0 8px 0;
      color: #f3f4f6;
      font-size: 24px;
      font-weight: 700;
    }

    .counts {
      display: flex;
      gap: 16px;
    }

    .count-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    .count-item.events {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    .count-item.tickets {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .count-item.logs {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .count-icon {
      font-size: 16px;
    }

    .day-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    .day-grid-scrollable {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .day-grid-content {
      display: flex;
      min-height: 2400px; /* 30 heures × 80px pour avoir plus d'espace */
      height: auto;
    }

    .time-column {
      width: 80px;
      background: #2d2d2d;
      border-right: 1px solid #404040;
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

    .day-content {
      flex: 1;
      position: relative;
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
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 20;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
      min-height: 60px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .event-block:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .event-time {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.9;
    }

    .event-duration {
      font-size: 11px;
      opacity: 0.8;
    }

    .event-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .event-description {
      font-size: 12px;
      opacity: 0.9;
      line-height: 1.4;
      margin-bottom: 6px;
    }

    .event-location {
      font-size: 11px;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .location-icon {
      font-size: 12px;
    }

    .ticket-block {
      position: absolute;
      background: #f59e0b;
      color: white;
      border-radius: 6px;
      padding: 10px 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 15;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      min-height: 50px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .ticket-block:hover {
      background: #d97706;
      transform: translateY(-1px);
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .ticket-icon {
      font-size: 14px;
    }

    .ticket-time {
      font-size: 11px;
      opacity: 0.8;
    }

    .ticket-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .ticket-status {
      margin-top: 4px;
    }

    .status-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-open {
      background: rgba(255, 255, 255, 0.2);
    }

    .status-closed {
      background: rgba(0, 0, 0, 0.2);
    }

    .log-block {
      position: absolute;
      background: #10b981;
      color: white;
      border-radius: 6px;
      padding: 10px 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 15;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      min-height: 50px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .log-block:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .log-icon {
      font-size: 14px;
    }

    .log-time {
      font-size: 11px;
      opacity: 0.8;
    }

    .log-message {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .log-level {
      margin-top: 4px;
    }

    .level-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .level-info {
      background: rgba(255, 255, 255, 0.2);
    }

    .level-warning {
      background: rgba(255, 193, 7, 0.3);
    }

    .level-error {
      background: rgba(220, 53, 69, 0.3);
    }

    .no-items {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #9ca3af;
      z-index: 1;
    }

    .no-items-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-items h3 {
      margin: 0 0 8px 0;
      color: #d1d5db;
      font-size: 18px;
    }

    .no-items p {
      margin: 0;
      font-size: 14px;
    }

    /* Scrollbar personnalisée */
    .day-grid-scrollable::-webkit-scrollbar {
      width: 16px;
    }

    .day-grid-scrollable::-webkit-scrollbar-track {
      background: #2d2d2d;
      border-radius: 8px;
    }

    .day-grid-scrollable::-webkit-scrollbar-thumb {
      background: #4b5563;
      border-radius: 8px;
      border: 2px solid #2d2d2d;
    }

    .day-grid-scrollable::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }
  `]
})
export class CalendarDayViewComponent {
  @Input() currentDate: Date = new Date();
  @Input() dayEvents: CalendarEventResponse[] = [];
  @Input() dayTickets: any[] = [];
  @Input() dayLogs: any[] = [];
  @Input() timeSlots: number[] = [];
  
  @Output() eventClick = new EventEmitter<CalendarEventResponse>();
  @Output() eventEditClick = new EventEmitter<CalendarEventResponse>();
  @Output() dayRightClick = new EventEmitter<DayRightClickEvent>();
  @Output() ticketClick = new EventEmitter<any>();
  @Output() logClick = new EventEmitter<any>();
  @Output() addEvent = new EventEmitter<void>();

  formatTime(date: Date | string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventDuration(event: CalendarEventResponse): string {
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime || event.start_datetime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    
    if (duration < 60) {
      return `${duration}min`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h${minutes}min` : `${hours}h`;
    }
  }

  getEventTop(event: CalendarEventResponse): number {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime || event.start_datetime);
    
    // Pour la vue DAY, nous affichons toujours depuis l'heure de début de l'événement
    // même s'il commence avant le jour affiché
    const hours = eventStart.getHours();
    const minutes = eventStart.getMinutes();
    return (hours * 80) + (minutes * 80 / 60); // 80px par heure
  }

  getEventHeight(event: CalendarEventResponse): number {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime || event.start_datetime);
    
    // Pour la vue DAY, nous calculons la hauteur basée sur la durée réelle
    // mais limitée à la journée affichée (24h max)
    const start = new Date(eventStart);
    const end = new Date(eventEnd);
    
    // Si l'événement commence avant le jour affiché, commencer à 00h00
    const dayStart = new Date(this.currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(this.currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    let displayStart = start;
    let displayEnd = end;
    
    // Ajuster si l'événement commence avant le jour affiché
    if (start < dayStart) {
      displayStart = dayStart;
    }
    
    // Ajuster si l'événement finit après le jour affiché
    if (end > dayEnd) {
      displayEnd = dayEnd;
    }
    
    // Validation supplémentaire pour éviter les hauteurs négatives
    if (displayEnd < displayStart) {
      console.warn(`⚠️ Calcul de hauteur pour événement invalide (ID: ${event.id})`);
      return 60; // Hauteur minimum
    }
    
    const duration = (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60); // minutes
    
    // S'assurer que la durée est positive
    const validDuration = Math.max(30, duration); // Minimum 30 minutes
    
    return Math.max(60, (validDuration * 80 / 60)); // Min 60px, 80px par heure
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

  getEventLeft(event: CalendarEventResponse, index: number): number {
    // Calculer les événements qui se chevauchent
    const overlappingEvents = this.getOverlappingEvents(event);
    const columnIndex = this.getEventColumnIndex(event, overlappingEvents);
    
    // Largeur totale disponible moins les marges
    const totalWidth = 400; // Largeur approximative de la colonne
    const margin = 8;
    const availableWidth = totalWidth - (margin * 2);
    
    // Calculer la largeur et position de chaque colonne
    const numColumns = Math.max(1, overlappingEvents.length);
    const columnWidth = availableWidth / numColumns;
    
    return margin + (columnIndex * columnWidth);
  }

  getEventWidth(event: CalendarEventResponse, index: number): number {
    const overlappingEvents = this.getOverlappingEvents(event);
    const numColumns = Math.max(1, overlappingEvents.length);
    const totalWidth = 400;
    const margin = 8;
    const availableWidth = totalWidth - (margin * 2);
    
    return (availableWidth / numColumns) - 4; // -4 pour un petit espace entre les colonnes
  }

  private getOverlappingEvents(event: CalendarEventResponse): CalendarEventResponse[] {
    const eventStart = new Date(event.start_datetime);
    const eventEnd = new Date(event.end_datetime || event.start_datetime);
    
    return this.dayEvents.filter(otherEvent => {
      if (otherEvent.id === event.id) return false;
      
      const otherStart = new Date(otherEvent.start_datetime);
      const otherEnd = new Date(otherEvent.end_datetime || otherEvent.start_datetime);
      
      // Vérifier si les événements se chevauchent
      return eventStart < otherEnd && eventEnd > otherStart;
    });
  }

  private getEventColumnIndex(event: CalendarEventResponse, overlappingEvents: CalendarEventResponse[]): number {
    if (overlappingEvents.length === 0) return 0;
    
    // Trier les événements qui se chevauchent par heure de début
    const allEvents = [event, ...overlappingEvents].sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
    
    return allEvents.findIndex(e => e.id === event.id);
  }

  getTicketLeft(ticket: any, index: number): number {
    // Calculer les tickets qui se chevauchent à la même heure
    const overlappingTickets = this.getOverlappingTickets(ticket);
    const columnIndex = this.getTicketColumnIndex(ticket, overlappingTickets);
    
    const totalWidth = 400;
    const margin = 8;
    const availableWidth = totalWidth - (margin * 2);
    const numColumns = Math.max(1, overlappingTickets.length);
    const columnWidth = availableWidth / numColumns;
    
    return margin + (columnIndex * columnWidth);
  }

  getTicketWidth(ticket: any, index: number): number {
    const overlappingTickets = this.getOverlappingTickets(ticket);
    const numColumns = Math.max(1, overlappingTickets.length);
    const totalWidth = 400;
    const margin = 8;
    const availableWidth = totalWidth - (margin * 2);
    
    return (availableWidth / numColumns) - 4;
  }

  getLogLeft(log: any, index: number): number {
    // Calculer les logs qui se chevauchent à la même heure
    const overlappingLogs = this.getOverlappingLogs(log);
    const columnIndex = this.getLogColumnIndex(log, overlappingLogs);
    
    const totalWidth = 400;
    const margin = 8;
    const availableWidth = totalWidth - (margin * 2);
    const numColumns = Math.max(1, overlappingLogs.length);
    const columnWidth = availableWidth / numColumns;
    
    return margin + (columnIndex * columnWidth);
  }

  getLogWidth(log: any, index: number): number {
    const overlappingLogs = this.getOverlappingLogs(log);
    const numColumns = Math.max(1, overlappingLogs.length);
    const totalWidth = 400;
    const margin = 8;
    const availableWidth = totalWidth - (margin * 2);
    
    return (availableWidth / numColumns) - 4;
  }

  private getOverlappingTickets(ticket: any): any[] {
    const ticketTime = new Date(ticket.created_at);
    const ticketHour = ticketTime.getHours();
    const ticketMinutes = ticketTime.getMinutes();
    
    return this.dayTickets.filter(otherTicket => {
      if (otherTicket.id === ticket.id) return false;
      
      const otherTime = new Date(otherTicket.created_at);
      const otherHour = otherTime.getHours();
      const otherMinutes = otherTime.getMinutes();
      
      // Considérer comme chevauchant si dans la même heure
      return otherHour === ticketHour;
    });
  }

  private getOverlappingLogs(log: any): any[] {
    const logTime = new Date(log.timestamp);
    const logHour = logTime.getHours();
    const logMinutes = logTime.getMinutes();
    
    return this.dayLogs.filter(otherLog => {
      if (otherLog.id === log.id) return false;
      
      const otherTime = new Date(otherLog.timestamp);
      const otherHour = otherTime.getHours();
      const otherMinutes = otherTime.getMinutes();
      
      // Considérer comme chevauchant si dans la même heure
      return otherHour === logHour;
    });
  }

  private getTicketColumnIndex(ticket: any, overlappingTickets: any[]): number {
    if (overlappingTickets.length === 0) return 0;
    
    const allTickets = [ticket, ...overlappingTickets].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return allTickets.findIndex(t => t.id === ticket.id);
  }

  private getLogColumnIndex(log: any, overlappingLogs: any[]): number {
    if (overlappingLogs.length === 0) return 0;
    
    const allLogs = [log, ...overlappingLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return allLogs.findIndex(l => l.id === log.id);
  }

  onEventClick(event: CalendarEventResponse): void {
    this.eventClick.emit(event);
  }

  onEventEditClick(event: CalendarEventResponse, mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    console.log('🖱️ Clic droit sur événement DAY:', event.title);
    this.eventEditClick.emit(event);
  }

  onDayRightClick(date: Date, event: MouseEvent): void {
    event.preventDefault();
    
    const target = event.target as HTMLElement;
    const dayContent = target.closest('.day-content');
    
    if (dayContent) {
      const rect = dayContent.getBoundingClientRect();
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

  onAddEvent(): void {
    this.addEvent.emit();
  }

  ngOnInit(): void {
    // Validation et correction des événements au chargement
    this.validateAndFixEvents();
  }

  private validateAndFixEvents(): void {
    console.log('🔍 Validation des événements DAY:', this.dayEvents.length);
    
    this.dayEvents.forEach((event, index) => {
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime || event.start_datetime);
      
      // Vérifier si l'événement finit avant de commencer
      if (endDate < startDate) {
        console.warn(`⚠️ Événement invalide détecté (ID: ${event.id}):`, {
          title: event.title,
          start: event.start_datetime,
          end: event.end_datetime,
          problem: 'L\'événement finit avant de commencer'
        });
        
        // Corriger automatiquement en définissant end_datetime = start_datetime + 1h
        const correctedEnd = new Date(startDate.getTime() + (60 * 60 * 1000)); // +1 heure
        event.end_datetime = correctedEnd;
        
        console.log(`✅ Événement corrigé (ID: ${event.id}):`, {
          original_end: event.end_datetime,
          corrected_end: correctedEnd.toISOString()
        });
      }
      
      // Vérifier si l'événement a une durée négative ou nulle
      const duration = endDate.getTime() - startDate.getTime();
      if (duration <= 0) {
        console.warn(`⚠️ Événement sans durée (ID: ${event.id}):`, {
          title: event.title,
          duration_minutes: duration / (1000 * 60)
        });
        
        // Corriger en ajoutant 30 minutes minimum
        const correctedEnd = new Date(startDate.getTime() + (30 * 60 * 1000)); // +30 minutes
        event.end_datetime = correctedEnd;
        
        console.log(`✅ Durée corrigée (ID: ${event.id}):`, {
          new_duration_minutes: 30
        });
      }
    });
  }
}
