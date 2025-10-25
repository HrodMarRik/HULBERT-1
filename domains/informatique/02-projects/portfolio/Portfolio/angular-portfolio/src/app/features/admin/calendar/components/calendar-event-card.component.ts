import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEventResponse } from '../../../../models/calendar.model';

@Component({
  selector: 'app-calendar-event-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="event-card" 
      [class]="getEventClass()"
      (click)="onEventClick()"
      [title]="event.description">
      
      <!-- Event Header -->
      <div class="event-header">
        <div class="event-title">{{ event.title }}</div>
        <div class="event-time">{{ formatTime(event.start_datetime) }}</div>
      </div>

      <!-- Event Details -->
      <div class="event-details" *ngIf="showDetails">
        <div class="event-description" *ngIf="event.description">
          {{ event.description }}
        </div>
        
        <div class="event-meta">
          <div class="event-location" *ngIf="event.location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,4A5,5 0 0,1 17,9C17,11.5 14.5,16.5 12,18.5C9.5,16.5 7,11.5 7,9A5,5 0 0,1 12,4Z"/>
            </svg>
            {{ event.location }}
          </div>
          
          <div class="event-tags" *ngIf="event.tags">
            <span class="tag" *ngFor="let tag of getTags()">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- Event Actions -->
      <div class="event-actions" *ngIf="showActions">
        <button 
          class="action-btn edit" 
          (click)="onEdit($event)"
          title="Edit Event">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
          </svg>
        </button>
        <button 
          class="action-btn delete" 
          (click)="onDelete($event)"
          title="Delete Event">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
        </button>
      </div>

      <!-- Status Indicator -->
      <div class="status-indicator" [class]="'status-' + event.status"></div>
    </div>
  `,
  styles: [`
    .event-card {
      position: relative;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 12px;
      margin: 4px 0;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .event-card:hover {
      background: #374151;
      border-color: #6b7280;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .event-card.compact {
      padding: 8px;
      margin: 2px 0;
    }

    .event-card.compact .event-details {
      display: none;
    }

    .event-card.compact .event-actions {
      display: none;
    }

    /* Event Header */
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .event-title {
      font-weight: 600;
      color: #f3f4f6;
      font-size: 14px;
      line-height: 1.3;
      flex: 1;
      margin-right: 8px;
    }

    .event-time {
      font-size: 12px;
      color: #9ca3af;
      white-space: nowrap;
      font-weight: 500;
    }

    /* Event Details */
    .event-details {
      margin-bottom: 8px;
    }

    .event-description {
      font-size: 13px;
      color: #d1d5db;
      line-height: 1.4;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .event-location {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #9ca3af;
    }

    .event-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .tag {
      background: #374151;
      color: #d1d5db;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    /* Event Actions */
    .event-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .event-card:hover .event-actions {
      opacity: 1;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn.edit {
      background: #3b82f6;
      color: white;
    }

    .action-btn.edit:hover {
      background: #2563eb;
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    /* Status Indicator */
    .status-indicator {
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      border-radius: 0 2px 2px 0;
    }

    .status-planned {
      background: #6b7280;
    }

    .status-confirmed {
      background: #3b82f6;
    }

    .status-completed {
      background: #10b981;
    }

    .status-cancelled {
      background: #ef4444;
    }

    /* Category-specific styling */
    .event-card.category-meeting {
      border-left: 4px solid #3b82f6;
    }

    .event-card.category-project {
      border-left: 4px solid #10b981;
    }

    .event-card.category-deadline {
      border-left: 4px solid #f59e0b;
    }

    .event-card.category-personal {
      border-left: 4px solid #8b5cf6;
    }

    .event-card.category-other {
      border-left: 4px solid #6b7280;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .event-card {
        padding: 10px;
      }

      .event-header {
        flex-direction: column;
        gap: 4px;
      }

      .event-title {
        margin-right: 0;
      }

      .event-time {
        align-self: flex-end;
      }

      .event-actions {
        opacity: 1;
        margin-top: 8px;
      }
    }
  `]
})
export class CalendarEventCardComponent {
  @Input() event!: CalendarEventResponse;
  @Input() showDetails = true;
  @Input() showActions = true;
  @Input() compact = false;

  @Output() eventClick = new EventEmitter<CalendarEventResponse>();
  @Output() eventEdit = new EventEmitter<CalendarEventResponse>();
  @Output() eventDelete = new EventEmitter<CalendarEventResponse>();

  getEventClass(): string {
    const classes = [];
    
    if (this.compact) {
      classes.push('compact');
    }
    
    if (this.event.category) {
      classes.push(`category-${this.event.category}`);
    }
    
    return classes.join(' ');
  }

  formatTime(date: Date | string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTags(): string[] {
    if (!this.event.tags) return [];
    return this.event.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }

  onEventClick(): void {
    this.eventClick.emit(this.event);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.eventEdit.emit(this.event);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.eventDelete.emit(this.event);
  }
}
