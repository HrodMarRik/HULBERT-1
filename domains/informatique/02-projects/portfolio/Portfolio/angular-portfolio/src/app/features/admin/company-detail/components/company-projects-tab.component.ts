import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectResponse } from '../../../../models/project.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { CompanyStateService } from '../services/company-state.service';

@Component({
  selector: 'app-company-projects-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditableFieldComponent],
  template: `
    <div class="company-projects">
      <!-- Projects Header -->
      <div class="projects-header">
        <div class="section-title">
          <h3>Projets de l'entreprise ({{ projects.length }})</h3>
        </div>
        
        <div class="projects-actions">
          <button class="btn-primary" (click)="onAddProject()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Nouveau Projet
          </button>
        </div>
      </div>

      <!-- Projects List -->
      <div class="projects-list">
        <div class="project-card" *ngFor="let project of projects">
          <div class="project-header">
            <div class="project-title">
              <a [routerLink]="['/admin/projects', project.id]" class="project-link">
                {{ project.title }}
              </a>
              <span class="status-badge" [class]="'status-' + project.status">
                {{ getStatusLabel(project.status) }}
              </span>
            </div>
            
            <div class="project-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="project.progress_percentage"></div>
              </div>
              <span class="progress-text">{{ project.progress_percentage }}%</span>
            </div>
          </div>
          
          <div class="project-details">
            <div class="project-detail-item">
              <label>Description:</label>
              <app-editable-field
                [value]="project.description || ''"
                [fieldType]="'textarea'"
                [fieldName]="'description'"
                [placeholder]="'Description du projet'"
                (valueChanged)="updateProjectField(project, 'description', $event)">
              </app-editable-field>
            </div>
            
            <div class="project-detail-item">
              <label>Équipe assignée:</label>
              <app-editable-field
                [value]="project.team_assigned || ''"
                [fieldType]="'text'"
                [fieldName]="'team_assigned'"
                [placeholder]="'John Doe, Jane Smith'"
                (valueChanged)="updateProjectField(project, 'team_assigned', $event)">
              </app-editable-field>
            </div>
            
            <div class="project-detail-item">
              <label>Statut:</label>
              <app-editable-field
                [value]="project.status"
                [fieldType]="'select'"
                [fieldName]="'status'"
                [selectOptions]="statusOptions"
                (valueChanged)="updateProjectField(project, 'status', $event)">
              </app-editable-field>
            </div>
            
            <div class="project-detail-item">
              <label>Progression:</label>
              <app-editable-field
                [value]="project.progress_percentage.toString()"
                [fieldType]="'number'"
                [fieldName]="'progress_percentage'"
                [placeholder]="'0'"
                (valueChanged)="updateProjectField(project, 'progress_percentage', +$event)">
              </app-editable-field>
            </div>
            
            <div class="project-detail-item">
              <label>Date de début:</label>
              <app-editable-field
                [value]="project.start_date || ''"
                [fieldType]="'date'"
                [fieldName]="'start_date'"
                (valueChanged)="updateProjectField(project, 'start_date', $event)">
              </app-editable-field>
            </div>
            
            <div class="project-detail-item">
              <label>Date de fin:</label>
              <app-editable-field
                [value]="project.end_date || ''"
                [fieldType]="'date'"
                [fieldName]="'end_date'"
                (valueChanged)="updateProjectField(project, 'end_date', $event)">
              </app-editable-field>
            </div>
            
            <div class="project-detail-item">
              <label>Budget:</label>
              <div class="budget-display">
                <span class="budget-amount">{{ project.budget ? (project.budget | currency:(project.currency || 'EUR'):'symbol':'1.0-0') : '0 €' }}</span>
                <button class="add-budget-btn" (click)="onAddBudget(project)" title="Ajouter du budget">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="project-detail-item">
              <label>Devise:</label>
              <app-editable-field
                [value]="project.currency || 'EUR'"
                [fieldType]="'select'"
                [fieldName]="'currency'"
                [selectOptions]="currencyOptions"
                (valueChanged)="updateProjectField(project, 'currency', $event)">
              </app-editable-field>
            </div>
          </div>
          
          <div class="project-actions">
            <button 
              class="action-btn edit" 
              (click)="onEditProject(project)" 
              title="Modifier le projet">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
              </svg>
              Modifier
            </button>
            
            <button 
              class="action-btn delete" 
              (click)="onDeleteProject(project)" 
              title="Supprimer le projet">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              Supprimer
            </button>
          </div>
          
          <div class="project-meta">
            <span class="project-created">Créé le {{ project.created_at | date:'dd/MM/yyyy' }}</span>
            <span class="project-updated" *ngIf="project.updated_at !== project.created_at">
              Modifié le {{ project.updated_at | date:'dd/MM/yyyy' }}
            </span>
          </div>
        </div>
        
        <div class="no-projects" *ngIf="projects.length === 0">
          <div class="no-projects-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13"/>
            </svg>
          </div>
          <h4>Aucun projet</h4>
          <p>Commencez par créer votre premier projet.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-projects {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .projects-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title h3 {
      margin: 0;
      color: #f3f4f6;
      font-size: 20px;
      font-weight: 600;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .projects-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 24px;
    }

    .project-card {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      padding: 24px;
      transition: all 0.2s;
    }

    .project-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .project-header {
      margin-bottom: 20px;
    }

    .project-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .project-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
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

    .project-progress {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #374151;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 14px;
      font-weight: 600;
      color: #3b82f6;
      min-width: 40px;
    }

    .project-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .project-detail-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .project-detail-item label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .budget-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .budget-amount {
      font-size: 16px;
      font-weight: 700;
      color: #10b981;
    }

    .add-budget-btn {
      background: #3b82f6;
      border: none;
      border-radius: 4px;
      padding: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .add-budget-btn:hover {
      background: #2563eb;
      transform: scale(1.05);
    }

    .project-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 12px;
      font-weight: 500;
      flex: 1;
      justify-content: center;
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

    .project-meta {
      border-top: 1px solid #333;
      padding-top: 8px;
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

    /* Responsive Design */
    @media (max-width: 768px) {
      .company-projects {
        padding: 16px;
      }

      .projects-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .projects-list {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .project-card {
        padding: 16px;
      }

      .project-details {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .project-actions {
        flex-direction: column;
      }

      .project-meta {
        flex-direction: column;
        gap: 4px;
      }
    }
  `]
})
export class CompanyProjectsTabComponent implements OnInit, OnDestroy {
  @Input() companyId: number = 0;
  @Output() addProject = new EventEmitter<void>();
  @Output() updateProject = new EventEmitter<{project: ProjectResponse, field: string, value: any}>();
  @Output() editProject = new EventEmitter<ProjectResponse>();
  @Output() deleteProject = new EventEmitter<ProjectResponse>();
  @Output() addBudget = new EventEmitter<ProjectResponse>();

  private destroy$ = new Subject<void>();

  projects: ProjectResponse[] = [];

  statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Actif' },
    { value: 'on_hold', label: 'En attente' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  currencyOptions = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CHF', label: 'CHF (CHF)' }
  ];

  constructor(private companyStateService: CompanyStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.companyStateService.companyState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.projects = state.projects;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event handlers
  onAddProject(): void {
    this.addProject.emit();
  }

  updateProjectField(project: ProjectResponse, field: string, value: any): void {
    this.updateProject.emit({ project, field, value });
  }

  onEditProject(project: ProjectResponse): void {
    this.editProject.emit(project);
  }

  onDeleteProject(project: ProjectResponse): void {
    this.deleteProject.emit(project);
  }

  onAddBudget(project: ProjectResponse): void {
    this.addBudget.emit(project);
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
}
