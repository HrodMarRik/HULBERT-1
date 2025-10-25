import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card weather-widget">
      <div class="widget-header">
        <div class="widget-icon">🌤️</div>
        <div class="widget-title">Météo</div>
        <div class="widget-value">{{ weather?.temperature || '--' }}°C</div>
      </div>
      
      <div class="widget-content">
        <div class="weather-main" *ngIf="weather">
          <div class="weather-condition">{{ weather.condition }}</div>
          <div class="weather-location">{{ weather.location }}</div>
          
          <div class="weather-details">
            <div class="detail-item">
              <span class="detail-icon">💧</span>
              <span class="detail-label">Humidité</span>
              <span class="detail-value">{{ weather.humidity }}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">💨</span>
              <span class="detail-label">Vent</span>
              <span class="detail-value">{{ weather.windSpeed }} km/h</span>
            </div>
          </div>
        </div>
        
        <div class="loading-state" *ngIf="loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">Chargement...</div>
        </div>
        
        <div class="error-state" *ngIf="error">
          <div class="error-icon">⚠️</div>
          <div class="error-text">{{ error }}</div>
          <button (click)="loadWeather()" class="retry-btn">Réessayer</button>
        </div>
        
        <div class="empty-state" *ngIf="!weather && !loading && !error">
          <div class="empty-icon">🌤️</div>
          <div class="empty-text">Données météo non disponibles</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <div class="last-update" *ngIf="lastUpdate">
          Mis à jour: {{ formatTime(lastUpdate) }}
        </div>
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
    
    .weather-main {
      text-align: center;
    }
    
    .weather-condition {
      font-size: 13px;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    
    .weather-location {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    
    .weather-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
    }
    
    .detail-icon {
      font-size: 16px;
      width: 20px;
    }
    
    .detail-label {
      font-size: 11px;
      color: #94a3b8;
      flex: 1;
    }
    
    .detail-value {
      font-size: 11px;
      font-weight: 600;
      color: #f1f5f9;
    }
    
    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 8px;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .loading-text, .error-text, .empty-text {
      font-size: 12px;
      color: #6b7280;
    }
    
    .error-icon, .empty-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .retry-btn {
      padding: 4px 8px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
      margin-top: 8px;
    }
    
    .retry-btn:hover {
      background: #dc2626;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 16px;
    }
    
    .last-update {
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
  `]
})
export class WeatherWidgetComponent implements OnInit {
  weather: WeatherData | null = null;
  loading = false;
  error: string | null = null;
  lastUpdate: Date | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadWeather();
  }

  loadWeather() {
    this.loading = true;
    this.error = null;

    // Simulation de données météo (en production, utiliser une vraie API)
    setTimeout(() => {
      this.weather = {
        temperature: Math.floor(Math.random() * 15) + 10, // 10-25°C
        condition: this.getRandomCondition(),
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        location: 'Paris, France'
      };
      this.loading = false;
      this.lastUpdate = new Date();
    }, 1000);
  }

  private getRandomCondition(): string {
    const conditions = [
      'Ensoleillé', 'Nuageux', 'Partiellement nuageux', 
      'Pluvieux', 'Orageux', 'Brumeux'
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
