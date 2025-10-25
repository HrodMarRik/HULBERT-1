import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientPortalService, ClientTicketCreate } from './client-portal.service';

@Component({
  selector: 'app-client-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ticket-form-container">
      <div class="form-card">
        <div class="form-header">
          <button class="back-btn" (click)="goBack()">
            <span class="back-icon">←</span>
            Retour
          </button>
          <h1 class="form-title">Nouveau Ticket</h1>
        </div>

        <form class="ticket-form" (ngSubmit)="submitTicket()" *ngIf="!submitting && !success">
          <div class="form-group">
            <label for="title" class="form-label">Titre *</label>
            <input 
              type="text" 
              id="title"
              [(ngModel)]="ticket.title"
              name="title"
              placeholder="Décrivez brièvement votre demande"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="description" class="form-label">Description *</label>
            <textarea 
              id="description"
              [(ngModel)]="ticket.description"
              name="description"
              placeholder="Décrivez votre demande en détail"
              class="form-textarea"
              rows="6"
              required
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="theme" class="form-label">Catégorie *</label>
              <select 
                id="theme"
                [(ngModel)]="ticket.theme"
                name="theme"
                class="form-select"
                required
              >
                <option value="Support">Support</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Nouvelle fonctionnalité</option>
                <option value="Question">Question</option>
                <option value="Other">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label for="priority" class="form-label">Priorité *</label>
              <select 
                id="priority"
                [(ngModel)]="ticket.priority"
                name="priority"
                class="form-select"
                required
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div class="error-message" *ngIf="error">
            <div class="error-icon">⚠️</div>
            <div class="error-text">{{ error }}</div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              Annuler
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="!isFormValid()"
            >
              Créer le ticket
            </button>
          </div>
        </form>

        <!-- Loading state -->
        <div class="loading-state" *ngIf="submitting">
          <div class="loading-spinner"></div>
          <p class="loading-text">Création du ticket en cours...</p>
        </div>

        <!-- Success state -->
        <div class="success-state" *ngIf="success">
          <div class="success-icon">✅</div>
          <h2 class="success-title">Ticket créé avec succès !</h2>
          <p class="success-text">
            Votre ticket a été enregistré. Vous serez notifié par email des mises à jour.
          </p>
          <button class="btn btn-primary" (click)="goBack()">
            Retour à mes tickets
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ticket-form-container {
      min-height: 100vh;
      background: #f8fafc;
      padding: 40px 20px;
    }

    .form-card {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 32px;
    }

    .form-header {
      margin-bottom: 32px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #e2e8f0;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 16px;
    }

    .back-btn:hover {
      background: #cbd5e1;
    }

    .back-icon {
      font-size: 18px;
    }

    .form-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .ticket-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-label {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }

    .form-input, .form-textarea, .form-select {
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .form-select {
      cursor: pointer;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .error-icon {
      font-size: 24px;
    }

    .error-text {
      font-size: 14px;
      color: #dc2626;
      flex: 1;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #cbd5e1;
    }

    .loading-state, .success-state {
      padding: 60px 40px;
      text-align: center;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .success-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .success-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px 0;
    }

    .success-text {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 24px 0;
    }

    @media (max-width: 768px) {
      .form-card {
        padding: 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ClientTicketFormComponent implements OnInit {
  token: string = '';
  password: string = '';
  
  ticket: ClientTicketCreate = {
    title: '',
    description: '',
    theme: 'Support',
    priority: 'medium'
  };

  submitting: boolean = false;
  success: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientPortalService: ClientPortalService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      this.password = sessionStorage.getItem('client_password') || '';
    });
  }

  isFormValid(): boolean {
    return !!(this.ticket.title && this.ticket.description);
  }

  submitTicket() {
    if (!this.isFormValid()) return;

    this.submitting = true;
    this.error = '';

    this.clientPortalService.createTicket(this.token, this.ticket, this.password).subscribe({
      next: () => {
        this.submitting = false;
        this.success = true;
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.error || 'Erreur lors de la création du ticket';
      }
    });
  }

  goBack() {
    this.router.navigate(['/client-portal', this.token, 'tickets']);
  }
}

