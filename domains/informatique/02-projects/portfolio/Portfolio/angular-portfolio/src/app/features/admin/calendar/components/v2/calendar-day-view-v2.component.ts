import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCapsuleComponent, EventCapsule } from '../../../../../shared/components/event-capsule/event-capsule.component';
import { TicketCapsuleComponent, TicketCapsule } from '../../../../../shared/components/ticket-capsule/ticket-capsule.component';
import { EventDisplayService, CalendarEventResponse, EventCapsuleWithDate } from '../../services/event-display.service';

interface TimelineClickEvent {
  day: Date;
  hour: number;
  minutes: number;
  mouseEvent: MouseEvent;
}

@Component({
  selector: 'app-calendar-day-view-v2',
  standalone: true,
  imports: [CommonModule, EventCapsuleComponent, TicketCapsuleComponent],
  template: `
    <div class="day-view-v2">
      <!-- Header avec date -->
      <div class="day-header">
        <div class="time-column-header"></div>
        <div class="day-info">
          <div class="day-name">{{ currentDate | date:'EEEE':'fr-FR' }}</div>
          <div class="day-date">{{ currentDate | date:'d MMMM yyyy':'fr-FR' }}</div>
        </div>
      </div>

      <!-- Contenu scrollable -->
      <div class="day-content">
        <!-- Colonne des heures (sticky) -->
        <div class="time-column">
          <div *ngFor="let hour of hours" class="time-label">
            {{ hour }}:00
          </div>
        </div>

        <!-- Colonne principale -->
        <div class="main-column">
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
            *ngFor="let capsule of eventCapsules; trackBy: trackByEventId"
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
          *ngFor="let ticket of dayTickets; trackBy: trackByTicketId"
          [ticket]="ticket"
          [compact]="true"
          [style.top.px]="getTicketTop(ticket)"
          (ticketClick)="onTicketClick(ticket)"
          (ticketContextMenu)="onTicketContextMenu($event)">
        </app-ticket-capsule>

        <!-- Logs positionnés -->
        <div *ngFor="let log of dayLogs; trackBy: trackByLogId" 
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
               (contextmenu)="onTimelineRightClick($event)">
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

      <!-- Message vide -->
      <div class="empty-day-message" *ngIf="eventCapsules.length === 0 && dayTickets.length === 0">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3>Aucun événement aujourd'hui</h3>
        <p>Clic droit sur la timeline pour créer un événement ou un ticket</p>
      </div>
    </div>
  `,
  styles: [`
    .day-view-v2 {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1f2e;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    /* Header */
    .day-header {
      display: grid;
      grid-template-columns: 60px 1fr;
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

    .day-info {
      padding: 16px 24px;
      text-align: center;
    }

    .day-name {
      font-size: 16px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: capitalize;
      margin-bottom: 4px;
    }

    .day-date {
      font-size: 24px;
      font-weight: 700;
      color: #f1f5f9;
    }

    /* Contenu scrollable */
    .day-content {
      display: grid;
      grid-template-columns: 60px 1fr;
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

    /* Colonne principale */
    .main-column {
      position: relative;
      min-height: 1920px; /* 24h * 80px */
      cursor: context-menu;
    }

    .main-column:hover {
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

    /* Capsules positionnées */
    app-event-capsule {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 5;
      margin: 0 8px;
    }

    app-ticket-capsule {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 4;
      margin: 0 8px;
    }

    /* Logs */
    .log-item {
      position: absolute;
      left: 0;
      right: 0;
      background: #1e3a8a;
      border: 1px solid #3b82f6;
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
      padding: 6px 8px;
      margin: 0 8px;
      cursor: pointer;
      z-index: 3;
      font-size: 12px;
      color: #f1f5f9;
      transition: all 0.2s ease;
      min-height: 30px;
    }

    .log-item:hover {
      background: #1e40af;
      border-color: #60a5fa;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .log-time {
      font-weight: 700;
      color: #60a5fa;
      margin-bottom: 2px;
      font-size: 11px;
    }

    .log-content {
      font-size: 11px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #e2e8f0;
    }

    app-ticket-capsule {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 4;
      margin: 0 8px;
    }

    app-event-capsule {
      position: absolute;
      left: 0;
      right: 0;
      z-index: 5;
      margin: 0 8px;
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

    /* Message vide */
    .empty-day-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #64748b;
      z-index: 2;
    }

    .empty-day-message svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-day-message h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #94a3b8;
    }

    .empty-day-message p {
      margin: 0;
      font-size: 14px;
      opacity: 0.8;
    }

    /* Scrollbar personnalisée */
    .day-content::-webkit-scrollbar {
      width: 8px;
    }

    .day-content::-webkit-scrollbar-track {
      background: #1a1f2e;
    }

    .day-content::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 4px;
    }

    .day-content::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .day-header {
        grid-template-columns: 50px 1fr;
      }

      .day-content {
        grid-template-columns: 50px 1fr;
      }

      .time-column {
        width: 50px;
      }

      .time-label {
        font-size: 11px;
        padding: 6px 2px;
      }

      .day-info {
        padding: 12px 16px;
      }

      .day-name {
        font-size: 14px;
      }

      .day-date {
        font-size: 20px;
      }

      app-event-capsule,
      app-ticket-capsule {
        margin: 0 4px;
      }
    }

    @media (max-width: 480px) {
      .day-header {
        grid-template-columns: 40px 1fr;
      }

      .day-content {
        grid-template-columns: 40px 1fr;
      }

      .time-column {
        width: 40px;
      }

      .time-label {
        font-size: 10px;
        padding: 4px 1px;
      }

      .day-info {
        padding: 8px 12px;
      }

      .day-name {
        font-size: 12px;
      }

      .day-date {
        font-size: 18px;
      }
    }
  `]
})
export class CalendarDayViewV2Component implements OnInit, OnChanges {
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

