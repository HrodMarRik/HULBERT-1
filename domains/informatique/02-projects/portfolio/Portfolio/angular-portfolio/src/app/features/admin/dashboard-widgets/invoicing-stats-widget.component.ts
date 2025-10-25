import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-invoicing-stats-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card invoicing-widget">
      <div class="widget-header">
        <div class="widget-icon">💰</div>
        <div class="widget-title">Facturation</div>
        <div class="widget-value">{{ data?.invoices?.total_count || 0 }}</div>
      </div>
      
      <div class="widget-content">
        <!-- Invoices Stats -->
        <div class="stats-section">
          <div class="section-title">Factures</div>
          <div class="stat-row">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ data?.invoices?.total_count || 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Payées</span>
            <span class="stat-value paid">{{ data?.invoices?.paid_count || 0 }}</span>
          </div>
          <div class="payment-rate">
            <div class="rate-label">Taux de paiement</div>
            <div class="rate-bar">
              <div 
                class="rate-fill" 
                [style.width.%]="data?.invoices?.paid_percentage || 0"
                [style.background-color]="getPaymentRateColor(data?.invoices?.paid_percentage)">
              </div>
            </div>
            <div class="rate-value">{{ (data?.invoices?.paid_percentage || 0).toFixed(1) }}%</div>
          </div>
        </div>
        
        <!-- Quotes Stats -->
        <div class="stats-section">
          <div class="section-title">Devis</div>
          <div class="stat-row">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ data?.quotes?.total_count || 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Acceptés</span>
            <span class="stat-value accepted">{{ data?.quotes?.accepted_count || 0 }}</span>
          </div>
          <div class="conversion-rate">
            <div class="rate-label">Taux de conversion</div>
            <div class="rate-bar">
              <div 
                class="rate-fill" 
                [style.width.%]="data?.quotes?.conversion_rate || 0"
                [style.background-color]="getConversionRateColor(data?.quotes?.conversion_rate)">
              </div>
            </div>
            <div class="rate-value">{{ (data?.quotes?.conversion_rate || 0).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/invoicing" class="view-more">Gérer la facturation →</a>
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
    
    .stats-section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .stat-value {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
    }
    
    .stat-value.paid {
      color: #34d399;
    }
    
    .stat-value.accepted {
      color: #60a5fa;
    }
    
    .payment-rate, .conversion-rate {
      margin-top: 10px;
    }
    
    .rate-label {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    
    .rate-bar {
      height: 6px;
      background: #334155;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 3px;
    }
    
    .rate-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    
    .rate-value {
      font-size: 11px;
      font-weight: 600;
      color: #f1f5f9;
      text-align: right;
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
export class InvoicingStatsWidgetComponent implements OnInit {
  @Input() data: any;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {}

  getPaymentRateColor(rate: number): string {
    if (rate >= 80) return '#10b981'; // green
    if (rate >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  getConversionRateColor(rate: number): string {
    if (rate >= 30) return '#10b981'; // green
    if (rate >= 15) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }
}
