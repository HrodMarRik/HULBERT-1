import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface WishlistItem {
  id: number;
  name: string;
  current_price: number;
  target_price: number;
  price_reached: boolean;
}

@Component({
  selector: 'app-wishlist-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card wishlist-widget">
      <div class="widget-header">
        <div class="widget-icon">🎯</div>
        <div class="widget-title">Wishlist</div>
        <div class="widget-value" [class.alert]="getAlertsCount() > 0">
          {{ items.length }}
        </div>
      </div>
      
      <div class="widget-content">
        <div class="alerts-summary" *ngIf="getAlertsCount() > 0">
          <div class="alert-badge">
            <span class="alert-icon">🔔</span>
            <span class="alert-text">{{ getAlertsCount() }} prix atteint(s) !</span>
          </div>
        </div>
        
        <div class="items-list" *ngIf="items.length > 0">
          <div 
            class="item" 
            *ngFor="let item of items.slice(0, 3)"
            [class.price-reached]="item.price_reached"
          >
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-prices">
                <span class="current-price">{{ formatPrice(item.current_price) }}</span>
                <span class="price-separator">→</span>
                <span class="target-price">{{ formatPrice(item.target_price) }}</span>
              </div>
            </div>
            <div class="item-status">
              <span class="status-icon" *ngIf="item.price_reached">✓</span>
              <span class="status-icon waiting" *ngIf="!item.price_reached">⏱️</span>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="items.length === 0">
          <div class="empty-icon">🎯</div>
          <div class="empty-text">Aucun article dans la wishlist</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/wishlist" class="view-more">Voir la wishlist →</a>
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
    
    .widget-value.alert {
      color: #fbbf24;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .alerts-summary {
      margin-bottom: 12px;
    }
    
    .alert-badge {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 6px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .alert-icon {
      font-size: 16px;
    }
    
    .alert-text {
      font-size: 12px;
      color: #fbbf24;
      font-weight: 600;
    }
    
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      background: #334155;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      transition: all 0.2s ease;
    }
    
    .item:hover {
      background: #3f4d61;
      border-color: rgba(96, 165, 250, 0.3);
    }
    
    .item.price-reached {
      background: rgba(251, 191, 36, 0.1);
      border-color: rgba(251, 191, 36, 0.3);
    }
    
    .item-info {
      flex: 1;
    }
    
    .item-name {
      font-size: 12px;
      color: #f1f5f9;
      font-weight: 500;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .item-prices {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
    }
    
    .current-price {
      color: #94a3b8;
      font-weight: 600;
    }
    
    .price-separator {
      color: #64748b;
    }
    
    .target-price {
      color: #fbbf24;
      font-weight: 600;
    }
    
    .item-status {
      font-size: 18px;
    }
    
    .status-icon.waiting {
      opacity: 0.5;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 20px;
      text-align: center;
    }
    
    .empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
      opacity: 0.5;
    }
    
    .empty-text {
      font-size: 12px;
      color: #94a3b8;
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
export class WishlistWidgetComponent implements OnInit {
  @Input() items: WishlistItem[] = [];

  ngOnInit() {
    // Données de test
    if (this.items.length === 0) {
      this.items = [
        {
          id: 1,
          name: 'MacBook Pro M3',
          current_price: 2199,
          target_price: 1999,
          price_reached: false
        },
        {
          id: 2,
          name: 'Sony WH-1000XM5',
          current_price: 329,
          target_price: 350,
          price_reached: true
        },
        {
          id: 3,
          name: 'iPad Air',
          current_price: 699,
          target_price: 599,
          price_reached: false
        },
        {
          id: 4,
          name: 'AirPods Pro 2',
          current_price: 249,
          target_price: 279,
          price_reached: true
        }
      ];
    }
  }

  getAlertsCount(): number {
    return this.items.filter(item => item.price_reached).length;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}

