import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-projects-stats-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card projects-widget">
      <div class="widget-header">
        <div class="widget-icon">📊</div>
        <div class="widget-title">Projets</div>
        <div class="widget-value">{{ data?.total || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <div class="stats-grid">
          <div class="stat-item" *ngFor="let status of statusList">
            <div class="stat-label">{{ status.label }}</div>
            <div class="stat-value" [style.color]="getStatusColor(status.key)">
              {{ data?.by_status[status.key] || 0 }}
            </div>
          </div>
        </div>
        
        <div class="budget-info" *ngIf="data?.total_budget">
          <div class="budget-label">Budget Total</div>
          <div class="budget-value">{{ formatCurrency(data.total_budget) }}</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/projects" class="view-more">Voir tous les projets →</a>
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
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .stat-item {
      text-align: center;
      padding: 8px;
      background: #334155;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .stat-label {
      font-size: 11px;
      color: #cbd5e1;
      text-transform: capitalize;
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: 600;
      margin-top: 4px;
      color: #f1f5f9;
    }
    
    .budget-info {
      padding: 10px;
      background: #1e3a5f;
      border-radius: 8px;
      border-left: 4px solid #60a5fa;
    }
    
    .budget-label {
      font-size: 11px;
      color: #cbd5e1;
      margin-bottom: 4px;
    }
    
    .budget-value {
      font-size: 14px;
      font-weight: 600;
      color: #93c5fd;
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
export class ProjectsStatsWidgetComponent implements OnInit {
  @Input() data: any;
  
  statusList = [
    { key: 'planning', label: 'Planification' },
    { key: 'active', label: 'Actif' },
    { key: 'on-hold', label: 'En pause' },
    { key: 'completed', label: 'Terminé' },
    { key: 'cancelled', label: 'Annulé' }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  getStatusColor(status: string): string {
    return this.dashboardService.getStatusColor(status);
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }
}
