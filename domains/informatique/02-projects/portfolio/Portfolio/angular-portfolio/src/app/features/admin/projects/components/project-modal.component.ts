import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { TabbedModalComponent, TabConfig } from '../../../../shared/components/tabbed-modal/tabbed-modal.component';
import { TagInputComponent } from '../../../../shared/components/tag-input/tag-input.component';
import { TagsService } from '../../../../shared/services/tags.service';
import { ProjectResponse, ProjectCreate, ProjectUpdate } from '../../../../models/project.model';
import { Company } from '../../../../models/company.model';
import { Contact } from '../../../../models/contact.model';

export interface ProjectContext {
  type: 'company' | 'contact' | 'normal';
  id?: number;
  entity?: Company | Contact;
}

export interface ProjectTemplate {
  label: string;
  description: string;
  data: Partial<ProjectCreate> & { tags?: string };
}

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TabbedModalComponent, TagInputComponent],
  providers: [TagsService],
  template: `
    <app-tabbed-modal
      [isVisible]="showModal"
      [title]="modalTitle"
      [tabs]="tabs"
      [activeTabIndex]="activeTabIndex"
      [isFormValid]="isFormValid"
      [isLoading]="isLoading"
      [saveButtonText]="saveButtonText"
      [showDeleteButton]="isEditing"
      [showQuickActions]="!isEditing"
      [quickActionTemplates]="quickActionTemplates"
      (close)="onClose()"
      (save)="onSave()"
      (delete)="onDelete()"
      (quickAction)="onQuickAction($event)"
      (tabChange)="onTabChange($event)">
      
      <ng-template #tabContent let-tab let-index="index">
        <!-- Onglet 1: Informations Générales -->
        <div *ngIf="index === 0" class="tab-content">
          <div class="form-group">
            <label class="form-label required">Titre du projet</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="projectForm['title']"
              placeholder="Nom du projet"
              (blur)="validateField('title')">
            <div *ngIf="errors['title']" class="form-error">{{ errors['title'] }}</div>
          </div>

          <div class="form-group">
            <label class="form-label required">Entreprise</label>
            <select class="form-select" [(ngModel)]="projectForm['company_id']" (change)="onCompanyChange()">
              <option value="">Sélectionner une entreprise</option>
              <option *ngFor="let company of availableCompanies" [value]="company.id">
                {{ company.name }}
              </option>
            </select>
            <div class="form-info" *ngIf="context?.type === 'company'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <span>Entreprise pré-sélectionnée depuis le contexte</span>
            </div>
            <div *ngIf="errors['company_id']" class="form-error">{{ errors['company_id'] }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Contact principal</label>
            <select class="form-select" [(ngModel)]="projectForm.primary_contact_id">
              <option value="">Sélectionner un contact</option>
              <option *ngFor="let contact of availableContacts" [value]="contact.id">
                {{ contact.first_name }} {{ contact.last_name }} - {{ contact.email }}
              </option>
            </select>
            <div class="form-info" *ngIf="context?.type === 'contact'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <span>Contact pré-sélectionné depuis le contexte</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="projectForm.description"
              rows="4"
              placeholder="Description détaillée du projet">
            </textarea>
          </div>
        </div>

        <!-- Onglet 2: Planning & Budget -->
        <div *ngIf="index === 1" class="tab-content">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Statut</label>
              <select class="form-select" [(ngModel)]="projectForm.status">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Statut commercial</label>
              <select class="form-select" [(ngModel)]="projectForm.commercial_status">
                <option value="">Non défini</option>
                <option value="prospect">Prospect</option>
                <option value="negotiation">Négociation</option>
                <option value="signed">Signé</option>
                <option value="delivered">Livré</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date de début</label>
              <input 
                type="date" 
                class="form-input"
                [(ngModel)]="projectForm.start_date">
            </div>

            <div class="form-group">
              <label class="form-label">Date de fin</label>
              <input 
                type="date" 
                class="form-input"
                [(ngModel)]="projectForm.end_date">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Progression</label>
            <div class="progress-controls">
              <input 
                type="range" 
                class="progress-slider"
                [(ngModel)]="projectForm.progress_percentage"
                min="0" 
                max="100" 
                step="5">
              <span class="progress-value">{{ projectForm.progress_percentage || 0 }}%</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Devise</label>
              <select class="form-select" [(ngModel)]="projectForm.currency">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF (CHF)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Budget initial</label>
              <div class="budget-controls">
                <input 
                  type="number" 
                  class="form-input"
                  [(ngModel)]="projectForm.budget"
                  min="0"
                  step="0.01"
                  placeholder="0">
                <span class="currency-display">{{ projectForm.currency || 'EUR' }}</span>
              </div>
            </div>
          </div>

          <div class="form-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            <span>Le budget peut être modifié après la création du projet</span>
          </div>
        </div>

        <!-- Onglet 3: Équipe & Détails -->
        <div *ngIf="index === 2" class="tab-content">
          <div class="form-group">
            <label class="form-label">Équipe assignée</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="projectForm.team_assigned"
              rows="3"
              placeholder="John Doe, Jane Smith, etc.">
            </textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Tags</label>
            <app-tag-input
              [(ngModel)]="projectTags"
              entityType="project"
              placeholder="Ajouter des tags..."
              helpText="Séparez les tags par des virgules"
              (tagsChange)="onTagsChange($event)">
            </app-tag-input>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="additionalNotes"
              rows="4"
              placeholder="Notes internes ou commentaires supplémentaires">
            </textarea>
          </div>
        </div>
      </ng-template>
    </app-tabbed-modal>
  `,
  styles: [`
    .tab-content {
      padding: 0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .form-label.required::after {
      content: ' *';
      color: #ef4444;
      font-weight: 700;
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: 10px 12px;
      background: #374151;
      color: #f3f4f6;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-error {
      display: block;
      margin-top: 4px;
      color: #ef4444;
      font-size: 12px;
      font-weight: 500;
    }

    .form-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #1e3a8a;
      color: #dbeafe;
      border-radius: 6px;
      font-size: 14px;
      margin-top: 8px;
    }

    .form-info svg {
      flex-shrink: 0;
    }

    .progress-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-slider {
      flex: 1;
      height: 6px;
      background: #374151;
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
    }

    .progress-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border-radius: 50%;
      cursor: pointer;
    }

    .progress-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border-radius: 50%;
      cursor: pointer;
      border: none;
    }

    .progress-value {
      font-weight: 600;
      color: #3b82f6;
      min-width: 40px;
      text-align: center;
    }

    .budget-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .budget-controls .form-input {
      flex: 1;
    }

    .currency-display {
      font-weight: 600;
      color: #d1d5db;
      min-width: 50px;
      text-align: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .progress-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .budget-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
    }
  `]
})
export class ProjectModalComponent implements OnInit, OnDestroy {
  @Input() showModal: boolean = false;
  @Input() editingProject: ProjectResponse | null = null;
  @Input() context: ProjectContext = { type: 'normal' };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{project: any, data: ProjectCreate | ProjectUpdate}>();

