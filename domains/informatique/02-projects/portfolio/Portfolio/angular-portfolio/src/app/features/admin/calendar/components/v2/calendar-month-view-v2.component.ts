import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCapsuleComponent, EventCapsule } from '../../../../../shared/components/event-capsule/event-capsule.component';
import { EventDisplayService, CalendarEventResponse, EventCapsuleWithDate } from '../../services/event-display.service';

interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  eventCapsules: EventCapsuleWithDate[];
  tickets: any[];
  logs: any[];
}

@Component({
  selector: 'app-calendar-month-view-v2',
  standalone: true,
  imports: [CommonModule, EventCapsuleComponent],
  template: `
    <div class="month-view-v2">
      <!-- Header avec jours de la semaine -->
      <div class="month-header">
        <div class="day-header" *ngFor="let dayName of weekDays">
          {{ dayName }}
        </div>
      </div>

      <!-- Grille du calendrier -->
      <div class="month-grid">
        <div 
          *ngFor="let day of monthDays; trackBy: trackByDate" 
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.today]="day.isToday"
          [class.has-events]="day.eventCapsules.length > 0"
          [class.has-tickets]="day.tickets.length > 0"
          (click)="onDayClick(day)"
          (contextmenu)="onDayRightClick(day, $event)">
          
          <!-- Numéro du jour -->
          <div class="day-number">
            {{ day.date | date:'d' }}
          </div>

          <!-- Indicateurs de contenu -->
          <div class="content-indicators">
            <div class="event-indicator" *ngIf="day.eventCapsules.length > 0" 
                 [title]="day.eventCapsules.length + ' événement(s)'">
              {{ day.eventCapsules.length }}
            </div>
            <div class="ticket-indicator" *ngIf="day.tickets.length > 0"
                 [title]="day.tickets.length + ' ticket(s)'">
              {{ day.tickets.length }}
            </div>
            <div class="log-indicator" *ngIf="day.logs.length > 0"
                 [title]="day.logs.length + ' log(s)'">
              {{ day.logs.length }}
            </div>
          </div>

          <!-- Capsules d'événements (limitées aux plus récents) -->
          <div class="day-events" *ngIf="day.eventCapsules.length > 0">
            <app-event-capsule
              *ngFor="let capsule of getLimitedEvents(day.eventCapsules); trackBy: trackByEventId"
              [event]="capsule"
              [type]="capsule.type"
              [compact]="true"
              [showTime]="false"
              (capsuleClick)="onEventClick($event)"
              (capsuleContextMenu)="onEventContextMenu($event)">
            </app-event-capsule>
            
            <!-- Indicateur s'il y a plus d'événements -->
            <div class="more-events-indicator" *ngIf="day.eventCapsules.length > maxEventsPerDay">
              <span class="more-events-text">+{{ day.eventCapsules.length - maxEventsPerDay }} autres</span>
            </div>
          </div>

          <!-- Message vide -->
          <div class="empty-day-message" *ngIf="day.eventCapsules.length === 0 && day.tickets.length === 0 && day.logs.length === 0 && day.isCurrentMonth">
            <span class="empty-hint">Clic droit pour créer</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .month-view-v2 {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1f2e;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Header des jours */
    .month-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #1e293b;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .day-header {
      padding: 16px 8px;
      text-align: center;
      font-weight: 600;
      font-size: 13px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    .day-header:last-child {
      border-right: none;
    }

    /* Grille du calendrier */
    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      min-height: 0;
    }

    .calendar-day {
      min-height: 120px;
      padding: 12px 8px;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .calendar-day:hover {
      background: rgba(59, 130, 246, 0.05);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .calendar-day:last-child {
      border-right: none;
    }

    /* États des jours */
    .calendar-day.other-month {
      background: rgba(0, 0, 0, 0.1);
      opacity: 0.4;
    }

    .calendar-day.today {
      background: rgba(59, 130, 246, 0.1);
      border: 2px solid #3b82f6;
    }

    .calendar-day.has-events {
      background: rgba(16, 185, 129, 0.05);
    }

    .calendar-day.has-tickets {
      background: rgba(168, 85, 247, 0.05);
    }

    /* Numéro du jour */
    .day-number {
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 4px;
    }

    .calendar-day.other-month .day-number {
      color: #64748b;
    }

    .calendar-day.today .day-number {
      color: #3b82f6;
      font-weight: 700;
    }

    /* Indicateurs de contenu */
    .content-indicators {
      display: flex;
      gap: 4px;
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .event-indicator {
      background: #10b981;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
    }

    .ticket-indicator {
      background: #a855f7;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      box-shadow: 0 2px 4px rgba(168, 85, 247, 0.3);
    }

    .log-indicator {
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      cursor: help;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    /* Événements seulement */
    .day-events {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
    }

    /* Indicateur "+X autres" */
    .more-events-indicator {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 3px;
      padding: 2px 4px;
      margin-top: 2px;
      text-align: center;
    }

    .more-events-text {
      font-size: 9px;
      color: #60a5fa;
      font-weight: 600;
      font-style: italic;
    }

    /* Message vide */
    .empty-day-message {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .calendar-day:hover .empty-day-message {
      opacity: 1;
    }

    .empty-hint {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .calendar-day {
        min-height: 80px;
        padding: 8px 4px;
      }

      .day-number {
        font-size: 14px;
      }

      .day-header {
        padding: 12px 4px;
        font-size: 11px;
      }

      .content-indicators {
        top: 4px;
        right: 4px;
      }

      .event-indicator,
      .ticket-indicator,
      .log-indicator {
        width: 16px;
        height: 16px;
        font-size: 9px;
      }
    }

    /* Animation d'entrée */
    .calendar-day {
      animation: fadeInUp 0.3s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Focus pour accessibilité */
    .calendar-day:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `]
})
export class CalendarMonthViewV2Component implements OnInit, OnChanges {
  @Input() currentDate: Date = new Date();
  @Input() events: CalendarEventResponse[] = [];
  @Input() tickets: any[] = [];
  @Input() logs: any[] = [];

