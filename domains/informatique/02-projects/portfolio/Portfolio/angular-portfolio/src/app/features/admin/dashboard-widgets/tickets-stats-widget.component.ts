import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-tickets-stats-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card tickets-widget">
      <div class="widget-header">
        <div class="widget-icon">🎫</div>
        <div class="widget-title">Tickets</div>
        <div class="widget-value">{{ data?.total || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <!-- Tickets Critiques -->
        <div class="critical-tickets" *ngIf="getCriticalCount() > 0">
          <div class="critical-header">
            <span class="critical-icon">🚨</span>
            <span class="critical-label">Critiques</span>
            <span class="critical-count">{{ getCriticalCount() }}</span>
          </div>
        </div>
        
        <!-- Boutons de Création -->
        <div class="action-buttons">
          <button class="action-btn bug-btn" (click)="createNewTicket('bug')">
            <span class="btn-icon">🐛</span>
            <span class="btn-text">Bug</span>
          </button>
          <button class="action-btn feature-btn" (click)="createNewTicket('feature')">
            <span class="btn-icon">✨</span>
            <span class="btn-text">Feature</span>
          </button>
          <button class="action-btn task-btn" (click)="createNewTicket('task')">
            <span class="btn-icon">📋</span>
            <span class="btn-text">Task</span>
          </button>
          <button class="action-btn support-btn" (click)="createNewTicket('support')">
            <span class="btn-icon">🆘</span>
            <span class="btn-text">Support</span>
          </button>
        </div>
        
        <!-- Stats Rapides -->
        <div class="quick-stats" *ngIf="data?.total">
          <div class="quick-stat">
            <span class="quick-label">Ouverts</span>
            <span class="quick-value">{{ getOpenCount() }}</span>
          </div>
          <div class="quick-stat">
            <span class="quick-label">En cours</span>
            <span class="quick-value">{{ data.by_status['in_progress'] || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/tickets" class="view-more">Voir tous les tickets →</a>
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
    }
    
    .critical-tickets {
      margin-bottom: 8px;
    }
    
    .critical-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      background: #dc2626;
      border-radius: 6px;
      border: 1px solid #ef4444;
    }
    
    .critical-icon {
      font-size: 12px;
    }
    
    .critical-label {
      font-size: 11px;
      color: #fef2f2;
      font-weight: 500;
    }
    
    .critical-count {
      font-size: 12px;
      color: #fef2f2;
      font-weight: 600;
      margin-left: auto;
    }
    
    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 10px;
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border: none;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .bug-btn {
      background: #dc2626;
      color: #fef2f2;
    }
    
    .bug-btn:hover {
      background: #ef4444;
      transform: translateY(-1px);
    }
    
    .feature-btn {
      background: #059669;
      color: #f0fdf4;
    }
    
    .feature-btn:hover {
      background: #10b981;
      transform: translateY(-1px);
    }
    
    .task-btn {
      background: #7c3aed;
      color: #faf5ff;
    }
    
    .task-btn:hover {
      background: #8b5cf6;
      transform: translateY(-1px);
    }
    
    .support-btn {
      background: #ea580c;
      color: #fff7ed;
    }
    
    .support-btn:hover {
      background: #f97316;
      transform: translateY(-1px);
    }
    
    .btn-icon {
      font-size: 12px;
    }
    
    .btn-text {
      flex: 1;
      text-align: left;
    }
    
    .quick-stats {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: #334155;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .quick-stat {
      text-align: center;
    }
    
    .quick-label {
      display: block;
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    
    .quick-value {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
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
export class TicketsStatsWidgetComponent implements OnInit {
  @Input() data: any;
  
  statusList = [
    { key: 'open', label: 'Ouvert' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'resolved', label: 'Résolu' },
    { key: 'closed', label: 'Fermé' }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  getStatusColor(status: string): string {
    return this.dashboardService.getStatusColor(status);
  }

  getPercentage(status: string): number {
    if (!this.data?.total) return 0;
    const count = this.data.by_status[status] || 0;
    return (count / this.data.total) * 100;
  }

  getOpenCount(): number {
    return (this.data?.by_status['open'] || 0) + (this.data?.by_status['in_progress'] || 0);
  }

  getCriticalCount(): number {
    // Simuler des tickets critiques - dans une vraie app, ceci viendrait de l'API
    // On peut utiliser la priorité ou un champ spécial pour identifier les tickets critiques
    return this.data?.critical_count || 0;
  }

  createNewTicket(type: 'bug' | 'feature' | 'task' | 'support') {
    // Rediriger vers la page de création de ticket avec le type pré-rempli
    const url = `/admin/tickets/new?type=${type}`;
    window.open(url, '_blank');
  }
}
