import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TicketCapsule {
  id: number;
  title: string;
  status?: string;
  priority?: string;
  created_at?: Date | string;
  due_date?: Date | string;
  assigned_to?: any;
}

@Component({
  selector: 'app-ticket-capsule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="ticket-capsule"
      [class.compact]="compact"
      [class.priority-high]="ticket?.priority === 'high'"
      [class.priority-urgent]="ticket?.priority === 'urgent'"
      [class.status-completed]="ticket?.status === 'completed'"
      (click)="onClick($event)"
      (contextmenu)="onContextMenu($event)"
      [attr.aria-label]="'Ticket: ' + ticket?.title"
      tabindex="0">
      
      <div class="ticket-content">
        <!-- Icône ticket -->
        <div class="ticket-icon">
          🎫
        </div>

        <!-- Titre -->
        <div class="ticket-title" [title]="ticket?.title">
          {{ ticket?.title }}
        </div>

        <!-- Badge de statut -->
        <div class="status-badge" *ngIf="ticket?.status">
          <span class="status-indicator" [class]="'status-' + ticket.status">
            {{ getStatusLabel() }}
          </span>
        </div>

        <!-- Badge de priorité -->
        <div class="priority-indicator" *ngIf="ticket?.priority === 'high' || ticket?.priority === 'urgent'">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2z"/>
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-capsule {
      position: relative;
      display: flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);
      border-left: 3px solid #a855f7;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      user-select: none;
      box-shadow: -2px 0 6px rgba(168, 85, 247, 0.2);
    }

    .ticket-capsule:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(168, 85, 247, 0.3);
      z-index: 10;
      border-left-width: 4px;
    }

    .ticket-capsule:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(168, 85, 247, 0.2);
    }

    .ticket-capsule:focus {
      outline: 2px solid #a855f7;
      outline-offset: 2px;
    }

    /* Priority variants */
    .ticket-capsule.priority-high {
      border-left-color: #f59e0b;
      box-shadow: -2px 0 6px rgba(245, 158, 11, 0.3);
    }

    .ticket-capsule.priority-urgent {
      border-left-color: #ef4444;
      box-shadow: -2px 0 6px rgba(239, 68, 68, 0.3);
      animation: pulse-urgent 2s ease-in-out infinite;
    }

    @keyframes pulse-urgent {
      0%, 100% {
        box-shadow: -2px 0 6px rgba(239, 68, 68, 0.3);
      }
      50% {
        box-shadow: -2px 0 12px rgba(239, 68, 68, 0.5);
      }
    }

    /* Status: completed */
    .ticket-capsule.status-completed {
      opacity: 0.6;
    }

    .ticket-capsule.status-completed .ticket-title {
      text-decoration: line-through;
    }

    /* Compact mode */
    .ticket-capsule.compact {
      padding: 4px 8px;
      min-height: 22px;
    }

    .ticket-capsule.compact .ticket-icon {
      font-size: 12px;
    }

    .ticket-capsule.compact .ticket-title {
      font-size: 11px;
    }

    /* Ticket content */
    .ticket-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .ticket-icon {
      font-size: 14px;
      flex-shrink: 0;
      line-height: 1;
    }

    .ticket-title {
      font-size: 12px;
      font-weight: 500;
      color: #e2e8f0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    /* Status badge */
    .status-badge {
      flex-shrink: 0;
    }

    .status-indicator {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-indicator.status-open {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    .status-indicator.status-in-progress {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .status-indicator.status-completed {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .status-indicator.status-closed {
      background: rgba(100, 116, 139, 0.2);
      color: #94a3b8;
    }

    /* Priority indicator */
    .priority-indicator {
      position: absolute;
      top: 3px;
      right: 3px;
      color: #ef4444;
    }

    .priority-indicator svg {
      fill: currentColor;
      filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.5));
    }
  `]
})
export class TicketCapsuleComponent {
  @Input() ticket: TicketCapsule | any;
  @Input() compact: boolean = false;

  @Output() ticketClick = new EventEmitter<TicketCapsule>();
  @Output() ticketContextMenu = new EventEmitter<{ticket: TicketCapsule, mouseEvent: MouseEvent}>();

  onClick(mouseEvent: MouseEvent): void {
    mouseEvent.stopPropagation();
    this.ticketClick.emit(this.ticket);
  }

  onContextMenu(mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    this.ticketContextMenu.emit({ ticket: this.ticket, mouseEvent });
  }

  getStatusLabel(): string {
    if (!this.ticket?.status) return '';
    
    const statusLabels: Record<string, string> = {
      'open': 'Ouvert',
      'in-progress': 'En cours',
      'completed': 'Terminé',
      'closed': 'Fermé'
    };
    
    return statusLabels[this.ticket.status] || this.ticket.status;
  }
}

