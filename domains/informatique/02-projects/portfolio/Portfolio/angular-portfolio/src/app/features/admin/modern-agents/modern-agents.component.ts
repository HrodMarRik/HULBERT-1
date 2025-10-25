import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, interval, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastSeen?: string;
  uptime?: number;
  description?: string;
  type?: string;
}

interface AgentMetrics {
  agent_id: string;
  agent_name: string;
  lines_created: number;
  lines_deleted: number;
  lines_modified: number;
  files_processed: number;
  files_created: number;
  files_deleted: number;
  jobs_completed: number;
  jobs_failed: number;
  total_work_time_seconds: number;
  last_activity: string | null;
  avg_job_duration_seconds: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

interface AgentActivity {
  id: number;
  agent_id: string;
  activity_type: string;
  file_path: string | null;
  lines_changed: number | null;
  duration_seconds: number | null;
  error_message: string | null;
  timestamp: string;
}

@Component({
  selector: 'app-modern-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="agents-container admin-page-container">
      <!-- Header -->
      <div class="agents-header">
        <div class="header-content">
          <h1>Gestion des Agents</h1>
          <p class="header-subtitle">Surveillez et contrôlez vos agents en temps réel</p>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="openStatsPanel()" title="Voir les statistiques globales">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13"/>
            </svg>
            Agent Stats
          </button>
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

    <!-- Panneau Latéral de Statistiques -->
    <div class="stats-panel" [class.open]="showStatsPanel">
      <div class="stats-panel-header">
        <h2>Statistiques Globales des Agents</h2>
        <button class="close-btn" (click)="closeStatsPanel()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>
      
      <div class="stats-panel-content" *ngIf="!statsLoading && agentStats.length > 0">
        <!-- Vue d'ensemble -->
        <div class="stats-section">
          <h3>Vue d'ensemble</h3>
          <div class="stats-overview-grid">
            <div class="stat-box">
              <div class="stat-value">{{ getTotalStats().totalJobsCompleted + getTotalStats().totalJobsFailed }}</div>
              <div class="stat-label">Jobs Total</div>
            </div>
            <div class="stat-box success">
              <div class="stat-value">{{ getTotalStats().overallSuccessRate.toFixed(1) }}%</div>
              <div class="stat-label">Taux de Succès</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ formatDuration(getTotalStats().totalWorkTime) }}</div>
              <div class="stat-label">Temps Total</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ getTotalStats().totalFilesProcessed }}</div>
              <div class="stat-label">Fichiers Traités</div>
            </div>
          </div>
        </div>
        
        <!-- Statistiques de Fichiers -->
        <div class="stats-section">
          <h3>Fichiers</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-name">Fichiers Créés</span>
              <span class="stat-value-inline">{{ getTotalStats().totalFilesCreated }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Fichiers Supprimés</span>
              <span class="stat-value-inline">{{ getTotalStats().totalFilesDeleted }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Fichiers Traités</span>
              <span class="stat-value-inline">{{ getTotalStats().totalFilesProcessed }}</span>
            </div>
          </div>
        </div>
        
        <!-- Statistiques de Lignes -->
        <div class="stats-section">
          <h3>Lignes de Code</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-name">Lignes Créées</span>
              <span class="stat-value-inline success">+{{ getTotalStats().totalLinesCreated }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Lignes Supprimées</span>
              <span class="stat-value-inline error">-{{ getTotalStats().totalLinesDeleted }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Lignes Modifiées</span>
              <span class="stat-value-inline">~{{ getTotalStats().totalLinesModified }}</span>
            </div>
            <div class="stat-item total">
              <span class="stat-name">Impact Total</span>
              <span class="stat-value-inline">{{ getTotalStats().totalLinesCreated + getTotalStats().totalLinesDeleted + getTotalStats().totalLinesModified }} lignes</span>
            </div>
          </div>
        </div>
        
        <!-- Performance -->
        <div class="stats-section">
          <h3>Performance</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-name">Jobs Réussis</span>
              <span class="stat-value-inline success">{{ getTotalStats().totalJobsCompleted }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Jobs Échoués</span>
              <span class="stat-value-inline error">{{ getTotalStats().totalJobsFailed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Taux de Succès</span>
              <span class="stat-value-inline">{{ getTotalStats().overallSuccessRate.toFixed(1) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-name">Temps Total</span>
              <span class="stat-value-inline">{{ formatDuration(getTotalStats().totalWorkTime) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Agents Individuels -->
        <div class="stats-section">
          <h3>Agents Individuels</h3>
          <div class="agents-stats-list">
            <div class="agent-stat-item" *ngFor="let agentStat of agentStats">
              <div class="agent-stat-header">
                <span class="agent-stat-name">{{ agentStat.agent_name }}</span>
                <span class="agent-stat-id">{{ agentStat.agent_id }}</span>
              </div>
              <div class="agent-stat-metrics">
                <div class="agent-stat-metric">
                  <span class="metric-label">Jobs:</span>
                  <span class="metric-value">{{ agentStat.jobs_completed + agentStat.jobs_failed }}</span>
                </div>
                <div class="agent-stat-metric">
                  <span class="metric-label">Succès:</span>
                  <span class="metric-value success">{{ agentStat.success_rate.toFixed(1) }}%</span>
                </div>
                <div class="agent-stat-metric">
                  <span class="metric-label">Fichiers:</span>
                  <span class="metric-value">{{ agentStat.files_processed }}</span>
                </div>
                <div class="agent-stat-metric">
                  <span class="metric-label">Lignes:</span>
                  <span class="metric-value">{{ formatNumber(agentStat.lines_created + agentStat.lines_deleted) }}</span>
                </div>
              </div>
            </div>
            
            <div class="empty-agents" *ngIf="agentStats.length === 0">
              <p>Aucune donnée d'agent disponible</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-panel-loading" *ngIf="statsLoading">
        <div class="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    </div>

    <!-- Overlay pour fermer le panneau -->
    <div class="stats-overlay" *ngIf="showStatsPanel" (click)="closeStatsPanel()"></div>

    <!-- Modal des Logs -->
    <div class="logs-modal" *ngIf="showLogsModal" (click)="closeLogsModal()">
      <div class="logs-modal-content" (click)="$event.stopPropagation()">
        <div class="logs-modal-header">
          <h2>Logs - {{ selectedAgent?.name || 'Agent' }}</h2>
          <button class="close-btn" (click)="closeLogsModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <div class="logs-modal-body">
          <div *ngIf="logsLoading" class="logs-loading">
            <div class="spinner"></div>
            <p>Chargement des logs...</p>
          </div>
          
          <div *ngIf="!logsLoading && selectedAgentLogs && selectedAgentLogs.length > 0" class="logs-content">
            <div *ngFor="let log of selectedAgentLogs; trackBy: trackByLog" class="log-entry" [class]="'log-' + (log.level || 'info')">
              <div class="log-timestamp">{{ log.timestamp | date:'medium' }}</div>
              <div class="log-level">{{ log.level || 'info' }}</div>
              <div class="log-message">{{ log.message }}</div>
            </div>
          </div>
          
          <div *ngIf="!logsLoading && (!selectedAgentLogs || selectedAgentLogs.length === 0)" class="logs-empty">
            <p>Aucun log disponible pour cet agent</p>
          </div>
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
      overflow-y: auto;
      overflow-x: hidden;
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

    /* Panneau Latéral de Statistiques */
    .stats-panel {
      position: fixed;
      right: -500px;
      top: 0;
      width: 480px;
      height: 100vh;
      background: #1e1e1e;
      border-left: 1px solid #404040;
      z-index: 10000;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
    }

    .stats-panel.open {
      right: 0;
    }

    .stats-panel-header {
      padding: 24px;
      border-bottom: 1px solid #404040;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #252525;
    }

    .stats-panel-header h2 {
      margin: 0;
      font-size: 20px;
      color: #e0e0e0;
      font-weight: 600;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #404040;
      color: #e0e0e0;
    }

    .stats-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .stats-section {
      margin-bottom: 32px;
    }

    .stats-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #007acc;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-box {
      background: #252525;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .stat-box:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .stat-box.success {
      border-color: #00c853;
      background: rgba(0, 200, 83, 0.05);
    }

    .stat-box .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #e0e0e0;
      margin-bottom: 4px;
    }

    .stat-box.success .stat-value {
      color: #00c853;
    }

    .stat-box .stat-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #252525;
      border: 1px solid #404040;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .stat-item:hover {
      background: #2a2a2a;
      border-color: #505050;
    }

    .stat-item.total {
      border-color: #007acc;
      background: rgba(0, 122, 204, 0.05);
    }

    .stat-name {
      font-size: 14px;
      color: #bbb;
    }

    .stat-value-inline {
      font-size: 16px;
      font-weight: 600;
      color: #e0e0e0;
    }

    .stat-value-inline.success {
      color: #00c853;
    }

    .stat-value-inline.error {
      color: #f44336;
    }

    .activities-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      background: #252525;
      border: 1px solid #404040;
      border-radius: 6px;
      padding: 12px;
      transition: all 0.2s ease;
    }

    .activity-item:hover {
      background: #2a2a2a;
      border-color: #505050;
    }

    .activity-type {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .activity-type.success {
      background: rgba(0, 200, 83, 0.1);
      color: #00c853;
      border: 1px solid #00c853;
    }

    .activity-type.error {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid #f44336;
    }

    .activity-type.info {
      background: rgba(0, 122, 204, 0.1);
      color: #007acc;
      border: 1px solid #007acc;
    }

    .activity-type.warning {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
      border: 1px solid #ff9800;
    }

    .activity-details {
      font-size: 13px;
    }

    .activity-file {
      color: #e0e0e0;
      font-weight: 500;
      margin-bottom: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    .activity-meta {
      display: flex;
      gap: 12px;
      color: #888;
      font-size: 12px;
    }

    .activity-time {
      margin-left: auto;
    }

    .activity-error {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
      padding: 6px 8px;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
    }

    .empty-activities {
      text-align: center;
      padding: 40px 20px;
      color: #888;
    }

    .agents-stats-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .agent-stat-item {
      background: #252525;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .agent-stat-item:hover {
      background: #2a2a2a;
      border-color: #505050;
    }

    .agent-stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .agent-stat-name {
      font-size: 16px;
      font-weight: 600;
      color: #e0e0e0;
    }

    .agent-stat-id {
      font-size: 12px;
      color: #888;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    .agent-stat-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .agent-stat-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .metric-label {
      font-size: 12px;
      color: #888;
    }

    .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: #e0e0e0;
    }

    .metric-value.success {
      color: #00c853;
    }

    .empty-agents {
      text-align: center;
      padding: 40px 20px;
      color: #888;
    }

    .stats-panel-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #888;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #404040;
      border-top-color: #007acc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }

    /* Styles pour le modal des logs */
    .logs-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    }

    .logs-modal-content {
      background: #2d2d2d;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      overflow: hidden;
      border: 1px solid #404040;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    .logs-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
      background: #404040;
    }

    .logs-modal-header h2 {
      margin: 0;
      font-size: 18px;
      color: #fff;
    }

    .logs-modal-body {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .logs-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
    }

    .logs-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .log-entry {
      background: #404040;
      border-radius: 8px;
      padding: 12px 16px;
      display: grid;
      grid-template-columns: auto auto 1fr;
      gap: 12px;
      align-items: center;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .log-timestamp {
      color: #888;
      font-size: 11px;
      white-space: nowrap;
    }

    .log-level {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .log-message {
      color: #e0e0e0;
      word-break: break-word;
    }

    .log-info .log-level {
      background: #2196f3;
      color: white;
    }

    .log-warning .log-level {
      background: #ff9800;
      color: white;
    }

    .log-error .log-level {
      background: #f44336;
      color: white;
    }

    .log-debug .log-level {
      background: #9c27b0;
      color: white;
    }

    .logs-empty {
      text-align: center;
      padding: 40px;
      color: #888;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-panel {
        width: 100%;
        right: -100%;
      }
      
      .stats-overview-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ModernAgentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private autoRefreshInterval?: any;

  agents: Agent[] = [];
  loading = false;
  autoRefresh = true;
  viewMode: 'grid' | 'list' = 'grid';
  
  selectedAgent: Agent | null = null;
  agentMetrics: AgentMetrics | null = null;
  agentActivities: AgentActivity[] = [];
  loadingStats = false;
  statsPanelOpen = false;
  
  // Nouvelles propriétés pour le panneau de statistiques globales
  showStatsPanel = false;
  statsLoading = false;
  statsError: string | null = null;
  agentStats: AgentMetrics[] = [];

  // Propriétés pour les logs
  showLogsModal = false;
  selectedAgentLogs: any[] = [];
  logsLoading = false;

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
        next: (agents: Agent[]) => {
          this.agents = agents;
          this.loading = false;
        },
        error: (err: any) => {
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
        error: (err: any) => {
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
        error: (err: any) => {
          console.error('Erreur lors de l\'arrêt:', err);
          agent.status = 'error';
        }
      });
  }

  viewLogs(agent: Agent) {
    console.log('Ouverture des logs pour:', agent.name);
    this.selectedAgent = agent;
    this.showLogsModal = true;
    this.loadAgentLogs(agent.id);
  }

  private loadAgentLogs(agentId: string) {
    this.logsLoading = true;
    this.http.get<any>(`http://localhost:8000/api/agents/${agentId}/logs`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading agent logs:', error);
          this.selectedAgentLogs = [{
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Erreur lors du chargement des logs: ${error.message}`
          }];
          return of({ logs: this.selectedAgentLogs });
        })
      )
      .subscribe({
        next: (response) => {
          this.selectedAgentLogs = response.logs || [];
          this.logsLoading = false;
          console.log('Logs chargés:', this.selectedAgentLogs);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des logs:', error);
          this.selectedAgentLogs = [{
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Erreur lors du chargement des logs: ${error.message}`
          }];
          this.logsLoading = false;
        }
      });
  }

  closeLogsModal() {
    this.showLogsModal = false;
    this.selectedAgentLogs = [];
  }

  trackByLog(index: number, log: any): any {
    return log.timestamp + log.message;
  }

  openStatsPanel() {
    this.showStatsPanel = true;
    this.loadAllAgentStats();
  }

  closeStatsPanel() {
    this.showStatsPanel = false;
  }

  private loadAllAgentStats() {
    this.statsLoading = true;
    this.statsError = null;

    // Charger les statistiques pour tous les agents
    const agentIds = this.agents.map(agent => agent.id);
    const statsPromises = agentIds.map(agentId => 
      this.http.get<AgentMetrics>(`${this.getApiBase()}/api/agents/${agentId}/metrics`).pipe(
        catchError((error: any) => {
          console.error(`Erreur lors du chargement des métriques pour ${agentId}:`, error);
          return of(null);
        })
      )
    );

    forkJoin(statsPromises).pipe(
      takeUntil(this.destroy$)
    ).subscribe((results: (AgentMetrics | null)[]) => {
      this.agentStats = results.filter((stat: AgentMetrics | null) => stat !== null) as AgentMetrics[];
      this.statsLoading = false;
      console.log('Statistiques chargées:', this.agentStats);
    }, (error: any) => {
      console.error('Erreur lors du chargement des statistiques:', error);
      this.statsError = 'Erreur lors du chargement des statistiques';
      this.statsLoading = false;
    });
  }

  getTotalStats(): {
    totalLinesCreated: number;
    totalLinesDeleted: number;
    totalLinesModified: number;
    totalFilesProcessed: number;
    totalFilesCreated: number;
    totalFilesDeleted: number;
    totalJobsCompleted: number;
    totalJobsFailed: number;
    overallSuccessRate: number;
    totalWorkTime: number;
  } {
    if (!this.agentStats || this.agentStats.length === 0) {
      return {
        totalLinesCreated: 0,
        totalLinesDeleted: 0,
        totalLinesModified: 0,
        totalFilesProcessed: 0,
        totalFilesCreated: 0,
        totalFilesDeleted: 0,
        totalJobsCompleted: 0,
        totalJobsFailed: 0,
        overallSuccessRate: 0,
        totalWorkTime: 0
      };
    }

    const totals = this.agentStats.reduce((acc: any, stats: AgentMetrics) => {
      acc.totalLinesCreated += stats.lines_created;
      acc.totalLinesDeleted += stats.lines_deleted;
      acc.totalLinesModified += stats.lines_modified;
      acc.totalFilesProcessed += stats.files_processed;
      acc.totalFilesCreated += stats.files_created;
      acc.totalFilesDeleted += stats.files_deleted;
      acc.totalJobsCompleted += stats.jobs_completed;
      acc.totalJobsFailed += stats.jobs_failed;
      acc.totalWorkTime += stats.total_work_time_seconds;
      return acc;
    }, {
      totalLinesCreated: 0,
      totalLinesDeleted: 0,
      totalLinesModified: 0,
      totalFilesProcessed: 0,
      totalFilesCreated: 0,
      totalFilesDeleted: 0,
      totalJobsCompleted: 0,
      totalJobsFailed: 0,
      totalWorkTime: 0
    });

    const totalJobs = totals.totalJobsCompleted + totals.totalJobsFailed;
    totals.overallSuccessRate = totalJobs > 0 ? (totals.totalJobsCompleted / totalJobs) * 100 : 0;

    return totals;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  loadAgentStats(agentId: string) {
    this.loadingStats = true;
    
    // Charger les métriques
    this.http.get<AgentMetrics>(`${this.getApiBase()}/api/agents/${agentId}/metrics`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics: AgentMetrics) => {
          this.agentMetrics = metrics;
          this.loadingStats = false;
        },
        error: (err: any) => {
          console.error('Erreur lors du chargement des métriques:', err);
          this.loadingStats = false;
        }
      });
    
    // Charger les activités récentes
    this.http.get<AgentActivity[]>(`${this.getApiBase()}/api/agents/${agentId}/activities?limit=20`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities: AgentActivity[]) => {
          this.agentActivities = activities;
        },
        error: (err: any) => {
          console.error('Erreur lors du chargement des activités:', err);
        }
      });
  }


  private displayLogsModal(agentName: string, logs: any[]) {
    // Créer un modal simple pour afficher les logs
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      width: 100%;
      max-width: 800px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid #404040;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; color: #e0e0e0; font-size: 18px;">Logs - ${agentName}</h3>
      <button id="close-logs-modal" style="
        background: #404040;
        border: none;
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">Fermer</button>
    `;

    const logsContainer = document.createElement('div');
    logsContainer.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
    `;

    if (logs.length === 0) {
      logsContainer.innerHTML = '<div style="color: #888; text-align: center; padding: 40px;">Aucun log disponible</div>';
    } else {
      logsContainer.innerHTML = logs.map(log => `
        <div style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${
          log.level === 'ERROR' ? '#f44336' : 
          log.level === 'WARN' ? '#ff9800' : 
          log.level === 'INFO' ? '#00c853' : '#007acc'
        };">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">
            ${new Date(log.timestamp).toLocaleString('fr-FR')} [${log.level}]
          </div>
          <div style="color: #e0e0e0; white-space: pre-wrap;">${log.message}</div>
        </div>
      `).join('');
    }

    modalContent.appendChild(header);
    modalContent.appendChild(logsContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Gérer la fermeture du modal
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    document.getElementById('close-logs-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
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


  getActivityClass(activityType: string): string {
    const classMap: { [key: string]: string } = {
      'job_complete': 'success',
      'job_fail': 'error',
      'job_start': 'info',
      'file_edit': 'warning'
    };
    return classMap[activityType] || 'info';
  }

  getActivityLabel(activityType: string): string {
    const labelMap: { [key: string]: string } = {
      'job_complete': 'Job Terminé',
      'job_fail': 'Job Échoué',
      'job_start': 'Job Démarré',
      'file_edit': 'Fichier Modifié'
    };
    return labelMap[activityType] || activityType;
  }

  formatActivityTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return `Il y a ${Math.floor(diffMins / 1440)}j`;
  }
}
