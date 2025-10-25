import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { TabbedModalComponent, TabConfig } from '../../../../shared/components/tabbed-modal/tabbed-modal.component';
import { TagInputComponent } from '../../../../shared/components/tag-input/tag-input.component';
import { TagsService } from '../../../../shared/services/tags.service';
import { Company, CompanyCreate, CompanyUpdate } from '../../../../models/company.model';
import { Contact } from '../../../../models/contact.model';

export interface CompanyContext {
  type: 'contact' | 'project' | 'normal';
  id?: number;
  entity?: Contact;
}

export interface CompanyTemplate {
  label: string;
  description: string;
  data: Partial<CompanyCreate>;
}

@Component({
  selector: 'app-company-modal',
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
        <!-- Onglet 1: Informations Principales -->
        <div *ngIf="index === 0" class="tab-content">
          <div class="form-group">
            <label class="form-label required">Nom de l'entreprise</label>
            <input 
              type="text" 
              class="form-input"
              [(ngModel)]="companyForm.name"
              placeholder="Nom de l'entreprise"
              (blur)="validateField('name')">
            <div *ngIf="errors['name']" class="form-error">{{ errors['name'] }}</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Industrie</label>
              <select class="form-select" [(ngModel)]="companyForm.industry">
                <option value="">Sélectionner une industrie</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Statut</label>
              <select class="form-select" [(ngModel)]="companyForm.status">
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Site web</label>
              <input 
                type="url" 
                class="form-input"
                [(ngModel)]="companyForm.website"
                placeholder="https://www.example.com">
            </div>

            <div class="form-group">
              <label class="form-label">Logo URL</label>
              <input 
                type="url" 
                class="form-input"
                [(ngModel)]="companyForm.logo_url"
                placeholder="https://example.com/logo.png">
            </div>
          </div>
        </div>

        <!-- Onglet 2: Contact & Adresse -->
        <div *ngIf="index === 1" class="tab-content">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input 
                type="email" 
                class="form-input"
                [(ngModel)]="companyForm.email"
                placeholder="contact@entreprise.com">
            </div>

            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <input 
                type="tel" 
                class="form-input"
                [(ngModel)]="companyForm.phone"
                placeholder="+33 1 23 45 67 89">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Adresse</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="companyForm.address"
              rows="3"
              placeholder="Adresse complète de l'entreprise">
            </textarea>
          </div>

          <div class="form-info" *ngIf="context?.type === 'contact'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            <span>Informations pré-remplies depuis le contact</span>
          </div>
        </div>

        <!-- Onglet 3: Notes & Tags -->
        <div *ngIf="index === 2" class="tab-content">
          <div class="form-group">
            <label class="form-label">Tags</label>
            <app-tag-input
              [(ngModel)]="companyTags"
              entityType="company"
              placeholder="Ajouter des tags..."
              helpText="Séparez les tags par des virgules"
              (tagsChange)="onTagsChange($event)">
            </app-tag-input>
          </div>

          <div class="form-group">
            <label class="form-label">Notes internes</label>
            <textarea 
              class="form-textarea"
              [(ngModel)]="companyForm.notes"
              rows="5"
              placeholder="Notes internes sur l'entreprise, historique, etc.">
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
export class CompanyModalComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() editingCompany: Company | null = null;
  @Input() context: CompanyContext = { type: 'normal' };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{company: any, data: CompanyCreate | CompanyUpdate}>();

  private destroy$ = new Subject<void>();

  // Form data
  companyForm: CompanyCreate = {
    name: '',
    industry: '',
    website: '',
    address: '',
    phone: '',
    email: '',
    status: 'prospect',
    notes: '',
    tags: '',
    logo_url: ''
  };

  companyTags: string[] = [];
  additionalNotes: string = '';
  errors: {[key: string]: string} = {};

  // UI state
  isLoading: boolean = false;
  activeTabIndex: number = 0;

  // Templates rapides
  quickActionTemplates: CompanyTemplate[] = [
    {
      label: 'Nouveau Client',
      description: 'Créer une entreprise avec statut client',
      data: { status: 'client' }
    },
    {
      label: 'Nouveau Prospect',
      description: 'Créer une entreprise avec statut prospect',
      data: { status: 'prospect' }
    },
    {
      label: 'Entreprise Tech',
      description: 'Créer une entreprise technologique',
      data: { industry: 'Technology', status: 'prospect' }
    }
  ];

  tabs: TabConfig[] = [
    { id: 'main', label: 'Informations Principales', icon: 'info', required: true },
    { id: 'contact', label: 'Contact & Adresse', icon: 'user' },
    { id: 'notes', label: 'Notes & Tags', icon: 'tag' }
  ];

  constructor(@Inject(TagsService) private tagsService: TagsService) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modalTitle(): string {
    return this.editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise';
  }

  get saveButtonText(): string {
    return this.editingCompany ? 'Modifier' : 'Créer';
  }

  get isEditing(): boolean {
    return !!this.editingCompany;
  }

  get isFormValid(): boolean {
    return !!(this.companyForm.name?.trim());
  }

  private initializeForm(): void {
    if (this.editingCompany) {
      // Mode édition
      this.companyForm = { ...this.editingCompany };
      this.companyTags = this.tagsService.parseTagsString(this.companyForm.tags || '');
    } else {
      // Mode création
      this.resetForm();
      this.applyContext();
    }
  }

  private resetForm(): void {
    this.companyForm = {
      name: '',
      industry: '',
      website: '',
      address: '',
      phone: '',
      email: '',
      status: 'prospect',
      notes: '',
      tags: '',
      logo_url: ''
    };
    this.companyTags = [];
    this.additionalNotes = '';
    this.errors = {};
  }

  private applyContext(): void {
    if (!this.context || this.context.type === 'normal') return;

    switch (this.context.type) {
      case 'contact':
        // Pré-remplir avec les informations du contact si disponibles
        if (this.context.entity) {
          const contact = this.context.entity;
          this.companyForm.email = contact.email || '';
          this.companyForm.phone = contact.phone || '';
        }
        break;
      case 'project':
        // Si on crée une entreprise depuis un projet, on peut pré-remplir certaines infos
        break;
    }
  }

  validateField(fieldName: string): void {
    const value = this.companyForm[fieldName as keyof CompanyCreate];
    
    switch (fieldName) {
      case 'name':
        if (!value || (value as string).trim() === '') {
          this.errors['name'] = 'Le nom de l\'entreprise est obligatoire';
        } else {
          delete this.errors['name'];
        }
        break;
      case 'email':
        if (value && !this.isValidEmail(value as string)) {
          this.errors['email'] = 'Format d\'email invalide';
        } else {
          delete this.errors['email'];
        }
        break;
      case 'website':
        if (value && !this.isValidUrl(value as string)) {
          this.errors['website'] = 'Format d\'URL invalide';
        } else {
          delete this.errors['website'];
        }
        break;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onTagsChange(tags: string[]): void {
    this.companyTags = tags;
    this.companyForm.tags = this.tagsService.formatTagsArray(tags);
  }

  onQuickAction(template: CompanyTemplate): void {
    Object.assign(this.companyForm, template.data);
    
    // Incrémenter les compteurs d'utilisation des tags
    if (template.data.tags) {
      const tags = this.tagsService.parseTagsString(template.data.tags);
      this.tagsService.incrementTagUsage(tags, 'company').subscribe();
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
    const companyData = {
      ...this.companyForm,
      tags: this.tagsService.formatTagsArray(this.companyTags)
    };

    // Incrémenter les compteurs d'utilisation des tags
    if (this.companyTags.length > 0) {
      this.tagsService.incrementTagUsage(this.companyTags, 'company').subscribe();
    }

    this.save.emit({
      company: this.editingCompany,
      data: companyData
    });

    // Simuler un délai de sauvegarde
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onDelete(): void {
    // TODO: Implémenter la suppression si nécessaire
    console.log('Delete company');
  }
}
