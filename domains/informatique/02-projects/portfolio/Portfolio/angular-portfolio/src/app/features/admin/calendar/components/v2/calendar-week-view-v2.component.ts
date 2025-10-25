import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCapsuleComponent, EventCapsule } from '../../../../../shared/components/event-capsule/event-capsule.component';
import { TicketCapsuleComponent, TicketCapsule } from '../../../../../shared/components/ticket-capsule/ticket-capsule.component';
import { EventDisplayService, CalendarEventResponse, EventCapsuleWithDate } from '../../services/event-display.service';

interface WeekDay {
  date: Date;
  name: string;
  eventCapsules: EventCapsuleWithDate[];
  tickets: any[];
  logs: any[];
}

interface TimelineClickEvent {
  day: Date;
  hour: number;
  minutes: number;
  mouseEvent: MouseEvent;
}

@Component({
  selector: 'app-calendar-week-view-v2',
  standalone: true,
  imports: [CommonModule, EventCapsuleComponent, TicketCapsuleComponent],
  template: `
    <div class="week-view-v2">
      <!-- Header fixe avec jours -->
      <div class="week-header">
        <div class="time-column-header"></div>
        <div *ngFor="let day of weekDays" class="day-header">
          <div class="day-name">{{ day.name }}</div>
          <div class="day-date">{{ day.date | date:'d' }}</div>
          
          <!-- Indicateurs de contenu -->
          <div class="header-indicators">
            <span class="header-badge event-badge" *ngIf="day.eventCapsules.length > 0"
                  [title]="day.eventCapsules.length + ' événement(s)'">
              {{ day.eventCapsules.length }}
            </span>
            <span class="header-badge ticket-badge" *ngIf="day.tickets.length > 0"
                  [title]="day.tickets.length + ' ticket(s)'">
              {{ day.tickets.length }}
            </span>
            <span class="header-badge log-badge" *ngIf="day.logs.length > 0"
                  [title]="day.logs.length + ' log(s)'">
              {{ day.logs.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Contenu scrollable -->
      <div class="week-content">
        <!-- Colonne des heures (sticky) -->
        <div class="time-column">
          <div *ngFor="let hour of hours" class="time-label">
            {{ hour }}:00
          </div>
        </div>

        <!-- Colonnes des jours -->
        <div class="days-grid">
          <div 
            *ngFor="let day of weekDays; trackBy: trackByDate" 
            class="day-column"
            (contextmenu)="onTimelineRightClick(day, $event)">
            
            <!-- Lignes horaires -->
            <div class="hour-lines">
              <div *ngFor="let hour of hours" 
                   class="hour-line"
                   [class.current-hour]="isCurrentHour(hour)"
                   [class.half-hour]="false">
              </div>
            </div>

            <!-- Capsules d'événements positionnées -->
            <app-event-capsule
              *ngFor="let capsule of day.eventCapsules; trackBy: trackByEventId"
              [event]="capsule"
              [type]="capsule.type"
              [compact]="false"
              [showTime]="true"
              [style.top.px]="getEventTop(capsule)"
              [style.height.px]="getEventHeight(capsule)"
              [style.left.%]="getEventLeft(capsule)"
              [style.width.%]="getEventWidth(capsule)"
              (capsuleClick)="onEventClick($event)"
              (capsuleContextMenu)="onEventContextMenu($event)">
            </app-event-capsule>

            <!-- Capsules de tickets positionnées -->
            <app-ticket-capsule
              *ngFor="let ticket of day.tickets; trackBy: trackByTicketId"
              [ticket]="ticket"
              [compact]="true"
              [style.top.px]="getTicketTop(ticket)"
              (ticketClick)="onTicketClick(ticket)"
              (ticketContextMenu)="onTicketContextMenu($event)">
            </app-ticket-capsule>

            <!-- Logs positionnés -->
            <div *ngFor="let log of day.logs; trackBy: trackByLogId" 
                 class="log-item"
                 [style.top.px]="getLogTop(log)"
                 (click)="onLogClick(log)"
                 (contextmenu)="onLogContextMenu(log, $event)">
              <div class="log-time">{{ formatLogTime(log) }}</div>
              <div class="log-content">{{ log.message || log.description }}</div>
            </div>

            <!-- Zone de création (invisible, pour détecter les clics) -->
            <div class="creation-zone" 
                 style="pointer-events: auto;"
                 (contextmenu)="onTimelineRightClick(day, $event)">
            </div>
          </div>
        </div>
      </div>

      <!-- Indicateur d'heure actuelle -->
      <div class="current-time-indicator" 
           *ngIf="showCurrentTime"
           [style.top.px]="getCurrentTimeTop()">
        <div class="time-line"></div>
        <div class="time-label">{{ getCurrentTime() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .week-view-v2 {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1f2e;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    /* Header fixe */
    .week-header {
      display: grid;
      grid-template-columns: 60px repeat(7, 1fr);
      background: #1e293b;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(8px);
    }

    .time-column-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 8px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .day-header {
      padding: 16px 8px;
      text-align: center;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      transition: background 0.2s ease;
    }

    .day-header:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    .day-header:last-child {
      border-right: none;
    }

    .day-name {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .day-date {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .header-indicators {
      display: flex;
      gap: 4px;
      justify-content: center;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .header-badge {
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      color: white;
      display: inline-flex;
      align-items: center;
      cursor: help;
    }

    .event-badge {
      background: #10b981;
    }

    .ticket-badge {
      background: #a855f7;
    }

    .log-badge {
      background: #3b82f6;
    }

    /* Contenu scrollable */
    .week-content {
      display: grid;
      grid-template-columns: 60px repeat(7, 1fr);
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    /* Colonne des heures */
    .time-column {
      position: sticky;
      left: 0;
      background: #1a1f2e;
      z-index: 10;
      border-right: 2px solid rgba(255, 255, 255, 0.1);
    }

    .time-label {
      height: 80px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 8px 4px;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Grille des jours */
    .days-grid {
      display: contents; /* Permet aux enfants de participer à la grille parent */
    }

    .day-column {
      position: relative;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      min-height: 1920px; /* 24h * 80px */
      cursor: context-menu;
    }

    .day-column:last-child {
      border-right: none;
    }

    .day-column:hover {
      background: rgba(59, 130, 246, 0.02);
    }

    /* Lignes horaires */
    .hour-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .hour-line {
      height: 80px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
    }

    .hour-line.current-hour {
      border-bottom-color: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
    }

    .hour-line.half-hour {
      border-bottom-color: rgba(255, 255, 255, 0.02);
    }

    /* Logs */
    .log-item {
      position: absolute;
      left: 0;
      right: 0;
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 4px;
      padding: 4px 8px;
      margin: 0 2px;
      cursor: pointer;
      z-index: 3;
      font-size: 11px;
      color: #d1d5db;
      transition: all 0.2s ease;
    }

    .log-item:hover {
      background: #4b5563;
      border-color: #6b7280;
      transform: translateY(-1px);
    }

    .log-time {
      font-weight: 600;
      color: #9ca3af;
      margin-bottom: 2px;
    }

    .log-content {
      font-size: 10px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    app-ticket-capsule {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 4;
      margin: 0 2px;
    }

    app-event-capsule {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 5;
      margin: 0 4px;
      pointer-events: auto;
    }

    /* Zone de création */
    .creation-zone {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      pointer-events: none;
    }

    /* Indicateur d'heure actuelle */
    .current-time-indicator {
      position: absolute;
      left: 60px;
      right: 0;
      z-index: 15;
      pointer-events: none;
    }

    .time-line {
      height: 2px;
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
    }

    .current-time-indicator .time-label {
      position: absolute;
      left: 8px;
      top: -8px;
      background: #ef4444;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    /* Scrollbar personnalisée */
    .week-content::-webkit-scrollbar {
      width: 8px;
    }

    .week-content::-webkit-scrollbar-track {
      background: #1a1f2e;
    }

    .week-content::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 4px;
    }

    .week-content::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .week-header {
        grid-template-columns: 50px repeat(7, 1fr);
      }

      .week-content {
        grid-template-columns: 50px repeat(7, 1fr);
      }

      .time-column {
        width: 50px;
      }

      .time-label {
        font-size: 11px;
        padding: 6px 2px;
      }

      .day-header {
        padding: 12px 4px;
      }

      .day-name {
        font-size: 11px;
      }

      .day-date {
        font-size: 16px;
      }
    }

    @media (max-width: 768px) {
      .week-header {
        grid-template-columns: 40px repeat(7, 1fr);
      }

      .week-content {
        grid-template-columns: 40px repeat(7, 1fr);
      }

      .time-column {
        width: 40px;
      }

      .time-label {
        font-size: 10px;
        padding: 4px 1px;
      }

      .day-header {
        padding: 8px 2px;
      }

      .day-name {
        font-size: 10px;
      }

      .day-date {
        font-size: 14px;
      }
    }
  `]
})
export class CalendarWeekViewV2Component implements OnInit, OnChanges {
  @Input() currentDate: Date = new Date();
  @Input() events: CalendarEventResponse[] = [];
  @Input() tickets: any[] = [];
  @Input() logs: any[] = [];
  @Input() showCurrentTime: boolean = false;

