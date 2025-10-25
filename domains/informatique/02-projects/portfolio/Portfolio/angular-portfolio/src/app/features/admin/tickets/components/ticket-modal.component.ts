import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { TabbedModalComponent, TabConfig } from '../../../../shared/components/tabbed-modal/tabbed-modal.component';
import { TagInputComponent } from '../../../../shared/components/tag-input/tag-input.component';
import { TagsService } from '../../../../shared/services/tags.service';
import { TicketCreate, TicketUpdate } from '../../../../models/ticket.model';
import { Project } from '../../../../models/project.model';
import { Company } from '../../../../models/company.model';
import { Contact } from '../../../../models/contact.model';
import { environment } from '../../../../../environments/environment';

export interface TicketContext {
  type: 'project' | 'company' | 'contact' | 'normal';
  id?: number;
  entity?: Project | Company | Contact;
}

export interface TicketTemplate {
  label: string;
  description: string;
  data: Partial<TicketCreate>;
}

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TabbedModalComponent, TagInputComponent],
  template: `
    <app-tabbed-modal
      [isVisible]="isVisible"
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
        <!-- Onglet 1: Informations Essentielles -->
        <div *ngIf="index === 0" class="tab-content">
          <div class="form-group">
            <label class="form-label required">Titre</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="ticketForm.title"
              placeholder="Titre du ticket"
              (blur)="validateField('title')">
            <div *ngIf="errors['title']" class="form-error">{{ errors['title'] }}</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Thème</label>
              <select class="form-select" [(ngModel)]="ticketForm.theme">
                <option value="">Sélectionner un thème</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="Support">Support</option>
                <option value="Question">Question</option>
                <option value="Documentation">Documentation</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Priorité</label>
              <select class="form-select" [(ngModel)]="ticketForm.priority">
                <option value="">Sélectionner une priorité</option>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="ticketForm.description"
              rows="4"
              placeholder="Description détaillée du ticket">
            </textarea>
          </div>
        </div>

        <!-- Onglet 2: Assignation & Planning -->
        <div *ngIf="index === 1" class="tab-content">
          <div class="form-group">
            <label class="form-label">Projet</label>
            <select class="form-select" [(ngModel)]="ticketForm.project_id">
              <option value="">Sélectionner un projet</option>
              <option *ngFor="let project of availableProjects" [value]="project.id">
                {{ project.title }}
              </option>
            </select>
            <div class="form-info" *ngIf="context?.type === 'project'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <span>Projet pré-sélectionné depuis le contexte</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assigné à</label>
            <div class="assignment-controls">
              <select class="form-select" [(ngModel)]="ticketForm.assigned_to">
                <option value="">Non assigné</option>
                <option *ngFor="let agent of availableAgents" [value]="agent.name">
                  {{ agent.name }}
                </option>
              </select>
              <button 
                type="button" 
                class="form-btn secondary small"
                (click)="assignToSelf()">
                M'assigner
              </button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date d'échéance</label>
              <input 
                type="datetime-local" 
                class="form-input"
                [(ngModel)]="ticketForm.due_date">
            </div>

            <div class="form-group">
              <label class="form-label">Heures estimées</label>
              <input 
                type="number" 
                class="form-input"
                [(ngModel)]="ticketForm.estimated_hours"
                min="0"
                step="0.5"
                placeholder="1">
            </div>
          </div>
        </div>

        <!-- Onglet 3: Détails Supplémentaires -->
        <div *ngIf="index === 2" class="tab-content">
          <div class="form-group">
            <label class="form-label">Tags</label>
            <app-tag-input
              [(ngModel)]="ticketTags"
              entityType="ticket"
              placeholder="Ajouter des tags..."
              helpText="Séparez les tags par des virgules"
              (tagsChange)="onTagsChange($event)">
            </app-tag-input>
          </div>

          <div class="form-group">
            <label class="form-label">Statut</label>
            <select class="form-select" [(ngModel)]="ticketForm.status">
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Notes additionnelles</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="additionalNotes"
              rows="3"
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

    .assignment-controls {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .assignment-controls .form-select {
      flex: 1;
    }

    .form-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .form-btn.secondary {
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
    }

    .form-btn.secondary:hover {
      background: #4b5563;
    }

    .form-btn.small {
      padding: 6px 12px;
      font-size: 12px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .assignment-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .assignment-controls .form-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class TicketModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() editingTicket: any = null;
  @Input() context: TicketContext = { type: 'normal' };
  @Input() prefilledTemplate?: 'bug' | 'feature' | 'question';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ticket: any, data: TicketCreate | TicketUpdate}>();
  @Output() delete = new EventEmitter<number>();

  private destroy$ = new Subject<void>();

  // Form data
  ticketForm: TicketCreate = {
    title: '',
    description: '',
    theme: '',
    priority: '',
    status: 'open',
    assigned_to: '',
    due_date: '',
    tags: '',
    estimated_hours: 1,
    project_id: undefined
  };

  ticketTags: string[] = [];
  additionalNotes: string = '';
  errors: {[key: string]: string} = {};

  // UI state
  isLoading: boolean = false;
  activeTabIndex: number = 0;

  // Data
  availableProjects: Project[] = [];
  availableAgents: any[] = [];

  // Templates rapides
  quickActionTemplates: TicketTemplate[] = [
    {
      label: 'Bug Critique',
      description: 'Créer un ticket de bug avec priorité critique',
      data: { theme: 'Bug', priority: 'critical', estimated_hours: 2 }
    },
    {
      label: 'Demande Feature',
      description: 'Créer une demande de fonctionnalité',
      data: { theme: 'Feature', priority: 'medium', estimated_hours: 8 }
    },
    {
      label: 'Question Rapide',
      description: 'Créer une question simple',
      data: { theme: 'Question', priority: 'low', estimated_hours: 0.5 }
    }
  ];

  tabs: TabConfig[] = [
    { id: 'essentials', label: 'Informations Essentielles', icon: 'info', required: true },
    { id: 'assignment', label: 'Assignation & Planning', icon: 'user' },
    { id: 'details', label: 'Détails Supplémentaires', icon: 'settings' }
  ];

  constructor(private tagsService: TagsService, private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingTicket'] && this.isVisible) {
      this.initializeForm();
    }
    if (changes['isVisible'] && this.isVisible) {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.editingTicket ? 'Modifier le ticket' : 'Nouveau ticket';
  }

  get saveButtonText(): string {
    return this.editingTicket ? 'Modifier' : 'Créer';
  }

  get isEditing(): boolean {
    return !!this.editingTicket;
  }

  get isFormValid(): boolean {
    return !!(this.ticketForm.title?.trim() && 
              this.ticketForm.theme && 
              this.ticketForm.priority);
  }

  private initializeForm(): void {
    if (this.editingTicket) {
      console.log('Initializing form with ticket:', this.editingTicket);
      // Mode édition - s'assurer que tous les champs sont définis
      this.ticketForm = {
        title: this.editingTicket.title || '',
        description: this.editingTicket.description || '',
        theme: this.editingTicket.theme || '',
        priority: this.editingTicket.priority || '',
        status: this.editingTicket.status || 'open',
        assigned_to: this.editingTicket.assigned_to || 'HrodMarRik', // Vous êtes assigné par défaut si vide
        due_date: this.editingTicket.due_date || '',
        tags: this.editingTicket.tags || '',
        estimated_hours: this.editingTicket.estimated_hours || 1,
        project_id: this.editingTicket.project_id || undefined
      };
      this.ticketTags = this.tagsService.parseTagsString(this.ticketForm.tags || '');
      console.log('Form initialized:', this.ticketForm);
    } else {
      // Mode création
      this.resetForm();
      this.applyContext();
      this.applyTemplate();
    }
  }

  private resetForm(): void {
    this.ticketForm = {
      title: '',
      description: '',
      theme: '',
      priority: '',
      status: 'open',
      assigned_to: 'HrodMarRik', // Vous êtes assigné par défaut
      due_date: '',
      tags: '',
      estimated_hours: 1,
      project_id: undefined
    };
    this.ticketTags = [];
    this.additionalNotes = '';
    this.errors = {};
  }

  private applyContext(): void {
    if (!this.context || this.context.type === 'normal') return;

    switch (this.context.type) {
      case 'project':
        this.ticketForm.project_id = this.context.id;
        break;
      case 'company':
        // Si l'entreprise a un seul projet, le pré-sélectionner
        // Sinon, laisser le dropdown vide pour que l'utilisateur choisisse
        break;
      case 'contact':
        // Si le contact est lié à un projet, le pré-sélectionner
        break;
    }
  }

  private applyTemplate(): void {
    if (!this.prefilledTemplate) return;

    const templates: {[key: string]: Partial<TicketCreate>} = {
      'bug': { theme: 'Bug', priority: 'critical', estimated_hours: 2 },
      'feature': { theme: 'Feature', priority: 'medium', estimated_hours: 8 },
      'question': { theme: 'Question', priority: 'low', estimated_hours: 0.5 }
    };

    const template = templates[this.prefilledTemplate];
    if (template) {
      Object.assign(this.ticketForm, template);
    }
  }

  private loadData(): void {
    // Charger les projets disponibles
    this.loadProjects();
    
    // Charger les agents disponibles
    this.loadAgents();
  }

  private loadProjects(): void {
    // Charger les projets depuis l'API
    this.http.get<any[]>(`${environment.apiUrl}/api/projects`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Erreur lors du chargement des projets:', error);
          return of([]);
        })
      )
      .subscribe(projects => {
        this.availableProjects = projects.map(project => ({
          id: project.id,
          title: project.title,
          company_id: project.company_id
        } as Project));
        console.log('Projets chargés:', this.availableProjects);
      });
  }

  private loadAgents(): void {
    // TODO: Implémenter le chargement des agents depuis l'API
    this.availableAgents = [
      { id: 0, name: 'HrodMarRik' },
      { id: 1, name: 'Agent 1' },
      { id: 2, name: 'Agent 2' }
    ];
  }

  validateField(fieldName: string): void {
    const value = this.ticketForm[fieldName as keyof TicketCreate];
    
    switch (fieldName) {
      case 'title':
        if (!value || (value as string).trim() === '') {
          this.errors['title'] = 'Le titre est obligatoire';
        } else {
          delete this.errors['title'];
        }
        break;
      case 'theme':
        if (!value) {
          this.errors['theme'] = 'Le thème est obligatoire';
        } else {
          delete this.errors['theme'];
        }
        break;
      case 'priority':
        if (!value) {
          this.errors['priority'] = 'La priorité est obligatoire';
        } else {
          delete this.errors['priority'];
        }
        break;
    }
  }

  onTagsChange(tags: string[]): void {
    this.ticketTags = tags;
    this.ticketForm.tags = this.tagsService.formatTagsArray(tags);
  }

  assignToSelf(): void {
    // Assigner le ticket à vous-même
    this.ticketForm.assigned_to = 'HrodMarRik';
  }

  onQuickAction(template: TicketTemplate): void {
    Object.assign(this.ticketForm, template.data);
    
    // Incrémenter les compteurs d'utilisation des tags
    if (template.data.tags) {
      const tags = this.tagsService.parseTagsString(template.data.tags);
      this.tagsService.incrementTagUsage(tags, 'ticket').subscribe();
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

    // Préparer les données selon le mode (création ou modification)
    let ticketData: any;
    
    if (this.isEditing) {
      // Mode modification - envoyer tous les champs disponibles
      ticketData = {
        title: this.ticketForm.title,
        description: this.ticketForm.description,
        theme: this.ticketForm.theme,
        priority: this.ticketForm.priority,
        status: this.ticketForm.status,
        assigned_to: this.ticketForm.assigned_to || null,
        due_date: this.ticketForm.due_date ? new Date(this.ticketForm.due_date).toISOString() : null,
        tags: this.tagsService.formatTagsArray(this.ticketTags) || null,
        estimated_hours: this.ticketForm.estimated_hours ? Number(this.ticketForm.estimated_hours) : null,
        project_id: this.ticketForm.project_id ? Number(this.ticketForm.project_id) : null
      };
      
      // Nettoyer les champs vides pour éviter les erreurs de validation
      Object.keys(ticketData).forEach(key => {
        if (ticketData[key] === '' || ticketData[key] === undefined) {
          ticketData[key] = null;
        }
      });
      
      console.log('Sending update data:', ticketData);
    } else {
      // Mode création - seulement les champs que le backend accepte
      ticketData = {
        title: this.ticketForm.title,
        description: this.ticketForm.description,
        theme: this.ticketForm.theme,
        priority: this.ticketForm.priority,
        status: this.ticketForm.status,
        assigned_to: this.ticketForm.assigned_to
      };
      
      console.log('Sending create data:', ticketData);
    }

    // Incrémenter les compteurs d'utilisation des tags
    if (this.ticketTags.length > 0) {
      this.tagsService.incrementTagUsage(this.ticketTags, 'ticket').subscribe();
    }

    this.save.emit({
      ticket: this.editingTicket,
      data: ticketData
    });

    // Simuler un délai de sauvegarde
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onDelete(): void {
    if (this.editingTicket) {
      this.delete.emit(this.editingTicket.id);
    }
  }
}
