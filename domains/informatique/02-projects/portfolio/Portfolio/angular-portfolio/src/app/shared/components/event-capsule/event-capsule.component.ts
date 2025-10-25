import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CapsuleType = 'start' | 'end' | 'single';

export interface EventCapsule {
  id: number;
  title: string;
  start_datetime: Date | string;
  end_datetime?: Date | string;
  type: CapsuleType;
  status?: string;
  category?: string;
  description?: string;
  location?: string;
  all_day?: boolean;
  priority?: string;
  displayDate?: Date;
  originalEvent?: any;
}

@Component({
  selector: 'app-event-capsule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="event-capsule"
      [class.capsule-start]="type === 'start'"
      [class.capsule-end]="type === 'end'"
      [class.capsule-single]="type === 'single'"
      [class.compact]="compact"
      [class.status-confirmed]="event?.status === 'confirmed'"
      [class.status-cancelled]="event?.status === 'cancelled'"
      (click)="onClick($event)"
      (contextmenu)="onContextMenu($event)"
      [attr.aria-label]="getAriaLabel()"
      tabindex="0">
      
      <div class="capsule-content">
        <!-- Indicateur de type (début/fin) -->
        <div class="type-indicator" *ngIf="type !== 'single'">
          <span *ngIf="type === 'start'" class="indicator-icon">→</span>
          <span *ngIf="type === 'end'" class="indicator-icon">←</span>
        </div>

        <!-- Heure (pour compact) -->
        <div class="event-time" *ngIf="compact && showTime">
          {{ getTimeDisplay() }}
        </div>

        <!-- Titre -->
        <div class="event-title" [title]="event?.title">
          {{ event?.title }}
        </div>

        <!-- Détails supplémentaires (non compact) -->
        <div class="event-details" *ngIf="!compact">
          <div class="event-time-full" *ngIf="showTime">
            {{ getTimeDisplay() }}
          </div>
          <div class="event-location" *ngIf="event?.location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {{ event.location }}
          </div>
        </div>

        <!-- Badge de statut -->
        <div class="status-badge" *ngIf="event?.status && event.status !== 'planned'">
          <span class="status-dot" [class]="'status-' + event.status"></span>
        </div>

        <!-- Badge de priorité -->
        <div class="priority-badge" *ngIf="event?.priority === 'high'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2z"/>
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-capsule {
      position: relative;
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      user-select: none;
    }

    .event-capsule:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      z-index: 10;
    }

    .event-capsule:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .event-capsule:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Type: Start (Début) */
    .capsule-start {
      border-left: 4px solid #10b981;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);
      box-shadow: -2px 0 8px rgba(16, 185, 129, 0.3);
    }

    /* Type: End (Fin) */
    .capsule-end {
      border-right: 4px solid #f59e0b;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%);
      box-shadow: 2px 0 8px rgba(245, 158, 11, 0.3);
    }

    /* Type: Single */
    .capsule-single {
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.12);
    }

    .capsule-single:hover {
      border-width: 3px;
    }

    /* Compact mode */
    .event-capsule.compact {
      padding: 4px 8px;
      min-height: 24px;
    }

    .event-capsule.compact .event-title {
      font-size: 11px;
    }

    .event-capsule.compact .event-time {
      font-size: 10px;
    }

    /* Capsule content */
    .capsule-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .type-indicator {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .indicator-icon {
      font-size: 14px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .capsule-start .indicator-icon {
      color: #10b981;
    }

    .capsule-end .indicator-icon {
      color: #f59e0b;
    }

    .event-time {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .event-title {
      font-size: 13px;
      font-weight: 500;
      color: #f1f5f9;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .event-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }

    .event-time-full {
      font-size: 12px;
      color: #94a3b8;
    }

    .event-location {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #64748b;
    }

    .event-location svg {
      fill: currentColor;
    }

    /* Status badge */
    .status-badge {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .status-dot {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-dot.status-confirmed {
      background: #10b981;
    }

    .status-dot.status-cancelled {
      background: #ef4444;
    }

    /* Priority badge */
    .priority-badge {
      position: absolute;
      top: 4px;
      left: 4px;
      color: #ef4444;
    }

    .priority-badge svg {
      fill: currentColor;
      filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
    }

    /* Status modifiers */
    .status-cancelled {
      opacity: 0.6;
      text-decoration: line-through;
    }
  `]
})
export class EventCapsuleComponent {
  @Input() event: EventCapsule | any;
  @Input() type: CapsuleType = 'single';
  @Input() compact: boolean = false;
  @Input() showTime: boolean = true;

  @Output() capsuleClick = new EventEmitter<EventCapsule>();
  @Output() capsuleContextMenu = new EventEmitter<{event: EventCapsule, mouseEvent: MouseEvent}>();

  onClick(mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.capsuleClick.emit(this.event);
  }

  onContextMenu(mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    this.capsuleContextMenu.emit({ event: this.event, mouseEvent });
  }

  getTimeDisplay(): string {
    if (!this.event) return '';
    
    const start = new Date(this.event.start_datetime);
    const end = this.event.end_datetime ? new Date(this.event.end_datetime) : null;

    if (this.event.all_day) {
      return 'Toute la journée';
    }

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    if (this.type === 'start') {
      return `→ ${formatTime(start)}`;
    } else if (this.type === 'end' && end) {
      return `${formatTime(end)} ←`;
    } else if (end) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    } else {
      return formatTime(start);
    }
  }

  getAriaLabel(): string {
    if (!this.event) return '';
    
    let label = this.event.title;
    
    if (this.type === 'start') {
      label += ' (début)';
    } else if (this.type === 'end') {
      label += ' (fin)';
    }
    
    return label;
  }
}

