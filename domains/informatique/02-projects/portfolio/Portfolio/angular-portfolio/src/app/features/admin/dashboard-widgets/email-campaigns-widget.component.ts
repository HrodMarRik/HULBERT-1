import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailCampaignService, EmailDashboardStats } from '../../../core/services/email-campaign.service';

@Component({
  selector: 'app-email-campaigns-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="widget-card email-campaigns-widget">
      <div class="widget-header">
        <div class="widget-icon">📧</div>
        <div class="widget-title">E-mailing</div>
        <div class="widget-value">{{ stats?.total_campaigns || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <!-- Stats rapides -->
        <div class="quick-stats" *ngIf="stats">
          <div class="quick-stat">
            <span class="quick-label">Templates</span>
            <span class="quick-value">{{ stats.total_templates }}</span>
          </div>
          <div class="quick-stat">
            <span class="quick-label">Listes</span>
            <span class="quick-value">{{ stats.total_lists }}</span>
          </div>
          <div class="quick-stat">
            <span class="quick-label">Ce mois</span>
            <span class="quick-value">{{ stats.recent_campaigns }}</span>
          </div>
        </div>

        <!-- Campagnes récentes -->
        <div class="recent-campaigns" *ngIf="recentCampaigns.length > 0">
          <div class="recent-title">Campagnes récentes</div>
          <div class="campaign-list">
            <div class="campaign-item" *ngFor="let campaign of recentCampaigns.slice(0, 3)" 
                 [routerLink]="['/admin/email-campaigns/campaigns', campaign.id]">
              <div class="campaign-info">
                <div class="campaign-name">{{ campaign.name }}</div>
                <div class="campaign-status" [style.color]="getStatusColor(campaign.status)">
                  {{ getStatusLabel(campaign.status) }}
                </div>
              </div>
              <div class="campaign-meta">
                <span class="recipients">{{ campaign.total_recipients }} destinataires</span>
                <span class="date">{{ formatDate(campaign.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="quick-actions">
          <button class="action-btn primary" routerLink="/admin/email-campaigns/new-campaign">
            <span class="btn-icon">📧</span>
            <span class="btn-text">Nouvelle</span>
          </button>
          <button class="action-btn secondary" routerLink="/admin/email-campaigns/templates">
            <span class="btn-icon">📝</span>
            <span class="btn-text">Templates</span>
          </button>
        </div>

        <!-- État vide -->
        <div class="empty-state" *ngIf="!stats || stats.total_campaigns === 0">
          <div class="empty-icon">📧</div>
          <div class="empty-text">Aucune campagne</div>
          <button class="create-btn" routerLink="/admin/email-campaigns/new-campaign">
            Créer une campagne
          </button>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/email-campaigns" class="view-more">Voir toutes les campagnes →</a>
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

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .quick-stat {
      text-align: center;
      padding: 6px;
      background: #334155;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }

    .quick-label {
      font-size: 10px;
      color: #94a3b8;
      display: block;
      margin-bottom: 2px;
    }

    .quick-value {
      font-size: 12px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .recent-campaigns {
      margin-bottom: 12px;
    }

    .recent-title {
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 8px;
    }

    .campaign-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .campaign-item {
      padding: 8px;
      background: #334155;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      cursor: pointer;
      transition: background 0.2s ease;
      text-decoration: none;
      color: inherit;
    }

    .campaign-item:hover {
      background: #475569;
    }

    .campaign-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .campaign-name {
      font-size: 12px;
      font-weight: 500;
      color: #f1f5f9;
      flex: 1;
    }

    .campaign-status {
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.2);
    }

    .campaign-meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }

    .recipients {
      font-weight: 500;
    }

    .date {
      color: #64748b;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 12px;
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
      text-decoration: none;
      color: inherit;
    }

    .action-btn.primary {
      background: #667eea;
      color: white;
    }

    .action-btn.primary:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .action-btn.secondary {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .action-btn.secondary:hover {
      background: #334155;
      border-color: #60a5fa;
    }

    .btn-icon {
      font-size: 12px;
    }

    .btn-text {
      flex: 1;
      text-align: left;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .empty-text {
      font-size: 12px;
      margin-bottom: 12px;
    }

    .create-btn {
      padding: 6px 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
      text-decoration: none;
    }

    .create-btn:hover {
      background: #5a67d8;
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
export class EmailCampaignsWidgetComponent implements OnInit {
  stats: EmailDashboardStats | null = null;
  recentCampaigns: any[] = [];

  constructor(private emailCampaignService: EmailCampaignService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.emailCampaignService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.recentCampaigns = stats.recent_campaigns_data || [];
      },
      error: (error) => {
        console.error('Error loading email stats:', error);
      }
    });
  }

  getStatusColor(status: string): string {
    return this.emailCampaignService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.emailCampaignService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return this.emailCampaignService.formatDate(dateString);
  }
}