  eventCapsules: EventCapsuleWithDate[] = [];
  dayTickets: any[] = [];
  dayLogs: any[] = [];
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  pixelsPerHour = 80;

  constructor(private eventDisplayService: EventDisplayService) {}

  ngOnInit(): void {
    console.log('🎯 CalendarDayViewV2Component initialized');
    this.updateDayData();
    // Centrer automatiquement l'heure actuelle
    setTimeout(() => this.centerCurrentTime(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate'] || changes['events'] || changes['tickets']) {
      this.updateDayData();
      // Recentrer l'heure actuelle après les changements
      setTimeout(() => this.centerCurrentTime(), 100);
    }
  }

  updateDayData(): void {
    console.log('🎯 DAY updateDayData - currentDate:', this.currentDate);
    console.log('🎯 DAY updateDayData - events:', this.events);
    
    // Récupérer les capsules d'événements pour ce jour
    this.eventCapsules = this.eventDisplayService.getEventsForDate(this.events, this.currentDate);
    console.log('🎯 DAY updateDayData - eventCapsules:', this.eventCapsules);
    
    // Récupérer les tickets pour ce jour
    this.dayTickets = this.getTicketsForDate(this.currentDate);
    
    // Récupérer les logs pour ce jour
    this.dayLogs = this.getLogsForDate(this.currentDate);
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
    return this.eventDisplayService.calculateEventTop(capsule, this.currentDate, this.pixelsPerHour);
  }

  getEventHeight(capsule: EventCapsuleWithDate): number {
    return this.eventDisplayService.calculateEventHeight(capsule, this.currentDate, this.pixelsPerHour);
  }

  getEventLeft(capsule: EventCapsuleWithDate): number {
    // Pour l'instant, pas de gestion de collision horizontale
    return 0;
  }

  getEventWidth(capsule: EventCapsuleWithDate): number {
    // Pour l'instant, pleine largeur
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
  onTimelineRightClick(mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    
    const target = mouseEvent.currentTarget as HTMLElement;
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const y = mouseEvent.clientY - rect.top;
    const hour = Math.floor(y / this.pixelsPerHour);
    const minutes = Math.floor((y % this.pixelsPerHour) / (this.pixelsPerHour / 60));
    
    this.timelineRightClick.emit({
      day: this.currentDate,
      hour: Math.max(0, Math.min(23, hour)),
      minutes: Math.max(0, Math.min(59, minutes)),
      mouseEvent
    });
  }

  onEventClick(event: EventCapsule): void {
    console.log('🎯 DAY Event clicked:', event);
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
    const scrollContainer = document.querySelector('.day-content');
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