  private destroy$ = new Subject<void>();

  // Form data
  projectForm: ProjectCreate = {
    title: '',
    description: '',
    company_id: 0,
    primary_contact_id: 0,
    status: 'planning',
    commercial_status: '',
    start_date: '',
    end_date: '',
    progress_percentage: 0,
    currency: 'EUR',
    budget: 0,
    team_assigned: '',
    tags: ''
  };

  projectTags: string[] = [];
  additionalNotes: string = '';
  errors: {[key: string]: string} = {};

  // UI state
  isLoading: boolean = false;
  activeTabIndex: number = 0;

  // Data
  availableCompanies: Company[] = [];
  availableContacts: Contact[] = [];

  // Templates rapides
  quickActionTemplates: ProjectTemplate[] = [
    {
      label: 'Projet Client',
      description: 'Créer un projet client avec statut actif',
      data: { status: 'active', commercial_status: 'signed', progress_percentage: 10 }
    },
    {
      label: 'Prospect',
      description: 'Créer un projet prospect en négociation',
      data: { status: 'planning', commercial_status: 'prospect', progress_percentage: 0 }
    },
    {
      label: 'Projet Interne',
      description: 'Créer un projet interne',
      data: { status: 'active', commercial_status: '', progress_percentage: 5 }
    }
  ];

  tabs: TabConfig[] = [
    { id: 'general', label: 'Informations Générales', icon: 'info', required: true },
    { id: 'planning', label: 'Planning & Budget', icon: 'calendar' },
    { id: 'team', label: 'Équipe & Détails', icon: 'user' }
  ];

  constructor(@Inject(TagsService) private tagsService: TagsService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.editingProject ? 'Modifier le projet' : 'Nouveau projet';
  }

