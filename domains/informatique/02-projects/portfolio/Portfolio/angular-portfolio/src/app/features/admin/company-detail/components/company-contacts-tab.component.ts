import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompanyContact, ContactResponse } from '../../../../models/company.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { CompanyStateService } from '../services/company-state.service';

@Component({
  selector: 'app-company-contacts-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditableFieldComponent],
  template: `
    <div class="company-contacts">
      <!-- Contacts Header -->
      <div class="contacts-header">
        <div class="section-title">
          <h3>Contacts de l'entreprise ({{ contacts.length }})</h3>
        </div>
        
        <div class="contacts-actions">
          <button class="btn-primary" (click)="onAddContact()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Ajouter Contact
          </button>
        </div>
      </div>

      <!-- Contacts List -->
      <div class="contacts-list">
        <div class="contact-card" *ngFor="let contact of contacts">
          <div class="contact-header">
            <div class="contact-avatar">
              {{ getContactInitials(contact.contact) }}
            </div>
            
            <div class="contact-info">
              <div class="contact-name">
                <a [routerLink]="['/admin/contacts', contact.contact?.id]" class="contact-link">
                  {{ contact.contact?.first_name }} {{ contact.contact?.last_name }}
                </a>
                <span class="primary-badge" *ngIf="contact.is_primary">Principal</span>
              </div>
              
              <div class="contact-details">
                <div class="contact-email">
                  <app-editable-field
                    [value]="contact.contact?.email || ''"
                    [fieldType]="'email'"
                    [fieldName]="'email'"
                    [placeholder]="'Email'"
                    (valueChanged)="onUpdateContactField(contact, 'email', $event)">
                  </app-editable-field>
                </div>
                
                <div class="contact-phone">
                  <app-editable-field
                    [value]="contact.contact?.phone || ''"
                    [fieldType]="'tel'"
                    [fieldName]="'phone'"
                    [placeholder]="'Téléphone'"
                    (valueChanged)="onUpdateContactField(contact, 'phone', $event)">
                  </app-editable-field>
                </div>
              </div>
            </div>
          </div>
          
          <div class="contact-roles">
            <div class="role-item">
              <label>Rôle:</label>
              <app-editable-field
                [value]="contact.role || ''"
                [fieldType]="'text'"
                [fieldName]="'role'"
                placeholder="Rôle dans l'entreprise"
                (valueChanged)="onUpdateContactRole(contact, 'role', $event)">
              </app-editable-field>
            </div>
            
            <div class="role-item">
              <label>Département:</label>
              <app-editable-field
                [value]="contact.department || ''"
                [fieldType]="'text'"
                [fieldName]="'department'"
                [placeholder]="'Département'"
                (valueChanged)="onUpdateContactRole(contact, 'department', $event)">
              </app-editable-field>
            </div>
          </div>
          
          <div class="contact-actions">
            <button 
              class="action-btn primary" 
              (click)="onSetPrimary(contact)" 
              [disabled]="contact.is_primary"
              title="Définir comme contact principal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/>
              </svg>
              {{ contact.is_primary ? 'Principal' : 'Définir Principal' }}
            </button>
            
            <button 
              class="action-btn delete" 
              (click)="onDeleteContact(contact)" 
              title="Supprimer le contact">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              Supprimer
            </button>
          </div>
          
          <div class="contact-meta">
            <span class="contact-added">Ajouté le {{ contact.added_at | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>
        
        <div class="no-contacts" *ngIf="contacts.length === 0">
          <div class="no-contacts-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
            </svg>
          </div>
          <h4>Aucun contact</h4>
          <p>Commencez par ajouter votre premier contact.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-contacts {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .contacts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title h3 {
      margin: 0;
      color: #f3f4f6;
      font-size: 20px;
      font-weight: 600;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .contacts-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .contact-card {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      padding: 20px;
      transition: all 0.2s;
      position: relative;
      min-height: 200px;
    }

    .contact-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .contact-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .contact-avatar {
      width: 48px;
      height: 48px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .contact-info {
      flex: 1;
      min-width: 0;
    }

    .contact-name {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .contact-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: color 0.2s;
    }

    .contact-link:hover {
      color: #60a5fa;
      text-decoration: underline;
    }

    .primary-badge {
      background: #10b981;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-roles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .role-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-item label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .contact-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
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
      flex: 1;
      justify-content: center;
    }

    .action-btn.primary {
      background: #10b981;
      color: white;
    }

    .action-btn.primary:hover:not(:disabled) {
      background: #059669;
    }

    .action-btn.primary:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    .contact-meta {
      border-top: 1px solid #333;
      padding-top: 8px;
    }

    .contact-added {
      font-size: 12px;
      color: #9ca3af;
    }

    .no-contacts {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
      grid-column: 1 / -1;
    }

    .no-contacts-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-contacts h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-contacts p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .company-contacts {
        padding: 16px;
      }

      .contacts-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .contacts-list {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .contact-card {
        padding: 16px;
      }

      .contact-roles {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .contact-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CompanyContactsTabComponent implements OnInit, OnDestroy {
  @Input() companyId: number = 0;
  @Output() addContact = new EventEmitter<void>();
  @Output() updateContact = new EventEmitter<{contact: CompanyContact, field: string, value: any}>();
  @Output() updateContactRole = new EventEmitter<{contact: CompanyContact, field: string, value: any}>();
  @Output() setPrimaryContact = new EventEmitter<CompanyContact>();
  @Output() deleteContact = new EventEmitter<CompanyContact>();

  private destroy$ = new Subject<void>();

  contacts: CompanyContact[] = [];

  constructor(private companyStateService: CompanyStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.companyStateService.companyState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.contacts = state.contacts;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event handlers
  onAddContact(): void {
    this.addContact.emit();
  }

  onUpdateContactField(contact: CompanyContact, field: string, value: any): void {
    this.updateContact.emit({ contact, field, value });
  }

  onUpdateContactRole(contact: CompanyContact, field: string, value: any): void {
    this.updateContactRole.emit({ contact, field, value });
  }

  onSetPrimary(contact: CompanyContact): void {
    this.setPrimaryContact.emit(contact);
  }

  onDeleteContact(contact: CompanyContact): void {
    this.deleteContact.emit(contact);
  }

  // Utility methods
  getContactInitials(contact: ContactResponse | undefined): string {
    if (!contact) return '??';
    return `${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase();
  }
}
