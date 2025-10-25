import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCapsuleComponent, EventCapsule } from '../event-capsule/event-capsule.component';

type GroupByOption = 'date' | 'status' | 'none';

interface EventGroup {
  label: string;
  events: EventCapsule[];
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, EventCapsuleComponent],
  template: `
    <div class="event-list-container">
      <!-- Header -->
      <div class="list-header" *ngIf="showHeader">
        <h3 class="list-title">
          {{ title || 'Événements' }}
          <span class="event-count">({{ events.length }})</span>
        </h3>
        
        <div class="list-actions" *ngIf="showActions">
          <button class="action-btn" (click)="onAddEvent()" *ngIf="showAddButton">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nouvel événement
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="events.length === 0">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p class="empty-message">{{ emptyMessage || 'Aucun événement' }}</p>
        <button class="empty-action-btn" (click)="onAddEvent()" *ngIf="showAddButton">
          Créer un événement
        </button>
      </div>

      <!-- Events list -->
      <div class="events-content" *ngIf="events.length > 0">
        <!-- Grouped view -->
        <div *ngIf="groupBy !== 'none'" class="grouped-events">
          <div *ngFor="let group of groupedEvents" class="event-group">
            <div class="group-header">
              <span class="group-label">{{ group.label }}</span>
              <span class="group-count">{{ group.events.length }}</span>
            </div>
            <div class="group-events">
              <app-event-capsule
                *ngFor="let event of group.events"
                [event]="event"
                [type]="event.type || 'single'"
                [compact]="false"
                [showTime]="showTime"
                (capsuleClick)="onEventClick($event)"
                (capsuleContextMenu)="onEventContextMenu($event)">
              </app-event-capsule>
            </div>
          </div>
        </div>

        <!-- Flat view -->
        <div *ngIf="groupBy === 'none'" class="flat-events">
          <app-event-capsule
            *ngFor="let event of events"
            [event]="event"
            [type]="event.type || 'single'"
            [compact]="compact"
            [showTime]="showTime"
            (capsuleClick)="onEventClick($event)"
            (capsuleContextMenu)="onEventContextMenu($event)">
          </app-event-capsule>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-list-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #1a1f2e;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Header */
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .list-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .event-count {
      font-size: 14px;
      font-weight: 400;
      color: #64748b;
    }

    .list-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .action-btn svg {
      flex-shrink: 0;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-state svg {
      color: #475569;
      margin-bottom: 16px;
    }

    .empty-message {
      margin: 0 0 16px 0;
      font-size: 15px;
      color: #94a3b8;
    }

    .empty-action-btn {
      padding: 10px 20px;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .empty-action-btn:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }

    /* Events content */
    .events-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Grouped events */
    .grouped-events {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .event-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }

    .group-label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .group-count {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .group-events {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-left: 12px;
    }

    /* Flat events */
    .flat-events {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .event-list-container {
        padding: 16px;
      }

      .list-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .list-actions {
        width: 100%;
      }

      .action-btn {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class EventListComponent implements OnInit, OnChanges {
  @Input() events: EventCapsule[] = [];
  @Input() title: string = '';
  @Input() showTime: boolean = true;
  @Input() showDate: boolean = true;
  @Input() groupBy: GroupByOption = 'none';
  @Input() compact: boolean = false;
  @Input() showHeader: boolean = true;
  @Input() showActions: boolean = true;
  @Input() showAddButton: boolean = true;
  @Input() emptyMessage: string = '';

  @Output() eventClick = new EventEmitter<EventCapsule>();
  @Output() eventEdit = new EventEmitter<EventCapsule>();
  @Output() eventDelete = new EventEmitter<EventCapsule>();
  @Output() addEvent = new EventEmitter<void>();

  groupedEvents: EventGroup[] = [];

  ngOnInit(): void {
    this.updateGroupedEvents();
  }

  ngOnChanges(): void {
    this.updateGroupedEvents();
  }

  updateGroupedEvents(): void {
    if (this.groupBy === 'none') {
      this.groupedEvents = [];
      return;
    }

    if (this.groupBy === 'date') {
      this.groupByDate();
    } else if (this.groupBy === 'status') {
      this.groupByStatus();
    }
  }

  groupByDate(): void {
    const groups = new Map<string, EventCapsule[]>();
    
    this.events.forEach(event => {
      const date = new Date(event.start_datetime);
      const dateKey = date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    this.groupedEvents = Array.from(groups.entries())
      .map(([label, events]) => ({ label, events }))
      .sort((a, b) => new Date(a.events[0].start_datetime).getTime() - new Date(b.events[0].start_datetime).getTime());
  }

  groupByStatus(): void {
    const groups = new Map<string, EventCapsule[]>();
    
    const statusOrder = ['planned', 'confirmed', 'cancelled'];
    const statusLabels: Record<string, string> = {
      'planned': 'Planifiés',
      'confirmed': 'Confirmés',
      'cancelled': 'Annulés'
    };

    this.events.forEach(event => {
      const status = event.status || 'planned';
      
      if (!groups.has(status)) {
        groups.set(status, []);
      }
      groups.get(status)!.push(event);
    });

    this.groupedEvents = statusOrder
      .filter(status => groups.has(status))
      .map(status => ({ 
        label: statusLabels[status] || status, 
        events: groups.get(status)! 
      }));
  }

  onEventClick(event: EventCapsule): void {
    this.eventClick.emit(event);
  }

  onEventContextMenu(data: {event: EventCapsule, mouseEvent: MouseEvent}): void {
    this.eventEdit.emit(data.event);
  }

  onAddEvent(): void {
    this.addEvent.emit();
  }
}

