import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EmailSecurityStatus {
  email: string;
  is_compromised: boolean;
  breach_count: number;
  last_checked: string;
}

@Component({
  selector: 'app-email-security-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card email-security-widget">
      <div class="widget-header">
        <div class="widget-icon">🔒</div>
        <div class="widget-title">Sécurité Email</div>
        <div class="widget-value" [class.alert]="getCompromisedCount() > 0">
          {{ getCompromisedCount() }}
        </div>
      </div>
      
      <div class="widget-content">
        <div class="security-summary" *ngIf="emails.length > 0">
          <div class="summary-item">
            <div class="summary-label">Emails surveillés</div>
            <div class="summary-value">{{ emails.length }}</div>
          </div>
          <div class="summary-item alert" *ngIf="getCompromisedCount() > 0">
            <div class="summary-label">Compromis</div>
            <div class="summary-value">{{ getCompromisedCount() }}</div>
          </div>
          <div class="summary-item safe" *ngIf="getCompromisedCount() === 0">
            <div class="summary-label">Statut</div>
            <div class="summary-value">✓ Sécurisé</div>
          </div>
        </div>
        
        <div class="emails-list" *ngIf="emails.length > 0">
          <div 
            class="email-item" 
            *ngFor="let email of emails.slice(0, 3)"
            [class.compromised]="email.is_compromised"
          >
            <div class="email-status">
              <span class="status-icon" *ngIf="email.is_compromised">⚠️</span>
              <span class="status-icon" *ngIf="!email.is_compromised">✓</span>
            </div>
            <div class="email-info">
              <div class="email-address">{{ email.email }}</div>
              <div class="email-details" *ngIf="email.is_compromised">
                {{ email.breach_count }} violation(s) détectée(s)
              </div>
              <div class="email-details" *ngIf="!email.is_compromised">
                Aucune violation détectée
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="emails.length === 0">
          <div class="empty-icon">🔒</div>
          <div class="empty-text">Aucun email surveillé</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/email-security" class="view-more">Gérer la surveillance →</a>
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
      color: #10b981;
    }
    
    .widget-value.alert {
      color: #f87171;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .security-summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .summary-item {
      background: #334155;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .summary-item.alert {
      background: rgba(248, 113, 113, 0.1);
      border-color: rgba(248, 113, 113, 0.3);
    }
    
    .summary-item.safe {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
    }
    
    .summary-label {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    
    .summary-value {
      font-size: 14px;
      color: #f1f5f9;
      font-weight: 600;
    }
    
    .emails-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .email-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      background: #334155;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .email-item.compromised {
      background: rgba(248, 113, 113, 0.1);
      border-color: rgba(248, 113, 113, 0.3);
    }
    
    .email-status {
      font-size: 16px;
    }
    
    .email-info {
      flex: 1;
    }
    
    .email-address {
      font-size: 12px;
      color: #f1f5f9;
      font-weight: 500;
      margin-bottom: 2px;
    }
    
    .email-details {
      font-size: 10px;
      color: #94a3b8;
    }
    
    .email-item.compromised .email-details {
      color: #fca5a5;
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
export class EmailSecurityWidgetComponent implements OnInit {
  @Input() emails: EmailSecurityStatus[] = [];

  ngOnInit() {
    // Données de test
    if (this.emails.length === 0) {
      this.emails = [
        {
          email: 'contact@example.com',
          is_compromised: false,
          breach_count: 0,
          last_checked: new Date().toISOString()
        },
        {
          email: 'client@company.com',
          is_compromised: true,
          breach_count: 2,
          last_checked: new Date().toISOString()
        },
        {
          email: 'admin@domain.com',
          is_compromised: false,
          breach_count: 0,
          last_checked: new Date().toISOString()
        }
      ];
    }
  }

  getCompromisedCount(): number {
    return this.emails.filter(e => e.is_compromised).length;
  }
}

