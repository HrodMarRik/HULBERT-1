import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-agent-metrics-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card agent-widget">
      <div class="widget-header">
        <div class="widget-icon">🤖</div>
        <div class="widget-title">Agents</div>
        <div class="widget-value">{{ agents.length || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <div class="agent-list" *ngIf="agents && agents.length > 0">
          <div class="agent-item" *ngFor="let agent of agents">
            <div class="agent-info">
              <div class="agent-name">{{ agent.agent_name }}</div>
              <div class="agent-id">{{ agent.agent_id }}</div>
            </div>
            <div class="agent-stats">
              <div class="stat-row">
                <span class="stat-label">Jobs terminés</span>
                <span class="stat-value">{{ agent.jobs_completed }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Taux de succès</span>
                <span class="stat-value" [style.color]="getSuccessRateColor(agent.success_rate)">
                  {{ agent.success_rate.toFixed(1) }}%
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Dernière activité</span>
                <span class="stat-value">{{ formatLastActivity(agent.last_activity) }}</span>
              </div>
            </div>
            <div class="agent-status" [class]="getAgentStatus(agent)">
              <div class="status-indicator"></div>
              <span class="status-text">{{ getAgentStatusText(agent) }}</span>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="!agents || agents.length === 0">
          <div class="empty-icon">🤖</div>
          <div class="empty-text">Aucun agent actif</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/agents" class="view-more">Gérer les agents →</a>
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      background: #1e293b;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 14px;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .widget-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .widget-icon {
      font-size: 24px;
    }
    
    .widget-title {
      font-size: 15px;
      font-weight: 600;
      color: #f1f5f9;
      flex: 1;
    }

    .widget-value {
      font-size: 20px;
      font-weight: 700;
      color: #60a5fa;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .agent-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .agent-item {
      padding: 10px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      margin-bottom: 8px;
      background: #334155;
    }
    
    .agent-info {
      margin-bottom: 6px;
    }
    
    .agent-name {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
    }
    
    .agent-id {
      font-size: 11px;
      color: #94a3b8;
      font-family: monospace;
    }
    
    .agent-stats {
      margin-bottom: 6px;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    
    .stat-label {
      font-size: 11px;
      color: #cbd5e1;
    }
    
    .stat-value {
      font-size: 11px;
      font-weight: 600;
      color: #f1f5f9;
    }
    
    .agent-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .agent-status.active .status-indicator {
      background: #10b981;
    }
    
    .agent-status.inactive .status-indicator {
      background: #ef4444;
    }
    
    .agent-status.unknown .status-indicator {
      background: #6b7280;
    }
    
    .status-text {
      font-weight: 500;
    }
    
    .agent-status.active .status-text {
      color: #10b981;
    }
    
    .agent-status.inactive .status-text {
      color: #ef4444;
    }
    
    .agent-status.unknown .status-text {
      color: #6b7280;
    }
    
    .empty-state {
      text-align: center;
      padding: 30px 20px;
      color: #94a3b8;
    }
    
    .empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
    }
    
    .empty-text {
      font-size: 12px;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 16px;
    }
    
    .view-more {
      color: #60a5fa;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    
    .view-more:hover {
      color: #93c5fd;
      text-decoration: underline;
    }
  `]
})
export class AgentMetricsWidgetComponent implements OnInit {
  @Input() agents: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  getSuccessRateColor(rate: number): string {
    if (rate >= 90) return '#10b981'; // green
    if (rate >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  formatLastActivity(lastActivity: string): string {
    if (!lastActivity) return 'Jamais';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  getAgentStatus(agent: any): string {
    if (!agent.last_activity) return 'unknown';
    
    const lastActivity = new Date(agent.last_activity);
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 30) return 'active';
    if (diffMins < 1440) return 'inactive';
    return 'unknown';
  }

  getAgentStatusText(agent: any): string {
    const status = this.getAgentStatus(agent);
    const statusTexts: { [key: string]: string } = {
      'active': 'Actif',
      'inactive': 'Inactif',
      'unknown': 'Inconnu'
    };
    return statusTexts[status] || 'Inconnu';
  }
}
