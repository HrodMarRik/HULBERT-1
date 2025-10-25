import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientTokensService, ClientToken, ClientTokenCreate } from './client-tokens.service';

@Component({
  selector: 'app-client-tokens-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tokens-manager">
      <div class="manager-header">
        <h1 class="manager-title">Gestion des Tokens Clients</h1>
        <button class="btn btn-primary" (click)="showCreateModal = true">
          <span class="btn-icon">➕</span>
          Nouveau Token
        </button>
      </div>

      <!-- Liste des tokens -->
      <div class="tokens-list">
        <div class="token-card" *ngFor="let token of tokens">
          <div class="token-header">
            <div class="token-status" [class.active]="token.active" [class.inactive]="!token.active">
              {{ token.active ? 'Actif' : 'Inactif' }}
            </div>
            <div class="token-actions">
              <button class="action-btn" (click)="copyTokenUrl(token)" title="Copier le lien">
                📋
              </button>
              <button class="action-btn" (click)="regenerateToken(token.id)" title="Régénérer">
                🔄
              </button>
              <button class="action-btn danger" (click)="deactivateToken(token.id)" title="Désactiver">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="token-content">
            <div class="token-info">
              <span class="info-label">Contact ID:</span>
              <span class="info-value">{{ token.contact_id }}</span>
            </div>
            <div class="token-info" *ngIf="token.project_id">
              <span class="info-label">Projet ID:</span>
              <span class="info-value">{{ token.project_id }}</span>
            </div>
            <div class="token-info" *ngIf="token.max_tickets">
              <span class="info-label">Limite tickets:</span>
              <span class="info-value">{{ token.max_tickets }}</span>
            </div>
            <div class="token-info" *ngIf="token.last_used_at">
              <span class="info-label">Dernière utilisation:</span>
              <span class="info-value">{{ formatDate(token.last_used_at) }}</span>
            </div>
          </div>

          <div class="token-url">
            <input 
              type="text" 
              [value]="getTokenUrl(token)" 
              readonly 
              class="url-input"
              (click)="selectText($event)"
            />
          </div>
        </div>

        <div class="empty-state" *ngIf="tokens.length === 0 && !loading">
          <p>Aucun token créé</p>
        </div>
      </div>

      <!-- Modal création -->
      <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 class="modal-title">Créer un Token Client</h2>
          
          <form (ngSubmit)="createToken()">
            <div class="form-group">
              <label>Contact ID *</label>
              <input 
                type="number" 
                [(ngModel)]="newToken.contact_id" 
                name="contact_id"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label>Projet ID (optionnel)</label>
              <input 
                type="number" 
                [(ngModel)]="newToken.project_id" 
                name="project_id"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Limite de tickets (optionnel)</label>
              <input 
                type="number" 
                [(ngModel)]="newToken.max_tickets" 
                name="max_tickets"
                class="form-input"
                placeholder="Illimité si vide"
              />
            </div>

            <div class="form-group">
              <label>Mot de passe (optionnel)</label>
              <input 
                type="password" 
                [(ngModel)]="newToken.password" 
                name="password"
                class="form-input"
                placeholder="Laisser vide pour aucun mot de passe"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="!newToken.contact_id">
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tokens-manager {
      padding: 24px;
    }

    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .manager-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
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

    .tokens-list {
      display: grid;
      gap: 16px;
    }

    .token-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }

    .token-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .token-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .token-status.active {
      background: #d1fae5;
      color: #065f46;
    }

    .token-status.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .token-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 6px 10px;
      background: #f1f5f9;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #e2e8f0;
    }

    .action-btn.danger:hover {
      background: #fee2e2;
    }

    .token-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    .token-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
    }

    .token-url {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .url-input {
      width: 100%;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      color: #475569;
      cursor: pointer;
    }

    .url-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 20px 0;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }
  `]
})
export class ClientTokensManagerComponent implements OnInit {
  tokens: ClientToken[] = [];
  loading: boolean = false;
  showCreateModal: boolean = false;
  
  newToken: ClientTokenCreate = {
    contact_id: 0
  };

  constructor(private clientTokensService: ClientTokensService) {}

  ngOnInit() {
    this.loadTokens();
  }

  loadTokens() {
    this.loading = true;
    this.clientTokensService.getTokens().subscribe({
      next: (tokens) => {
        this.tokens = tokens;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tokens:', err);
        this.loading = false;
      }
    });
  }

  createToken() {
    this.clientTokensService.createToken(this.newToken).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newToken = { contact_id: 0 };
        this.loadTokens();
      },
      error: (err) => {
        console.error('Error creating token:', err);
        alert('Erreur lors de la création du token');
      }
    });
  }

  regenerateToken(id: number) {
    if (!confirm('Régénérer ce token ? L\'ancien lien ne fonctionnera plus.')) return;
    
    this.clientTokensService.regenerateToken(id).subscribe({
      next: () => {
        this.loadTokens();
      },
      error: (err) => {
        console.error('Error regenerating token:', err);
        alert('Erreur lors de la régénération du token');
      }
    });
  }

  deactivateToken(id: number) {
    if (!confirm('Désactiver ce token ?')) return;
    
    this.clientTokensService.deactivateToken(id).subscribe({
      next: () => {
        this.loadTokens();
      },
      error: (err) => {
        console.error('Error deactivating token:', err);
        alert('Erreur lors de la désactivation du token');
      }
    });
  }

  getTokenUrl(token: ClientToken): string {
    return `${window.location.origin}/client-portal/${token.token}`;
  }

  copyTokenUrl(token: ClientToken) {
    const url = this.getTokenUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      alert('Lien copié dans le presse-papiers !');
    });
  }

  selectText(event: Event) {
    (event.target as HTMLInputElement).select();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

