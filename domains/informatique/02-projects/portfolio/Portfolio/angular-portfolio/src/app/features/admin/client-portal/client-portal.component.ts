import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface ClientToken {
  id: string;
  token: string;
  contactId: number;
  contactName: string;
  projectId?: number;
  projectName?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

interface ClientTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'feature' | 'task' | 'support';
  projectId?: number;
  projectName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: Date;
  endDate?: Date;
}

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="client-portal-container">
      <div class="header">
        <h1>Portail Client</h1>
        <p>Gérez les accès clients et leurs tickets</p>
      </div>

      <div class="main-content">
        <!-- Client Tokens Section -->
        <div class="tokens-section">
          <div class="section-header">
            <h2>Tokens d'Accès Client</h2>
            <button class="btn btn-primary" (click)="generateNewToken()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouveau Token
            </button>
          </div>

          <div class="tokens-grid">
            <div class="token-card" *ngFor="let token of clientTokens">
              <div class="token-header">
                <div class="token-info">
                  <h3>{{ token.contactName }}</h3>
                  <p>{{ token.projectName || 'Aucun projet assigné' }}</p>
                </div>
                <div class="token-status" [class]="token.isActive ? 'active' : 'inactive'">
                  {{ token.isActive ? 'Actif' : 'Inactif' }}
                </div>
              </div>

              <div class="token-details">
                <div class="token-url">
                  <label>Lien d'accès:</label>
                  <div class="url-container">
                    <input type="text" 
                           [value]="getClientUrl(token.token)" 
                           readonly
                           class="url-input">
                    <button class="btn-icon" (click)="copyUrl(token.token)" title="Copier">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="token-stats">
                  <div class="stat">
                    <span class="stat-label">Utilisations:</span>
                    <span class="stat-value">{{ token.usageCount }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Dernière utilisation:</span>
                    <span class="stat-value">{{ formatDate(token.lastUsed) }}</span>
                  </div>
                </div>
              </div>

              <div class="token-actions">
                <button class="btn btn-secondary" (click)="toggleToken(token.id)">
                  {{ token.isActive ? 'Désactiver' : 'Activer' }}
                </button>
                <button class="btn btn-secondary" (click)="regenerateToken(token.id)">
                  Régénérer
                </button>
                <button class="btn btn-danger" (click)="deleteToken(token.id)">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects Section -->
        <div class="projects-section">
          <div class="section-header">
            <h2>Projets Clients</h2>
            <button class="btn btn-primary" (click)="addProject()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouveau Projet
            </button>
          </div>

          <div class="projects-grid">
            <div class="project-card" *ngFor="let project of projects">
              <div class="project-header">
                <h3>{{ project.name }}</h3>
                <div class="project-status" [class]="project.status.toLowerCase()">
                  {{ project.status }}
                </div>
              </div>

              <p class="project-description">{{ project.description }}</p>

              <div class="project-progress">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="project.progress"></div>
                </div>
                <span class="progress-text">{{ project.progress }}%</span>
              </div>

              <div class="project-dates">
                <div class="date-item">
                  <span class="date-label">Début:</span>
                  <span class="date-value">{{ formatDate(project.startDate) }}</span>
                </div>
                <div class="date-item" *ngIf="project.endDate">
                  <span class="date-label">Fin:</span>
                  <span class="date-value">{{ formatDate(project.endDate) }}</span>
                </div>
              </div>

              <div class="project-actions">
                <button class="btn btn-secondary" (click)="editProject(project)">
                  Modifier
                </button>
                <button class="btn btn-secondary" (click)="viewProjectTickets(project.id)">
                  Voir les tickets
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Tickets Section -->
        <div class="tickets-section">
          <div class="section-header">
            <h2>Tickets Clients</h2>
            <div class="ticket-filters">
              <select [(ngModel)]="selectedStatus" (change)="filterTickets()">
                <option value="">Tous les statuts</option>
                <option value="open">Ouverts</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolus</option>
                <option value="closed">Fermés</option>
              </select>
              <select [(ngModel)]="selectedProject" (change)="filterTickets()">
                <option value="">Tous les projets</option>
                <option *ngFor="let project of projects" [value]="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="tickets-list">
            <div class="ticket-card" *ngFor="let ticket of filteredTickets">
              <div class="ticket-header">
                <div class="ticket-info">
                  <h3>{{ ticket.title }}</h3>
                  <p>{{ ticket.projectName || 'Aucun projet' }}</p>
                </div>
                <div class="ticket-badges">
                  <span class="status-badge" [class]="'status-' + ticket.status">
                    {{ getStatusLabel(ticket.status) }}
                  </span>
                  <span class="priority-badge" [class]="'priority-' + ticket.priority">
                    {{ getPriorityLabel(ticket.priority) }}
                  </span>
                  <span class="type-badge" [class]="'type-' + ticket.type">
                    {{ getTypeLabel(ticket.type) }}
                  </span>
                </div>
              </div>

              <p class="ticket-description">{{ ticket.description }}</p>

              <div class="ticket-meta">
                <span class="ticket-date">Créé le {{ formatDate(ticket.createdAt) }}</span>
                <span class="ticket-updated" *ngIf="ticket.updatedAt !== ticket.createdAt">
                  Modifié le {{ formatDate(ticket.updatedAt) }}
                </span>
              </div>

              <div class="ticket-actions">
                <button class="btn btn-secondary" (click)="editTicket(ticket)">
                  Modifier
                </button>
                <button class="btn btn-secondary" (click)="viewTicket(ticket.id)">
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .client-portal-container {
      padding: 20px;
      background: #0f172a;
      min-height: 100vh;
      color: #f1f5f9;
    }

    .header {
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 28px;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .header p {
      color: #94a3b8;
      font-size: 16px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-size: 20px;
      color: #f1f5f9;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #64748b;
      color: white;
    }

    .btn-secondary:hover {
      background: #475569;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
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
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
    }

    .tokens-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .token-card {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
    }

    .token-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .token-info h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin: 0 0 4px 0;
    }

    .token-info p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }

    .token-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .token-status.active {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .token-status.inactive {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
    }

    .token-details {
      margin-bottom: 20px;
    }

    .token-url {
      margin-bottom: 15px;
    }

    .token-url label {
      display: block;
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 5px;
    }

    .url-container {
      display: flex;
      gap: 8px;
    }

    .url-input {
      flex: 1;
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: #f1f5f9;
      font-size: 12px;
    }

    .token-stats {
      display: flex;
      gap: 20px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #94a3b8;
    }

    .stat-value {
      font-size: 14px;
      color: #f1f5f9;
      font-weight: 500;
    }

    .token-actions {
      display: flex;
      gap: 10px;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .project-card {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .project-header h3 {
      font-size: 18px;
      color: #f1f5f9;
      margin: 0;
    }

    .project-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .project-status.active {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .project-status.inactive {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
    }

    .project-description {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .project-progress {
      margin-bottom: 15px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      color: #94a3b8;
    }

    .project-dates {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .date-item {
      display: flex;
      justify-content: space-between;
    }

    .date-label {
      font-size: 12px;
      color: #94a3b8;
    }

    .date-value {
      font-size: 12px;
      color: #f1f5f9;
    }

    .project-actions {
      display: flex;
      gap: 10px;
    }

    .ticket-filters {
      display: flex;
      gap: 10px;
    }

    .ticket-filters select {
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: #f1f5f9;
      font-size: 14px;
    }

    .tickets-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .ticket-card {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .ticket-info h3 {
      font-size: 16px;
      color: #f1f5f9;
      margin: 0 0 4px 0;
    }

    .ticket-info p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }

    .ticket-badges {
      display: flex;
      gap: 8px;
    }

    .status-badge, .priority-badge, .type-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-open {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .status-in_progress {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .status-resolved {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .status-closed {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
    }

    .priority-low {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .priority-medium {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .priority-high {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .priority-critical {
      background: rgba(139, 69, 19, 0.1);
      color: #dc2626;
    }

    .type-bug {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .type-feature {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .type-task {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .type-support {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .ticket-description {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .ticket-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .ticket-date, .ticket-updated {
      font-size: 12px;
      color: #94a3b8;
    }

    .ticket-actions {
      display: flex;
      gap: 10px;
    }

    @media (max-width: 768px) {
      .tokens-grid, .projects-grid {
        grid-template-columns: 1fr;
      }
      
      .section-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }
      
      .ticket-filters {
        flex-direction: column;
      }
    }
  `]
})
export class ClientPortalComponent implements OnInit {
  clientTokens: ClientToken[] = [
    {
      id: '1',
      token: 'abc123def456',
      contactId: 1,
      contactName: 'Jean Dupont',
      projectId: 1,
      projectName: 'Site Web E-commerce',
      isActive: true,
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 5
    },
    {
      id: '2',
      token: 'xyz789uvw012',
      contactId: 2,
      contactName: 'Marie Martin',
      isActive: false,
      createdAt: new Date(),
      usageCount: 0
    }
  ];

  projects: Project[] = [
    {
      id: 1,
      name: 'Site Web E-commerce',
      description: 'Développement d\'une plateforme e-commerce complète',
      status: 'active',
      progress: 75,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30')
    },
    {
      id: 2,
      name: 'Application Mobile',
      description: 'Application mobile iOS et Android',
      status: 'planning',
      progress: 25,
      startDate: new Date('2024-03-01')
    }
  ];

  clientTickets: ClientTicket[] = [
    {
      id: '1',
      title: 'Problème de connexion',
      description: 'Les utilisateurs ne peuvent pas se connecter au site',
      status: 'open',
      priority: 'high',
      type: 'bug',
      projectId: 1,
      projectName: 'Site Web E-commerce',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Nouvelle fonctionnalité',
      description: 'Ajouter un système de filtres avancés',
      status: 'in_progress',
      priority: 'medium',
      type: 'feature',
      projectId: 1,
      projectName: 'Site Web E-commerce',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  filteredTickets: ClientTicket[] = [];
  selectedStatus: string = '';
  selectedProject: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.filteredTickets = this.clientTickets;
  }

  getClientUrl(token: string): string {
    return `${window.location.origin}/client/${token}`;
  }

  copyUrl(token: string) {
    const url = this.getClientUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      console.log('URL copied to clipboard');
    });
  }

  generateNewToken() {
    console.log('Generate new token');
  }

  toggleToken(tokenId: string) {
    const token = this.clientTokens.find(t => t.id === tokenId);
    if (token) {
      token.isActive = !token.isActive;
    }
  }

  regenerateToken(tokenId: string) {
    console.log('Regenerate token:', tokenId);
  }

  deleteToken(tokenId: string) {
    this.clientTokens = this.clientTokens.filter(t => t.id !== tokenId);
  }

  addProject() {
    console.log('Add new project');
  }

  editProject(project: Project) {
    console.log('Edit project:', project);
  }

  viewProjectTickets(projectId: number) {
    this.selectedProject = projectId.toString();
    this.filterTickets();
  }

  filterTickets() {
    this.filteredTickets = this.clientTickets.filter(ticket => {
      const statusMatch = !this.selectedStatus || ticket.status === this.selectedStatus;
      const projectMatch = !this.selectedProject || ticket.projectId?.toString() === this.selectedProject;
      
      return statusMatch && projectMatch;
    });
  }

  editTicket(ticket: ClientTicket) {
    console.log('Edit ticket:', ticket);
  }

  viewTicket(ticketId: string) {
    console.log('View ticket:', ticketId);
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
      'critical': 'Critique'
    };
    return labels[priority] || priority;
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'bug': 'Bug',
      'feature': 'Fonctionnalité',
      'task': 'Tâche',
      'support': 'Support'
    };
    return labels[type] || type;
  }

  formatDate(date?: Date): string {
    if (!date) return 'Jamais';
    return date.toLocaleDateString('fr-FR');
  }
}
