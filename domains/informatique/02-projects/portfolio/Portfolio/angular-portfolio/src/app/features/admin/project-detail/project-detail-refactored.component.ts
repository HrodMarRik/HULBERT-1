import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import the new components
import { ProjectOverviewTabComponent } from './components/project-overview-tab.component';
import { ProjectBudgetTabComponent } from './components/project-budget-tab.component';
import { ProjectNotesTabComponent } from './components/project-notes-tab.component';

// Import services
import { ProjectStateService } from './services/project-state.service';
import { ProjectBudgetService } from './services/project-budget.service';
import { ProjectService } from '../../../core/services/project.service';

// Import models
import { Project, ProjectNote, ProjectDetailResponse } from '../../../models/project.model';
import { BudgetTransaction } from '../../../models/budget.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    ProjectOverviewTabComponent,
    ProjectBudgetTabComponent,
    ProjectNotesTabComponent
  ],
  template: `
    <div class="project-detail-container">
      <!-- Project Header -->
      <div class="project-header" *ngIf="project">
        <div class="project-title">
          <h1>{{ project.title }}</h1>
          <div class="project-status">
            <span class="status-badge" [class]="'status-' + project.status">
              {{ getStatusLabel(project.status) }}
            </span>
          </div>
        </div>
        
        <div class="project-actions">
          <button class="btn-secondary" (click)="goBack()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
            Retour
          </button>
        </div>
      </div>

      <!-- Project Tabs -->
      <div class="project-tabs">
        <div class="tab-navigation">
          <button 
            *ngFor="let tab of tabs"
            class="tab-btn"
            [class.active]="activeTab === tab.id"
            (click)="setActiveTab(tab.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path [attr.d]="tab.icon"/>
            </svg>
            {{ tab.label }}
            <span class="tab-count" *ngIf="tab.count !== undefined">({{ tab.count }})</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Overview Tab -->
          <app-project-overview-tab
            *ngIf="activeTab === 'overview'"
            [project]="project"
            (updateProject)="onUpdateProject($event)"
            (addBudget)="onAddBudget()">
          </app-project-overview-tab>

          <!-- Budget Tab -->
          <app-project-budget-tab
            *ngIf="activeTab === 'budget'"
            [projectId]="projectId"
            (addTransaction)="onAddTransaction()"
            (editTransaction)="onEditTransaction($event)"
            (deleteTransaction)="onDeleteTransaction($event)">
          </app-project-budget-tab>

          <!-- Events Tab -->
          <div *ngIf="activeTab === 'events'" class="tab-placeholder">
            <div class="placeholder-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
              </svg>
              <h3>Événements</h3>
              <p>Gestion des événements du projet (à implémenter)</p>
            </div>
          </div>

          <!-- Contacts Tab -->
          <div *ngIf="activeTab === 'contacts'" class="tab-placeholder">
            <div class="placeholder-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
              <h3>Contacts</h3>
              <p>Gestion des contacts du projet (à implémenter)</p>
            </div>
          </div>

          <!-- Documents Tab -->
          <div *ngIf="activeTab === 'documents'" class="tab-placeholder">
            <div class="placeholder-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <h3>Documents</h3>
              <p>Gestion des documents du projet (à implémenter)</p>
            </div>
          </div>

          <!-- Tasks Tab -->
          <div *ngIf="activeTab === 'tasks'" class="tab-placeholder">
            <div class="placeholder-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4Z"/>
              </svg>
              <h3>Tâches</h3>
              <p>Gestion des tâches du projet (à implémenter)</p>
            </div>
          </div>

          <!-- Timeline Tab -->
          <div *ngIf="activeTab === 'timeline'" class="tab-placeholder">
            <div class="placeholder-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
              <h3>Timeline</h3>
              <p>Chronologie du projet (à implémenter)</p>
            </div>
          </div>

          <!-- Notes Tab -->
          <app-project-notes-tab
            *ngIf="activeTab === 'notes'"
            [projectId]="projectId"
            (addNote)="onAddNote($event)"
            (editNote)="onEditNote($event)"
            (deleteNote)="onDeleteNote($event)">
          </app-project-notes-tab>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-detail-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    }

    .project-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .project-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #f3f4f6;
    }

    .project-status {
      display: flex;
      align-items: center;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
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
      gap: 12px;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .project-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .tab-navigation {
      display: flex;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: none;
      color: #9ca3af;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #d1d5db;
      background: #374151;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: #1a1a1a;
    }

    .tab-count {
      background: #374151;
      color: #d1d5db;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }

    .tab-btn.active .tab-count {
      background: #3b82f6;
      color: white;
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
    }

    .tab-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 400px;
    }

    .placeholder-content {
      text-align: center;
      color: #9ca3af;
    }

    .placeholder-content svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .placeholder-content h3 {
      margin: 0 0 8px 0;
      color: #d1d5db;
      font-size: 18px;
    }

    .placeholder-content p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .project-header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .project-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .project-title h1 {
        font-size: 24px;
      }

      .tab-navigation {
        flex-wrap: wrap;
      }

      .tab-btn {
        padding: 12px 16px;
        font-size: 13px;
      }
    }
  `]
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  projectId: number = 0;
  project: ProjectDetailResponse | null = null;
  activeTab = 'overview';

  tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13', count: 0 },
    { id: 'budget', label: 'Budget', icon: 'M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13 12.5,13H11.5C10.04,13 9,13.9 9,15H7C7,12.79 8.79,11 11,11H13C15.21,11 17,12.79 17,15C17,17.21 15.21,19 13,19H11C8.79,19 7,17.21 7,15M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,7A1,1 0 0,0 11,8A1,1 0 0,0 12,9A1,1 0 0,0 13,8A1,1 0 0,0 12,7Z', count: 0 },
    { id: 'events', label: 'Events', icon: 'M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z', count: 0 },
    { id: 'contacts', label: 'Contacts', icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z', count: 0 },
    { id: 'documents', label: 'Documents', icon: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z', count: 0 },
    { id: 'tasks', label: 'Tasks', icon: 'M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4Z', count: 0 },
    { id: 'timeline', label: 'Timeline', icon: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z', count: 0 },
    { id: 'notes', label: 'Notes', icon: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z', count: 0 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectStateService: ProjectStateService,
    private projectBudgetService: ProjectBudgetService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.projectId = +params['id'];
        if (this.projectId) {
          this.loadProject();
        }
      });

    // Subscribe to state changes
    this.projectStateService.projectState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.project = state.project;
        this.activeTab = state.activeTab;
        this.updateTabCounts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProject(): void {
    this.projectStateService.setLoading(true);
    
    this.projectService.getProjectDetail(this.projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.projectStateService.setProject(project);
          this.projectStateService.setLoading(false);
        },
        error: (error) => {
          console.error('Error loading project:', error);
          this.projectStateService.setError('Erreur lors du chargement du projet');
          this.projectStateService.setLoading(false);
        }
      });
  }

  private updateTabCounts(): void {
    if (this.project) {
      this.tabs = this.tabs.map(tab => {
        switch (tab.id) {
          case 'events':
            return { ...tab, count: this.project?.events?.length || 0 };
          case 'contacts':
            return { ...tab, count: this.project?.contacts?.length || 0 };
          case 'documents':
            return { ...tab, count: this.project?.documents?.length || 0 };
          case 'notes':
            return { ...tab, count: this.project?.notes?.length || 0 };
          default:
            return tab;
        }
      });
    }
  }

  setActiveTab(tab: string): void {
    this.projectStateService.setActiveTab(tab);
  }

  goBack(): void {
    this.router.navigate(['/admin/projects']);
  }

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

  // Event handlers for child components
  onUpdateProject(data: { field: string, value: any }): void {
    if (this.project) {
      this.projectService.updateProjectField(this.project.id, data.field, data.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.projectStateService.updateProjectField(data.field, data.value);
          },
          error: (error) => {
            console.error('Error updating project:', error);
          }
        });
    }
  }

  onAddBudget(): void {
    // TODO: Implement budget addition modal
    console.log('Add budget clicked');
  }

  onAddTransaction(): void {
    // TODO: Implement transaction addition modal
    console.log('Add transaction clicked');
  }

  onEditTransaction(transaction: BudgetTransaction): void {
    // TODO: Implement transaction edit modal
    console.log('Edit transaction:', transaction);
  }

  onDeleteTransaction(transaction: BudgetTransaction): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      // TODO: Implement transaction deletion
      console.log('Delete transaction:', transaction);
    }
  }

  onAddNote(content: string): void {
    if (this.project) {
      this.projectService.addProjectNote(this.project.id, content)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (note) => {
            this.projectStateService.addNote(note);
          },
          error: (error) => {
            console.error('Error adding note:', error);
          }
        });
    }
  }

  onEditNote(note: ProjectNote): void {
    // TODO: Implement note edit modal
    console.log('Edit note:', note);
  }

  onDeleteNote(note: ProjectNote): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      if (this.project) {
        this.projectService.deleteProjectNote(this.project.id, note.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.projectStateService.removeNote(note.id);
            },
            error: (error) => {
              console.error('Error deleting note:', error);
            }
          });
      }
    }
  }
}
