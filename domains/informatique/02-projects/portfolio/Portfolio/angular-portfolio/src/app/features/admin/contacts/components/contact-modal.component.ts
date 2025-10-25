import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { TabbedModalComponent, TabConfig } from '../../../../shared/components/tabbed-modal/tabbed-modal.component';
import { TagInputComponent } from '../../../../shared/components/tag-input/tag-input.component';
import { TagsService } from '../../../../shared/services/tags.service';
import { Contact, ContactCreate, ContactUpdate } from '../../../../models/contact.model';
import { Company } from '../../../../models/company.model';

export interface ContactContext {
  type: 'company' | 'project' | 'normal';
  id?: number;
  entity?: Company;
}

export interface ContactTemplate {
  label: string;
  description: string;
  data: Partial<ContactCreate>;
}

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TabbedModalComponent, TagInputComponent],
  providers: [TagsService],
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
        <!-- Onglet 1: Identité -->
        <div *ngIf="index === 0" class="tab-content">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Prénom</label>
              <input 
                type="text" 
                class="form-input"
                [(ngModel)]="contactForm.first_name"
                placeholder="Prénom"
                (blur)="validateField('first_name')">
              <div *ngIf="errors['first_name']" class="form-error">{{ errors['first_name'] }}</div>
            </div>

            <div class="form-group">
              <label class="form-label required">Nom</label>
              <input 
                type="text" 
                class="form-input"
                [(ngModel)]="contactForm.last_name"
                placeholder="Nom de famille"
                (blur)="validateField('last_name')">
              <div *ngIf="errors['last_name']" class="form-error">{{ errors['last_name'] }}</div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input 
                type="email" 
                class="form-input"
                [(ngModel)]="contactForm.email"
                placeholder="email@example.com"
                (blur)="validateField('email')">
              <div *ngIf="errors['email']" class="form-error">{{ errors['email'] }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <input 
                type="tel" 
                class="form-input"
                [(ngModel)]="contactForm.phone"
                placeholder="+33 1 23 45 67 89">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mobile</label>
            <input 
              type="tel" 
              class="form-input"
              [(ngModel)]="contactForm.mobile"
              placeholder="+33 6 12 34 56 78">
          </div>

          <div class="form-group">
            <label class="form-label">Photo URL</label>
            <input 
              type="url" 
              class="form-input"
              [(ngModel)]="contactForm.photo_url"
              placeholder="https://example.com/photo.jpg">
          </div>
        </div>

        <!-- Onglet 2: Professionnel -->
        <div *ngIf="index === 1" class="tab-content">
          <div class="form-group">
            <label class="form-label">Entreprise</label>
            <select class="form-select" [(ngModel)]="contactForm.company_id">
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
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Poste</label>
              <input 
                type="text" 
                class="form-input"
                [(ngModel)]="contactForm.position"
                placeholder="CEO, CTO, Manager, etc.">
            </div>

            <div class="form-group">
              <label class="form-label">Département</label>
              <input 
                type="text" 
                class="form-input"
                [(ngModel)]="contactForm.department"
                placeholder="IT, Marketing, Sales, etc.">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Statut</label>
            <select class="form-select" [(ngModel)]="contactForm.status">
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        <!-- Onglet 3: Informations Supplémentaires -->
        <div *ngIf="index === 2" class="tab-content">
          <div class="form-group">
            <label class="form-label">Tags</label>
            <app-tag-input
              [(ngModel)]="contactTags"
              entityType="contact"
              placeholder="Ajouter des tags..."
              helpText="Séparez les tags par des virgules"
              (tagsChange)="onTagsChange($event)">
            </app-tag-input>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="contactForm.notes"
              rows="5"
              placeholder="Notes sur le contact, historique, préférences, etc.">
            </textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Informations supplémentaires</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="additionalNotes"
              rows="3"
              placeholder="Informations complémentaires, contexte, etc.">
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

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
  `]
})
export class ContactModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() editingContact: Contact | null = null;
  @Input() context: ContactContext = { type: 'normal' };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{contact: any, data: ContactCreate | ContactUpdate}>();

  private destroy$ = new Subject<void>();

  // Form data
  contactForm: ContactCreate = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    department: '',
    status: 'active',
    notes: '',
    tags: '',
    photo_url: '',
    company_id: undefined
  };

  contactTags: string[] = [];
  additionalNotes: string = '';
  errors: {[key: string]: string} = {};

  // UI state
  isLoading: boolean = false;
  activeTabIndex: number = 0;

  // Data
  availableCompanies: Company[] = [];

  // Templates rapides
  quickActionTemplates: ContactTemplate[] = [
    {
      label: 'Contact Principal',
      description: 'Créer un contact principal avec statut actif',
      data: { status: 'active', position: 'CEO' }
    },
    {
      label: 'Contact Secondaire',
      description: 'Créer un contact secondaire',
      data: { status: 'active', position: 'Manager' }
    },
    {
      label: 'Contact Technique',
      description: 'Créer un contact technique',
      data: { status: 'active', position: 'CTO', department: 'IT' }
    }
  ];

  tabs: TabConfig[] = [
    { id: 'identity', label: 'Identité', icon: 'user', required: true },
    { id: 'professional', label: 'Professionnel', icon: 'settings' },
    { id: 'additional', label: 'Informations Supplémentaires', icon: 'tag' }
  ];

  constructor(private tagsService: TagsService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingContact'] && this.isVisible) {
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
    return this.editingContact ? 'Modifier le contact' : 'Nouveau contact';
  }

  get saveButtonText(): string {
    return this.editingContact ? 'Modifier' : 'Créer';
  }

  get isEditing(): boolean {
    return !!this.editingContact;
  }

  get isFormValid(): boolean {
    return !!(this.contactForm.first_name?.trim() && 
              this.contactForm.last_name?.trim());
  }

  private initializeForm(): void {
    if (this.editingContact) {
      // Mode édition
      this.contactForm = { ...this.editingContact };
      this.contactTags = this.tagsService.parseTagsString(this.contactForm.tags || '');
    } else {
      // Mode création
      this.resetForm();
      this.applyContext();
    }
  }

  private resetForm(): void {
    this.contactForm = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      mobile: '',
      position: '',
      department: '',
      status: 'active',
      notes: '',
      tags: '',
      photo_url: '',
      company_id: undefined
    };
    this.contactTags = [];
    this.additionalNotes = '';
    this.errors = {};
  }

  private applyContext(): void {
    if (!this.context || this.context.type === 'normal') return;

    switch (this.context.type) {
      case 'company':
        this.contactForm.company_id = this.context.id;
        break;
      case 'project':
        // Si on crée un contact depuis un projet, on peut pré-remplir l'entreprise du projet
        break;
    }
  }

  private loadData(): void {
    // Charger les entreprises disponibles
    this.loadCompanies();
  }

  private loadCompanies(): void {
    // TODO: Implémenter le chargement des entreprises depuis l'API
    this.availableCompanies = [
      { id: 1, name: 'TechCorp', industry: 'Technology' } as Company,
      { id: 2, name: 'DesignStudio', industry: 'Design' } as Company
    ];
  }

  validateField(fieldName: string): void {
    const value = this.contactForm[fieldName as keyof ContactCreate];
    
    switch (fieldName) {
      case 'first_name':
        if (!value || (value as string).trim() === '') {
          this.errors['first_name'] = 'Le prénom est obligatoire';
        } else {
          delete this.errors['first_name'];
        }
        break;
      case 'last_name':
        if (!value || (value as string).trim() === '') {
          this.errors['last_name'] = 'Le nom est obligatoire';
        } else {
          delete this.errors['last_name'];
        }
        break;
      case 'email':
        if (value && !this.isValidEmail(value as string)) {
          this.errors['email'] = 'Format d\'email invalide';
        } else {
          delete this.errors['email'];
        }
        break;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onTagsChange(tags: string[]): void {
    this.contactTags = tags;
    this.contactForm.tags = this.tagsService.formatTagsArray(tags);
  }

  onQuickAction(template: ContactTemplate): void {
    Object.assign(this.contactForm, template.data);
    
    // Incrémenter les compteurs d'utilisation des tags
    if (template.data.tags) {
      const tags = this.tagsService.parseTagsString(template.data.tags);
      this.tagsService.incrementTagUsage(tags, 'contact').subscribe();
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
    const contactData = {
      ...this.contactForm,
      tags: this.tagsService.formatTagsArray(this.contactTags)
    };

    // Incrémenter les compteurs d'utilisation des tags
    if (this.contactTags.length > 0) {
      this.tagsService.incrementTagUsage(this.contactTags, 'contact').subscribe();
    }

    this.save.emit({
      contact: this.editingContact,
      data: contactData
    });

    // Simuler un délai de sauvegarde
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onDelete(): void {
    // TODO: Implémenter la suppression si nécessaire
    console.log('Delete contact');
  }
}
