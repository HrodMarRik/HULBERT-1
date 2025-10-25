import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

interface TicketHistory {
  id: number;
  ticket_id: number;
  user_id: number;
  action: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user_name?: string;
}

@Component({
  selector: 'app-ticket-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ticket-logs-container">
      <div class="logs-header">
        <h2>📋 Logs de Modification des Tickets</h2>
        <div class="logs-controls">
          <button class="refresh-btn" (click)="loadLogs()" title="Actualiser les logs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <div class="logs-content">
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <span>Chargement des logs...</span>
        </div>

        <div *ngIf="!loading && logs.length === 0" class="no-logs">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
          </svg>
          <h3>Aucun log de modification trouvé</h3>
          <p>Les modifications des tickets apparaîtront ici.</p>
        </div>

        <div *ngIf="!loading && logs.length > 0" class="logs-list">
          <div *ngFor="let log of logs" class="log-item">
            <div class="log-header">
              <div class="log-info">
                <span class="log-action">{{ getActionDisplay(log.action) }}</span>
                <span class="log-ticket">Ticket #{{ log.ticket_id }}</span>
                <span class="log-field">{{ getFieldDisplay(log.field_name) }}</span>
              </div>
              <div class="log-meta">
                <span class="log-user">{{ log.user_name || 'Utilisateur' }}</span>
                <span class="log-date">{{ log.created_at | date:'short' }}</span>
              </div>
            </div>
            <div class="log-changes" *ngIf="log.old_value || log.new_value">
              <div class="change-item" *ngIf="log.old_value">
                <span class="change-label">Ancienne valeur:</span>
                <span class="change-value old">{{ log.old_value }}</span>
              </div>
              <div class="change-item" *ngIf="log.new_value">
                <span class="change-label">Nouvelle valeur:</span>
                <span class="change-value new">{{ log.new_value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-logs-container {
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      background: #1a1a1a;
      color: #fff;
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

    .logs-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #fff;
    }

    .logs-controls {
      display: flex;
      gap: 12px;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover {
      background: #5a6268;
      transform: translateY(-1px);
    }

    .logs-content {
      padding: 0 24px 24px 24px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
      color: #888;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #333;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-logs {
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }

    .no-logs svg {
      color: #555;
      margin-bottom: 16px;
    }

    .no-logs h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #aaa;
    }

    .no-logs p {
      margin: 0;
      font-size: 14px;
    }

    .logs-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .log-item {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
    }

    .log-item:hover {
      border-color: #555;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .log-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .log-action {
      font-weight: 600;
      color: #4caf50;
      font-size: 14px;
    }

    .log-ticket {
      font-weight: 500;
      color: #2196f3;
      font-size: 13px;
    }

    .log-field {
      color: #ffc107;
      font-size: 12px;
      font-weight: 500;
    }

    .log-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .log-user {
      font-size: 12px;
      color: #888;
    }

    .log-date {
      font-size: 11px;
      color: #666;
    }

    .log-changes {
      border-top: 1px solid #404040;
      padding-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .change-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .change-label {
      font-size: 12px;
      color: #888;
      min-width: 100px;
    }

    .change-value {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
    }

    .change-value.old {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }

    .change-value.new {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }
  `]
})
export class TicketLogsComponent implements OnInit, OnDestroy {
  logs: TicketHistory[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLogs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLogs() {
    this.loading = true;
    this.http.get<TicketHistory[]>('http://localhost:8000/api/tickets/history')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logs) => {
          this.logs = logs;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading ticket logs:', error);
          this.loading = false;
          // Afficher un message d'erreur plus convivial
          this.logs = [];
        }
      });
  }

  getActionDisplay(action: string): string {
    switch (action) {
      case 'created': return '📝 Créé';
      case 'updated': return '✏️ Modifié';
      case 'resolved': return '✅ Résolu';
      case 'closed': return '🔒 Fermé';
      default: return action;
    }
  }

  getFieldDisplay(field: string): string {
    switch (field) {
      case 'title': return 'Titre';
      case 'description': return 'Description';
      case 'status': return 'Statut';
      case 'priority': return 'Priorité';
      case 'theme': return 'Thème';
      case 'assigned_to': return 'Assigné à';
      case 'due_date': return 'Date d\'échéance';
      case 'estimated_hours': return 'Heures estimées';
      default: return field;
    }
  }
}
