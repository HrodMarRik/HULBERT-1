import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, interval } from 'rxjs';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastSeen?: string;
  uptime?: number;
  description?: string;
  type?: string;
}

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agents-container">
      <!-- Header -->
      <div class="agents-header">
        <div class="header-content">
          <h1>Gestion des Agents</h1>
          <p class="header-subtitle">Surveillez et contrôlez vos agents en temps réel</p>
        </div>
        <div class="header-actions">
          <button class="action-btn refresh" (click)="refresh()" [disabled]="loading" title="Actualiser">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            {{ loading ? 'Actualisation...' : 'Actualiser' }}
          </button>
          <div class="auto-refresh">
            <label class="auto-refresh-label">
              <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
              Actualisation auto (5s)
            </label>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon running">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ getRunningCount() }}</div>
            <div class="stat-label">En cours</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon stopped">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.5,8L11,13.5L7.5,10L6,11.5L11,16.5Z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ getStoppedCount() }}</div>
            <div class="stat-label">Arrêtés</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ getErrorCount() }}</div>
            <div class="stat-label">Erreurs</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ agents.length }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
      </div>

      <!-- Agents List -->
      <div class="agents-list">
        <div class="list-header">
          <h2>Liste des Agents</h2>
          <div class="view-controls">
            <button class="view-btn" [class.active]="viewMode === 'grid'" (click)="setViewMode('grid')" title="Vue grille">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"/>
              </svg>
            </button>
            <button class="view-btn" [class.active]="viewMode === 'list'" (click)="setViewMode('list')" title="Vue liste">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="agents-grid" [class.list-view]="viewMode === 'list'">
          <div class="agent-card" 
               *ngFor="let agent of agents" 
               [class.running]="agent.status === 'running'"
               [class.stopped]="agent.status === 'stopped'"
               [class.error]="agent.status === 'error'"
               [class.starting]="agent.status === 'starting'"
               [class.stopping]="agent.status === 'stopping'">
            
            <div class="agent-header">
              <div class="agent-info">
                <div class="agent-name">{{ agent.name }}</div>
                <div class="agent-id">ID: {{ agent.id }}</div>
                <div class="agent-type" *ngIf="agent.type">{{ agent.type }}</div>
              </div>
              <div class="agent-status">
                <div class="status-indicator" [class]="agent.status">
                  <div class="status-dot"></div>
                  <span class="status-text">{{ getStatusText(agent.status) }}</span>
                </div>
              </div>
            </div>

            <div class="agent-content">
              <div class="agent-description" *ngIf="agent.description">
                {{ agent.description }}
              </div>
              
              <div class="agent-details">
                <div class="detail-item" *ngIf="agent.lastSeen">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M15.5,8L9,14.5L6.5,12L5,13.5L9,17.5L17,9.5L15.5,8Z"/>
                  </svg>
                  <span>Dernière activité: {{ formatDate(agent.lastSeen) }}</span>
                </div>
                
                <div class="detail-item" *ngIf="agent.uptime">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M15.5,8L9,14.5L6.5,12L5,13.5L9,17.5L17,9.5L15.5,8Z"/>
                  </svg>
                  <span>Uptime: {{ formatUptime(agent.uptime) }}</span>
                </div>
              </div>
            </div>

            <div class="agent-actions">
              <button class="action-btn start" 
                      (click)="startAgent(agent)" 
                      [disabled]="agent.status === 'running' || agent.status === 'starting'"
                      title="Démarrer l'agent">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                </svg>
                {{ agent.status === 'starting' ? 'Démarrage...' : 'Démarrer' }}
              </button>
              
              <button class="action-btn stop" 
                      (click)="stopAgent(agent)" 
                      [disabled]="agent.status === 'stopped' || agent.status === 'stopping'"
                      title="Arrêter l'agent">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6,6H18V18H6V6Z"/>
                </svg>
                {{ agent.status === 'stopping' ? 'Arrêt...' : 'Arrêter' }}
              </button>
              
              <button class="action-btn secondary" 
                      (click)="viewLogs(agent)" 
                      title="Voir les logs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Logs
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="agents.length === 0 && !loading">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
          </div>
          <h3>Aucun agent trouvé</h3>
          <p>Il n'y a actuellement aucun agent configuré dans le système.</p>
        </div>
      </div>
  </div>
  `,
  styles: [`
    .agents-container {
      height: 100vh;
      background: #1a1a1a;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }

    .agents-header {
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-content h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #e0e0e0;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      color: #888;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .action-btn {
      background: #007acc;
      border: none;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .action-btn:hover:not(:disabled) {
      background: #005a9e;
      transform: translateY(-1px);
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-btn.refresh {
      background: #404040;
    }

    .action-btn.refresh:hover {
      background: #505050;
    }

    .action-btn.start {
      background: #00c853;
    }

    .action-btn.start:hover:not(:disabled) {
      background: #00a047;
    }

    .action-btn.stop {
      background: #f44336;
    }

    .action-btn.stop:hover:not(:disabled) {
      background: #d32f2f;
    }

    .action-btn.secondary {
      background: #404040;
    }

    .action-btn.secondary:hover {
      background: #505050;
    }

    .auto-refresh {
      display: flex;
      align-items: center;
    }

    .auto-refresh-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #888;
      cursor: pointer;
    }

    .auto-refresh-label input[type="checkbox"] {
      accent-color: #007acc;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 24px;
      background: #252525;
    }

    .stat-card {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.running {
      background: rgba(0, 200, 83, 0.2);
      color: #00c853;
    }

    .stat-icon.stopped {
      background: rgba(158, 158, 158, 0.2);
      color: #9e9e9e;
    }

    .stat-icon.error {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .stat-icon.total {
      background: rgba(0, 122, 204, 0.2);
      color: #007acc;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #e0e0e0;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #888;
      margin-top: 4px;
    }

    .agents-list {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .list-header h2 {
      margin: 0;
      font-size: 20px;
      color: #e0e0e0;
    }

    .view-controls {
      display: flex;
      gap: 4px;
    }

    .view-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-btn:hover {
      background: #505050;
    }

    .view-btn.active {
      background: #007acc;
      color: white;
    }

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .agents-grid.list-view {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .agent-card {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
      animation: slideIn 0.3s ease-out;
    }

    .agent-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .agent-card.running {
      border-left: 4px solid #00c853;
    }

    .agent-card.stopped {
      border-left: 4px solid #9e9e9e;
    }

    .agent-card.error {
      border-left: 4px solid #f44336;
    }

    .agent-card.starting {
      border-left: 4px solid #ff9800;
    }

    .agent-card.stopping {
      border-left: 4px solid #ff5722;
    }

    .agent-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .agent-info {
      flex: 1;
    }

    .agent-name {
      font-size: 18px;
      font-weight: 600;
      color: #e0e0e0;
      margin-bottom: 4px;
    }

    .agent-id {
      font-size: 12px;
      color: #888;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }

    .agent-type {
      font-size: 12px;
      color: #007acc;
      background: rgba(0, 122, 204, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 4px;
    }

    .agent-status {
      display: flex;
      align-items: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-indicator.running {
      background: rgba(0, 200, 83, 0.1);
      color: #00c853;
    }

    .status-indicator.stopped {
      background: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }

    .status-indicator.error {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .status-indicator.starting {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .status-indicator.stopping {
      background: rgba(255, 87, 34, 0.1);
      color: #ff5722;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    .status-indicator.stopped .status-dot {
      animation: none;
    }

    .agent-content {
      margin-bottom: 16px;
    }

    .agent-description {
      color: #bbb;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .agent-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #888;
    }

    .agent-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .agent-actions .action-btn {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      padding: 8px 12px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }

    .empty-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #bbb;
      font-size: 18px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    /* Animations */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .agents-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }
      
      .header-actions {
        width: 100%;
        justify-content: space-between;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
      }
      
      .agents-list {
        padding: 16px;
      }
      
      .agents-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .agent-actions {
        flex-direction: column;
      }
      
      .agent-actions .action-btn {
        flex: none;
      }
    }
  `]
})
export class AgentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private autoRefreshInterval?: any;

  agents: Agent[] = [];
  loading = false;
  autoRefresh = true;
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refresh();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }

  private getApiBase(): string {
    return (window as any)["API_BASE_URL"] || 'http://localhost:8000';
  }

  refresh() {
    this.loading = true;
    this.http.get<Agent[]>(`${this.getApiBase()}/api/agents`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (agents) => {
          this.agents = agents;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des agents:', err);
          this.loading = false;
        }
      });
  }

  startAgent(agent: Agent) {
    agent.status = 'starting';
    this.http.post(`${this.getApiBase()}/api/agents/${agent.id}/start`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refresh();
        },
        error: (err) => {
          console.error('Erreur lors du démarrage:', err);
          agent.status = 'error';
        }
      });
  }

  stopAgent(agent: Agent) {
    agent.status = 'stopping';
    this.http.post(`${this.getApiBase()}/api/agents/${agent.id}/stop`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refresh();
        },
        error: (err) => {
          console.error('Erreur lors de l\'arrêt:', err);
          agent.status = 'error';
        }
      });
  }

  viewLogs(agent: Agent) {
    // TODO: Implémenter la visualisation des logs
    console.log('Voir les logs pour:', agent.name);
  }

  toggleAutoRefresh() {
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      if (this.autoRefresh) {
        this.refresh();
      }
    }, 5000);
  }

  private stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = undefined;
    }
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  getRunningCount(): number {
    return this.agents.filter(a => a.status === 'running').length;
  }

  getStoppedCount(): number {
    return this.agents.filter(a => a.status === 'stopped').length;
  }

  getErrorCount(): number {
    return this.agents.filter(a => a.status === 'error').length;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'running': 'En cours',
      'stopped': 'Arrêté',
      'error': 'Erreur',
      'starting': 'Démarrage',
      'stopping': 'Arrêt'
    };
    return statusMap[status] || status;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  }

  formatUptime(seconds: number): string {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}j ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
