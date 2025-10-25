import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface LogFile {
  filename: string;
  readable_name: string;
  description: string;
  size: number;
  modified: string;
  type: string;
  date: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  request_id?: string;
}

interface LogStats {
  total_files: number;
  total_size: number;
  last_modified: string;
}

@Component({
  selector: 'app-logs-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="logs-viewer">
      <!-- Header -->
      <div class="logs-header">
        <div class="header-content">
          <h1>Système de Logs</h1>
          <p class="header-subtitle">Surveillance et debugging en temps réel</p>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="refreshLogs()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
            Actualiser
          </button>
          <button class="action-btn danger" (click)="clearOldLogs()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
            </svg>
            Nettoyer
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="logs-content">

      <!-- Stats Cards -->
      <div class="stats-container-compact" *ngIf="stats">
        <div class="stats-block-compact">
          <h3 class="block-title-compact">Statistiques</h3>
          <div class="stats-grid-compact">
            <div class="stat-card-compact">
              <div class="stat-icon-compact files">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ stats.total_files }}</div>
                <div class="stat-label-compact">Fichiers</div>
              </div>
            </div>
            <div class="stat-card-compact">
              <div class="stat-icon-compact size">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ formatFileSize(stats.total_size) }}</div>
                <div class="stat-label-compact">Taille</div>
              </div>
            </div>
            <div class="stat-card-compact">
              <div class="stat-icon-compact open">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getTotalActivity() }}</div>
                <div class="stat-label-compact">Activité</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres Avancés -->
      <div class="filters-section">
        <h2>🔍 Filtres Avancés</h2>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Type de Log</label>
            <select [(ngModel)]="selectedLogType" (change)="applyFilters()">
              <option value="">Tous les types</option>
              <option value="api">🌐 API</option>
              <option value="accounting">💰 Comptabilité</option>
              <option value="payroll">👥 Paie</option>
              <option value="invoicing">📄 Facturation</option>
              <option value="social">🏛️ Déclarations Sociales</option>
              <option value="errors">❌ Erreurs</option>
              <option value="debug">🔍 Debug</option>
              <option value="general">📝 Généraux</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Taille minimale</label>
            <select [(ngModel)]="minSizeFilter" (change)="applyFilters()">
              <option value="">Toutes tailles</option>
              <option value="1024">1 KB+</option>
              <option value="10240">10 KB+</option>
              <option value="102400">100 KB+</option>
              <option value="1048576">1 MB+</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Période</label>
            <select [(ngModel)]="dateFilter" (change)="applyFilters()">
              <option value="">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="older">Plus ancien</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Recherche</label>
            <input 
              type="text" 
              [(ngModel)]="searchFilter" 
              (input)="applyFilters()"
              placeholder="Nom de fichier ou description..."
              class="search-input">
          </div>
        </div>
        
        <div class="filter-actions">
          <button class="action-btn secondary" (click)="clearFilters()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
            Effacer filtres
          </button>
          <span class="filter-count">{{ filteredLogFiles.length }} fichier(s) trouvé(s)</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls-section" *ngIf="selectedFile">
        <h2>Contrôles de Logs</h2>
        <div class="controls-row">
          <div class="control-group">
            <label>Fichier de log:</label>
            <select [(ngModel)]="selectedFile" (change)="onFileChange()">
              <option value="">Sélectionner un fichier</option>
              <option *ngFor="let file of filteredLogFiles" [value]="file.filename">
                {{ file.readable_name }} ({{ formatFileSize(file.size) }})
              </option>
            </select>
          </div>
          
          <div class="control-group">
            <label>Niveau:</label>
            <select [(ngModel)]="selectedLevel" (change)="loadLogEntries()">
              <option value="">Tous</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          
          <div class="control-group">
            <label>Module:</label>
            <input type="text" [(ngModel)]="selectedModule" (input)="loadLogEntries()" placeholder="Filtrer par module">
          </div>
        </div>
        
        <div class="controls-row">
          <div class="control-group">
            <label>Recherche:</label>
            <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Rechercher dans les logs">
          </div>
        </div>
      </div>

      <!-- Files Grid -->
      <div class="files-section" *ngIf="!selectedFile">
        <h2>Fichiers de Logs Disponibles</h2>
        <div class="files-grid">
          <div *ngFor="let file of filteredLogFiles" class="file-card" [attr.data-type]="file.type" (click)="selectFile(file)">
            <div class="file-icon">{{ getFileIcon(file.type) }}</div>
            <div class="file-content">
              <h3>{{ file.readable_name }}</h3>
              <p class="file-description">{{ file.description }}</p>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-date">{{ formatDate(file.modified) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div *ngIf="filteredLogFiles.length === 0" class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>Aucun fichier trouvé</h3>
          <p>Essayez de modifier vos filtres pour voir plus de résultats.</p>
        </div>
      </div>

      <!-- Log Entries -->
      <div class="entries-section" *ngIf="selectedFile">
        <div class="entries-header">
          <h2>Logs: {{ getSelectedFileReadableName() }}</h2>
          <div class="entries-info">
            <span>{{ logEntries.length }} entrées</span>
            <span *ngIf="hasMore">({{ totalEntries }} au total)</span>
          </div>
        </div>
        
        <div class="entries-list">
          <div *ngFor="let entry of logEntries" class="log-entry" [class]="'level-' + entry.level.toLowerCase()">
            <div class="entry-header">
              <span class="timestamp">{{ entry.timestamp }}</span>
              <span class="level">{{ entry.level }}</span>
              <span class="module">{{ entry.module }}</span>
              <span *ngIf="entry.request_id" class="request-id">[{{ entry.request_id }}]</span>
            </div>
            <div class="entry-message">{{ entry.message }}</div>
          </div>
        </div>
        
        <div class="pagination" *ngIf="hasMore">
          <button (click)="loadMore()">Charger plus</button>
        </div>
      </div>

      <!-- Search Results -->
      <div class="search-results" *ngIf="searchResults.length > 0">
        <h2>Résultats de recherche: "{{ searchQuery }}"</h2>
        <div class="search-info">{{ searchResults.length }} résultats trouvés</div>
        
        <div class="search-entries">
          <div *ngFor="let result of searchResults" class="search-entry" [class]="'level-' + result.level.toLowerCase()">
            <div class="search-header">
              <span class="file">{{ result.file }}</span>
              <span class="timestamp">{{ result.timestamp }}</span>
              <span class="level">{{ result.level }}</span>
              <span class="module">{{ result.module }}</span>
            </div>
            <div class="search-message">{{ result.message }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logs-viewer {
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .logs-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px 24px 24px;
      background: #1a1a1a;
    }

    .logs-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border-radius: 0 0 12px 12px;
      margin-bottom: 20px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #fff;
    }

    .header-subtitle {
      margin: 0;
      color: #888;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn:hover {
      background: #505050;
      transform: translateY(-1px);
    }

    .action-btn.primary {
      background: #007acc;
      color: white;
    }

    .action-btn.primary:hover {
      background: #005a9e;
    }

    .action-btn.secondary {
      background: #666;
    }

    .action-btn.secondary:hover {
      background: #777;
    }

    .action-btn.danger {
      background: #dc3545;
      color: white;
    }

    .action-btn.danger:hover {
      background: #c82333;
    }

    /* Compact Stats Layout */
    .stats-container-compact {
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .stats-block-compact {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      flex: 1;
      min-width: 200px;
    }
    
    .block-title-compact {
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #404040;
      padding-bottom: 4px;
    }
    
    .stats-grid-compact {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
    }
    
    .stat-card-compact {
      background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
      border-radius: 6px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
      border: 1px solid #404040;
      cursor: pointer;
    }
    
    .stat-card-compact:hover {
      background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .stat-icon-compact {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-content-compact {
      text-align: center;
    }
    
    .stat-number-compact {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }
    
    .stat-label-compact {
      font-size: 9px;
      color: #ccc;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    /* Priority Colors for Compact Stats */
    .stat-icon-compact.files { background: #4caf50; color: #fff; }
    .stat-icon-compact.size { background: #ffc107; color: #000; }
    .stat-icon-compact.open { background: #2196f3; color: #fff; }

    /* Filtres */
    .filters-section {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .filters-section h2 {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-group label {
      color: #ccc;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-group select,
    .filter-group input {
      background: #3a3a3a;
      border: 1px solid #404040;
      border-radius: 6px;
      color: #e0e0e0;
      padding: 8px 12px;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    .filter-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #404040;
    }

    .filter-count {
      color: #888;
      font-size: 12px;
      background: #3a3a3a;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #404040;
    }

    /* Contrôles de logs - Section améliorée */
    .controls-section {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .controls-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .controls-row:last-child {
      margin-bottom: 0;
    }

    .control-group {
      display: flex;
      flex-direction: column;
    }

    .control-group label {
      color: #ccc;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .control-group select,
    .control-group input {
      background: #3a3a3a;
      border: 1px solid #404040;
      border-radius: 6px;
      color: #e0e0e0;
      padding: 10px 12px;
      font-size: 14px;
      transition: all 0.2s ease;
      width: 100%;
    }

    .control-group select:focus,
    .control-group input:focus {
      outline: none;
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
      background: #404040;
    }

    .control-group select:hover,
    .control-group input:hover {
      border-color: #555;
    }

    /* Grille de fichiers */
    .files-section {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .files-section h2 {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
    }

    .file-card {
      background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #404040;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .file-card:hover {
      background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .file-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .file-content h3 {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .file-description {
      color: #ccc;
      font-size: 12px;
      margin: 0 0 8px 0;
    }

    .file-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #888;
    }

    .file-meta span {
      background: #3a3a3a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #404040;
    }

    /* Section des entrées de logs */
    .entries-section {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .entries-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #404040;
    }

    .entries-header h2 {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .entries-info {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #888;
    }

    .entries-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .log-entry {
      background: linear-gradient(135deg, rgba(58, 58, 58, 0.8) 0%, rgba(45, 45, 45, 0.8) 100%);
      border-radius: 6px;
      padding: 12px;
      border: 1px solid rgba(64, 64, 64, 0.4);
      transition: all 0.2s ease;
    }

    .log-entry:hover {
      background: linear-gradient(135deg, rgba(74, 74, 74, 0.9) 0%, rgba(58, 58, 58, 0.9) 100%);
      transform: translateX(4px);
      border-color: rgba(64, 64, 64, 0.6);
    }

    .entry-header {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .timestamp, .level, .module, .request-id {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(58, 58, 58, 0.6);
      border: 1px solid rgba(64, 64, 64, 0.5);
      color: #b0b0b0;
    }

    .level {
      font-weight: 600;
      text-transform: uppercase;
    }

    .level-error { 
      background: rgba(220, 53, 69, 0.15);
      color: #e57373;
      border-color: rgba(220, 53, 69, 0.3);
    }
    .level-warning { 
      background: rgba(255, 193, 7, 0.15);
      color: #ffb74d;
      border-color: rgba(255, 193, 7, 0.3);
    }
    .level-info { 
      background: rgba(23, 162, 184, 0.15);
      color: #4fc3f7;
      border-color: rgba(23, 162, 184, 0.3);
    }
    .level-debug { 
      background: rgba(108, 117, 125, 0.15);
      color: #90a4ae;
      border-color: rgba(108, 117, 125, 0.3);
    }

    .entry-message {
      color: #d0d0d0;
      font-size: 12px;
      line-height: 1.4;
      font-family: 'Courier New', monospace;
      background: rgba(26, 26, 26, 0.8);
      padding: 8px;
      border-radius: 4px;
      border: 1px solid rgba(64, 64, 64, 0.3);
    }

    /* Résultats vides */
    .no-results {
      text-align: center;
      padding: 40px 20px;
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
    }

    .no-results-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-results h3 {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .no-results p {
      color: #888;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .logs-header {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .header-actions {
        flex-direction: column;
        gap: 8px;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .files-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid-compact {
        grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      }

      .entry-header {
        flex-direction: column;
        gap: 4px;
      }
    }
  `]
})
export class LogsViewerComponent implements OnInit {
  logFiles: LogFile[] = [];
  filteredLogFiles: LogFile[] = [];
  selectedFile: string = '';
  selectedLevel: string = '';
  selectedModule: string = '';
  searchQuery: string = '';
  
  // Nouveaux filtres
  selectedLogType: string = '';
  minSizeFilter: string = '';
  dateFilter: string = '';
  searchFilter: string = '';
  
  logEntries: LogEntry[] = [];
  searchResults: any[] = [];
  stats: LogStats | null = null;
  
  totalEntries = 0;
  hasMore = false;
  currentOffset = 0;
  limit = 100;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLogFiles();
    this.loadStats();
  }

  loadLogFiles() {
    this.http.get<{files: LogFile[]}>('http://localhost:8000/api/logs/files').subscribe({
      next: (response) => {
        this.logFiles = response.files;
        this.applyFilters(); // Appliquer les filtres après le chargement
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fichiers:', error);
      }
    });
  }

  loadStats() {
    this.http.get<{stats: LogStats}>('http://localhost:8000/api/logs/stats').subscribe({
      next: (response) => {
        this.stats = response.stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  selectFile(file: LogFile) {
    this.selectedFile = file.filename;
    this.loadLogEntries();
  }

  onFileChange() {
    this.currentOffset = 0;
    this.loadLogEntries();
  }

  loadLogEntries() {
    if (!this.selectedFile) return;

    const params: any = {
      file: this.selectedFile,
      limit: this.limit,
      offset: this.currentOffset
    };

    if (this.selectedLevel) params.level = this.selectedLevel;
    if (this.selectedModule) params.module = this.selectedModule;

    this.http.get<any>('http://localhost:8000/api/logs/entries', { params }).subscribe({
      next: (response) => {
        if (this.currentOffset === 0) {
          this.logEntries = response.entries;
        } else {
          this.logEntries.push(...response.entries);
        }
        this.totalEntries = response.total;
        this.hasMore = response.has_more;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des entrées:', error);
      }
    });
  }

  loadMore() {
    this.currentOffset += this.limit;
    this.loadLogEntries();
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.http.get<any>('http://localhost:8000/api/logs/search', {
      params: { q: this.searchQuery }
    }).subscribe({
      next: (response) => {
        this.searchResults = response.results;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche:', error);
      }
    });
  }

  // Méthodes pour les nouveaux filtres
  applyFilters() {
    this.filteredLogFiles = this.logFiles.filter(file => {
      // Filtre par type
      if (this.selectedLogType && file.type !== this.selectedLogType) {
        return false;
      }
      
      // Filtre par taille minimale
      if (this.minSizeFilter && file.size < parseInt(this.minSizeFilter)) {
        return false;
      }
      
      // Filtre par date
      if (this.dateFilter) {
        const fileDate = new Date(file.modified);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        switch (this.dateFilter) {
          case 'today':
            if (fileDate < today) return false;
            break;
          case 'week':
            if (fileDate < weekAgo) return false;
            break;
          case 'month':
            if (fileDate < monthAgo) return false;
            break;
          case 'older':
            if (fileDate >= monthAgo) return false;
            break;
        }
      }
      
      // Filtre par recherche textuelle
      if (this.searchFilter) {
        const searchLower = this.searchFilter.toLowerCase();
        const matchesName = file.readable_name.toLowerCase().includes(searchLower);
        const matchesDescription = file.description.toLowerCase().includes(searchLower);
        const matchesFilename = file.filename.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesDescription && !matchesFilename) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  clearFilters() {
    this.selectedLogType = '';
    this.minSizeFilter = '';
    this.dateFilter = '';
    this.searchFilter = '';
    this.applyFilters();
  }

  refreshLogs() {
    this.loadLogFiles();
    this.loadStats();
    if (this.selectedFile) {
      this.loadLogEntries();
    }
  }

  clearOldLogs() {
    if (confirm('Supprimer les logs de plus de 30 jours ?')) {
      this.http.post('http://localhost:8000/api/logs/clear', {}).subscribe({
        next: (response: any) => {
          alert('Logs nettoyés: ' + response.message);
          this.refreshLogs();
        },
        error: (error) => {
          console.error('Erreur lors du nettoyage:', error);
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'api': '🌐',
      'accounting': '💰',
      'payroll': '👥',
      'invoicing': '📄',
      'social': '🏛️',
      'errors': '❌',
      'debug': '🔍',
      'general': '📝'
    };
    return icons[type] || '📄';
  }

  getTotalActivity(): number {
    return this.logFiles.reduce((total, file) => total + file.size, 0);
  }

  getSelectedFileReadableName(): string {
    const selectedFileObj = this.logFiles.find(f => f.filename === this.selectedFile);
    return selectedFileObj ? selectedFileObj.readable_name : this.selectedFile;
  }
}