  @Output() timelineRightClick = new EventEmitter<TimelineClickEvent>();
  @Output() eventClick = new EventEmitter<EventCapsuleWithDate>();
  @Output() eventContextMenu = new EventEmitter<{event: EventCapsule, mouseEvent: MouseEvent}>();
  @Output() ticketClick = new EventEmitter<any>();
  @Output() ticketContextMenu = new EventEmitter<{ticket: any, mouseEvent: MouseEvent}>();
  @Output() logClick = new EventEmitter<any>();
  @Output() logContextMenu = new EventEmitter<{log: any, mouseEvent: MouseEvent}>();

  weekDays: WeekDay[] = [];
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  pixelsPerHour = 80;

  constructor(private eventDisplayService: EventDisplayService) {}

  ngOnInit(): void {
    console.log('🎯 CalendarWeekViewV2Component initialized');
    this.generateWeekDays();
    // Centrer automatiquement l'heure actuelle
    setTimeout(() => this.centerCurrentTime(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate'] || changes['events'] || changes['tickets']) {
      this.generateWeekDays();
      // Recentrer l'heure actuelle après les changements
      setTimeout(() => this.centerCurrentTime(), 100);
    }
  }

  generateWeekDays(): void {
    // Calculer le début de la semaine (lundi)
    const startOfWeek = new Date(this.currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi
    startOfWeek.setDate(diff);

    // Générer les 7 jours de la semaine
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    
    this.weekDays = days.map(date => {
      const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const name = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      // Récupérer les capsules d'événements pour ce jour
      const eventCapsules = this.eventDisplayService.getEventsForDate(this.events, date);
      
      // Récupérer les tickets pour ce jour
      const dayTickets = this.getTicketsForDate(date);
      
      // Récupérer les logs pour ce jour
      const dayLogs = this.getLogsForDate(date);
      
      return {
        date,
        name,
        eventCapsules,
        tickets: dayTickets,
        logs: dayLogs
      };
    });
  }

  private getTicketsForDate(date: Date): any[] {
    return this.tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at || ticket.due_date);
      return ticketDate.toDateString() === date.toDateString();
    });
  }

  private getLogsForDate(date: Date): any[] {
    return this.logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate.toDateString() === date.toDateString();
    });
  }

  // Calculs de position
  getEventTop(capsule: EventCapsuleWithDate): number {
    return this.eventDisplayService.calculateEventTop(capsule, capsule.displayDate, this.pixelsPerHour);
  }

  getEventHeight(capsule: EventCapsuleWithDate): number {
    return this.eventDisplayService.calculateEventHeight(capsule, capsule.displayDate, this.pixelsPerHour);
  }

  getEventLeft(capsule: EventCapsuleWithDate): number {
    // Pour l'instant, pas de gestion de collision horizontale
    // À implémenter si nécessaire
    return 0;
  }

  getEventWidth(capsule: EventCapsuleWithDate): number {
    // Pour l'instant, pleine largeur
    // À implémenter si nécessaire
    return 100;
  }

  getTicketTop(ticket: any): number {
    const date = new Date(ticket.created_at || ticket.due_date);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return (hours * this.pixelsPerHour) + (minutes * this.pixelsPerHour / 60);
  }

  // Heure actuelle
  getCurrentTimeTop(): number {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * this.pixelsPerHour) + (minutes * this.pixelsPerHour / 60);
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  isCurrentHour(hour: number): boolean {
    const now = new Date();
    return now.getHours() === hour;
  }

  // Event handlers
  onTimelineRightClick(day: WeekDay, mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    
    const target = mouseEvent.currentTarget as HTMLElement;
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const y = mouseEvent.clientY - rect.top;
    const hour = Math.floor(y / this.pixelsPerHour);
    const minutes = Math.floor((y % this.pixelsPerHour) / (this.pixelsPerHour / 60));
    
    this.timelineRightClick.emit({
      day: day.date,
      hour: Math.max(0, Math.min(23, hour)),
      minutes: Math.max(0, Math.min(59, minutes)),
      mouseEvent
    });
  }

  onEventClick(event: EventCapsule): void {
    console.log('🎯 WEEK Event clicked:', event);
    this.eventClick.emit(event as EventCapsuleWithDate);
  }

  onEventContextMenu(data: {event: EventCapsule, mouseEvent: MouseEvent}): void {
    data.mouseEvent.preventDefault();
    data.mouseEvent.stopPropagation();
    this.eventContextMenu.emit(data);
  }

  onTicketClick(ticket: any): void {
    this.ticketClick.emit(ticket);
  }

  onTicketContextMenu(data: {ticket: any, mouseEvent: MouseEvent}): void {
    data.mouseEvent.preventDefault();
    data.mouseEvent.stopPropagation();
    this.ticketContextMenu.emit(data);
  }

  // TrackBy functions
  trackByDate(index: number, day: WeekDay): string {
    return day.date.toISOString();
  }

  trackByEventId(index: number, capsule: EventCapsuleWithDate): number {
    return capsule.id;
  }

  trackByTicketId(index: number, ticket: any): number {
    return ticket.id;
  }

  trackByLogId(index: number, log: any): number {
    return log.id || index;
  }

  getLogTop(log: any): number {
    const logTime = new Date(log.created_at || log.timestamp);
    const hours = logTime.getHours();
    const minutes = logTime.getMinutes();
    return (hours * 80) + (minutes * 80 / 60);
  }

  formatLogTime(log: any): string {
    const logTime = new Date(log.created_at || log.timestamp);
    return logTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  onLogClick(log: any): void {
    console.log('Log clicked:', log);
    this.logClick.emit(log);
  }

  onLogContextMenu(log: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Log context menu:', log);
    this.logContextMenu.emit({ log, mouseEvent: event });
  }

  centerCurrentTime(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Calculer la position de l'heure actuelle
    const currentTimeTop = this.getCurrentTimeTop();
    
    // Trouver le conteneur scrollable
    const scrollContainer = document.querySelector('.week-timeline-container');
    if (scrollContainer) {
      // Calculer la position pour centrer l'heure actuelle
      const containerHeight = scrollContainer.clientHeight;
      const scrollPosition = currentTimeTop - (containerHeight / 2);
      
      // Scroll vers cette position
      scrollContainer.scrollTop = Math.max(0, scrollPosition);
      
      console.log(`🎯 Centré sur l'heure actuelle: ${currentHour}:${currentMinutes.toString().padStart(2, '0')}`);
    }
  }
}