  get saveButtonText(): string {
    return this.editingProject ? 'Modifier' : 'Créer';
  }

  get isEditing(): boolean {
    return !!this.editingProject;
  }

  get isFormValid(): boolean {
    return !!(this.projectForm.title?.trim() && 
              this.projectForm.company_id);
  }

  private initializeForm(): void {
    if (this.editingProject) {
      // Mode édition
      this.projectForm = { ...this.editingProject };
      this.projectTags = this.tagsService.parseTagsString(this.projectForm.tags || '');
    } else {
      // Mode création
      this.resetForm();
      this.applyContext();
    }
  }

  private resetForm(): void {
    this.projectForm = {
      title: '',
      description: '',
      company_id: 0,
      primary_contact_id: 0,
      status: 'planning',
      commercial_status: '',
      start_date: '',
      end_date: '',
      progress_percentage: 0,
      currency: 'EUR',
      budget: 0,
      team_assigned: '',
      tags: ''
    };
    this.projectTags = [];
    this.additionalNotes = '';
    this.errors = {};
  }

  private applyContext(): void {
    if (!this.context || this.context.type === 'normal') return;

    switch (this.context.type) {
      case 'company':
        this.projectForm.company_id = this.context.id || 0;
        break;
      case 'contact':
        this.projectForm.primary_contact_id = this.context.id || 0;
        // Si le contact a une entreprise, la pré-sélectionner
        if (this.context.entity && 'company_id' in this.context.entity) {
          this.projectForm.company_id = (this.context.entity as Contact).company_id || 0;
        }
        break;
    }
  }

  private loadData(): void {
    // Charger les entreprises disponibles
    this.loadCompanies();
    
    // Charger les contacts disponibles
    this.loadContacts();
  }

  private loadCompanies(): void {
    // TODO: Implémenter le chargement des entreprises depuis l'API
    this.availableCompanies = [
      { id: 1, name: 'TechCorp', industry: 'Technology' } as Company,
      { id: 2, name: 'DesignStudio', industry: 'Design' } as Company
    ];
  }

  private loadContacts(): void {
    // TODO: Implémenter le chargement des contacts depuis l'API
    this.availableContacts = [
      { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', company_id: 1 } as Contact,
      { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', company_id: 2 } as Contact
    ];
  }

  onCompanyChange(): void {
    // Filtrer les contacts par entreprise sélectionnée
    if (this.projectForm.company_id) {
      this.availableContacts = this.availableContacts.filter(
        contact => contact.company_id === this.projectForm.company_id
      );
    } else {
      this.loadContacts(); // Recharger tous les contacts
    }
  }

  validateField(fieldName: string): void {
    const value = this.projectForm[fieldName as keyof ProjectCreate];
    
    switch (fieldName) {
      case 'title':
        if (!value || (value as string).trim() === '') {
          this.errors['title'] = 'Le titre est obligatoire';
        } else {
          delete this.errors['title'];
        }
        break;
      case 'company_id':
        if (!value) {
          this.errors['company_id'] = 'L\'entreprise est obligatoire';
        } else {
          delete this.errors['company_id'];
        }
        break;
    }
  }

  onTagsChange(tags: string[]): void {
    this.projectTags = tags;
    this.projectForm.tags = this.tagsService.formatTagsArray(tags);
  }

  onQuickAction(template: ProjectTemplate): void {
    Object.assign(this.projectForm, template.data);
    
    // Incrémenter les compteurs d'utilisation des tags
    if (template.data.tags) {
      const tags = this.tagsService.parseTagsString(template.data.tags);
      this.tagsService.incrementTagUsage(tags, 'project').subscribe();
    }
  }

  onTabChange(event: {tabIndex: number, tab: TabConfig}): void {
    this.activeTabIndex = event.tabIndex;
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (!this.isFormValid) return;

    this.isLoading = true;

    // Préparer les données
    const projectData = {
      ...this.projectForm,
      tags: this.tagsService.formatTagsArray(this.projectTags)
    };

    // Incrémenter les compteurs d'utilisation des tags
    if (this.projectTags.length > 0) {
      this.tagsService.incrementTagUsage(this.projectTags, 'project').subscribe();
    }

    this.save.emit({
      project: this.editingProject,
      data: projectData
    });

    // Simuler un délai de sauvegarde
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onDelete(): void {
    // TODO: Implémenter la suppression si nécessaire
    console.log('Delete project');
  }
}