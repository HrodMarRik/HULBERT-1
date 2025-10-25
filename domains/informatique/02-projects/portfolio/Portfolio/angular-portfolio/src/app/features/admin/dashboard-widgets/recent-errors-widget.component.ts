import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-recent-errors-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card errors-widget">
      <div class="widget-header">
        <div class="widget-icon">❌</div>
        <div class="widget-title">Erreurs Récentes</div>
        <div class="widget-value">{{ errors.length || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <div class="error-list" *ngIf="errors && errors.length > 0">
          <div class="error-item" *ngFor="let error of errors; trackBy: trackByError">
            <div class="error-header">
              <span class="error-level" [class]="'level-' + error.level.toLowerCase()">
                {{ error.level }}
              </span>
              <span class="error-module">{{ error.module }}</span>
              <span class="error-time">{{ formatTime(error.timestamp) }}</span>
            </div>
            <div class="error-message">{{ error.message }}</div>
            <div class="error-request" *ngIf="error.request_id">
              <span class="request-label">Request ID:</span>
              <span class="request-id">{{ error.request_id }}</span>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="!errors || errors.length === 0">
          <div class="empty-icon">✅</div>
          <div class="empty-text">Aucune erreur récente</div>
          <div class="empty-subtext">Le système fonctionne correctement</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/logs" class="view-more">Voir tous les logs →</a>
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
      color: #f87171;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .error-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .error-item {
      padding: 12px;
      border-left: 4px solid #ef4444;
      background: #fef2f2;
      border-radius: 0 8px 8px 0;
      margin-bottom: 12px;
      transition: all 0.2s ease;
    }
    
    .error-item:hover {
      background: #fee2e2;
    }
    
    .error-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    
    .error-level {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    
    .level-error {
      background: #fecaca;
      color: #dc2626;
    }
    
    .level-warning {
      background: #fed7aa;
      color: #ea580c;
    }
    
    .level-info {
      background: #bfdbfe;
      color: #2563eb;
    }
    
    .error-module {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .error-time {
      font-size: 11px;
      color: #9ca3af;
      margin-left: auto;
    }
    
    .error-message {
      font-size: 14px;
      color: #1f2937;
      line-height: 1.4;
      margin-bottom: 8px;
      word-break: break-word;
    }
    
    .error-request {
      font-size: 11px;
      color: #6b7280;
    }
    
    .request-label {
      font-weight: 500;
    }
    
    .request-id {
      font-family: monospace;
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 3px;
      margin-left: 4px;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    
    .empty-text {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .empty-subtext {
      font-size: 14px;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 16px;
    }
    
    .view-more {
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    
    .view-more:hover {
      text-decoration: underline;
    }
  `]
})
export class RecentErrorsWidgetComponent implements OnInit {
  @Input() errors: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  trackByError(index: number, error: any): string {
    return error.timestamp + error.message;
  }
}
