import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PortfolioAsset {
  id: number;
  type: string;
  symbol?: string;
  name: string;
  quantity: number;
  purchase_price?: number;
  current_price?: number;
  currency: string;
  exchange?: string;
  notes?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTransaction {
  id: number;
  asset_id: number;
  type: string;
  quantity: number;
  price: number;
  date: string;
  fees: number;
  notes?: string;
  user_id: number;
  created_at: string;
}

export interface PortfolioPriceHistory {
  id: number;
  asset_id: number;
  price: number;
  date: string;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  total_pnl: number;
  pnl_percentage: number;
  asset_count: number;
  transaction_count: number;
  top_performers: Array<{
    asset_id: number;
    name: string;
    symbol?: string;
    current_value: number;
    invested_value: number;
    pnl: number;
    pnl_percentage: number;
  }>;
  worst_performers: Array<{
    asset_id: number;
    name: string;
    symbol?: string;
    current_value: number;
    invested_value: number;
    pnl: number;
    pnl_percentage: number;
  }>;
}

export interface PortfolioPerformance {
  period: string;
  start_value: number;
  end_value: number;
  pnl: number;
  pnl_percentage: number;
  daily_returns: Array<{
    date: string;
    value: number;
    return: number;
  }>;
}

export interface CreatePortfolioAssetRequest {
  type: string;
  symbol?: string;
  name: string;
  quantity?: number;
  purchase_price?: number;
  current_price?: number;
  currency?: string;
  exchange?: string;
  notes?: string;
}

export interface UpdatePortfolioAssetRequest {
  type?: string;
  symbol?: string;
  name?: string;
  quantity?: number;
  purchase_price?: number;
  current_price?: number;
  currency?: string;
  exchange?: string;
  notes?: string;
}

export interface CreatePortfolioTransactionRequest {
  asset_id: number;
  type: string;
  quantity: number;
  price: number;
  date: string;
  fees?: number;
  notes?: string;
}

export interface UpdatePortfolioTransactionRequest {
  type?: string;
  quantity?: number;
  price?: number;
  date?: string;
  fees?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioManagementService {
  private apiUrl = `${environment.apiUrl}/portfolio-management`;

  constructor(private http: HttpClient) {}

  // --- Assets ---
  createAsset(asset: CreatePortfolioAssetRequest): Observable<PortfolioAsset> {
    return this.http.post<PortfolioAsset>(`${this.apiUrl}/assets`, asset);
  }

  getAssets(assetType?: string): Observable<PortfolioAsset[]> {
    let params = new HttpParams();
    if (assetType) {
      params = params.set('asset_type', assetType);
    }
    return this.http.get<PortfolioAsset[]>(`${this.apiUrl}/assets`, { params });
  }

  getAsset(assetId: number): Observable<PortfolioAsset> {
    return this.http.get<PortfolioAsset>(`${this.apiUrl}/assets/${assetId}`);
  }

  updateAsset(assetId: number, asset: UpdatePortfolioAssetRequest): Observable<PortfolioAsset> {
    return this.http.patch<PortfolioAsset>(`${this.apiUrl}/assets/${assetId}`, asset);
  }

  deleteAsset(assetId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assets/${assetId}`);
  }

  updateAssetPrice(assetId: number): Observable<PortfolioAsset> {
    return this.http.post<PortfolioAsset>(`${this.apiUrl}/assets/${assetId}/update-price`, {});
  }

  // --- Transactions ---
  createTransaction(transaction: CreatePortfolioTransactionRequest): Observable<PortfolioTransaction> {
    return this.http.post<PortfolioTransaction>(`${this.apiUrl}/transactions`, transaction);
  }

  getTransactions(assetId?: number, limit: number = 50): Observable<PortfolioTransaction[]> {
    let params = new HttpParams();
    if (assetId) {
      params = params.set('asset_id', assetId.toString());
    }
    params = params.set('limit', limit.toString());
    return this.http.get<PortfolioTransaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  getTransaction(transactionId: number): Observable<PortfolioTransaction> {
    return this.http.get<PortfolioTransaction>(`${this.apiUrl}/transactions/${transactionId}`);
  }

  updateTransaction(transactionId: number, transaction: UpdatePortfolioTransactionRequest): Observable<PortfolioTransaction> {
    return this.http.patch<PortfolioTransaction>(`${this.apiUrl}/transactions/${transactionId}`, transaction);
  }

  deleteTransaction(transactionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${transactionId}`);
  }

  // --- Price History ---
  getPriceHistory(assetId: number, days: number = 30): Observable<PortfolioPriceHistory[]> {
    let params = new HttpParams();
    params = params.set('days', days.toString());
    return this.http.get<PortfolioPriceHistory[]>(`${this.apiUrl}/assets/${assetId}/price-history`, { params });
  }

  // --- Summary & Performance ---
  getPortfolioSummary(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(`${this.apiUrl}/summary`);
  }

  getPortfolioPerformance(days: number = 30): Observable<PortfolioPerformance> {
    let params = new HttpParams();
    params = params.set('days', days.toString());
    return this.http.get<PortfolioPerformance>(`${this.apiUrl}/performance`, { params });
  }

  // --- Bulk Operations ---
  updateAllPrices(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/update-all-prices`, {});
  }
}