  @Output() dayClick = new EventEmitter<Date>();
  @Output() dayRightClick = new EventEmitter<{date: Date, mouseEvent: MouseEvent}>();
  @Output() eventClick = new EventEmitter<EventCapsuleWithDate>();
  @Output() eventContextMenu = new EventEmitter<{event: EventCapsule, mouseEvent: MouseEvent}>();
  @Output() ticketClick = new EventEmitter<any>();
  @Output() ticketContextMenu = new EventEmitter<{ticket: any, mouseEvent: MouseEvent}>();
  @Output() logClick = new EventEmitter<any>();
  @Output() logContextMenu = new EventEmitter<{log: any, mouseEvent: MouseEvent}>();

  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  monthDays: MonthDay[] = [];
  maxEventsPerDay = 3; // Limite d'événements affichés par jour

  constructor(private eventDisplayService: EventDisplayService) {}

  ngOnInit(): void {
    this.generateMonthDays();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate'] || changes['events'] || changes['tickets']) {
      this.generateMonthDays();
    }
  }

  generateMonthDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Générer les jours du mois
    const days = this.eventDisplayService.generateMonthDays(year, month);
    
    this.monthDays = days.map(date => {
      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isToday(date);
      
      // Récupérer les capsules d'événements pour ce jour
      const eventCapsules = this.eventDisplayService.getEventsForDate(this.events, date);
      
      // Récupérer les tickets pour ce jour (logique simplifiée)
      const dayTickets = this.getTicketsForDate(date);
      
      // Récupérer les logs pour ce jour (logique simplifiée)
      const dayLogs = this.getLogsForDate(date);
      
      return {
        date,
        isCurrentMonth,
        isToday,
        eventCapsules,
        tickets: dayTickets,
        logs: dayLogs
      };
    });
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  private getTicketsForDate(date: Date): any[] {
    // Logique simplifiée - à adapter selon votre modèle de tickets
    return this.tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at || ticket.due_date);
      return ticketDate.toDateString() === date.toDateString();
    });
  }

  private getLogsForDate(date: Date): any[] {
    // Logique simplifiée - à adapter selon votre modèle de logs
    return this.logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate.toDateString() === date.toDateString();
    });
  }

  // Event handlers
  onDayClick(day: MonthDay): void {
    this.dayClick.emit(day.date);
  }

  onDayRightClick(day: MonthDay, mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    this.dayRightClick.emit({ date: day.date, mouseEvent });
  }

  onEventClick(event: EventCapsule): void {
    console.log('🎯 MONTH Event clicked:', event);
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

  onLogClick(log: any): void {
    console.log('🎯 MONTH Log clicked:', log);
    this.logClick.emit(log);
  }

  onLogContextMenu(log: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('🎯 MONTH Log context menu:', log);
    this.logContextMenu.emit({ log, mouseEvent: event });
  }

  getLimitedEvents(eventCapsules: EventCapsuleWithDate[]): EventCapsuleWithDate[] {
    // Trier par date de début (plus récent en premier) et limiter le nombre
    return eventCapsules
      .sort((a, b) => {
        const dateA = new Date(a.start_datetime || a.displayDate);
        const dateB = new Date(b.start_datetime || b.displayDate);
        return dateB.getTime() - dateA.getTime(); // Plus récent en premier
      })
      .slice(0, this.maxEventsPerDay);
  }

  // TrackBy functions pour optimiser les performances
  trackByDate(index: number, day: MonthDay): string {
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
}

