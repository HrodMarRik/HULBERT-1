import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompanyResponse } from '../../../../models/company.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { CompanyStateService } from '../services/company-state.service';

@Component({
  selector: 'app-company-overview-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent],
  template: `
    <div class="company-overview">
      <!-- Company Header -->
      <div class="company-header">
        <div class="company-title-section">
          <div class="company-title-field">
            <label>Nom de l'entreprise:</label>
            <app-editable-field
              [value]="company?.name || ''"
              [fieldType]="'text'"
              [fieldName]="'name'"
              placeholder="Nom de l'entreprise"
              (valueChanged)="updateCompanyField('name', $event)">
            </app-editable-field>
          </div>
          <div class="company-industry-field">
            <label>Secteur d'activité:</label>
            <app-editable-field
              [value]="company?.industry || ''"
              [fieldType]="'text'"
              [fieldName]="'industry'"
              placeholder="Secteur d'activité"
              (valueChanged)="updateCompanyField('industry', $event)">
            </app-editable-field>
          </div>
        </div>
      </div>

      <!-- Company Details -->
      <div class="company-details">
        <div class="company-detail-item">
          <label>Notes:</label>
          <app-editable-field
            [value]="company?.notes || ''"
            [fieldType]="'textarea'"
            [fieldName]="'notes'"
            placeholder="Notes sur l'entreprise"
            (valueChanged)="updateCompanyField('notes', $event)">
          </app-editable-field>
        </div>
        
        <div class="company-detail-item">
          <label>Site web:</label>
          <app-editable-field
            [value]="company?.website || ''"
            [fieldType]="'url'"
            [fieldName]="'website'"
            [placeholder]="'https://www.example.com'"
            (valueChanged)="updateCompanyField('website', $event)">
          </app-editable-field>
        </div>
        
        <div class="company-detail-item">
          <label>Téléphone:</label>
          <app-editable-field
            [value]="company?.phone || ''"
            [fieldType]="'tel'"
            [fieldName]="'phone'"
            [placeholder]="'+33 1 23 45 67 89'"
            (valueChanged)="updateCompanyField('phone', $event)">
          </app-editable-field>
        </div>
        
        <div class="company-detail-item">
          <label>Email:</label>
          <app-editable-field
            [value]="company?.email || ''"
            [fieldType]="'email'"
            [fieldName]="'email'"
            [placeholder]="'contact@entreprise.com'"
            (valueChanged)="updateCompanyField('email', $event)">
          </app-editable-field>
        </div>
        
        <div class="company-detail-item">
          <label>Adresse:</label>
          <app-editable-field
            [value]="company?.address || ''"
            [fieldType]="'textarea'"
            [fieldName]="'address'"
            [placeholder]="'Adresse complète'"
            (valueChanged)="updateCompanyField('address', $event)">
          </app-editable-field>
        </div>
        
        <div class="company-detail-item">
          <label>Statut:</label>
          <app-editable-field
            [value]="company?.status || ''"
            [fieldType]="'text'"
            [fieldName]="'status'"
            [placeholder]="'Statut'"
            (valueChanged)="updateCompanyField('status', $event)">
          </app-editable-field>
        </div>
        
        <div class="company-detail-item">
          <label>Tags:</label>
          <app-editable-field
            [value]="company?.tags || ''"
            [fieldType]="'text'"
            [fieldName]="'tags'"
            [placeholder]="'Tags'"
            (valueChanged)="updateCompanyField('tags', $event)">
          </app-editable-field>
        </div>
      </div>

      <!-- Company Stats -->
      <div class="company-stats">
        <div class="stat-item">
          <div class="stat-value">{{ contactsCount }}</div>
          <div class="stat-label">Contacts</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ projectsCount }}</div>
          <div class="stat-label">Projets</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ activeProjectsCount }}</div>
          <div class="stat-label">Projets Actifs</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ completedProjectsCount }}</div>
          <div class="stat-label">Projets Terminés</div>
        </div>
      </div>

      <!-- Company Metadata -->
      <div class="company-metadata">
        <div class="metadata-item">
          <label>Créé le:</label>
          <span>{{ company?.created_at | date:'dd/MM/yyyy à HH:mm' }}</span>
        </div>
        <div class="metadata-item">
          <label>Modifié le:</label>
          <span>{{ company?.updated_at | date:'dd/MM/yyyy à HH:mm' }}</span>
        </div>
        <div class="metadata-item">
          <label>ID:</label>
          <span>{{ company?.id }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-overview {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .company-header {
      margin-bottom: 32px;
    }

    .company-title-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    .company-title-field,
    .company-industry-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .company-title-field label,
    .company-industry-field label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .company-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .company-detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .company-detail-item label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .company-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
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

    .company-metadata {
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
      padding: 20px;
    }

    .metadata-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #333;
    }

    .metadata-item:last-child {
      border-bottom: none;
    }

    .metadata-item label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .metadata-item span {
      font-size: 14px;
      color: #9ca3af;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .company-overview {
        padding: 16px;
      }

      .company-details {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .company-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .company-title-section {
        gap: 12px;
      }
    }
  `]
})
export class CompanyOverviewTabComponent implements OnInit, OnDestroy {
  @Input() company: CompanyResponse | null = null;
  @Output() updateCompany = new EventEmitter<{field: string, value: any}>();

  private destroy$ = new Subject<void>();

  // Computed properties
  contactsCount = 0;
  projectsCount = 0;
  activeProjectsCount = 0;
  completedProjectsCount = 0;

  constructor(private companyStateService: CompanyStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.companyStateService.companyState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.company = state.company;
        this.contactsCount = state.contacts.length;
        this.projectsCount = state.projects.length;
        this.activeProjectsCount = state.projects.filter(p => p.status === 'active').length;
        this.completedProjectsCount = state.projects.filter(p => p.status === 'completed').length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateCompanyField(field: string, value: any): void {
    this.updateCompany.emit({ field, value });
  }
}
