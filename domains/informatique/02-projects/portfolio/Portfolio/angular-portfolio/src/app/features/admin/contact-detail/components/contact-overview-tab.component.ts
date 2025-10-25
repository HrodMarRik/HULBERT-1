import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContactResponse, ContactDetailResponse } from '../../../../models/contact.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { ContactStateService } from '../services/contact-state.service';

@Component({
  selector: 'app-contact-overview-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent],
  template: `
    <div class="contact-overview">
      <!-- Contact Header -->
      <div class="contact-header">
        <div class="contact-avatar-section">
          <div class="contact-avatar">
            {{ getContactInitials(contact) }}
          </div>
          <div class="contact-name-section">
            <div class="contact-name-field">
              <label>Prénom:</label>
              <app-editable-field
                [value]="contact?.first_name || ''"
                [fieldType]="'text'"
                [fieldName]="'first_name'"
                placeholder="Prénom"
                (valueChanged)="updateContactField('first_name', $event)">
              </app-editable-field>
            </div>
            <div class="contact-name-field">
              <label>Nom:</label>
              <app-editable-field
                [value]="contact?.last_name || ''"
                [fieldType]="'text'"
                [fieldName]="'last_name'"
                placeholder="Nom"
                (valueChanged)="updateContactField('last_name', $event)">
              </app-editable-field>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Details -->
      <div class="contact-details">
        <div class="contact-detail-item">
          <label>Email:</label>
          <app-editable-field
            [value]="contact?.email || ''"
            [fieldType]="'email'"
            [fieldName]="'email'"
            placeholder="email@example.com"
            (valueChanged)="updateContactField('email', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Téléphone:</label>
          <app-editable-field
            [value]="contact?.phone || ''"
            [fieldType]="'tel'"
            [fieldName]="'phone'"
            placeholder="+33 1 23 45 67 89"
            (valueChanged)="updateContactField('phone', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Mobile:</label>
          <app-editable-field
            [value]="contact?.mobile || ''"
            [fieldType]="'tel'"
            [fieldName]="'mobile'"
            placeholder="+33 6 12 34 56 78"
            (valueChanged)="updateContactField('mobile', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Fonction:</label>
          <app-editable-field
            [value]="contact?.position || ''"
            [fieldType]="'text'"
            [fieldName]="'position'"
            placeholder="Fonction"
            (valueChanged)="updateContactField('position', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Département:</label>
          <app-editable-field
            [value]="contact?.department || ''"
            [fieldType]="'text'"
            [fieldName]="'department'"
            placeholder="Département"
            (valueChanged)="updateContactField('department', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Statut:</label>
          <app-editable-field
            [value]="contact?.status || ''"
            [fieldType]="'text'"
            [fieldName]="'status'"
            placeholder="Statut"
            (valueChanged)="updateContactField('status', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Tags:</label>
          <app-editable-field
            [value]="contact?.tags || ''"
            [fieldType]="'text'"
            [fieldName]="'tags'"
            placeholder="Tags"
            (valueChanged)="updateContactField('tags', $event)">
          </app-editable-field>
        </div>
        
        <div class="contact-detail-item">
          <label>Notes:</label>
          <app-editable-field
            [value]="contact?.notes || ''"
            [fieldType]="'textarea'"
            [fieldName]="'notes'"
            placeholder="Notes sur le contact"
            (valueChanged)="updateContactField('notes', $event)">
          </app-editable-field>
        </div>
      </div>

      <!-- Contact Stats -->
      <div class="contact-stats">
        <div class="stat-item">
          <div class="stat-value">{{ companiesCount }}</div>
          <div class="stat-label">Entreprises</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ projectsCount }}</div>
          <div class="stat-label">Projets</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ documentsCount }}</div>
          <div class="stat-label">Documents</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getPrimaryCompany() ? 'Oui' : 'Non' }}</div>
          <div class="stat-label">Contact Principal</div>
        </div>
      </div>

      <!-- Contact Metadata -->
      <div class="contact-metadata">
        <div class="metadata-item">
          <label>Créé le:</label>
          <span>{{ contact?.created_at | date:'dd/MM/yyyy à HH:mm' }}</span>
        </div>
        <div class="metadata-item">
          <label>Modifié le:</label>
          <span>{{ contact?.updated_at | date:'dd/MM/yyyy à HH:mm' }}</span>
        </div>
        <div class="metadata-item">
          <label>ID:</label>
          <span>{{ contact?.id }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-overview {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .contact-header {
      margin-bottom: 32px;
    }

    .contact-avatar-section {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .contact-avatar {
      width: 80px;
      height: 80px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 24px;
      flex-shrink: 0;
    }

    .contact-name-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }

    .contact-name-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .contact-name-field label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .contact-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .contact-detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .contact-detail-item label {
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
    }

    .contact-stats {
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

    .contact-metadata {
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
      .contact-overview {
        padding: 16px;
      }

      .contact-avatar-section {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .contact-details {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .contact-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }
  `]
})
export class ContactOverviewTabComponent implements OnInit, OnDestroy {
  @Input() contact: ContactResponse | null = null;
  @Output() updateContact = new EventEmitter<{field: string, value: any}>();

  private destroy$ = new Subject<void>();

  // Computed properties
  companiesCount = 0;
  projectsCount = 0;
  documentsCount = 0;

  constructor(private contactStateService: ContactStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.contactStateService.contactState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.contact = state.contact;
        this.companiesCount = state.companyRoles.length;
        this.projectsCount = state.projectRoles.length;
        this.documentsCount = state.documents.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateContactField(field: string, value: any): void {
    this.updateContact.emit({ field, value });
  }

  getContactInitials(contact: ContactResponse | null): string {
    if (!contact) return '??';
    return `${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase();
  }

  getPrimaryCompany(): any {
    return this.contactStateService.getPrimaryCompany();
  }
}
