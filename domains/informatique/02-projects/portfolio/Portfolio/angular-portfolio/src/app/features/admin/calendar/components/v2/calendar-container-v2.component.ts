import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CalendarMonthViewV2Component } from './calendar-month-view-v2.component';
import { CalendarWeekViewV2Component } from './calendar-week-view-v2.component';
import { CalendarDayViewV2Component } from './calendar-day-view-v2.component';
import { CalendarListViewV2Component } from './calendar-list-view-v2.component';
import { EventDisplayService, EventCapsuleWithDate } from '../../services/event-display.service';
import { CalendarEventResponse } from '../../../../../models/calendar.model';
import { EventCapsule } from '../../../../../shared/components/event-capsule/event-capsule.component';
import { CalendarService } from '../../../../../core/services/calendar.service';
import { CalendarEventModalComponent, EventContext } from '../calendar-event-modal.component';
import { TicketModalComponent, TicketContext } from '../../../tickets/components/ticket-modal.component';

type CalendarView = 'month' | 'week' | 'day' | 'list';

interface ContextMenuOption {
  icon?: string;
  label?: string;
  action?: () => void;
  divider?: boolean;
  destructive?: boolean;
}

@Component({
  selector: 'app-calendar-container-v2',
  standalone: true,
  imports: [
    CommonModule,
    CalendarMonthViewV2Component,
    CalendarWeekViewV2Component,
    CalendarDayViewV2Component,
    CalendarListViewV2Component,
    CalendarEventModalComponent,
    TicketModalComponent
  ],
  template: `
    <div class="calendar-container-v2">
      <!-- Header avec navigation -->
      <div class="calendar-header">
        <!-- Navigation -->
        <div class="navigation">
          <button class="nav-btn" (click)="navigatePrevious()" title="Précédent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>
            </svg>
          </button>
          
          <div class="current-period">
            <h2>{{ getCurrentPeriodTitle() }}</h2>
            <button class="today-btn" (click)="goToToday()">Aujourd'hui</button>
          </div>
          
          <button class="nav-btn" (click)="navigateNext()" title="Suivant">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
            </svg>
          </button>
        </div>

        <!-- Sélection de vue -->
        <div class="view-toggle">
          <button 
            class="view-btn" 
            [class.active]="currentView === 'month'"
            (click)="setView('month')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
            </svg>
            Mois
          </button>
          <button 
            class="view-btn" 
            [class.active]="currentView === 'week'"
            (click)="setView('week')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,13H21V11H7V13M7,17H21V15H7V17M7,7V9H21V7H7Z"/>
            </svg>
            Semaine
          </button>
          <button 
            class="view-btn" 
            [class.active]="currentView === 'day'"
            (click)="setView('day')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V7H5V5H19M5,19V9H19V19H5Z"/>
            </svg>
            Jour
          </button>
          <button 
            class="view-btn" 
            [class.active]="currentView === 'list'"
            (click)="setView('list')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,13H21V11H7V13M7,17H21V15H7V17M7,7V9H21V7H7Z"/>
            </svg>
            Liste
          </button>
        </div>
      </div>

      <!-- Contenu du calendrier -->
      <div class="calendar-content">
        <!-- Vue MONTH -->
        <app-calendar-month-view-v2
          *ngIf="currentView === 'month'"
          [currentDate]="currentDate"
          [events]="events"
          [tickets]="tickets"
          [logs]="logs"
          (dayClick)="onDayClick($event)"
          (dayRightClick)="onDayRightClick($event)"
          (eventClick)="onEventClick($event)"
          (eventContextMenu)="onEventContextMenu($event)"
          (ticketClick)="onTicketClick($event)"
          (ticketContextMenu)="onTicketContextMenu($event)">
        </app-calendar-month-view-v2>

        <!-- Vue WEEK -->
        <app-calendar-week-view-v2
          *ngIf="currentView === 'week'"
          [currentDate]="currentDate"
          [events]="events"
          [tickets]="tickets"
          [logs]="logs"
          [showCurrentTime]="true"
          (timelineRightClick)="onTimelineRightClick($event)"
          (eventClick)="onEventClick($event)"
          (eventContextMenu)="onEventContextMenu($event)"
          (ticketClick)="onTicketClick($event)"
          (ticketContextMenu)="onTicketContextMenu($event)"
          (logClick)="onLogClick($event)"
          (logContextMenu)="onLogContextMenu($event)">
        </app-calendar-week-view-v2>

        <!-- Vue DAY -->
        <app-calendar-day-view-v2
          *ngIf="currentView === 'day'"
          [currentDate]="currentDate"
          [events]="events"
          [tickets]="tickets"
          [logs]="logs"
          [showCurrentTime]="true"
          (timelineRightClick)="onTimelineRightClick($event)"
          (eventClick)="onEventClick($event)"
          (eventContextMenu)="onEventContextMenu($event)"
          (ticketClick)="onTicketClick($event)"
          (ticketContextMenu)="onTicketContextMenu($event)"
          (logClick)="onLogClick($event)"
          (logContextMenu)="onLogContextMenu($event)">
        </app-calendar-day-view-v2>

        <!-- Vue LIST -->
        <app-calendar-list-view-v2
          *ngIf="currentView === 'list'"
          [currentDate]="currentDate"
          [events]="events"
          [tickets]="tickets"
          [logs]="logs"
          (eventClick)="onEventClick($event)"
          (eventContextMenu)="onEventContextMenu($event)">
        </app-calendar-list-view-v2>
      </div>

      <!-- Menu contextuel -->
      <div 
        class="context-menu" 
        *ngIf="showContextMenu"
        [style.left.px]="contextMenuPosition.x"
        [style.top.px]="contextMenuPosition.y">
        <div class="context-menu-item" 
             *ngFor="let option of contextMenuOptions"
             [class.divider]="option.divider"
             [class.destructive]="option.destructive"
             (click)="executeContextAction(option)">
          <svg *ngIf="option.icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path [attr.d]="getIconPath(option.icon)"/>
          </svg>
          <span>{{ option.label }}</span>
        </div>
      </div>

      <!-- Overlay pour fermer le menu contextuel -->
      <div 
        class="context-menu-overlay" 
        *ngIf="showContextMenu"
        (click)="hideContextMenu()">
      </div>

      <!-- Event Modal -->
      <app-calendar-event-modal
        [isVisible]="showEventModal"
        [editingEvent]="selectedEvent"
        [context]="eventContext"
        (close)="onEventModalClose()"
        (save)="onEventModalSave($event)"
        (delete)="onEventModalDelete($event)">
      </app-calendar-event-modal>

      <!-- Ticket Modal -->
      <app-ticket-modal
        [isVisible]="showTicketModal"
        [editingTicket]="selectedTicket"
        [context]="ticketContext"
        (close)="onTicketModalClose()"
        (save)="onTicketModalSave($event)">
      </app-ticket-modal>
    </div>
  `,
  styles: [`
    .calendar-container-v2 {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0f172a;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    }

    /* Header */
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: #1a1f2e;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
    }

    .navigation {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .nav-btn:hover {
      background: #4b5563;
      border-color: #6b7280;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .current-period {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .current-period h2 {
      margin: 0;
      color: #f3f4f6;
      font-size: 24px;
      font-weight: 600;
    }

    .today-btn {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .today-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    /* Sélection de vue */
    .view-toggle {
      display: flex;
      background: #2d2d2d;
      border-radius: 8px;
      padding: 4px;
      border: 1px solid #404040;
    }

    .view-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: transparent;
      color: #999;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
      font-weight: 500;
    }

    .view-btn:hover {
      background: #404040;
      color: #f3f4f6;
      transform: translateY(-1px);
    }

    .view-btn.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    /* Contenu */
    .calendar-content {
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }

    /* Menu contextuel */
    .context-menu {
      position: fixed;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      z-index: 1000;
      padding: 8px;
      min-width: 200px;
    }

    .context-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.2s ease;
      font-size: 14px;
      color: #e2e8f0;
    }

    .context-menu-item:hover {
      background: #2d3748;
    }

    .context-menu-item.divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 4px 0;
      padding: 0;
      cursor: default;
    }

    .context-menu-item.destructive {
      color: #ef4444;
    }

    .context-menu-item.destructive:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .context-menu-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .calendar-header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .navigation {
        order: 2;
      }

      .view-toggle {
        order: 1;
        width: 100%;
        justify-content: center;
      }

      .view-btn {
        flex: 1;
        justify-content: center;
      }

      .current-period h2 {
        font-size: 20px;
      }
    }

    /* Animations */
    .calendar-content {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class CalendarContainerV2Component implements OnInit, OnDestroy {
  currentView: CalendarView = 'month';
  currentDate: Date = new Date();
  events: CalendarEventResponse[] = [];
  tickets: any[] = [];
  logs: any[] = [];

  // Menu contextuel
  showContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuOptions: ContextMenuOption[] = [];
  contextMenuData: any = null;

  // Event modal
  showEventModal = false;
  eventContext: EventContext = { type: 'calendar' };
  selectedEvent: CalendarEventResponse | null = null;

  // Ticket modal
  showTicketModal = false;
  ticketContext: TicketContext = { type: 'normal' };
  selectedTicket: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private eventDisplayService: EventDisplayService,
    private calendarService: CalendarService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🎯 CalendarContainerV2Component initialized');
    // Charger les données pour la période actuelle
    this.loadDataForCurrentPeriod();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // Charger les événements réels depuis l'API
    this.calendarService.getEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          console.log('Événements chargés:', events);
          this.events = events;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des événements:', error);
          // En cas d'erreur, utiliser des données de test
          this.events = [
            {
              id: 1,
              title: 'hhtrs',
              start_datetime: new Date('2025-10-03T20:11:00'),
              end_datetime: new Date('2025-10-23T20:11:00'),
              status: 'planned',
              category: 'work'
            } as any,
            {
              id: 2,
              title: 'test',
              start_datetime: new Date('2025-10-23T22:00:00'),
              end_datetime: new Date('2025-10-23T23:00:00'),
              status: 'confirmed',
              category: 'personal'
            } as any
          ];
        }
      });
  }

  // Navigation
  navigatePrevious(): void {
    if (this.currentView === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else if (this.currentView === 'week') {
      this.currentDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (this.currentView === 'day') {
      this.currentDate = new Date(this.currentDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (this.currentView === 'list') {
      // Pour la vue LIST, on peut naviguer par mois
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    }
    this.loadDataForCurrentPeriod();
  }

  navigateNext(): void {
    if (this.currentView === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else if (this.currentView === 'week') {
      this.currentDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (this.currentView === 'day') {
      this.currentDate = new Date(this.currentDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (this.currentView === 'list') {
      // Pour la vue LIST, on peut naviguer par mois
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    }
    this.loadDataForCurrentPeriod();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.loadDataForCurrentPeriod();
  }

  setView(view: CalendarView): void {
    this.currentView = view;
    this.loadDataForCurrentPeriod();
  }

  private notifyDataChange(): void {
    // Forcer la détection des changements pour les composants enfants
    this.changeDetector.detectChanges();
  }

  private loadDataForCurrentPeriod(): void {
    // Calculer la plage de dates selon la vue
    let dateFrom: string = '';
    let dateTo: string = '';

    if (this.currentView === 'month') {
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
      dateFrom = startOfMonth.toISOString().split('T')[0];
      dateTo = endOfMonth.toISOString().split('T')[0];
    } else if (this.currentView === 'week') {
      const startOfWeek = new Date(this.currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      dateFrom = startOfWeek.toISOString().split('T')[0];
      dateTo = endOfWeek.toISOString().split('T')[0];
    } else if (this.currentView === 'day') {
      // Day view
      dateFrom = this.currentDate.toISOString().split('T')[0];
      dateTo = dateFrom;
    } else if (this.currentView === 'list') {
      // List view - charger les événements du mois en cours
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
      dateFrom = startOfMonth.toISOString().split('T')[0];
      dateTo = endOfMonth.toISOString().split('T')[0];
    }

    // Charger TOUS les événements (pas de filtrage par période)
    // Les composants enfants se chargeront du filtrage selon leur vue
    this.calendarService.getEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          console.log(`Événements chargés pour ${this.currentView}:`, events);
          
          // Ajouter des événements de test si aucun événement n'est chargé
          if (!events || events.length === 0) {
            const today = new Date();
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            
            this.events = [
              {
                id: 1,
                title: 'hhtrs',
                start_datetime: new Date('2025-10-03T20:11:00'),
                end_datetime: new Date('2025-10-23T20:11:00'),
                status: 'planned',
                category: 'work',
                description: 'Événement multi-jours',
                location: 'Bureau'
              } as any,
              {
                id: 2,
                title: 'test',
                start_datetime: new Date('2025-10-23T22:00:00'),
                end_datetime: new Date('2025-10-23T23:00:00'),
                status: 'confirmed',
                category: 'personal',
                description: 'Événement de test',
                location: 'Maison'
              } as any,
              {
                id: 3,
                title: 'Réunion Hier',
                start_datetime: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000), // 14h hier
                end_datetime: new Date(yesterday.getTime() + 15 * 60 * 60 * 1000), // 15h hier
                status: 'completed',
                category: 'meeting',
                description: 'Réunion terminée hier',
                location: 'Salle de conférence'
              } as any,
              {
                id: 4,
                title: 'Rendez-vous Demain',
                start_datetime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10h demain
                end_datetime: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000), // 11h demain
                status: 'planned',
                category: 'appointment',
                description: 'Rendez-vous médical',
                location: 'Cabinet médical'
              } as any,
              {
                id: 5,
                title: 'Événement Aujourd\'hui 22h',
                start_datetime: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 22h aujourd'hui
                end_datetime: new Date(today.getTime() + 23 * 60 * 60 * 1000), // 23h aujourd'hui
                status: 'planned',
                category: 'personal',
                description: 'Événement de test à 22h',
                location: 'Test Location'
              } as any,
              {
                id: 6,
                title: 'Projet Long',
                start_datetime: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
                end_datetime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
                status: 'in_progress',
                category: 'project',
                description: 'Projet qui s\'étale sur plusieurs jours',
                location: 'Bureau'
              } as any,
              {
                id: 7,
                title: 'Formation',
                start_datetime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Dans 2 jours à 9h
                end_datetime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // Dans 2 jours à 17h
                status: 'planned',
                category: 'training',
                description: 'Formation d\'une journée',
                location: 'Centre de formation'
              } as any,
              {
                id: 8,
                title: 'Weekend',
                start_datetime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // Dans 4 jours
                end_datetime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000), // Dans 6 jours
                status: 'planned',
                category: 'personal',
                description: 'Weekend de repos',
                location: 'Maison'
              } as any
            ];
            console.log('🎯 Aucun événement trouvé, ajout d\'événements de test:', this.events);
          } else {
            // Utiliser seulement les événements de l'API (pas d'événements de test)
            this.events = events;
            console.log('🎯 Événements chargés depuis l\'API seulement:', this.events);
            console.log('🎯 Détail des événements API:', events);
            
            // Afficher les détails de chaque événement API
            events.forEach((event, index) => {
              console.log(`🎯 Événement API ${index + 1}:`, {
                id: event.id,
                title: event.title,
                start_datetime: event.start_datetime,
                end_datetime: event.end_datetime,
                start_date: new Date(event.start_datetime).toDateString(),
                end_date: event.end_datetime ? new Date(event.end_datetime).toDateString() : 'N/A'
              });
            });
          }
          
          // Charger les tickets et logs de test
          this.loadTestTicketsAndLogs();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des événements:', error);
          // Ajouter des événements de test pour diagnostiquer
          const today = new Date();
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          
          this.events = [
            {
              id: 1,
              title: 'hhtrs',
              start_datetime: new Date('2025-10-03T20:11:00'),
              end_datetime: new Date('2025-10-23T20:11:00'),
              status: 'planned',
              category: 'work',
              description: 'Événement multi-jours',
              location: 'Bureau'
            } as any,
            {
              id: 2,
              title: 'test',
              start_datetime: new Date('2025-10-23T22:00:00'),
              end_datetime: new Date('2025-10-23T23:00:00'),
              status: 'confirmed',
              category: 'personal',
              description: 'Événement de test',
              location: 'Maison'
            } as any,
            {
              id: 3,
              title: 'Réunion Hier',
              start_datetime: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000), // 14h hier
              end_datetime: new Date(yesterday.getTime() + 15 * 60 * 60 * 1000), // 15h hier
              status: 'completed',
              category: 'meeting',
              description: 'Réunion terminée hier',
              location: 'Salle de conférence'
            } as any,
            {
              id: 4,
              title: 'Rendez-vous Demain',
              start_datetime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10h demain
              end_datetime: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000), // 11h demain
              status: 'planned',
              category: 'appointment',
              description: 'Rendez-vous médical',
              location: 'Cabinet médical'
            } as any,
            {
              id: 5,
              title: 'Événement Aujourd\'hui 22h',
              start_datetime: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 22h aujourd'hui
              end_datetime: new Date(today.getTime() + 23 * 60 * 60 * 1000), // 23h aujourd'hui
              status: 'planned',
              category: 'personal',
              description: 'Événement de test à 22h',
              location: 'Test Location'
            } as any,
            {
              id: 6,
              title: 'Projet Long',
              start_datetime: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
              end_datetime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
              status: 'in_progress',
              category: 'project',
              description: 'Projet qui s\'étale sur plusieurs jours',
              location: 'Bureau'
            } as any,
            {
              id: 7,
              title: 'Formation',
              start_datetime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Dans 2 jours à 9h
              end_datetime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // Dans 2 jours à 17h
              status: 'planned',
              category: 'training',
              description: 'Formation d\'une journée',
              location: 'Centre de formation'
            } as any,
            {
              id: 8,
              title: 'Weekend',
              start_datetime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // Dans 4 jours
              end_datetime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000), // Dans 6 jours
              status: 'planned',
              category: 'personal',
              description: 'Weekend de repos',
              location: 'Maison'
            } as any
          ];
          console.log('🎯 Événements de test ajoutés:', this.events);
          
          // Charger les tickets et logs de test
          this.loadTestTicketsAndLogs();
        }
      });
  }

  private loadTestTicketsAndLogs(): void {
    const today = new Date();
    
    // Créer des tickets de test
    this.tickets = [
      {
        id: 1,
        title: 'Ticket Bug Critique',
        description: 'Bug critique à corriger',
        priority: 'high',
        status: 'open',
        created_at: new Date(today.getTime() - 2 * 60 * 60 * 1000), // Il y a 2h
        due_date: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Demain
        assignee: 'Dev Team'
      },
      {
        id: 2,
        title: 'Amélioration UX',
        description: 'Améliorer l\'interface utilisateur',
        priority: 'medium',
        status: 'in_progress',
        created_at: new Date(today.getTime() - 4 * 60 * 60 * 1000), // Il y a 4h
        due_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
        assignee: 'UX Team'
      },
      {
        id: 3,
        title: 'Maintenance Serveur',
        description: 'Maintenance préventive du serveur',
        priority: 'low',
        status: 'planned',
        created_at: new Date(today.getTime() - 6 * 60 * 60 * 1000), // Il y a 6h
        due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Dans 1 semaine
        assignee: 'DevOps Team'
      }
    ];

    // Créer des logs de test
    this.logs = [
      {
        id: 1,
        message: 'Erreur 500 sur l\'API utilisateurs',
        description: 'Erreur serveur lors de la récupération des utilisateurs',
        level: 'error',
        created_at: new Date(today.getTime() - 1 * 60 * 60 * 1000), // Il y a 1h
        source: 'API',
        user_id: 1
      },
      {
        id: 2,
        message: 'Connexion utilisateur réussie',
        description: 'Utilisateur admin connecté avec succès',
        level: 'info',
        created_at: new Date(today.getTime() - 3 * 60 * 60 * 1000), // Il y a 3h
        source: 'Auth',
        user_id: 1
      },
      {
        id: 3,
        message: 'Sauvegarde automatique terminée',
        description: 'Sauvegarde de la base de données terminée avec succès',
        level: 'success',
        created_at: new Date(today.getTime() - 5 * 60 * 60 * 1000), // Il y a 5h
        source: 'Backup',
        user_id: null
      },
      {
        id: 4,
        message: 'Avertissement mémoire faible',
        description: 'Utilisation mémoire à 85%',
        level: 'warning',
        created_at: new Date(today.getTime() - 7 * 60 * 60 * 1000), // Il y a 7h
        source: 'System',
        user_id: null
      }
    ];

    console.log('🎯 Tickets de test chargés:', this.tickets);
    console.log('🎯 Logs de test chargés:', this.logs);
  }

  getCurrentPeriodTitle(): string {
    if (this.currentView === 'month') {
      return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (this.currentView === 'week') {
      const startOfWeek = new Date(this.currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (this.currentView === 'day') {
      return this.currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (this.currentView === 'list') {
      return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    
    // Fallback par défaut
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // Event handlers
  onDayClick(date: Date): void {
    this.currentDate = date;
    if (this.currentView === 'month') {
      this.setView('day');
    }
  }

  onDayRightClick(data: {date: Date, mouseEvent: MouseEvent}): void {
    this.showContextMenu = true;
    this.contextMenuPosition = {
      x: data.mouseEvent.clientX,
      y: data.mouseEvent.clientY
    };
    this.contextMenuData = { type: 'day', date: data.date };
    this.contextMenuOptions = [
      {
        icon: 'calendar-plus',
        label: 'Nouvel événement',
        action: () => this.createEvent(data.date)
      },
      {
        icon: 'ticket',
        label: 'Nouveau ticket',
        action: () => this.createTicket(data.date)
      }
    ];
  }

  onTimelineRightClick(data: any): void {
    this.showContextMenu = true;
    this.contextMenuPosition = {
      x: data.mouseEvent.clientX,
      y: data.mouseEvent.clientY
    };
    this.contextMenuData = { type: 'timeline', ...data };
    this.contextMenuOptions = [
      {
        icon: 'calendar-plus',
        label: `Nouvel événement à ${data.hour}:${data.minutes.toString().padStart(2, '0')}`,
        action: () => this.createEventAtTime(data.day, data.hour, data.minutes)
      },
      {
        icon: 'ticket',
        label: `Nouveau ticket à ${data.hour}:${data.minutes.toString().padStart(2, '0')}`,
        action: () => this.createTicketAtTime(data.day, data.hour, data.minutes)
      }
    ];
  }

  onEventClick(event: EventCapsule): void {
    console.log('🎯 Event clicked:', event);
    // Ouvrir le modal d'édition avec l'événement
    this.openEventModal(event as EventCapsuleWithDate, { type: 'calendar' });
  }

  onEventContextMenu(data: {event: EventCapsule, mouseEvent: MouseEvent}): void {
    this.showContextMenu = true;
    this.contextMenuPosition = {
      x: data.mouseEvent.clientX,
      y: data.mouseEvent.clientY
    };
    this.contextMenuData = { type: 'event', event: data.event };
    this.contextMenuOptions = [
      {
        icon: 'edit',
        label: 'Modifier l\'événement',
        action: () => this.editEvent(data.event)
      },
      {
        icon: 'copy',
        label: 'Dupliquer',
        action: () => this.duplicateEvent(data.event)
      },
      {
        icon: 'share',
        label: 'Partager',
        action: () => this.shareEvent(data.event)
      },
      { divider: true },
      {
        icon: 'trash',
        label: 'Supprimer',
        action: () => this.deleteEvent(data.event),
        destructive: true
      }
    ];
  }

  onTicketClick(ticket: any): void {
    console.log('Ticket clicked:', ticket);
    // Ouvrir le modal d'édition avec le ticket
    this.openTicketModal(ticket, { type: 'normal' });
  }

  onTicketContextMenu(data: {ticket: any, mouseEvent: MouseEvent}): void {
    this.showContextMenu = true;
    this.contextMenuPosition = {
      x: data.mouseEvent.clientX,
      y: data.mouseEvent.clientY
    };
    this.contextMenuData = { type: 'ticket', ticket: data.ticket };
    this.contextMenuOptions = [
      {
        icon: 'edit',
        label: 'Modifier le ticket',
        action: () => this.editTicket(data.ticket)
      },
      {
        icon: 'trash',
        label: 'Supprimer',
        action: () => this.deleteTicket(data.ticket),
        destructive: true
      }
    ];
  }

  onLogClick(log: any): void {
    console.log('Log clicked:', log);
    // Pour l'instant, juste logger. On pourrait ouvrir un modal de détail
  }

  onLogContextMenu(data: {log: any, mouseEvent: MouseEvent}): void {
    data.mouseEvent.preventDefault();
    data.mouseEvent.stopPropagation();
    console.log('Log context menu:', data.log);
    // Pour l'instant, juste logger. On pourrait ajouter des options de menu
  }

  // Actions du menu contextuel
  executeContextAction(option: ContextMenuOption): void {
    if (option.action) {
      option.action();
    }
    this.hideContextMenu();
  }

  hideContextMenu(): void {
    this.showContextMenu = false;
    this.contextMenuData = null;
    this.contextMenuOptions = [];
  }

  // Actions spécifiques
  createEvent(date: Date): void {
    console.log('Create event for date:', date);
    
    // Créer une date locale sans décalage horaire
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateString = this.dateToLocalISOString(localDate).split('T')[0];
    
    console.log('Date locale créée:', localDate);
    console.log('Date string:', dateString);
    
    this.openEventModal(null, { 
      type: 'calendar',
      date: dateString
    });
  }

  createTicket(date: Date): void {
    console.log('Create ticket for date:', date);
    this.openTicketModal(null, { type: 'normal' });
  }

  createEventAtTime(date: Date, hour: number, minutes: number): void {
    const eventDate = new Date(date);
    eventDate.setHours(hour, minutes, 0, 0);
    console.log('Create event at time:', eventDate);
    
    // Créer un événement temporaire avec l'heure pré-remplie
    const newEvent: any = {
      id: 0,
      title: '',
      description: '',
      start_datetime: eventDate,
      end_datetime: new Date(eventDate.getTime() + 60 * 60 * 1000), // +1 heure
      location: '',
      category: '',
      tags: '',
      status: 'planned'
    };
    
    this.openEventModal({ originalEvent: newEvent } as EventCapsule, { 
      type: 'calendar',
      date: this.dateToLocalISOString(eventDate).split('T')[0],
      time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    });
  }

  createTicketAtTime(date: Date, hour: number, minutes: number): void {
    const ticketDate = new Date(date);
    ticketDate.setHours(hour, minutes, 0, 0);
    console.log('Create ticket at time:', ticketDate);
    
    // Créer un ticket temporaire avec l'heure pré-remplie
    const newTicket: any = {
      id: 0,
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
      created_at: ticketDate
    };
    
    this.openTicketModal(newTicket, { type: 'normal' });
  }

  editEvent(event: EventCapsule): void {
    console.log('Edit event:', event);
    this.openEventModal(event, { type: 'calendar' });
  }

  duplicateEvent(event: EventCapsule): void {
    console.log('Duplicate event:', event);
    // Créer une copie de l'événement pour duplication
    const duplicatedEvent = event.originalEvent ? { ...event.originalEvent } : null;
    if (duplicatedEvent) {
      duplicatedEvent.id = undefined; // Nouvel ID
      duplicatedEvent.title = duplicatedEvent.title + ' (Copie)';
    }
    this.openEventModal(duplicatedEvent ? { ...event, originalEvent: duplicatedEvent } : null, { type: 'calendar' });
  }

  shareEvent(event: EventCapsule): void {
    console.log('Share event:', event);
    // TODO: Ouvrir modal de partage
  }

  deleteEvent(event: EventCapsule): void {
    console.log('Delete event:', event);
    
    // Confirmation avant suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`)) {
      // Supprimer l'événement de la liste locale immédiatement
      this.events = this.events.filter(e => e.id !== event.originalEvent?.id);
      
      // Appeler l'API pour supprimer l'événement
      if (event.originalEvent?.id) {
        this.calendarService.deleteEvent(event.originalEvent.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('Événement supprimé avec succès de la base de données');
            },
            error: (error) => {
              console.error('Erreur lors de la suppression:', error);
              // Restaurer l'événement en cas d'erreur
              this.loadDataForCurrentPeriod();
            }
          });
      }
      
      console.log('Événement supprimé localement:', event.title);
    }
  }

  // Helper method to convert Date to ISO string without timezone offset
  private dateToLocalISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  // Event Modal Methods
  onEventModalClose(): void {
    this.showEventModal = false;
    this.selectedEvent = null;
    this.eventContext = { type: 'calendar' };
  }

  onEventModalSave(eventData: any): void {
    console.log('Event saved:', eventData);
    
    if (eventData.event) {
      // Modification d'un événement existant
      this.calendarService.updateEvent(eventData.event.id, eventData.event)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedEvent) => {
            console.log('Événement modifié avec succès:', updatedEvent);
            // Mettre à jour l'événement dans la liste locale
            const index = this.events.findIndex(e => e.id === updatedEvent.id);
            if (index !== -1) {
              this.events[index] = updatedEvent;
            }
            
            // Notifier les composants enfants du changement
            this.notifyDataChange();
            
            // Recharger les données pour s'assurer que tout est synchronisé
            this.loadDataForCurrentPeriod();
            
            this.showEventModal = false;
            this.selectedEvent = null;
          },
          error: (error) => {
            console.error('Erreur lors de la modification de l\'événement:', error);
            // Recharger les données en cas d'erreur
            this.loadDataForCurrentPeriod();
          }
        });
    } else if (eventData.data) {
      // Création d'un nouvel événement
      console.log('🎯 Données à envoyer à l\'API:', eventData.data);
      
      // S'assurer que les dates sont au bon format
      let startDateTime = eventData.data.start_datetime;
      let endDateTime = eventData.data.end_datetime;
      
      // Si les dates sont des objets Date, les convertir en ISO string sans décalage de fuseau
      if (startDateTime instanceof Date) {
        startDateTime = this.dateToLocalISOString(startDateTime);
      }
      if (endDateTime instanceof Date) {
        endDateTime = this.dateToLocalISOString(endDateTime);
      }
      
      // Vérifier si c'est un événement "toute la journée"
      const isAllDay = eventData.data.all_day || false;
      
      // Pour les événements toute la journée, s'assurer que les dates sont cohérentes
      if (isAllDay && startDateTime && endDateTime) {
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        
        // Si les dates sont différentes, corriger pour utiliser la même date
        if (startDate.toDateString() !== endDate.toDateString()) {
          console.log('🔧 Correction des dates pour événement toute la journée');
          endDate.setFullYear(startDate.getFullYear());
          endDate.setMonth(startDate.getMonth());
          endDate.setDate(startDate.getDate());
          endDate.setHours(23, 59, 0, 0); // 23:59:00
          endDateTime = endDate.toISOString();
        }
      }
      
      const eventToCreate = {
        title: eventData.data.title,
        description: eventData.data.description || '',
        location: eventData.data.location || '',
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        all_day: isAllDay,
        category: eventData.data.category || 'other',
        status: eventData.data.status || 'planned',
        tags: eventData.data.tags || '',
        is_recurring: eventData.data.is_recurring || false,
        participants: eventData.data.participants || [],
        reminder_minutes: eventData.data.reminder_minutes || [],
        ticket_id: eventData.data.ticket_id || null,
        project_id: eventData.data.project_id || null,
        company_id: eventData.data.company_id || null,
        contact_id: eventData.data.contact_id || null
      };
      
      console.log('🎯 Données formatées pour l\'API:', eventToCreate);
      
      this.calendarService.createEvent(eventToCreate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newEvent) => {
            console.log('✅ Événement créé avec succès:', newEvent);
            // Ajouter le nouvel événement à la liste locale
            this.events.push(newEvent);
            
            // Notifier les composants enfants du changement
            this.notifyDataChange();
            
            // Recharger les données pour s'assurer que tout est synchronisé
            this.loadDataForCurrentPeriod();
            
            this.showEventModal = false;
            this.selectedEvent = null;
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création de l\'événement:', error);
            console.error('❌ Détails de l\'erreur:', error.error);
            console.error('❌ Status:', error.status);
            console.error('❌ Status Text:', error.statusText);
            // Recharger les données en cas d'erreur
            this.loadDataForCurrentPeriod();
          }
        });
    } else {
      console.error('Données d\'événement invalides:', eventData);
      this.showEventModal = false;
      this.selectedEvent = null;
    }
  }

  onEventModalDelete(event: CalendarEventResponse): void {
    console.log('Event deleted from modal:', event);
    
    // Supprimer l'événement de la liste locale immédiatement
    this.events = this.events.filter(e => e.id !== event.id);
    
    // Appeler l'API pour supprimer l'événement
    this.calendarService.deleteEvent(event.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Événement supprimé avec succès de la base de données');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          // Restaurer l'événement en cas d'erreur
          this.loadDataForCurrentPeriod();
        }
      });
    
    // Fermer le modal
    this.showEventModal = false;
    this.selectedEvent = null;
    
    console.log('Événement supprimé depuis le modal:', event.title);
  }

  openEventModal(event: EventCapsule | null = null, context: EventContext = { type: 'calendar' }): void {
    // Si event est null ou si c'est une création (pas d'ID), selectedEvent doit être null
    if (!event || !event.originalEvent?.id) {
      this.selectedEvent = null;
    } else {
      this.selectedEvent = event.originalEvent;
    }
    this.eventContext = context;
    this.showEventModal = true;
  }

  // Ticket Modal Methods
  onTicketModalClose(): void {
    this.showTicketModal = false;
    this.selectedTicket = null;
    this.ticketContext = { type: 'normal' };
  }

  onTicketModalSave(ticketData: any): void {
    console.log('Ticket saved:', ticketData);
    // TODO: Sauvegarder le ticket via TicketService
    this.showTicketModal = false;
    this.selectedTicket = null;
    // Recharger les données
    this.loadDataForCurrentPeriod();
  }

  openTicketModal(ticket: any = null, context: TicketContext = { type: 'normal' }): void {
    this.selectedTicket = ticket;
    this.ticketContext = context;
    this.showTicketModal = true;
  }

  editTicket(ticket: any): void {
    console.log('Edit ticket:', ticket);
    this.openTicketModal(ticket, { type: 'normal' });
  }

  deleteTicket(ticket: any): void {
    console.log('Delete ticket:', ticket);
    
    // Confirmation avant suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer le ticket "${ticket.title}" ?`)) {
      // Supprimer le ticket de la liste locale
      this.tickets = this.tickets.filter(t => t.id !== ticket.id);
      
      // TODO: Appeler l'API pour supprimer le ticket
      // this.ticketService.deleteTicket(ticket.id).subscribe({
      //   next: () => {
      //     console.log('Ticket supprimé avec succès');
      //     this.loadDataForCurrentPeriod(); // Recharger les données
      //   },
      //   error: (error) => {
      //     console.error('Erreur lors de la suppression:', error);
      //     // Restaurer le ticket en cas d'erreur
      //     this.loadDataForCurrentPeriod();
      //   }
      // });
      
      console.log('Ticket supprimé localement:', ticket.title);
    }
  }

  // Utilitaires
  getIconPath(icon: string): string {
    const icons: Record<string, string> = {
      'calendar-plus': 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z',
      'ticket': 'M15.5,7C15.5,7.83 14.83,8.5 14,8.5H13V10.5H14C14.83,10.5 15.5,11.17 15.5,12C15.5,12.83 14.83,13.5 14,13.5H13V15.5H14C14.83,15.5 15.5,16.17 15.5,17C15.5,17.83 14.83,18.5 14,18.5H10C9.17,18.5 8.5,17.83 8.5,17C8.5,16.17 9.17,15.5 10,15.5H11V13.5H10C9.17,13.5 8.5,12.83 8.5,12C8.5,11.17 9.17,10.5 10,10.5H11V8.5H10C9.17,8.5 8.5,7.83 8.5,7C8.5,6.17 9.17,5.5 10,5.5H14C14.83,5.5 15.5,6.17 15.5,7Z',
      'edit': 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z',
      'copy': 'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z',
      'share': 'M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z',
      'trash': 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'
    };
    return icons[icon] || '';
  }
}

