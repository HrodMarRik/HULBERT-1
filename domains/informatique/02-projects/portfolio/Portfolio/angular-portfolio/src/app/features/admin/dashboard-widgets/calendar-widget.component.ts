import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-calendar-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card calendar-widget">
      <div class="widget-header">
        <div class="widget-icon">📅</div>
        <div class="widget-title">Calendrier</div>
        <div class="widget-value">{{ upcomingEvents.length || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <div class="upcoming-events" *ngIf="upcomingEvents && upcomingEvents.length > 0">
          <div class="event-list">
            <div class="event-item" *ngFor="let event of upcomingEvents.slice(0, 3)">
              <div class="event-time">{{ formatEventTime(event.start_datetime) }}</div>
              <div class="event-title">{{ event.title }}</div>
              <div class="event-category" [style.color]="getCategoryColor(event.category)">
                {{ getCategoryLabel(event.category) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="!upcomingEvents || upcomingEvents.length === 0">
          <div class="empty-icon">📅</div>
          <div class="empty-text">Aucun événement à venir</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/calendar" class="view-more">Voir le calendrier →</a>
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
    
    .upcoming-events {
      margin-top: 0;
    }
    
    .event-list {
      max-height: 200px;
      overflow-y: auto;
    }
    
    .event-item {
      padding: 8px 10px;
      border-left: 3px solid #60a5fa;
      background: #1e3a5f;
      border-radius: 0 6px 6px 0;
      margin-bottom: 6px;
    }
    
    .event-time {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .event-title {
      font-size: 12px;
      font-weight: 500;
      color: #f1f5f9;
      margin: 2px 0;
    }
    
    .event-category {
      font-size: 10px;
      font-weight: 500;
      color: #cbd5e1;
    }
    
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #94a3b8;
    }
    
    .empty-icon {
      font-size: 28px;
      margin-bottom: 6px;
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
export class CalendarWidgetComponent implements OnInit {
  @Input() data: any;
  @Input() upcomingEvents: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  formatEventTime(datetime: string): string {
    const date = new Date(datetime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (eventDate.getTime() === today.getTime()) {
      return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (eventDate.getTime() === tomorrow.getTime()) {
      return `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'meeting': '#3b82f6',
      'deadline': '#ef4444',
      'personal': '#10b981',
      'project': '#f59e0b',
      'other': '#6b7280'
    };
    return colors[category] || '#6b7280';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'meeting': 'Réunion',
      'deadline': 'Échéance',
      'personal': 'Personnel',
      'project': 'Projet',
      'other': 'Autre'
    };
    return labels[category] || category;
  }
}
