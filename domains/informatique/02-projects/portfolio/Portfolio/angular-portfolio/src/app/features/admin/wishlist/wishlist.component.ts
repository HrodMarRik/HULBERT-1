import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface WishlistItem {
  id: string;
  name: string;
  description: string;
  url: string;
  targetPrice: number;
  currentPrice: number;
  currency: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'purchased' | 'archived';
  priceHistory: PriceHistory[];
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  store: string;
}

interface PriceHistory {
  price: number;
  date: Date;
  source: string;
}

interface PriceAlert {
  id: string;
  itemId: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wishlist-container">
      <div class="header">
        <h1>Wishlist & Suivi de Prix</h1>
        <p>Suivez les prix de vos produits favoris</p>
      </div>

      <div class="main-content">
        <!-- Filters and Actions -->
        <div class="controls-section">
          <div class="filters">
            <div class="filter-group">
              <label>Catégorie:</label>
              <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
                <option value="">Toutes</option>
                <option value="electronics">Électronique</option>
                <option value="books">Livres</option>
                <option value="clothing">Vêtements</option>
                <option value="home">Maison</option>
                <option value="sports">Sport</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Statut:</label>
              <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="purchased">Acheté</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Priorité:</label>
              <select [(ngModel)]="selectedPriority" (change)="applyFilters()">
                <option value="">Toutes</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary" (click)="addItem()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Ajouter un produit
            </button>
            <button class="btn btn-secondary" (click)="refreshPrices()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              Actualiser les prix
            </button>
          </div>
        </div>

        <!-- Price Alerts -->
        <div class="alerts-section" *ngIf="priceAlerts.length > 0">
          <h3>Alertes de Prix</h3>
          <div class="alerts-list">
            <div class="alert-item" *ngFor="let alert of priceAlerts">
              <div class="alert-info">
                <span class="alert-product">{{ getItemName(alert.itemId) }}</span>
                <span class="alert-price">{{ alert.targetPrice }}€</span>
              </div>
              <div class="alert-actions">
                <button class="btn-icon" (click)="toggleAlert(alert.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                  </svg>
                </button>
                <button class="btn-icon delete" (click)="deleteAlert(alert.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Grid -->
        <div class="items-grid">
          <div class="item-card" *ngFor="let item of filteredItems">
            <div class="item-image">
              <img [src]="item.imageUrl || '/assets/placeholder-product.png'" 
                   [alt]="item.name"
                   (error)="onImageError($event)">
            </div>
            
            <div class="item-content">
              <div class="item-header">
                <h3>{{ item.name }}</h3>
                <div class="item-actions">
                  <button class="btn-icon" (click)="editItem(item)" title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="deleteItem(item.id)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <p class="item-description">{{ item.description }}</p>
              
              <div class="item-meta">
                <span class="item-store">{{ item.store }}</span>
                <span class="item-category">{{ item.category }}</span>
                <span class="priority-badge" [class]="'priority-' + item.priority">
                  {{ getPriorityLabel(item.priority) }}
                </span>
              </div>

              <div class="price-section">
                <div class="price-current">
                  <span class="price-label">Prix actuel:</span>
                  <span class="price-value">{{ item.currentPrice }}€</span>
                </div>
                <div class="price-target">
                  <span class="price-label">Prix cible:</span>
                  <span class="price-value">{{ item.targetPrice }}€</span>
                </div>
                <div class="price-difference" [class]="getPriceDifferenceClass(item)">
                  {{ getPriceDifference(item) }}€
                </div>
              </div>

              <div class="item-actions-bottom">
                <button class="btn btn-primary" (click)="openProduct(item.url)">
                  Voir le produit
                </button>
                <button class="btn btn-secondary" (click)="markAsPurchased(item.id)">
                  Marquer comme acheté
                </button>
                <button class="btn btn-secondary" (click)="setPriceAlert(item)">
                  Alerte prix
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="filteredItems.length === 0">
          <div class="empty-icon">🛍️</div>
          <h3>Aucun produit trouvé</h3>
          <p>Ajoutez des produits à votre wishlist ou modifiez vos filtres.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wishlist-container {
      padding: 20px;
      background: #0f172a;
      min-height: 100vh;
      color: #f1f5f9;
    }

