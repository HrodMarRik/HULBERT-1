import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectResponse } from '../../../../models/project.model';
import { ProjectsFilterService, ProjectStats } from '../services/projects-filter.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="project-list">
      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-bar">
          <div class="search-input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
            </svg>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Rechercher des projets...">
          </div>
        </div>
        
        <div class="filters">
          <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
            <option value="all">Tous les statuts</option>
            <option value="planning">Planning</option>
            <option value="active">Actif</option>
            <option value="on_hold">En attente</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
          
          <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange()">
            <option value="created_at">Date de création</option>
            <option value="title">Titre</option>
            <option value="status">Statut</option>
            <option value="progress_percentage">Progression</option>
            <option value="start_date">Date de début</option>
            <option value="budget">Budget</option>
          </select>
          
          <select [(ngModel)]="sortOrder" (ngModelChange)="onSortChange()">
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section">
        <div class="stat-card" *ngFor="let stat of getStatsArray()">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="projects-grid">
        <div class="project-card" *ngFor="let project of getPaginatedProjects()">
          <div class="project-header">
            <div class="project-title">
              <a [routerLink]="['/admin/projects', project.id]" class="project-link">
                {{ project.title }}
              </a>
              <span class="status-badge" [class]="'status-' + project.status">
                {{ getStatusLabel(project.status) }}
              </span>
            </div>
            
            <div class="project-actions">
              <button 
                class="action-btn edit" 
                (click)="onEditProject(project)" 
                title="Modifier">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
              </button>
              
              <button 
                class="action-btn delete" 
                (click)="onDeleteProject(project)" 
                title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="project-content">
            <div class="project-description" *ngIf="project.description">
              {{ project.description }}
            </div>
            
            <div class="project-details">
              <div class="detail-item">
                <span class="detail-label">Entreprise:</span>
                <span class="detail-value">{{ project.company_name || 'Non spécifiée' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Équipe:</span>
                <span class="detail-value">{{ project.team_assigned || 'Non assignée' }}</span>
              </div>
              
              <div class="detail-item" *ngIf="project.start_date">
                <span class="detail-label">Début:</span>
                <span class="detail-value">{{ project.start_date | date:'dd/MM/yyyy' }}</span>
              </div>
              
              <div class="detail-item" *ngIf="project.end_date">
                <span class="detail-label">Fin:</span>
                <span class="detail-value">{{ project.end_date | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
            
            <div class="project-progress">
              <div class="progress-label">Progression</div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="project.progress_percentage"></div>
              </div>
              <span class="progress-text">{{ project.progress_percentage }}%</span>
            </div>
            
            <div class="project-budget" *ngIf="project.budget">
              <span class="budget-label">Budget:</span>
              <span class="budget-value">{{ project.budget | currency:(project.currency || 'EUR'):'symbol':'1.0-0' }}</span>
            </div>
          </div>
          
          <div class="project-footer">
            <span class="project-created">Créé le {{ project.created_at | date:'dd/MM/yyyy' }}</span>
            <span class="project-updated" *ngIf="project.updated_at !== project.created_at">
              Modifié le {{ project.updated_at | date:'dd/MM/yyyy' }}
            </span>
          </div>
        </div>
        
        <div class="no-projects" *ngIf="getFilteredProjects().length === 0">
          <div class="no-projects-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13"/>
            </svg>
          </div>
          <h4>Aucun projet trouvé</h4>
          <p>{{ searchQuery ? 'Aucun projet ne correspond à votre recherche.' : 'Commencez par créer votre premier projet.' }}</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="getTotalPages() > 1">
        <button 
          class="page-btn" 
          [disabled]="currentPage === 1"
          (click)="onPageChange(currentPage - 1)">
          Précédent
        </button>
        
        <div class="page-numbers">
          <button 
            *ngFor="let page of getPageNumbers()"
            class="page-btn"
            [class.active]="page === currentPage"
            (click)="onPageChange(page)">
            {{ page }}
          </button>
        </div>
        
        <button 
          class="page-btn" 
          [disabled]="currentPage === getTotalPages()"
          (click)="onPageChange(currentPage + 1)">
          Suivant
        </button>
      </div>
    </div>
  `,
  styles: [`
    .project-list {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .filters-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .search-bar {
      flex: 1;
      max-width: 400px;
    }

    .search-input {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input svg {
      position: absolute;
      left: 12px;
      color: #9ca3af;
      z-index: 1;
    }

    .search-input input {
      width: 100%;
      padding: 12px 12px 12px 44px;
      background: #374151;
      color: #f3f4f6;
      border: 1px solid #4b5563;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-input input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filters {
      display: flex;
      gap: 12px;
    }

    .filters select {
      padding: 10px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
      padding: 16px;
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .project-card {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      padding: 20px;
      transition: all 0.2s;
    }

    .project-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .project-title {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .project-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: color 0.2s;
    }

    .project-link:hover {
      color: #60a5fa;
      text-decoration: underline;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.status-planning {
      background: #6b7280;
      color: white;
    }

    .status-badge.status-active {
      background: #3b82f6;
      color: white;
    }

    .status-badge.status-on_hold {
      background: #f59e0b;
      color: white;
    }

    .status-badge.status-completed {
      background: #10b981;
      color: white;
    }

    .status-badge.status-cancelled {
      background: #ef4444;
      color: white;
    }

    .project-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .project-card:hover .project-actions {
      opacity: 1;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.edit {
      background: #3b82f6;
      color: white;
    }

    .action-btn.edit:hover {
      background: #2563eb;
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    .project-content {
      margin-bottom: 16px;
    }

    .project-description {
      color: #d1d5db;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .project-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 14px;
      color: #f3f4f6;
    }

    .project-progress {
      margin-bottom: 12px;
    }

    .progress-label {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 6px;
    }

    .progress-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar > div {
      flex: 1;
      height: 6px;
      background: #374151;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      font-weight: 600;
      color: #3b82f6;
      min-width: 30px;
    }

    .project-budget {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .budget-label {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 600;
    }

    .budget-value {
      font-size: 14px;
      color: #10b981;
      font-weight: 600;
    }

    .project-footer {
      border-top: 1px solid #333;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #9ca3af;
    }

    .no-projects {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
      grid-column: 1 / -1;
    }

    .no-projects-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-projects h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-projects p {
      margin: 0;
      font-size: 14px;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    .page-btn {
      padding: 8px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .page-btn:hover:not(:disabled) {
      background: #4b5563;
    }

    .page-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      gap: 4px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .project-list {
        padding: 16px;
      }

      .filters-section {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .search-bar {
        max-width: none;
      }

      .filters {
        flex-wrap: wrap;
        justify-content: center;
      }

      .stats-section {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .projects-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .project-card {
        padding: 16px;
      }

      .project-header {
        flex-direction: column;
        gap: 12px;
      }

      .project-actions {
        opacity: 1;
        justify-content: flex-end;
      }

      .project-details {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .project-footer {
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
      }
    }
  `]
})
export class ProjectListComponent implements OnInit, OnDestroy {
  @Output() editProject = new EventEmitter<ProjectResponse>();
  @Output() deleteProject = new EventEmitter<ProjectResponse>();

  private destroy$ = new Subject<void>();

  // Filter state
  searchQuery = '';
  statusFilter = 'all';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage = 1;

  constructor(private projectsFilterService: ProjectsFilterService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.projectsFilterService.projectsState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.searchQuery = state.filters.search;
        this.statusFilter = state.filters.status;
        this.sortBy = state.filters.sortBy;
        this.sortOrder = state.filters.sortOrder;
        this.currentPage = state.filters.page;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Computed properties
  getFilteredProjects(): ProjectResponse[] {
    return this.projectsFilterService.getFilteredProjects();
  }

  getPaginatedProjects(): ProjectResponse[] {
    return this.projectsFilterService.getPaginatedProjects();
  }

  getTotalPages(): number {
    return this.projectsFilterService.getTotalPages();
  }

  getStatsArray(): { label: string; value: number }[] {
    const stats = this.projectsFilterService.getStats();
    return [
      { label: 'Total', value: stats.total },
      { label: 'Actifs', value: stats.active },
      { label: 'Terminés', value: stats.completed },
      { label: 'En attente', value: stats.onHold },
      { label: 'Annulés', value: stats.cancelled },
      { label: 'Planning', value: stats.planning }
    ];
  }

  // Event handlers
  onSearchChange(): void {
    this.projectsFilterService.setFilters({ search: this.searchQuery, page: 1 });
  }

  onFilterChange(): void {
    this.projectsFilterService.setFilters({ status: this.statusFilter, page: 1 });
  }

  onSortChange(): void {
    this.projectsFilterService.setFilters({ 
      sortBy: this.sortBy, 
      sortOrder: this.sortOrder,
      page: 1 
    });
  }

  onPageChange(page: number): void {
    this.projectsFilterService.setFilters({ page });
  }

  onEditProject(project: ProjectResponse): void {
    this.editProject.emit(project);
  }

  onDeleteProject(project: ProjectResponse): void {
    this.deleteProject.emit(project);
  }

  // Utility methods
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'planning': 'Planning',
      'active': 'Actif',
      'on_hold': 'En attente',
      'completed': 'Terminé',
      'cancelled': 'Annulé'
    };
    return statusLabels[status] || status;
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
    const pages: number[] = [];
    
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
