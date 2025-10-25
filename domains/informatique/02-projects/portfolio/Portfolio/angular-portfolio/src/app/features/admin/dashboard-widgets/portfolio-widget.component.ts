import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  profit_loss: number;
  profit_loss_percent: number;
  assets_count: number;
}

@Component({
  selector: 'app-portfolio-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card portfolio-widget">
      <div class="widget-header">
        <div class="widget-icon">💰</div>
        <div class="widget-title">Portefeuille</div>
        <div class="widget-value">{{ formatCurrency(data.total_value) }}</div>
      </div>
      
      <div class="widget-content">
        <div class="portfolio-stats">
          <div class="stat-item">
            <div class="stat-label">Investi</div>
            <div class="stat-value">{{ formatCurrency(data.total_invested) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Actifs</div>
            <div class="stat-value">{{ data.assets_count }}</div>
          </div>
        </div>
        
        <div class="profit-loss" [class.positive]="data.profit_loss >= 0" [class.negative]="data.profit_loss < 0">
          <div class="pl-label">Gain/Perte</div>
          <div class="pl-value">
            <span class="pl-amount">{{ formatCurrency(data.profit_loss) }}</span>
            <span class="pl-percent">({{ data.profit_loss_percent >= 0 ? '+' : '' }}{{ data.profit_loss_percent.toFixed(2) }}%)</span>
          </div>
          <div class="pl-icon">{{ data.profit_loss >= 0 ? '📈' : '📉' }}</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/portfolio" class="view-more">Voir le portefeuille →</a>
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
      font-size: 18px;
      font-weight: 700;
      color: #fbbf24;
    }
    
    .widget-content {
      flex: 1;
    }
    
    .portfolio-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .stat-item {
      background: #334155;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .stat-label {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .stat-value {
      font-size: 14px;
      color: #f1f5f9;
      font-weight: 600;
    }
    
    .profit-loss {
      background: #334155;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .profit-loss.positive {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
    }
    
    .profit-loss.negative {
      background: rgba(248, 113, 113, 0.1);
      border-color: rgba(248, 113, 113, 0.3);
    }
    
    .pl-label {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    
    .pl-value {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .pl-amount {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
    }
    
    .profit-loss.positive .pl-amount {
      color: #34d399;
    }
    
    .profit-loss.negative .pl-amount {
      color: #f87171;
    }
    
    .pl-percent {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .pl-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 32px;
      opacity: 0.3;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .view-more {
      color: #60a5fa;
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
      display: block;
      text-align: center;
      transition: color 0.2s ease;
    }
    
    .view-more:hover {
      color: #93c5fd;
    }
  `]
})
export class PortfolioWidgetComponent implements OnInit {
  @Input() data: PortfolioSummary = {
    total_value: 0,
    total_invested: 0,
    profit_loss: 0,
    profit_loss_percent: 0,
    assets_count: 0
  };

  ngOnInit() {
    // Données de test
    if (this.data.total_value === 0) {
      this.data = {
        total_value: 45230.50,
        total_invested: 40000,
        profit_loss: 5230.50,
        profit_loss_percent: 13.08,
        assets_count: 12
      };
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}

