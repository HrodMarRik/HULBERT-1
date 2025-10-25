import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectContact, ProjectResponse } from '../../../../models/project.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { ContactStateService } from '../services/contact-state.service';

@Component({
  selector: 'app-contact-projects-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditableFieldComponent],
  template: `
    <div class="contact-projects">
      <!-- Project Roles Header -->
      <div class="project-roles-header">
        <div class="section-title">
          <h3>Rôles dans les projets ({{ projectRoles.length }})</h3>
        </div>
      </div>

      <!-- Project Roles List -->
      <div class="project-roles-list">
        <div class="project-role-card" *ngFor="let role of projectRoles">
          <div class="project-header">
            <div class="project-info">
              <div class="project-name">
                <a [routerLink]="['/admin/projects', role.project_id]" class="project-link">
                  Projet #{{ role.project_id }}
                </a>
                <span class="status-badge status-unknown">Inconnu</span>
              </div>
              
              <div class="project-details">
                <div class="project-company">
                  Entreprise non spécifiée
                </div>
                <div class="project-dates">
                  Dates non spécifiées
                </div>
              </div>
            </div>
            
            <div class="project-actions">
              <button 
                class="action-btn delete" 
                (click)="onRemoveRole(role)" 
                title="Retirer du projet">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
                Retirer
              </button>
            </div>
          </div>
          
          <div class="role-details">
            <div class="role-item">
              <label>Rôle:</label>
              <app-editable-field
                [value]="role.role || ''"
                [fieldType]="'text'"
                [fieldName]="'role'"
                placeholder="Rôle dans le projet"
                (valueChanged)="onUpdateRole(role, 'role', $event)">
              </app-editable-field>
            </div>
            
            <div class="role-item">
              <label>Description:</label>
              <app-editable-field
                [value]="''"
                [fieldType]="'textarea'"
                [fieldName]="'description'"
                placeholder="Description du rôle"
                (valueChanged)="onUpdateRole(role, 'description', $event)">
              </app-editable-field>
            </div>
          </div>
          
          <div class="project-progress">
            <div class="progress-label">Progression du projet:</div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="0"></div>
            </div>
            <span class="progress-text">0%</span>
          </div>
          
          <div class="role-meta">
            <span class="role-added">Ajouté le {{ role.added_at | date:'dd/MM/yyyy' }}</span>
            <span class="project-budget">
              Budget: Non spécifié
            </span>
          </div>
        </div>
        
        <div class="no-roles" *ngIf="projectRoles.length === 0">
          <div class="no-roles-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13"/>
            </svg>
          </div>
          <h4>Aucun rôle de projet</h4>
          <p>Ce contact n'est associé à aucun projet.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-projects {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .project-roles-header {
      margin-bottom: 24px;
    }

    .section-title h3 {
      margin: 0;
      color: #f3f4f6;
      font-size: 20px;
      font-weight: 600;
    }

    .project-roles-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 24px;
    }

    .project-role-card {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      padding: 24px;
      transition: all 0.2s;
    }

    .project-role-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .project-info {
      flex: 1;
      min-width: 0;
    }

    .project-name {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
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

    .status-badge.status-unknown {
      background: #6b7280;
      color: white;
    }

    .project-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .project-company {
      font-size: 14px;
      color: #d1d5db;
      font-weight: 500;
    }

    .project-dates {
      font-size: 12px;
      color: #9ca3af;
    }

    .project-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .project-role-card:hover .project-actions {
      opacity: 1;
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
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    .role-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .role-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .role-item label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .project-progress {
      margin-bottom: 16px;
    }

    .progress-label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      margin-bottom: 8px;
    }

    .progress-bar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar > div {
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

    .role-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #333;
      padding-top: 12px;
    }

    .role-added {
      font-size: 12px;
      color: #9ca3af;
    }

    .project-budget {
      font-size: 12px;
      color: #10b981;
      font-weight: 600;
    }

    .no-roles {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
      grid-column: 1 / -1;
    }

    .no-roles-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-roles h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-roles p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .contact-projects {
        padding: 16px;
      }

      .project-roles-list {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .project-role-card {
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

      .role-details {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .role-meta {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
    }
  `]
})
export class ContactProjectsTabComponent implements OnInit, OnDestroy {
  @Input() contactId: number = 0;
  @Output() updateRole = new EventEmitter<{role: ProjectContact, field: string, value: any}>();
  @Output() removeRole = new EventEmitter<ProjectContact>();

  private destroy$ = new Subject<void>();

  projectRoles: ProjectContact[] = [];

  constructor(private contactStateService: ContactStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.contactStateService.contactState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.projectRoles = state.projectRoles;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event handlers
  onUpdateRole(role: ProjectContact, field: string, value: any): void {
    this.updateRole.emit({ role, field, value });
  }

  onRemoveRole(role: ProjectContact): void {
    this.removeRole.emit(role);
  }

  // Utility methods
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
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
