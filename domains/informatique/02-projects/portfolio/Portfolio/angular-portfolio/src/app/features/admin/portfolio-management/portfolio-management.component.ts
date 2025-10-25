import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PortfolioManagementService, PortfolioAsset, PortfolioTransaction, PortfolioSummary, PortfolioPerformance } from '@core/services/portfolio-management.service';

@Component({
  selector: 'app-portfolio-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="portfolio-management">
      <!-- Header -->
      <div class="portfolio-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">💰</span>
            Gestion Portefeuille
          </h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="showAddAssetModal = true">
              <span class="btn-icon">➕</span>
              Ajouter un actif
            </button>
            <button class="btn btn-secondary" (click)="updateAllPrices()" [disabled]="isUpdatingPrices">
              <span class="btn-icon" [class.spinning]="isUpdatingPrices">🔄</span>
              Actualiser les prix
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid" *ngIf="summary">
        <div class="summary-card total-value">
          <div class="card-icon">💎</div>
          <div class="card-content">
            <div class="card-value">{{ formatCurrency(summary.total_value) }}</div>
            <div class="card-label">Valeur totale</div>
          </div>
        </div>
        <div class="summary-card invested">
          <div class="card-icon">💼</div>
          <div class="card-content">
            <div class="card-value">{{ formatCurrency(summary.total_invested) }}</div>
            <div class="card-label">Investi</div>
          </div>
        </div>
        <div class="summary-card pnl" [class.positive]="summary.total_pnl >= 0" [class.negative]="summary.total_pnl < 0">
          <div class="card-icon">{{ summary.total_pnl >= 0 ? '📈' : '📉' }}</div>
          <div class="card-content">
            <div class="card-value">{{ formatCurrency(summary.total_pnl) }}</div>
            <div class="card-label">{{ summary.pnl_percentage.toFixed(2) }}% P&L</div>
          </div>
        </div>
        <div class="summary-card assets">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-value">{{ summary.asset_count }}</div>
            <div class="card-label">Actifs</div>
          </div>
        </div>
      </div>

      <!-- Performance Chart Placeholder -->
      <div class="chart-section">
        <div class="chart-header">
          <h2>Performance du portefeuille</h2>
          <div class="chart-controls">
            <select [(ngModel)]="selectedPeriod" (change)="loadPerformance()">
              <option value="7">7 jours</option>
              <option value="30" selected>30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-placeholder" *ngIf="!performance">
            <div class="placeholder-icon">📈</div>
            <div class="placeholder-text">Chargement des données de performance...</div>
          </div>
          <div class="performance-summary" *ngIf="performance">
            <div class="performance-item">
              <span class="performance-label">Période:</span>
              <span class="performance-value">{{ performance.period }}</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">Valeur de départ:</span>
              <span class="performance-value">{{ formatCurrency(performance.start_value) }}</span>
            </div>
            <div class="performance-item">
              <span class="performance-label">Valeur actuelle:</span>
              <span class="performance-value">{{ formatCurrency(performance.end_value) }}</span>
            </div>
            <div class="performance-item" [class.positive]="performance.pnl >= 0" [class.negative]="performance.pnl < 0">
              <span class="performance-label">P&L:</span>
              <span class="performance-value">{{ formatCurrency(performance.pnl) }} ({{ performance.pnl_percentage.toFixed(2) }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Assets List -->
      <div class="assets-section">
        <div class="section-header">
          <h2>Actifs du portefeuille</h2>
          <div class="section-actions">
            <select [(ngModel)]="filterType" (change)="applyFilters()">
              <option value="">Tous les types</option>
              <option value="stock">Actions</option>
              <option value="crypto">Crypto</option>
              <option value="etf">ETF</option>
              <option value="bond">Obligations</option>
              <option value="real_estate">Immobilier</option>
              <option value="commodity">Matières premières</option>
            </select>
            <button class="btn btn-sm" (click)="refreshAllPrices()" [disabled]="isUpdatingPrices">
              <span class="btn-icon" [class.spinning]="isUpdatingPrices">🔄</span>
              Actualiser tous
            </button>
          </div>
        </div>

        <div class="assets-list">
          <div 
            class="asset-item" 
            *ngFor="let asset of filteredAssets"
            [class.positive-pnl]="getAssetPnL(asset) >= 0"
            [class.negative-pnl]="getAssetPnL(asset) < 0">
            
            <div class="asset-info">
              <div class="asset-header">
                <h3 class="asset-name">{{ asset.name }}</h3>
                <span class="asset-symbol" *ngIf="asset.symbol">{{ asset.symbol }}</span>
                <span class="asset-type">{{ getAssetTypeLabel(asset.type) }}</span>
              </div>
              <div class="asset-details">
                <div class="asset-quantity">{{ asset.quantity }} unités</div>
                <div class="asset-price" *ngIf="asset.current_price">
                  Prix actuel: {{ formatCurrency(asset.current_price) }}
                </div>
                <div class="asset-purchase" *ngIf="asset.purchase_price">
                  Prix d'achat: {{ formatCurrency(asset.purchase_price) }}
                </div>
              </div>
              <div class="asset-pnl" *ngIf="asset.current_price && asset.purchase_price">
                <span class="pnl-label">P&L:</span>
                <span class="pnl-value" [class.positive]="getAssetPnL(asset) >= 0" [class.negative]="getAssetPnL(asset) < 0">
                  {{ formatCurrency(getAssetPnL(asset)) }} ({{ getAssetPnLPercentage(asset).toFixed(2) }}%)
                </span>
              </div>
            </div>

            <div class="asset-actions">
              <button 
                class="btn-icon" 
                (click)="updateAssetPrice(asset.id)"
                [disabled]="isUpdatingPrices"
                title="Actualiser le prix">
                🔄
              </button>
              <button 
                class="btn-icon" 
                (click)="showAddTransactionModal(asset)"
                title="Ajouter une transaction">
                ➕
              </button>
              <button 
                class="btn-icon" 
                (click)="editAsset(asset)"
                title="Modifier">
                ✏️
              </button>
              <button 
                class="btn-icon delete" 
                (click)="deleteAsset(asset.id)"
                title="Supprimer">
                🗑️
              </button>
            </div>
          </div>

          <div class="empty-state" *ngIf="filteredAssets.length === 0">
            <div class="empty-icon">💰</div>
            <div class="empty-text">Aucun actif dans le portefeuille</div>
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="performers-section" *ngIf="summary && (summary.top_performers.length > 0 || summary.worst_performers.length > 0)">
        <div class="performers-grid">
          <div class="performers-card" *ngIf="summary.top_performers.length > 0">
            <h3>🏆 Meilleurs performers</h3>
            <div class="performers-list">
              <div class="performer-item" *ngFor="let performer of summary.top_performers">
                <div class="performer-name">{{ performer.name }}</div>
                <div class="performer-pnl positive">{{ formatCurrency(performer.pnl) }} ({{ performer.pnl_percentage.toFixed(2) }}%)</div>
              </div>
            </div>
          </div>
          
          <div class="performers-card" *ngIf="summary.worst_performers.length > 0">
            <h3>📉 Moins bons performers</h3>
            <div class="performers-list">
              <div class="performer-item" *ngFor="let performer of summary.worst_performers">
                <div class="performer-name">{{ performer.name }}</div>
                <div class="performer-pnl negative">{{ formatCurrency(performer.pnl) }} ({{ performer.pnl_percentage.toFixed(2) }}%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Asset Modal -->
      <div class="modal-overlay" *ngIf="showAddAssetModal" (click)="closeAddAssetModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ajouter un actif</h2>
            <button class="btn-icon" (click)="closeAddAssetModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="addAsset()" #assetForm="ngForm">
              <div class="form-group">
                <label for="type">Type d'actif *</label>
                <select id="type" name="type" [(ngModel)]="newAsset.type" required class="form-select">
                  <option value="">Sélectionner un type</option>
                  <option value="stock">Action</option>
                  <option value="crypto">Cryptomonnaie</option>
                  <option value="etf">ETF</option>
                  <option value="bond">Obligation</option>
                  <option value="real_estate">Immobilier</option>
                  <option value="commodity">Matière première</option>
                </select>
              </div>
              <div class="form-group">
                <label for="name">Nom de l'actif *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="newAsset.name" 
                  required 
                  class="form-input"
                  placeholder="Ex: Apple Inc.">
              </div>
              <div class="form-group">
                <label for="symbol">Symbole (optionnel)</label>
                <input 
                  type="text" 
                  id="symbol" 
                  name="symbol" 
                  [(ngModel)]="newAsset.symbol" 
                  class="form-input"
                  placeholder="Ex: AAPL">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="quantity">Quantité</label>
                  <input 
                    type="number" 
                    id="quantity" 
                    name="quantity" 
                    [(ngModel)]="newAsset.quantity" 
                    step="0.000001"
                    class="form-input"
                    placeholder="0">
                </div>
                <div class="form-group">
                  <label for="currency">Devise</label>
                  <select id="currency" name="currency" [(ngModel)]="newAsset.currency" class="form-select">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="purchase_price">Prix d'achat</label>
                  <input 
                    type="number" 
                    id="purchase_price" 
                    name="purchase_price" 
                    [(ngModel)]="newAsset.purchase_price" 
                    step="0.01"
                    class="form-input"
                    placeholder="0.00">
                </div>
                <div class="form-group">
                  <label for="current_price">Prix actuel</label>
                  <input 
                    type="number" 
                    id="current_price" 
                    name="current_price" 
                    [(ngModel)]="newAsset.current_price" 
                    step="0.01"
                    class="form-input"
                    placeholder="0.00">
                </div>
              </div>
              <div class="form-group">
                <label for="exchange">Bourse (optionnel)</label>
                <input 
                  type="text" 
                  id="exchange" 
                  name="exchange" 
                  [(ngModel)]="newAsset.exchange" 
                  class="form-input"
                  placeholder="Ex: NASDAQ">
              </div>
              <div class="form-group">
                <label for="notes">Notes (optionnel)</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  [(ngModel)]="newAsset.notes" 
                  class="form-textarea"
                  placeholder="Notes sur cet actif"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeAddAssetModal()">
                Annuler
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                (click)="addAsset()"
                [disabled]="!assetForm.form.valid || isAddingAsset">
                {{ isAddingAsset ? 'Ajout en cours...' : 'Ajouter l\'actif' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-management {
      min-height: 100vh;
      background: #0f172a;
      color: #f1f5f9;
    }

    .portfolio-header {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 20px 0;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .title-icon {
      font-size: 1.5em;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .summary-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .summary-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .summary-card.positive {
      border-color: #10b981;
    }

    .summary-card.negative {
      border-color: #ef4444;
    }

    .card-icon {
      font-size: 2rem;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #60a5fa;
    }

    .summary-card.positive .card-value {
      color: #10b981;
    }

    .summary-card.negative .card-value {
      color: #ef4444;
    }

    .card-label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .chart-section {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      margin-bottom: 30px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #334155;
    }

    .chart-header h2 {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
    }

    .chart-controls select {
      background: #334155;
      border: 1px solid #475569;
      color: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .chart-container {
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-placeholder {
      text-align: center;
      color: #94a3b8;
    }

    .placeholder-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .placeholder-text {
      font-size: 1.1rem;
    }

    .performance-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      width: 100%;
    }

    .performance-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .performance-label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .performance-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f1f5f9;
    }

    .performance-item.positive .performance-value {
      color: #10b981;
    }

    .performance-item.negative .performance-value {
      color: #ef4444;
    }

    .assets-section {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      margin-bottom: 30px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #334155;
    }

    .section-header h2 {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
    }

    .section-actions {
      display: flex;
      gap: 12px;
    }

    .section-actions select {
      background: #334155;
      border: 1px solid #475569;
      color: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .assets-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .asset-item {
      background: #334155;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      transition: all 0.2s ease;
    }

    .asset-item:hover {
      background: #475569;
    }

    .asset-item.positive-pnl {
      border-color: #10b981;
    }

    .asset-item.negative-pnl {
      border-color: #ef4444;
    }

    .asset-info {
      flex: 1;
    }

    .asset-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .asset-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .asset-symbol {
      background: #1e3a5f;
      color: #60a5fa;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .asset-type {
      background: #374151;
      color: #d1d5db;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .asset-details {
      display: flex;
      gap: 20px;
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: #cbd5e1;
    }

    .asset-pnl {
      font-size: 0.9rem;
    }

    .pnl-label {
      color: #94a3b8;
      margin-right: 8px;
    }

    .pnl-value.positive {
      color: #10b981;
      font-weight: 600;
    }

    .pnl-value.negative {
      color: #ef4444;
      font-weight: 600;
    }

    .asset-actions {
      display: flex;
      gap: 8px;
    }

    .performers-section {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .performers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .performers-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
    }

    .performers-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .performers-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .performer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #334155;
    }

    .performer-item:last-child {
      border-bottom: none;
    }

    .performer-name {
      font-weight: 500;
    }

    .performer-pnl.positive {
      color: #10b981;
      font-weight: 600;
    }

    .performer-pnl.negative {
      color: #ef4444;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 1.1rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.3rem;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #334155;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f1f5f9;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 12px;
      background: #334155;
      border: 1px solid #475569;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 14px;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    /* Button Styles */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
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
      background: #334155;
      color: #f1f5f9;
    }

    .btn-icon.delete:hover {
      color: #ef4444;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .section-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      
      .section-actions {
        justify-content: center;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .asset-item {
        flex-direction: column;
        gap: 16px;
      }
      
      .asset-actions {
        justify-content: center;
      }
    }
  `]
})
export class PortfolioManagementComponent implements OnInit {
  assets: PortfolioAsset[] = [];
  filteredAssets: PortfolioAsset[] = [];
  transactions: PortfolioTransaction[] = [];
  summary: PortfolioSummary | null = null;
  performance: PortfolioPerformance | null = null;
  
  showAddAssetModal = false;
  isAddingAsset = false;
  isUpdatingPrices = false;
  
  filterType = '';
  selectedPeriod = '30';
  
  newAsset = {
    type: '',
    symbol: '',
    name: '',
    quantity: 0,
    purchase_price: 0,
    current_price: 0,
    currency: 'EUR',
    exchange: '',
    notes: ''
  };

  private portfolioService = inject(PortfolioManagementService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadAssets();
    this.loadSummary();
    this.loadPerformance();
  }

  loadAssets() {
    this.portfolioService.getAssets().subscribe({
      next: (assets) => {
        this.assets = assets;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading assets:', error);
      }
    });
  }

  loadSummary() {
    this.portfolioService.getPortfolioSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (error) => {
        console.error('Error loading summary:', error);
      }
    });
  }

  loadPerformance() {
    this.portfolioService.getPortfolioPerformance(parseInt(this.selectedPeriod)).subscribe({
      next: (performance) => {
        this.performance = performance;
      },
      error: (error) => {
        console.error('Error loading performance:', error);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.assets];
    
    if (this.filterType) {
      filtered = filtered.filter(asset => asset.type === this.filterType);
    }
    
    this.filteredAssets = filtered;
  }

  getAssetPnL(asset: PortfolioAsset): number {
    if (!asset.current_price || !asset.purchase_price) return 0;
    return (asset.current_price - asset.purchase_price) * asset.quantity;
  }

  getAssetPnLPercentage(asset: PortfolioAsset): number {
    if (!asset.current_price || !asset.purchase_price) return 0;
    return ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
  }

  getAssetTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'stock': 'Action',
      'crypto': 'Crypto',
      'etf': 'ETF',
      'bond': 'Obligation',
      'real_estate': 'Immobilier',
      'commodity': 'Matière première'
    };
    return labels[type] || type;
  }

  updateAssetPrice(assetId: number) {
    this.isUpdatingPrices = true;
    this.portfolioService.updateAssetPrice(assetId).subscribe({
      next: (asset) => {
        const index = this.assets.findIndex(a => a.id === assetId);
        if (index !== -1) {
          this.assets[index] = asset;
          this.applyFilters();
        }
        this.loadSummary();
        this.isUpdatingPrices = false;
      },
      error: (error) => {
        console.error('Error updating asset price:', error);
        this.isUpdatingPrices = false;
      }
    });
  }

  updateAllPrices() {
    this.isUpdatingPrices = true;
    this.portfolioService.updateAllPrices().subscribe({
      next: () => {
        this.loadAssets();
        this.loadSummary();
        this.isUpdatingPrices = false;
      },
      error: (error) => {
        console.error('Error updating all prices:', error);
        this.isUpdatingPrices = false;
      }
    });
  }

  refreshAllPrices() {
    this.updateAllPrices();
  }

  addAsset() {
    if (!this.newAsset.type || !this.newAsset.name) return;
    
    this.isAddingAsset = true;
    this.portfolioService.createAsset(this.newAsset).subscribe({
      next: (asset) => {
        this.assets.unshift(asset);
        this.applyFilters();
        this.closeAddAssetModal();
        this.loadSummary();
        this.isAddingAsset = false;
      },
      error: (error) => {
        console.error('Error adding asset:', error);
        this.isAddingAsset = false;
      }
    });
  }

  editAsset(asset: PortfolioAsset) {
    // Implementation for editing asset
    console.log('Edit asset:', asset);
  }

  deleteAsset(assetId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet actif ?')) return;
    
    this.portfolioService.deleteAsset(assetId).subscribe({
      next: () => {
        this.assets = this.assets.filter(a => a.id !== assetId);
        this.applyFilters();
        this.loadSummary();
      },
      error: (error) => {
        console.error('Error deleting asset:', error);
      }
    });
  }

  showAddTransactionModal(asset: PortfolioAsset) {
    // Implementation for adding transaction
    console.log('Add transaction for asset:', asset);
  }

  closeAddAssetModal() {
    this.showAddAssetModal = false;
    this.newAsset = {
      type: '',
      symbol: '',
      name: '',
      quantity: 0,
      purchase_price: 0,
      current_price: 0,
      currency: 'EUR',
      exchange: '',
      notes: ''
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }
}
