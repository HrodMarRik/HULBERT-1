import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contacts-stats-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card contacts-widget">
      <div class="widget-header">
        <div class="widget-icon">👥</div>
        <div class="widget-title">Contacts</div>
        <div class="widget-value">{{ data?.total || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Actifs</div>
            <div class="stat-value">{{ data?.by_status?.active || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Nouveaux</div>
            <div class="stat-value new">{{ data?.new_this_month || 0 }}</div>
          </div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/contacts" class="view-more">Voir tous les contacts →</a>
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
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      border-color: rgba(59, 130, 246, 0.4);
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .widget-icon {
      font-size: 20px;
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
      grid-template-columns: 1fr 1fr;
      gap: 10px;
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
      margin-bottom: 3px;
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
    }
    
    .stat-value.new {
      color: #34d399;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 12px;
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
export class ContactsStatsWidgetComponent implements OnInit {
  @Input() data: any;
  
  ngOnInit(): void {
    // Initialize component
  }
}

