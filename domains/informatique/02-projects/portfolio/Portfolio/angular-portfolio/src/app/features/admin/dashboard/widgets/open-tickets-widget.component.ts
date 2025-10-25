import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { WidgetBaseComponent } from '../widgets/widget-base.component';
import { WidgetConfig } from '../models/widget.interface';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  theme: string;
  assigned_to?: string;
  created_at: string;
  due_date?: string;
  comment_count: number;
}

@Component({
  selector: 'app-open-tickets-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" [class.editing]="isEditing">
      <div class="widget-header">
        <div class="widget-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Tickets Ouverts
        </div>
        <div class="widget-actions">
          <button class="action-btn refresh" (click)="refresh()" [disabled]="data.loading" title="Actualiser">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button class="action-btn remove" (click)="remove()" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="widget-content">
        <div *ngIf="data.loading" class="widget-loading">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
        
        <div *ngIf="data.error" class="widget-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L17.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
          </svg>
          <p>{{ data.error }}</p>
        </div>
        
        <div *ngIf="!data.loading && !data.error" class="tickets-content">
          <!-- En-tête avec compteur -->
          <div class="tickets-header">
            <div class="tickets-count">
              <span class="count-number">{{ tickets.length }}</span>
              <span class="count-label">tickets ouverts</span>
            </div>
            <button class="view-all-btn" (click)="viewAllTickets()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
              </svg>
              Voir tout
            </button>
          </div>

          <!-- Liste des tickets -->
          <div class="tickets-list" *ngIf="tickets.length > 0">
            <div *ngFor="let ticket of tickets.slice(0, 5); trackBy: trackByTicket" 
                 class="ticket-item"
                 (click)="viewTicket(ticket)">
              <div class="ticket-main">
                <div class="ticket-title">{{ ticket.title }}</div>
                <div class="ticket-meta">
                  <span class="ticket-id">#{{ ticket.id }}</span>
                  <span class="ticket-priority" [class]="ticket.priority">{{ getPriorityText(ticket.priority) }}</span>
                  <span class="ticket-theme">{{ ticket.theme }}</span>
                </div>
              </div>
              <div class="ticket-side">
                <div class="ticket-assignee" *ngIf="ticket.assigned_to">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                  </svg>
                  {{ ticket.assigned_to }}
                </div>
                <div class="ticket-comments" *ngIf="ticket.comment_count > 0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z"/>
                  </svg>
                  {{ ticket.comment_count }}
                </div>
                <div class="ticket-date">{{ formatDate(ticket.created_at) }}</div>
              </div>
            </div>
          </div>

          <!-- Message si pas de tickets -->
          <div *ngIf="tickets.length === 0" class="no-tickets">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
            </svg>
            <h3>Aucun ticket ouvert</h3>
            <p>Tous les tickets sont traités !</p>
          </div>

          <!-- Message si plus de 5 tickets -->
          <div *ngIf="tickets.length > 5" class="more-tickets">
            <button class="show-more-btn" (click)="viewAllTickets()">
              Voir les {{ tickets.length - 5 }} autres tickets
            </button>
          </div>
        </div>
      </div>
      
      <div class="widget-footer" *ngIf="data.lastUpdated">
        <span class="last-updated">Mis à jour: {{ data.lastUpdated | date:'short' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .widget-container {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget-container:hover {
      border-color: #555;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .widget-container.editing {
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    .widget-header {
      background: #404040;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #555;
    }

    .widget-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #e0e0e0;
    }

    .widget-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: #888;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      background: #555;
      color: #e0e0e0;
    }

    .action-btn.remove:hover {
      background: #f44336;
      color: white;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .widget-content {
      flex: 1;
      padding: 16px;
      overflow: hidden;
    }

    .widget-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #888;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #404040;
      border-top-color: #007acc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .widget-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #f44336;
      text-align: center;
    }

    .widget-footer {
      padding: 8px 16px;
      background: #404040;
      border-top: 1px solid #555;
    }

    .last-updated {
      font-size: 11px;
      color: #888;
    }

    /* Tickets Content */
    .tickets-content {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .tickets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #404040;
    }

    .tickets-count {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .count-number {
      font-size: 24px;
      font-weight: 700;
      color: #007acc;
      line-height: 1;
    }

    .count-label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .view-all-btn {
      background: #007acc;
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .view-all-btn:hover {
      background: #005a9e;
    }

    .tickets-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ticket-item {
      background: #404040;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .ticket-item:hover {
      background: #505050;
      transform: translateY(-1px);
    }

    .ticket-main {
      flex: 1;
      min-width: 0;
    }

    .ticket-title {
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 6px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ticket-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ticket-id {
      font-size: 10px;
      color: #888;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    .ticket-priority {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .ticket-priority.critical {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .ticket-priority.high {
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }

    .ticket-priority.medium {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    .ticket-priority.low {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .ticket-theme {
      font-size: 10px;
      color: #bbb;
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .ticket-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .ticket-assignee {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: #888;
    }

    .ticket-comments {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: #888;
    }

    .ticket-date {
      font-size: 9px;
      color: #666;
    }

    .no-tickets {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #888;
      text-align: center;
    }

    .no-tickets svg {
      opacity: 0.5;
    }

    .no-tickets h3 {
      margin: 0;
      font-size: 16px;
      color: #bbb;
    }

    .no-tickets p {
      margin: 0;
      font-size: 12px;
    }

    .more-tickets {
      margin-top: 12px;
      text-align: center;
    }

    .show-more-btn {
      background: transparent;
      border: 1px solid #555;
      color: #888;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .show-more-btn:hover {
      background: #555;
      color: #e0e0e0;
    }
  `]
})
export class OpenTicketsWidgetComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  private refreshInterval?: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    super();
  }

  get widgetTitle(): string {
    return 'Tickets Ouverts';
  }

  get widgetIcon(): string {
    return 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z';
  }

  override ngOnInit() {
    super.ngOnInit();
    this.startAutoRefresh();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  protected loadData(): void {
    this.setLoading(true);
    this.setError(undefined);

    this.http.get<Ticket[]>('http://localhost:8000/api/tickets?status=open&limit=10')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading open tickets:', error);
          this.setError('Erreur lors du chargement des tickets');
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.tickets = data;
          this.setLastUpdated(new Date());
          this.setLoading(false);
        }
      });
  }

  private startAutoRefresh(): void {
    const interval = this.config?.config?.['refreshInterval'] || 30000;
    this.refreshInterval = setInterval(() => {
      this.loadData();
    }, interval);
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/admin/tickets'], { 
      queryParams: { view: ticket.id } 
    });
  }

  viewAllTickets(): void {
    this.router.navigate(['/admin/tickets']);
  }

  getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      'critical': 'Critique',
      'high': 'Élevée',
      'medium': 'Moyenne',
      'low': 'Faible'
    };
    return priorityMap[priority] || priority;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Aujourd\'hui';
    } else if (diffDays === 2) {
      return 'Hier';
    } else if (diffDays <= 7) {
      return `Il y a ${diffDays - 1} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }

  trackByTicket(index: number, ticket: Ticket): number {
    return ticket.id;
  }
}