    .header {
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 28px;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .header p {
      color: #94a3b8;
      font-size: 16px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .controls-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      border-radius: 10px;
      padding: 20px;
    }

    .filters {
      display: flex;
      gap: 20px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .filter-group label {
      font-size: 12px;
      color: #94a3b8;
    }

    .filter-group select {
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: #f1f5f9;
      font-size: 14px;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #60a5fa;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #64748b;
      color: white;
    }

    .btn-secondary:hover {
      background: #475569;
    }

    .alerts-section {
      background: #1e293b;
      border-radius: 10px;
      padding: 20px;
    }

    .alerts-section h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin-bottom: 15px;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .alert-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #334155;
      padding: 12px 15px;
      border-radius: 6px;
    }

    .alert-info {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .alert-product {
      font-size: 14px;
      color: #f1f5f9;
    }

    .alert-price {
      font-size: 14px;
      color: #60a5fa;
      font-weight: 500;
    }

    .alert-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
    }

    .btn-icon.delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .item-card {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      overflow: hidden;
    }

    .item-image {
      height: 200px;
      overflow: hidden;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-content {
      padding: 20px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .item-header h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin: 0;
    }

    .item-actions {
      display: flex;
      gap: 8px;
    }

    .item-description {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .item-meta {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .item-store, .item-category {
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .priority-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .priority-high {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .priority-medium {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .priority-low {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .price-section {
      margin-bottom: 20px;
    }

    .price-current, .price-target {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .price-label {
      font-size: 14px;
      color: #94a3b8;
    }

    .price-value {
      font-size: 14px;
      color: #f1f5f9;
      font-weight: 500;
    }

    .price-difference {
      text-align: center;
      padding: 8px;
      border-radius: 6px;
      font-weight: 600;
    }

    .price-difference.positive {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .price-difference.negative {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .price-difference.neutral {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
    }

    .item-actions-bottom {
      display: flex;
      gap: 10px;
    }

    .item-actions-bottom .btn {
      flex: 1;
      justify-content: center;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      font-size: 20px;
      color: #f1f5f9;
      margin-bottom: 10px;
    }

    .empty-state p {
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .controls-section {
        flex-direction: column;
        gap: 20px;
      }
      
      .filters {
        flex-direction: column;
        gap: 15px;
      }
      
      .items-grid {
        grid-template-columns: 1fr;
      }
      
      .item-actions-bottom {
        flex-direction: column;
      }
    }
  `]
})
export class WishlistComponent implements OnInit {
  items: WishlistItem[] = [
    {
      id: '1',
      name: 'MacBook Pro 16"',
      description: 'MacBook Pro avec puce M2 Pro',
      url: 'https://apple.com/macbook-pro',
      targetPrice: 2500,
      currentPrice: 2799,
      currency: 'EUR',
      category: 'electronics',
      priority: 'high',
      status: 'active',
      priceHistory: [
        { price: 2799, date: new Date(), source: 'Apple Store' },
        { price: 2750, date: new Date(Date.now() - 86400000), source: 'Amazon' }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: 'https://via.placeholder.com/300x200',
      store: 'Apple'
    },
    {
      id: '2',
      name: 'Sony WH-1000XM5',
      description: 'Casque audio sans fil avec réduction de bruit',
      url: 'https://sony.com/wh-1000xm5',
      targetPrice: 300,
      currentPrice: 280,
      currency: 'EUR',
      category: 'electronics',
      priority: 'medium',
      status: 'active',
      priceHistory: [
        { price: 280, date: new Date(), source: 'Sony Store' },
        { price: 320, date: new Date(Date.now() - 172800000), source: 'FNAC' }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: 'https://via.placeholder.com/300x200',
      store: 'Sony'
    }
  ];

  priceAlerts: PriceAlert[] = [
    {
      id: '1',
      itemId: '1',
      targetPrice: 2500,
      isActive: true,
      createdAt: new Date()
    }
  ];

  filteredItems: WishlistItem[] = [];
  selectedCategory: string = '';
  selectedStatus: string = '';
  selectedPriority: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredItems = this.items.filter(item => {
      const categoryMatch = !this.selectedCategory || item.category === this.selectedCategory;
      const statusMatch = !this.selectedStatus || item.status === this.selectedStatus;
      const priorityMatch = !this.selectedPriority || item.priority === this.selectedPriority;
      
      return categoryMatch && statusMatch && priorityMatch;
    });
  }

  addItem() {
    // Implement add item functionality
    console.log('Add new item');
  }

  editItem(item: WishlistItem) {
    // Implement edit item functionality
    console.log('Edit item:', item);
  }

  deleteItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
    this.applyFilters();
  }

  refreshPrices() {
    // Implement price refresh functionality
    console.log('Refreshing prices');
  }

  openProduct(url: string) {
    window.open(url, '_blank');
  }

  markAsPurchased(id: string) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.status = 'purchased';
      this.applyFilters();
    }
  }

  setPriceAlert(item: WishlistItem) {
    const existingAlert = this.priceAlerts.find(alert => alert.itemId === item.id);
    if (!existingAlert) {
      const newAlert: PriceAlert = {
        id: Date.now().toString(),
        itemId: item.id,
        targetPrice: item.targetPrice,
        isActive: true,
        createdAt: new Date()
      };
      this.priceAlerts.push(newAlert);
    }
  }

  toggleAlert(alertId: string) {
    const alert = this.priceAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isActive = !alert.isActive;
    }
  }

  deleteAlert(alertId: string) {
    this.priceAlerts = this.priceAlerts.filter(a => a.id !== alertId);
  }

  getItemName(itemId: string): string {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.name : 'Produit inconnu';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Haute',
      'medium': 'Moyenne',
      'low': 'Basse'
    };
    return labels[priority] || priority;
  }

  getPriceDifference(item: WishlistItem): number {
    return item.targetPrice - item.currentPrice;
  }

  getPriceDifferenceClass(item: WishlistItem): string {
    const difference = this.getPriceDifference(item);
    if (difference > 0) return 'positive';
    if (difference < 0) return 'negative';
    return 'neutral';
  }

  onImageError(event: any) {
    event.target.src = '/assets/placeholder-product.png';
  }
}
