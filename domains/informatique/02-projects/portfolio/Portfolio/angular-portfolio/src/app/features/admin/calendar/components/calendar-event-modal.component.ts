import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { TabbedModalComponent, TabConfig } from '../../../../shared/components/tabbed-modal/tabbed-modal.component';
import { TagInputComponent } from '../../../../shared/components/tag-input/tag-input.component';
import { TagsService } from '../../../../shared/services/tags.service';
import { CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse, RecurrencePattern } from '../../../../models/calendar.model';
import { Project } from '../../../../models/project.model';
import { Company } from '../../../../models/company.model';
import { Contact } from '../../../../models/contact.model';

export interface EventContext {
  type: 'project' | 'company' | 'contact' | 'calendar' | 'normal';
  id?: number;
  entity?: Project | Company | Contact;
  date?: string; // Pour les événements créés depuis le calendrier
  time?: string; // Pour les événements créés avec une heure spécifique (format HH:MM)
}

export interface EventTemplate {
  label: string;
  description: string;
  data: Partial<CalendarEventCreate>;
}

@Component({
  selector: 'app-calendar-event-modal',
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
        <!-- Onglet 1: Informations de Base -->
        <div *ngIf="index === 0" class="tab-content">
          <div class="form-group">
            <label class="form-label required">Titre</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="eventForm.title"
              placeholder="Titre de l'événement"
              (blur)="validateField('title')">
            <div *ngIf="errors['title']" class="form-error">{{ errors['title'] }}</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Date de début</label>
              <input 
                type="date" 
                class="form-input"
                [(ngModel)]="start_date"
                (change)="onStartDateChange()">
              <div *ngIf="errors['start_date']" class="form-error">{{ errors['start_date'] }}</div>
            </div>

            <div class="form-group">
              <label class="form-label required">Heure de début</label>
              <input 
                type="time" 
                class="form-input"
                [(ngModel)]="start_time"
                [disabled]="all_day">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Date de fin</label>
              <input 
                type="date" 
                class="form-input"
                [(ngModel)]="end_date"
                (change)="onEndDateChange()">
              <div *ngIf="errors['end_date']" class="form-error">{{ errors['end_date'] }}</div>
            </div>

            <div class="form-group">
              <label class="form-label required">Heure de fin</label>
              <input 
                type="time" 
                class="form-input"
                [(ngModel)]="end_time"
                [disabled]="all_day">
            </div>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input 
                type="checkbox" 
                [(ngModel)]="all_day"
                (change)="onAllDayChange()">
              <span>Tout la journée</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Lieu</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="eventForm.location"
              placeholder="Lieu de l'événement">
          </div>
        </div>

        <!-- Onglet 2: Détails -->
        <div *ngIf="index === 1" class="tab-content">
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="eventForm.description"
              rows="4"
              placeholder="Description de l'événement">
            </textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Catégorie</label>
              <select class="form-select" [(ngModel)]="eventForm.category">
                <option value="">Sélectionner une catégorie</option>
                <option value="meeting">Réunion</option>
                <option value="project">Projet</option>
                <option value="deadline">Échéance</option>
                <option value="personal">Personnel</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Statut</label>
              <select class="form-select" [(ngModel)]="eventForm.status">
                <option value="planned">Planifié</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tags</label>
            <app-tag-input
              [(ngModel)]="eventTags"
              entityType="event"
              placeholder="Ajouter des tags..."
              helpText="Séparez les tags par des virgules"
              (tagsChange)="onTagsChange($event)">
            </app-tag-input>
          </div>
        </div>

        <!-- Onglet 3: Liens & Récurrence -->
        <div *ngIf="index === 2" class="tab-content">
          <div class="form-group">
            <label class="form-label">Projet lié</label>
            <select class="form-select" [(ngModel)]="eventForm.project_id">
              <option value="">Aucun projet</option>
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
            <label class="form-label">Entreprise liée</label>
            <select class="form-select" [(ngModel)]="eventForm.company_id">
              <option value="">Aucune entreprise</option>
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
          </div>

          <div class="form-group">
            <label class="form-label">Participants</label>
            <div class="participants-container">
              <div class="participants-list">
                <div *ngFor="let participant of eventParticipants; let i = index" class="participant-item">
                  <span class="participant-name">{{ participant }}</span>
                  <button type="button" class="remove-participant-btn" (click)="removeParticipant(i)" title="Supprimer ce participant">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="add-participant-section">
                <select class="form-select" [(ngModel)]="selectedContactId" (change)="addContactAsParticipant()">
                  <option value="">Ajouter un contact...</option>
                  <option *ngFor="let contact of availableContacts" [value]="contact.id">
                    {{ contact.first_name }} {{ contact.last_name }} - {{ contact.email }}
                  </option>
                </select>
                <div class="add-participant-manual">
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="newParticipantEmail"
                    placeholder="Ou ajouter un email manuellement..."
                    (keyup.enter)="addManualParticipant()">
                  <button type="button" class="add-btn" (click)="addManualParticipant()" [disabled]="!newParticipantEmail.trim()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="form-info" *ngIf="context?.type === 'contact'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <span>Contact pré-sélectionné depuis le contexte</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input 
                type="checkbox" 
                [(ngModel)]="eventForm.is_recurring"
                (change)="onRecurringChange()">
              <span>Événement récurrent</span>
            </label>
          </div>

          <div *ngIf="eventForm.is_recurring" class="recurrence-settings">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Fréquence</label>
                <select class="form-select" [(ngModel)]="recurrence_frequency">
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Intervalle</label>
                <input 
                  type="number" 
                  class="form-input"
                  [(ngModel)]="recurrence_interval"
                  min="1"
                  max="365"
                  placeholder="1">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Date de fin de récurrence</label>
              <input 
                type="date" 
                class="form-input"
                [(ngModel)]="recurrence_end_date">
            </div>
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

    .form-input:disabled {
      background: #2d2d2d;
      color: #9ca3af;
      cursor: not-allowed;
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

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #d1d5db;
    }

    .form-checkbox input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .recurrence-settings {
      margin-top: 16px;
      padding: 16px;
      background: #374151;
      border-radius: 6px;
      border: 1px solid #4b5563;
    }

    .participants-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .participants-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .participant-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 20px;
      font-size: 14px;
      color: #d1d5db;
    }

    .participant-name {
      flex: 1;
    }

    .remove-participant-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      border-radius: 50%;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .remove-participant-btn:hover {
      background: #ef4444;
      color: white;
    }

    .add-participant-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .add-participant-manual {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .add-participant-manual .form-input {
      flex: 1;
    }

    .add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .add-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .add-btn:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .recurrence-settings {
        padding: 12px;
      }
    }
  `]
})
export class CalendarEventModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() editingEvent: CalendarEventResponse | null = null;
  @Input() context: EventContext = { type: 'normal' };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{event: any, data: CalendarEventCreate | CalendarEventUpdate}>();
  @Output() delete = new EventEmitter<CalendarEventResponse>();

  private destroy$ = new Subject<void>();

  // Participants management
  eventParticipants: string[] = [];
  selectedContactId: string = '';
  newParticipantEmail: string = '';

  // Form data
  eventForm: CalendarEventCreate = {
    title: '',
    description: '',
    location: '',
    start_datetime: new Date(),
    end_datetime: new Date(),
    category: '',
    status: 'planned',
    tags: '',
    project_id: undefined,
    is_recurring: false,
    recurrence_pattern: undefined
  };

  // Additional form properties for UI
  all_day: boolean = false;
  start_date: string = '';
  start_time: string = '';
  end_date: string = '';
  end_time: string = '';
  recurrence_frequency: string = 'weekly';
  recurrence_interval: number = 1;
  recurrence_end_date: string = '';

  eventTags: string[] = [];
  errors: {[key: string]: string} = {};

  // UI state
  isLoading: boolean = false;
  activeTabIndex: number = 0;

  // Data
  availableProjects: Project[] = [];
  availableCompanies: Company[] = [];
  availableContacts: Contact[] = [];

  // Templates rapides
  quickActionTemplates: EventTemplate[] = [
    {
      label: 'Réunion 30min',
      description: 'Créer une réunion de 30 minutes',
      data: { 
        category: 'meeting'
      }
    },
    {
      label: 'Deadline Projet',
      description: 'Créer une échéance de projet',
      data: { 
        category: 'deadline', 
        status: 'planned'
      }
    },
    {
      label: 'Appel Client',
      description: 'Créer un appel client de 15 minutes',
      data: { 
        category: 'meeting'
      }
    }
  ];

  tabs: TabConfig[] = [
    { id: 'basic', label: 'Informations de Base', icon: 'info', required: true },
    { id: 'details', label: 'Détails', icon: 'settings' },
    { id: 'links', label: 'Liens & Récurrence', icon: 'calendar' }
  ];

  constructor(@Inject(TagsService) private tagsService: TagsService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingEvent'] && this.isVisible) {
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
    return this.editingEvent ? 'Modifier l\'événement' : 'Nouvel événement';
  }

  get saveButtonText(): string {
    return this.editingEvent ? 'Modifier' : 'Créer';
  }

  get isEditing(): boolean {
    return !!this.editingEvent;
  }

  get isFormValid(): boolean {
    return !!(this.eventForm.title?.trim() && 
              this.eventForm.start_datetime && 
              this.eventForm.end_datetime);
  }

  private initializeForm(): void {
    if (this.editingEvent) {
      // Mode édition
      this.eventForm = { ...this.editingEvent };
      this.eventTags = this.tagsService.parseTagsString(this.eventForm.tags || '');
      
      // Convertir les strings en objets Date pour l'UI
      const startDate = new Date(this.eventForm.start_datetime);
      const endDate = new Date(this.eventForm.end_datetime);
      
      // Extraire les dates et heures pour l'UI
      this.start_date = startDate.toISOString().split('T')[0];
      this.start_time = startDate.toTimeString().slice(0, 5);
      this.end_date = endDate.toISOString().split('T')[0];
      this.end_time = endDate.toTimeString().slice(0, 5);
      
      // Extraire les propriétés de récurrence
      if (this.eventForm.recurrence_pattern) {
        this.recurrence_frequency = this.eventForm.recurrence_pattern.frequency;
        this.recurrence_interval = this.eventForm.recurrence_pattern.interval;
        this.recurrence_end_date = this.eventForm.recurrence_pattern.end_date?.toISOString().split('T')[0] || '';
      }
      
      // Déterminer si c'est toute la journée
      this.all_day = startDate.getHours() === 0 && 
                     startDate.getMinutes() === 0 &&
                     endDate.getHours() === 23 && 
                     endDate.getMinutes() === 59;
      
      // Initialiser les participants
      this.eventParticipants = this.eventForm.participants || [];
    } else {
      // Mode création
      this.resetForm();
      this.applyContext();
    }
  }

  private resetForm(): void {
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 heure

    this.eventForm = {
      title: '',
      description: '',
      location: '',
      start_datetime: now,
      end_datetime: endTime,
      category: '',
      status: 'planned',
      tags: '',
      project_id: undefined,
      is_recurring: false,
      recurrence_pattern: undefined
    };

    // Initialize UI form properties
    this.all_day = false;
    this.start_date = now.toISOString().split('T')[0];
    this.start_time = now.toTimeString().slice(0, 5);
    this.end_date = endTime.toISOString().split('T')[0];
    this.end_time = endTime.toTimeString().slice(0, 5);
    this.recurrence_frequency = 'weekly';
    this.recurrence_interval = 1;
    this.recurrence_end_date = '';

    this.eventTags = [];
    this.eventParticipants = [];
    this.selectedContactId = '';
    this.newParticipantEmail = '';
    this.errors = {};
  }

  private applyContext(): void {
    if (!this.context || this.context.type === 'normal') return;

    switch (this.context.type) {
      case 'project':
        this.eventForm.project_id = this.context.id;
        this.eventForm.category = 'project';
        break;
      case 'company':
        this.eventForm.category = 'meeting';
        break;
      case 'contact':
        this.eventForm.category = 'meeting';
        break;
      case 'calendar':
        if (this.context.date) {
          const date = new Date(this.context.date);
          
          // Si une heure spécifique est fournie, l'utiliser
          if (this.context.time) {
            const [hours, minutes] = this.context.time.split(':').map(Number);
            date.setHours(hours || 0, minutes || 0, 0, 0);
            this.start_time = this.context.time;
            
            // Heure de fin : +1 heure par défaut
            const endTime = new Date(date.getTime() + 60 * 60 * 1000);
            this.end_time = endTime.toTimeString().slice(0, 5);
            this.eventForm.end_datetime = endTime;
          } else {
            // Heure par défaut si pas d'heure spécifique
            const now = new Date();
            date.setHours(now.getHours(), now.getMinutes(), 0, 0);
            this.start_time = now.toTimeString().slice(0, 5);
            
            const endTime = new Date(date.getTime() + 60 * 60 * 1000);
            this.end_time = endTime.toTimeString().slice(0, 5);
            this.eventForm.end_datetime = endTime;
          }
          
          this.eventForm.start_datetime = date;
          this.start_date = this.context.date;
          this.end_date = this.context.date;
        }
        break;
    }
  }

  private loadData(): void {
    // Charger les données disponibles
    this.loadProjects();
    this.loadCompanies();
    this.loadContacts();
  }

  private loadProjects(): void {
    // TODO: Implémenter le chargement des projets depuis l'API
    this.availableProjects = [
      { id: 1, title: 'Projet Alpha', company_id: 1 } as Project,
      { id: 2, title: 'Projet Beta', company_id: 2 } as Project
    ];
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

  onStartDateChange(): void {
    // Mettre à jour la datetime de début
    if (this.start_date) {
      const [hours, minutes] = this.start_time.split(':').map(Number);
      const newStartDate = new Date(this.start_date);
      newStartDate.setHours(hours || 0, minutes || 0, 0, 0);
      this.eventForm.start_datetime = newStartDate;

      // Si la date de fin est antérieure à la date de début, ajuster
      if (this.end_date && this.end_date < this.start_date) {
        this.end_date = this.start_date;
        this.eventForm.end_datetime = new Date(newStartDate.getTime() + 60 * 60 * 1000);
        this.end_time = new Date(this.eventForm.end_datetime).toTimeString().slice(0, 5);
      }
    }
  }

  onEndDateChange(): void {
    // Mettre à jour la datetime de fin
    if (this.end_date) {
      const [hours, minutes] = this.end_time.split(':').map(Number);
      const newEndDate = new Date(this.end_date);
      newEndDate.setHours(hours || 0, minutes || 0, 0, 0);
      this.eventForm.end_datetime = newEndDate;

      // Si la date de fin est antérieure à la date de début, ajuster
      if (this.start_date && this.end_date < this.start_date) {
        this.start_date = this.end_date;
        this.eventForm.start_datetime = new Date(newEndDate.getTime() - 60 * 60 * 1000);
        this.start_time = new Date(this.eventForm.start_datetime).toTimeString().slice(0, 5);
      }
    }
  }

  onAllDayChange(): void {
    if (this.all_day) {
      this.start_time = '';
      this.end_time = '';
      // Pour les événements toute la journée, utiliser la même date pour début et fin
      // avec des heures différentes pour éviter les problèmes de fuseau horaire
      const startDate = new Date(this.start_date);
      startDate.setHours(0, 0, 0, 0);
      this.eventForm.start_datetime = startDate;

      // Utiliser la même date mais à 23:59:00 pour éviter les problèmes de fuseau
      const endDate = new Date(this.start_date); // Même date que le début
      endDate.setHours(23, 59, 0, 0); // 23:59:00 au lieu de 23:59:59.999
      this.eventForm.end_datetime = endDate;
      
      // Mettre à jour end_date pour qu'elle soit identique à start_date
      this.end_date = this.start_date;
    } else {
      // Remettre des heures par défaut
      const now = new Date();
      this.start_time = now.toTimeString().slice(0, 5);
      this.end_time = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
      this.updateDatetimesFromForm();
    }
  }

  onRecurringChange(): void {
    if (!this.eventForm.is_recurring) {
      this.recurrence_frequency = 'weekly';
      this.recurrence_interval = 1;
      this.recurrence_end_date = '';
      this.eventForm.recurrence_pattern = undefined;
    } else {
      this.eventForm.recurrence_pattern = {
        frequency: this.recurrence_frequency,
        interval: this.recurrence_interval,
        end_date: this.recurrence_end_date ? new Date(this.recurrence_end_date) : undefined
      };
    }
  }

  validateField(fieldName: string): void {
    switch (fieldName) {
      case 'title':
        if (!this.eventForm.title || this.eventForm.title.trim() === '') {
          this.errors['title'] = 'Le titre est obligatoire';
        } else {
          delete this.errors['title'];
        }
        break;
      case 'start_date':
        if (!this.start_date) {
          this.errors['start_date'] = 'La date de début est obligatoire';
        } else {
          delete this.errors['start_date'];
        }
        break;
      case 'end_date':
        if (!this.end_date) {
          this.errors['end_date'] = 'La date de fin est obligatoire';
        } else if (this.start_date && this.end_date < this.start_date) {
          this.errors['end_date'] = 'La date de fin doit être postérieure à la date de début';
        } else {
          delete this.errors['end_date'];
        }
        break;
    }
  }

  onTagsChange(tags: string[]): void {
    this.eventTags = tags;
    this.eventForm.tags = this.tagsService.formatTagsArray(tags);
  }

  addContactAsParticipant(): void {
    if (this.selectedContactId) {
      const contact = this.availableContacts.find(c => c.id.toString() === this.selectedContactId);
      if (contact) {
        const participantEmail = `${contact.first_name} ${contact.last_name} <${contact.email}>`;
        if (!this.eventParticipants.includes(participantEmail)) {
          this.eventParticipants.push(participantEmail);
        }
        this.selectedContactId = '';
      }
    }
  }

  addManualParticipant(): void {
    if (this.newParticipantEmail.trim()) {
      if (!this.eventParticipants.includes(this.newParticipantEmail.trim())) {
        this.eventParticipants.push(this.newParticipantEmail.trim());
      }
      this.newParticipantEmail = '';
    }
  }

  removeParticipant(index: number): void {
    this.eventParticipants.splice(index, 1);
  }

  onQuickAction(template: EventTemplate): void {
    Object.assign(this.eventForm, template.data);
    
    // Incrémenter les compteurs d'utilisation des tags
    if (template.data.tags) {
      const tags = this.tagsService.parseTagsString(template.data.tags);
      this.tagsService.incrementTagUsage(tags, 'event').subscribe();
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

    // Mettre à jour les datetimes avant la sauvegarde
    this.updateDatetimesFromForm();

    // Préparer les données
    const eventData = {
      ...this.eventForm,
      all_day: this.all_day, // Inclure le booléen all_day
      tags: this.tagsService.formatTagsArray(this.eventTags),
      participants: this.eventParticipants.length > 0 ? this.eventParticipants : undefined
    };

    // Incrémenter les compteurs d'utilisation des tags
    if (this.eventTags.length > 0) {
      this.tagsService.incrementTagUsage(this.eventTags, 'event').subscribe();
    }

    this.save.emit({
      event: this.editingEvent,
      data: eventData
    });

    // Simuler un délai de sauvegarde
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onDelete(): void {
    if (this.editingEvent) {
      // Confirmation avant suppression
      if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${this.editingEvent.title}" ?`)) {
        this.delete.emit(this.editingEvent);
      }
    }
  }

  private updateDatetimesFromForm(): void {
    // Mettre à jour start_datetime
    if (this.start_date) {
      if (this.all_day) {
        // Pour les événements toute la journée, utiliser 00:00:00
        const startDate = new Date(this.start_date);
        startDate.setHours(0, 0, 0, 0);
        this.eventForm.start_datetime = startDate;
      } else if (this.start_time) {
        const [hours, minutes] = this.start_time.split(':').map(Number);
        const startDate = new Date(this.start_date);
        startDate.setHours(hours || 0, minutes || 0, 0, 0);
        this.eventForm.start_datetime = startDate;
      }
    }

    // Mettre à jour end_datetime
    if (this.end_date) {
      if (this.all_day) {
        // Pour les événements toute la journée, utiliser la même date que start_date
        // avec 23:59:00 pour éviter les problèmes de fuseau horaire
        const endDate = new Date(this.start_date); // Utiliser start_date au lieu de end_date
        endDate.setHours(23, 59, 0, 0); // 23:59:00 au lieu de 23:59:59.999
        this.eventForm.end_datetime = endDate;
      } else if (this.end_time) {
        const [hours, minutes] = this.end_time.split(':').map(Number);
        const endDate = new Date(this.end_date);
        endDate.setHours(hours || 0, minutes || 0, 0, 0);
        this.eventForm.end_datetime = endDate;
      }
    }
  }
}