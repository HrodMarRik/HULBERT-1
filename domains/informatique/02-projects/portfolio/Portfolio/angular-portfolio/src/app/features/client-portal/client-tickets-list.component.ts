import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientPortalService, ClientTicket } from './client-portal.service';

@Component({
  selector: 'app-client-tickets-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="client-tickets-container">
      <div class="tickets-header">
        <h1 class="tickets-title">Mes Tickets</h1>
        <button class="btn btn-primary" (click)="goToNewTicket()">
          <span class="btn-icon">➕</span>
          Nouveau Ticket
        </button>
      </div>

      <div class="tickets-content">
        <!-- Loading -->
        <div class="loading-state" *ngIf="loading">
          <div class="loading-spinner"></div>
          <p class="loading-text">Chargement de vos tickets...</p>
        </div>

        <!-- Error -->
        <div class="error-state" *ngIf="error">
          <div class="error-icon">⚠️</div>
          <p class="error-text">{{ error }}</p>
          <button class="btn btn-secondary" (click)="loadTickets()">Réessayer</button>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && !error && tickets.length === 0">
          <div class="empty-icon">📋</div>
          <h2 class="empty-title">Aucun ticket</h2>
          <p class="empty-text">Vous n'avez pas encore créé de ticket</p>
          <button class="btn btn-primary" (click)="goToNewTicket()">
            Créer mon premier ticket
          </button>
        </div>

        <!-- Tickets list -->
        <div class="tickets-list" *ngIf="!loading && !error && tickets.length > 0">
          <div 
            class="ticket-card" 
            *ngFor="let ticket of tickets"
            (click)="viewTicket(ticket)"
          >
            <div class="ticket-header">
              <div class="ticket-status" [class]="'status-' + ticket.status">
                {{ getStatusLabel(ticket.status) }}
              </div>
              <div class="ticket-priority" [class]="'priority-' + ticket.priority">
                {{ getPriorityLabel(ticket.priority) }}
              </div>
            </div>
            
            <h3 class="ticket-title">{{ ticket.title }}</h3>
            <p class="ticket-description">{{ ticket.description }}</p>
            
            <div class="ticket-footer">
              <div class="ticket-theme">
                <span class="theme-icon">🏷️</span>
                {{ ticket.theme }}
              </div>
              <div class="ticket-date">
                {{ formatDate(ticket.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .client-tickets-container {
      min-height: 100vh;
      background: #f8fafc;
      padding: 40px 20px;
    }

    .tickets-header {
      max-width: 1200px;
      margin: 0 auto 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .tickets-title {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #cbd5e1;
    }

    .btn-icon {
      font-size: 16px;
    }

    .tickets-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-state, .error-state, .empty-state {
      background: white;
      border-radius: 12px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    .loading-text, .error-text, .empty-text {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    .error-icon, .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .tickets-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .ticket-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ticket-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .ticket-header {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .ticket-status, .ticket-priority {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-open { background: #dbeafe; color: #1e40af; }
    .status-in_progress { background: #fef3c7; color: #92400e; }
    .status-resolved { background: #d1fae5; color: #065f46; }
    .status-closed { background: #e5e7eb; color: #374151; }

    .priority-low { background: #e0f2fe; color: #0369a1; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-high { background: #fed7aa; color: #9a3412; }
    .priority-urgent { background: #fecaca; color: #991b1b; }

    .ticket-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .ticket-description {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 16px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .ticket-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .ticket-theme {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }

    .theme-icon {
      font-size: 14px;
    }

    .ticket-date {
      font-size: 12px;
      color: #94a3b8;
    }

    @media (max-width: 768px) {
      .tickets-header {
        flex-direction: column;
        align-items: stretch;
      }

      .tickets-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClientTicketsListComponent implements OnInit {
  token: string = '';
  password: string = '';
  tickets: ClientTicket[] = [];
  loading: boolean = false;
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
      this.loadTickets();
    });
  }

  loadTickets() {
    this.loading = true;
    this.error = '';

    this.clientPortalService.getTickets(this.token, this.password).subscribe({
      next: (tickets) => {
        this.loading = false;
        this.tickets = tickets;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Erreur lors du chargement des tickets';
      }
    });
  }

  goToNewTicket() {
    this.router.navigate(['/client-portal', this.token, 'new-ticket']);
  }

  viewTicket(ticket: ClientTicket) {
    this.router.navigate(['/client-portal', this.token, 'tickets', ticket.id]);
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Ouvert',
      'in_progress': 'En cours',
      'resolved': 'Résolu',
      'closed': 'Fermé'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'low': 'Basse',
      'medium': 'Moyenne',
      'high': 'Haute',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
}

