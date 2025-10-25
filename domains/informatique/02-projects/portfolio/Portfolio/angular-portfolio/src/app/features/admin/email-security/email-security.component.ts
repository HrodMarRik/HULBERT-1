import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmailSecurityService, MonitoredEmail, EmailSecurityCheck, EmailSecurityAlert, EmailSecurityStats } from '../../../core/services/email-security.service';

@Component({
  selector: 'app-email-security',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="email-security">
      <!-- Header -->
      <div class="security-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">🔒</span>
            Sécurité Email
          </h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="showAddEmailModal = true">
              <span class="btn-icon">➕</span>
              Ajouter un email
            </button>
            <button class="btn btn-secondary" (click)="checkAllEmails()" [disabled]="isChecking">
              <span class="btn-icon" [class.spinning]="isChecking">🔄</span>
              Vérifier tous
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">📧</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_monitored }}</div>
            <div class="stat-label">Emails surveillés</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.active_monitored }}</div>
            <div class="stat-label">Actifs</div>
          </div>
        </div>
        <div class="stat-card" [class.danger]="stats.compromised_emails > 0">
          <div class="stat-icon">🚨</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.compromised_emails }}</div>
            <div class="stat-label">Compromis</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔍</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_checks }}</div>
            <div class="stat-label">Vérifications</div>
          </div>
        </div>
        <div class="stat-card" [class.warning]="stats.unacknowledged_alerts > 0">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.unacknowledged_alerts }}</div>
            <div class="stat-label">Alertes</div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="security-content">
        <!-- Emails List -->
        <div class="emails-section">
          <div class="section-header">
            <h2>Emails surveillés</h2>
            <div class="section-actions">
              <select [(ngModel)]="filterType" (change)="applyFilters()">
                <option value="">Tous les types</option>
                <option value="personal">Personnel</option>
                <option value="client">Client</option>
              </select>
              <select [(ngModel)]="filterStatus" (change)="applyFilters()">
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="compromised">Compromis</option>
              </select>
            </div>
          </div>

          <div class="emails-list">
            <div 
              class="email-item" 
              *ngFor="let email of filteredEmails"
              [class.compromised]="isEmailCompromised(email.id)"
              [class.inactive]="!email.active">
              
              <div class="email-info">
                <div class="email-address">{{ email.email }}</div>
                <div class="email-meta">
                  <span class="email-type">{{ email.type }}</span>
                  <span class="email-frequency">{{ email.check_frequency }}</span>
                  <span class="email-status" [class.active]="email.active">
                    {{ email.active ? 'Actif' : 'Inactif' }}
                  </span>
                </div>
                <div class="email-last-check" *ngIf="getLatestCheck(email.id)">
                  Dernière vérification: {{ formatDate(getLatestCheck(email.id)?.checked_at) }}
                  <span *ngIf="getLatestCheck(email.id)?.is_compromised" class="compromised-badge">
                    🚨 Compromis ({{ getLatestCheck(email.id)?.breach_count }} fuites)
                  </span>
                </div>
              </div>

              <div class="email-actions">
                <button 
                  class="btn-icon" 
                  (click)="checkEmail(email.id)"
                  [disabled]="isChecking"
                  title="Vérifier maintenant">
                  🔍
                </button>
                <button 
                  class="btn-icon" 
                  (click)="editEmail(email)"
                  title="Modifier">
                  ✏️
                </button>
                <button 
                  class="btn-icon delete" 
                  (click)="deleteEmail(email.id)"
                  title="Supprimer">
                  🗑️
                </button>
              </div>
            </div>

            <div class="empty-state" *ngIf="filteredEmails.length === 0">
              <div class="empty-icon">📧</div>
              <div class="empty-text">Aucun email surveillé</div>
            </div>
          </div>
        </div>

        <!-- Recent Checks -->
        <div class="checks-section">
          <div class="section-header">
            <h2>Vérifications récentes</h2>
          </div>

          <div class="checks-list">
            <div 
              class="check-item" 
              *ngFor="let check of recentChecks"
              [class.compromised]="check.is_compromised">
              
              <div class="check-info">
                <div class="check-email">{{ getEmailAddress(check.monitored_email_id) }}</div>
                <div class="check-date">{{ formatDate(check.checked_at) }}</div>
                <div class="check-result">
                  <span *ngIf="check.is_compromised" class="result-compromised">
                    🚨 Compromis - {{ check.breach_count }} fuites détectées
                  </span>
                  <span *ngIf="!check.is_compromised" class="result-safe">
                    ✅ Sécurisé
                  </span>
                </div>
              </div>

              <div class="check-details" *ngIf="check.is_compromised && check.breach_details">
                <div class="breach-details">
                  <div class="breach-item" *ngFor="let breach of check.breach_details">
                    <span class="breach-count">{{ breach.count }}</span> fuites détectées
                  </div>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="recentChecks.length === 0">
              <div class="empty-icon">🔍</div>
              <div class="empty-text">Aucune vérification récente</div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        <div class="alerts-section" *ngIf="alerts.length > 0">
          <div class="section-header">
            <h2>Alertes de sécurité</h2>
          </div>

          <div class="alerts-list">
            <div 
              class="alert-item" 
              *ngFor="let alert of alerts"
              [class.acknowledged]="alert.acknowledged">
              
              <div class="alert-info">
                <div class="alert-icon">🚨</div>
                <div class="alert-content">
                  <div class="alert-title">Email compromis détecté</div>
                  <div class="alert-date">{{ formatDate(alert.sent_at) }}</div>
                </div>
              </div>

              <div class="alert-actions">
                <button 
                  class="btn btn-sm" 
                  [class.btn-primary]="!alert.acknowledged"
                  [class.btn-secondary]="alert.acknowledged"
                  (click)="acknowledgeAlert(alert.id)"
                  [disabled]="alert.acknowledged">
                  {{ alert.acknowledged ? 'Acquitté' : 'Acquitter' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Email Modal -->
      <div class="modal-overlay" *ngIf="showAddEmailModal" (click)="closeAddEmailModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ajouter un email à surveiller</h2>
            <button class="btn-icon" (click)="closeAddEmailModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="addEmail()" #emailForm="ngForm">
              <div class="form-group">
                <label for="email">Adresse email *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="newEmail.email" 
                  required 
                  email
                  class="form-input"
                  placeholder="exemple@email.com">
              </div>
              <div class="form-group">
                <label for="type">Type d'email</label>
                <select id="type" name="type" [(ngModel)]="newEmail.type" class="form-select">
                  <option value="personal">Personnel</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div class="form-group">
                <label for="check_frequency">Fréquence de vérification</label>
                <select id="check_frequency" name="check_frequency" [(ngModel)]="newEmail.check_frequency" class="form-select">
                  <option value="daily">Quotidienne</option>
                  <option value="weekly" selected>Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeAddEmailModal()">
                Annuler
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                (click)="addEmail()"
                [disabled]="!emailForm.form.valid || isAddingEmail">
                {{ isAddingEmail ? 'Ajout en cours...' : 'Ajouter l\'email' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-security {
      min-height: 100vh;
      background: #0f172a;
      color: #f1f5f9;
    }

    .security-header {
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

    .stats-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .stat-card.danger {
      border-color: #ef4444;
      background: #7f1d1d;
    }

    .stat-card.warning {
      border-color: #f59e0b;
      background: #78350f;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #60a5fa;
    }

    .stat-card.danger .stat-value {
      color: #ef4444;
    }

    .stat-card.warning .stat-value {
      color: #f59e0b;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .security-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .emails-section,
    .checks-section,
    .alerts-section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
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

    .emails-list,
    .checks-list,
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .email-item,
    .check-item,
    .alert-item {
      background: #334155;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      transition: all 0.2s ease;
    }

    .email-item:hover,
    .check-item:hover,
    .alert-item:hover {
      background: #475569;
    }

    .email-item.compromised {
      border-color: #ef4444;
      background: #7f1d1d;
    }

    .email-item.inactive {
      opacity: 0.6;
    }

    .check-item.compromised {
      border-color: #ef4444;
      background: #7f1d1d;
    }

    .alert-item.acknowledged {
      opacity: 0.6;
    }

    .email-info,
    .check-info,
    .alert-info {
      flex: 1;
    }

    .email-address,
    .check-email {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 4px;
    }

    .email-meta,
    .check-date {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .email-type,
    .email-frequency,
    .email-status {
      margin-right: 12px;
    }

    .email-status.active {
      color: #10b981;
    }

    .email-last-check,
    .check-result {
      font-size: 0.9rem;
      color: #cbd5e1;
    }

    .compromised-badge {
      color: #ef4444;
      font-weight: 600;
    }

    .result-compromised {
      color: #ef4444;
      font-weight: 600;
    }

    .result-safe {
      color: #10b981;
      font-weight: 600;
    }

    .breach-details {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #475569;
    }

    .breach-item {
      font-size: 0.9rem;
      color: #cbd5e1;
      margin-bottom: 4px;
    }

    .breach-count {
      font-weight: 600;
      color: #ef4444;
    }

    .email-actions,
    .alert-actions {
      display: flex;
      gap: 8px;
    }

    .alert-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .alert-icon {
      font-size: 1.5rem;
    }

    .alert-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .alert-date {
      font-size: 0.9rem;
      color: #94a3b8;
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
      max-width: 500px;
      width: 90%;
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

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f1f5f9;
    }

    .form-input,
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
    .form-select:focus {
      outline: none;
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
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
    }
  `]
})
export class EmailSecurityComponent implements OnInit {
  emails: MonitoredEmail[] = [];
  filteredEmails: MonitoredEmail[] = [];
  recentChecks: EmailSecurityCheck[] = [];
  alerts: EmailSecurityAlert[] = [];
  stats: EmailSecurityStats | null = null;
  
  showAddEmailModal = false;
  isAddingEmail = false;
  isChecking = false;
  
  filterType = '';
  filterStatus = '';
  
  newEmail = {
    email: '',
    type: 'personal',
    check_frequency: 'weekly'
  };

  private emailSecurityService = inject(EmailSecurityService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadEmails();
    this.loadRecentChecks();
    this.loadAlerts();
    this.loadStats();
  }

  loadEmails() {
    this.emailSecurityService.getMonitoredEmails().subscribe({
      next: (emails) => {
        this.emails = emails;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading emails:', error);
      }
    });
  }

  loadRecentChecks() {
    this.emailSecurityService.getSecurityChecks(undefined, 10).subscribe({
      next: (checks) => {
        this.recentChecks = checks;
      },
      error: (error) => {
        console.error('Error loading checks:', error);
      }
    });
  }

  loadAlerts() {
    this.emailSecurityService.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
      },
      error: (error) => {
        console.error('Error loading alerts:', error);
      }
    });
  }

  loadStats() {
    this.emailSecurityService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.emails];
    
    if (this.filterType) {
      filtered = filtered.filter(email => email.type === this.filterType);
    }
    
    if (this.filterStatus) {
      switch (this.filterStatus) {
        case 'active':
          filtered = filtered.filter(email => email.active);
          break;
        case 'inactive':
          filtered = filtered.filter(email => !email.active);
          break;
        case 'compromised':
          filtered = filtered.filter(email => this.isEmailCompromised(email.id));
          break;
      }
    }
    
    this.filteredEmails = filtered;
  }

  isEmailCompromised(emailId: number): boolean {
    const check = this.getLatestCheck(emailId);
    return check ? check.is_compromised : false;
  }

  getLatestCheck(emailId: number): EmailSecurityCheck | undefined {
    return this.recentChecks.find(check => check.monitored_email_id === emailId);
  }

  getEmailAddress(emailId: number): string {
    const email = this.emails.find(e => e.id === emailId);
    return email ? email.email : 'Email inconnu';
  }

  checkEmail(emailId: number) {
    this.isChecking = true;
    this.emailSecurityService.checkEmailSecurity(emailId).subscribe({
      next: (check) => {
        this.loadRecentChecks();
        this.loadStats();
        this.isChecking = false;
      },
      error: (error) => {
        console.error('Error checking email:', error);
        this.isChecking = false;
      }
    });
  }

  checkAllEmails() {
    this.isChecking = true;
    const checkPromises = this.emails.map(email => 
      this.emailSecurityService.checkEmailSecurity(email.id).toPromise()
    );
    
    Promise.all(checkPromises).then(() => {
      this.loadRecentChecks();
      this.loadStats();
      this.isChecking = false;
    }).catch(error => {
      console.error('Error checking all emails:', error);
      this.isChecking = false;
    });
  }

  addEmail() {
    if (!this.newEmail.email) return;
    
    this.isAddingEmail = true;
    this.emailSecurityService.createMonitoredEmail(this.newEmail).subscribe({
      next: (email) => {
        this.emails.unshift(email);
        this.applyFilters();
        this.closeAddEmailModal();
        this.loadStats();
        this.isAddingEmail = false;
      },
      error: (error) => {
        console.error('Error adding email:', error);
        this.isAddingEmail = false;
      }
    });
  }

  editEmail(email: MonitoredEmail) {
    // Implementation for editing email
    console.log('Edit email:', email);
  }

  deleteEmail(emailId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet email de la surveillance ?')) return;
    
    this.emailSecurityService.deleteMonitoredEmail(emailId).subscribe({
      next: () => {
        this.emails = this.emails.filter(e => e.id !== emailId);
        this.applyFilters();
        this.loadStats();
      },
      error: (error) => {
        console.error('Error deleting email:', error);
      }
    });
  }

  acknowledgeAlert(alertId: number) {
    this.emailSecurityService.acknowledgeAlert(alertId).subscribe({
      next: (alert) => {
        const index = this.alerts.findIndex(a => a.id === alertId);
        if (index !== -1) {
          this.alerts[index] = alert;
        }
        this.loadStats();
      },
      error: (error) => {
        console.error('Error acknowledging alert:', error);
      }
    });
  }

  closeAddEmailModal() {
    this.showAddEmailModal = false;
    this.newEmail = {
      email: '',
      type: 'personal',
      check_frequency: 'weekly'
    };
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Jamais';
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'À l\'instant';
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }
}
