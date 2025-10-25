import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { WidgetBaseComponent } from '../widgets/widget-base.component';
import { WidgetConfig } from '../models/widget.interface';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastSeen?: string;
  uptime?: number;
  description?: string;
}

interface AgentStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
  agents: Agent[];
}

@Component({
  selector: 'app-agent-stats-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" [class.editing]="isEditing">
      <div class="widget-header">
        <div class="widget-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
          </svg>
          Statistiques Agents
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
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-item running">
              <div class="stat-value">{{ stats.running }}</div>
              <div class="stat-label">Actifs</div>
            </div>
          </div>

          <!-- Par statut -->
          <div class="stats-section">
            <h4>Par Statut</h4>
            <div class="status-grid">
              <div class="status-card running">
                <div class="status-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                  </svg>
                </div>
                <div class="status-info">
                  <div class="status-number">{{ stats.running }}</div>
                  <div class="status-text">En cours</div>
                </div>
              </div>
              
              <div class="status-card stopped">
                <div class="status-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6,6H18V18H6V6Z"/>
                  </svg>
                </div>
                <div class="status-info">
                  <div class="status-number">{{ stats.stopped }}</div>
                  <div class="status-text">Arrêtés</div>
                </div>
              </div>
              
              <div class="status-card error">
                <div class="status-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
                  </svg>
                </div>
                <div class="status-info">
                  <div class="status-number">{{ stats.error }}</div>
                  <div class="status-text">Erreurs</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste des agents -->
          <div class="stats-section" *ngIf="stats.agents && stats.agents.length > 0">
            <h4>Agents</h4>
            <div class="agents-list">
              <div *ngFor="let agent of stats.agents.slice(0, 3)" class="agent-item">
                <div class="agent-info">
                  <div class="agent-name">{{ agent.name }}</div>
                  <div class="agent-id">{{ agent.id }}</div>
                </div>
                <div class="agent-status" [class]="agent.status">
                  <div class="status-dot"></div>
                  <span class="status-text">{{ getStatusText(agent.status) }}</span>
                </div>
              </div>
              <div *ngIf="stats.agents.length > 3" class="more-agents">
                +{{ stats.agents.length - 3 }} autres agents
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

    .stat-item.running {
      border-left: 4px solid #4caf50;
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

    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .status-card {
      background: #404040;
      border-radius: 6px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-card.running {
      border-left: 3px solid #4caf50;
    }

    .status-card.stopped {
      border-left: 3px solid #9e9e9e;
    }

    .status-card.error {
      border-left: 3px solid #f44336;
    }

    .status-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
    }

    .status-info {
      flex: 1;
    }

    .status-number {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .status-text {
      font-size: 10px;
      color: #888;
    }

    .agents-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .agent-item {
      background: #404040;
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .agent-info {
      flex: 1;
    }

    .agent-name {
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 2px;
    }

    .agent-id {
      font-size: 10px;
      color: #888;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    .agent-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
    }

    .agent-status.running {
      color: #4caf50;
    }

    .agent-status.stopped {
      color: #9e9e9e;
    }

    .agent-status.error {
      color: #f44336;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-text {
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .more-agents {
      text-align: center;
      font-size: 11px;
      color: #888;
      padding: 8px;
      background: #404040;
      border-radius: 6px;
    }
  `]
})
export class AgentStatsWidgetComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  stats: AgentStats | null = null;
  private refreshInterval?: any;

  constructor(private http: HttpClient) {
    super();
  }

  get widgetTitle(): string {
    return 'Statistiques Agents';
  }

  get widgetIcon(): string {
    return 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z';
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

    this.http.get<Agent[]>('http://localhost:8000/api/agents')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading agents:', error);
          this.setError('Erreur lors du chargement des agents');
          return of([]);
        })
      )
      .subscribe({
        next: (agents) => {
          this.stats = this.calculateStats(agents);
          this.setLastUpdated(new Date());
          this.setLoading(false);
        }
      });
  }

  private calculateStats(agents: Agent[]): AgentStats {
    const running = agents.filter(a => a.status === 'running').length;
    const stopped = agents.filter(a => a.status === 'stopped').length;
    const error = agents.filter(a => a.status === 'error').length;

    return {
      total: agents.length,
      running,
      stopped,
      error,
      agents
    };
  }

  private startAutoRefresh(): void {
    const interval = this.config?.config?.['refreshInterval'] || 30000;
    this.refreshInterval = setInterval(() => {
      this.loadData();
    }, interval);
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'running': 'Actif',
      'stopped': 'Arrêté',
      'error': 'Erreur',
      'starting': 'Démarrage',
      'stopping': 'Arrêt'
    };
    return statusMap[status] || status;
  }
}
