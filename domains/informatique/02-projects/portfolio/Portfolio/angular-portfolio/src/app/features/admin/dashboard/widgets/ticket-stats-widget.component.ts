import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, interval } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { WidgetBaseComponent } from '../widgets/widget-base.component';
import { WidgetConfig } from '../models/widget.interface';

interface TicketStats {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  by_priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  unread_count: number;
}

@Component({
  selector: 'app-ticket-stats-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" [class.editing]="isEditing">
      <div class="widget-header">
        <div class="widget-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Statistiques Tickets
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
            <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
          </svg>
          <p>{{ data.error }}</p>
        </div>
        
        <div *ngIf="!data.loading && !data.error && stats" class="stats-content">
          <!-- Vue d'ensemble -->
          <div class="stats-overview">
            <div class="stat-item total">
              <div class="stat-value">{{ stats.total || 0 }}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-item unread">
              <div class="stat-value">{{ stats.unread_count || 0 }}</div>
              <div class="stat-label">Non lus</div>
            </div>
          </div>

          <!-- Par statut -->
          <div class="stats-section">
            <h4>Par Statut</h4>
            <div class="stats-grid">
              <div class="stat-card open">
                <div class="stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ (stats && stats.by_status.open) || 0 }}</div>
                  <div class="stat-text">Ouverts</div>
                </div>
              </div>
              
              <div class="stat-card progress">
                <div class="stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ (stats && stats.by_status.in_progress) || 0 }}</div>
                  <div class="stat-text">En cours</div>
                </div>
              </div>
              
              <div class="stat-card resolved">
                <div class="stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ (stats && stats.by_status.resolved) || 0 }}</div>
                  <div class="stat-text">Résolus</div>
                </div>
              </div>
              
              <div class="stat-card closed">
                <div class="stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ (stats && stats.by_status.closed) || 0 }}</div>
                  <div class="stat-text">Fermés</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Par priorité -->
          <div class="stats-section">
            <h4>Par Priorité</h4>
            <div class="priority-stats">
              <div class="priority-item critical">
                <span class="priority-label">Critique</span>
                <span class="priority-count">{{ (stats && stats.by_priority.critical) || 0 }}</span>
              </div>
              <div class="priority-item high">
                <span class="priority-label">Élevée</span>
                <span class="priority-count">{{ (stats && stats.by_priority.high) || 0 }}</span>
              </div>
              <div class="priority-item medium">
                <span class="priority-label">Moyenne</span>
                <span class="priority-count">{{ (stats && stats.by_priority.medium) || 0 }}</span>
              </div>
              <div class="priority-item low">
                <span class="priority-label">Faible</span>
                <span class="priority-count">{{ (stats && stats.by_priority.low) || 0 }}</span>
              </div>
            </div>
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

    /* Stats Content */
    .stats-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .stat-item {
      background: #404040;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }

    .stat-item.total {
      border-left: 4px solid #007acc;
    }

    .stat-item.unread {
      border-left: 4px solid #f44336;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-section h4 {
      margin: 0 0 12px 0;
      font-size: 12px;
      color: #007acc;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .stat-card {
      background: #404040;
      border-radius: 6px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-card.open {
      border-left: 3px solid #4caf50;
    }

    .stat-card.progress {
      border-left: 3px solid #ffc107;
    }

    .stat-card.resolved {
      border-left: 3px solid #2196f3;
    }

    .stat-card.closed {
      border-left: 3px solid #666;
    }

    .stat-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
    }

    .stat-info {
      flex: 1;
    }

    .stat-number {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .stat-text {
      font-size: 10px;
      color: #888;
    }

    .priority-stats {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .priority-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .priority-item.critical {
      background: rgba(244, 67, 54, 0.1);
      border-left: 3px solid #f44336;
    }

    .priority-item.high {
      background: rgba(255, 152, 0, 0.1);
      border-left: 3px solid #ff9800;
    }

    .priority-item.medium {
      background: rgba(255, 193, 7, 0.1);
      border-left: 3px solid #ffc107;
    }

    .priority-item.low {
      background: rgba(76, 175, 80, 0.1);
      border-left: 3px solid #4caf50;
    }

    .priority-label {
      color: #bbb;
    }

    .priority-count {
      font-weight: 600;
      color: #fff;
    }
  `]
})
export class TicketStatsWidgetComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  stats: TicketStats | null = null;
  private refreshInterval?: any;

  constructor(private http: HttpClient) {
    super();
  }

  get widgetTitle(): string {
    return 'Statistiques Tickets';
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

    this.http.get<TicketStats>('http://localhost:8000/api/tickets/stats/summary')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading ticket stats:', error);
          this.setError('Erreur lors du chargement des statistiques');
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            // Adapter la structure de données de l'API
            this.stats = {
              total: data.total || 0,
              by_status: {
                open: data.by_status?.open || 0,
                in_progress: data.by_status?.in_progress || 0,
                resolved: data.by_status?.resolved || 0,
                closed: data.by_status?.closed || 0
              },
              by_priority: data.by_priority || {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
              },
              unread_count: data.unread_count || 0
            };
            this.setLastUpdated(new Date());
          }
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
}
