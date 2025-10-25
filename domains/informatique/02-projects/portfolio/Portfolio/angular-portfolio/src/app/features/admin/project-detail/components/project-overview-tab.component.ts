import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Project } from '../../../../models/project.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { ProjectStateService } from '../services/project-state.service';

@Component({
  selector: 'app-project-overview-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent],
  template: `
    <div class="project-overview">
      <!-- Project Header -->
      <div class="project-header">
        <div class="project-title-section">
          <div class="project-title-field">
            <label>Nom du projet:</label>
            <app-editable-field
              [value]="project?.title || ''"
              [fieldType]="'text'"
              [fieldName]="'title'"
              [placeholder]="'Nom du projet'"
              (valueChanged)="updateProjectField('title', $event)">
            </app-editable-field>
          </div>
          <div class="project-status-field">
            <label>Statut:</label>
            <app-editable-field
              [value]="project?.status || ''"
              [fieldType]="'select'"
              [fieldName]="'status'"
              [selectOptions]="statusOptions"
              (valueChanged)="updateProjectField('status', $event)">
            </app-editable-field>
          </div>
        </div>
        
        <div class="project-progress">
          <div class="progress-field">
            <label>Progression:</label>
            <app-editable-field
              [value]="(project?.progress_percentage || 0).toString()"
              [fieldType]="'number'"
              [fieldName]="'progress_percentage'"
              [placeholder]="'0'"
              (valueChanged)="updateProjectField('progress_percentage', +$event)">
            </app-editable-field>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="project?.progress_percentage || 0"></div>
          </div>
          <span class="progress-text">{{ project?.progress_percentage || 0 }}%</span>
        </div>
      </div>

      <!-- Project Details -->
      <div class="project-details">
        <div class="project-detail-item">
          <label>Description:</label>
          <app-editable-field
            [value]="project?.description || ''"
            [fieldType]="'textarea'"
            [fieldName]="'description'"
            [placeholder]="'Description du projet'"
            (valueChanged)="updateProjectField('description', $event)">
          </app-editable-field>
        </div>
        
        <div class="project-detail-item">
          <label>Équipe assignée:</label>
          <app-editable-field
            [value]="project?.team_assigned || ''"
            [fieldType]="'text'"
            [fieldName]="'team_assigned'"
            [placeholder]="'John Doe, Jane Smith'"
            (valueChanged)="updateProjectField('team_assigned', $event)">
          </app-editable-field>
        </div>
        
        <div class="project-detail-item">
          <label>Date de début:</label>
          <app-editable-field
            [value]="project?.start_date || ''"
            [fieldType]="'date'"
            [fieldName]="'start_date'"
            (valueChanged)="updateProjectField('start_date', $event)">
          </app-editable-field>
        </div>
        
        <div class="project-detail-item">
          <label>Date de fin:</label>
          <app-editable-field
            [value]="project?.end_date || ''"
            [fieldType]="'date'"
            [fieldName]="'end_date'"
            (valueChanged)="updateProjectField('end_date', $event)">
          </app-editable-field>
        </div>
        
        <div class="project-detail-item">
          <label>Budget:</label>
          <div class="budget-display">
            <span class="budget-amount">{{ project?.budget ? (project?.budget | currency:(project?.currency || 'EUR'):'symbol':'1.0-0') : '0 €' }}</span>
            <button class="add-budget-btn" (click)="onAddBudget()" title="Ajouter du budget">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            </button>
          </div>
        </div>
*-        
        <div class="project-detail-item">
          <label>Devise:</label>
          <app-editable-field
            [value]="project?.currency || 'EUR'"
            [fieldType]="'select'"
            [fieldName]="'currency'"
            [selectOptions]="currencyOptions"
            (valueChanged)="updateProjectField('currency', $event)">
          </app-editable-field>
        </div>
      </div>

      <!-- Project Stats -->
      <div class="project-stats">
        <div class="stat-item">
          <div class="stat-value">{{ 0 }}</div>
          <div class="stat-label">Phases</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ 0 }}</div>
          <div class="stat-label">Livrables</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ 0 }}</div>
          <div class="stat-label">Contacts</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ 0 }}</div>
          <div class="stat-label">Documents</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-overview {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .project-header {
      margin-bottom: 32px;
    }

    .project-title-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    .project-title-field,
    .project-status-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .project-title-field label,
    .project-status-field label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .project-progress {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .progress-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-field label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .progress-bar {
      width: 100%;
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
    }

    .project-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .project-detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .project-detail-item label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .budget-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .budget-amount {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
    }

    .add-budget-btn {
      background: #3b82f6;
      border: none;
      border-radius: 6px;
      padding: 8px;
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

    .project-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 20px;
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .project-overview {
        padding: 16px;
      }

      .project-details {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .project-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }
  `]
})
export class ProjectOverviewTabComponent implements OnInit, OnDestroy {
  @Input() project: Project | null = null;
  @Output() updateProject = new EventEmitter<{field: string, value: any}>();
  @Output() addBudget = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  currencyOptions = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CHF', label: 'CHF (CHF)' }
  ];

  constructor(private projectStateService: ProjectStateService) {}

  ngOnInit(): void {
    // Subscribe to project state changes
    this.projectStateService.projectState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.project = state.project;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateProjectField(field: string, value: any): void {
    this.updateProject.emit({ field, value });
  }

  onAddBudget(): void {
    this.addBudget.emit();
  }
}
