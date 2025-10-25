import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompanyContact } from '../../../../models/company.model';
import { EditableFieldComponent } from '../../../../shared/components/editable-field/editable-field.component';
import { ContactStateService } from '../services/contact-state.service';

@Component({
  selector: 'app-contact-company-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditableFieldComponent],
  template: `
    <div class="contact-company">
      <!-- Company Roles Header -->
      <div class="company-roles-header">
        <div class="section-title">
          <h3>Rôles dans les entreprises ({{ companyRoles.length }})</h3>
        </div>
      </div>

      <!-- Company Roles List -->
      <div class="company-roles-list">
        <div class="company-role-card" *ngFor="let role of companyRoles">
          <div class="company-header">
            <div class="company-info">
              <div class="company-name">
                <a [routerLink]="['/admin/companies', role.company_id]" class="company-link">
                  Entreprise #{{ role.company_id }}
                </a>
                <span class="primary-badge" *ngIf="role.is_primary">Contact Principal</span>
              </div>
              
              <div class="company-details">
                <div class="company-industry">
                  Secteur non spécifié
                </div>
                <div class="company-location">
                  Localisation non spécifiée
                </div>
              </div>
            </div>
            
            <div class="company-actions">
              <button 
                class="action-btn primary" 
                (click)="onSetPrimary(role)" 
                [disabled]="role.is_primary"
                title="Définir comme contact principal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/>
                </svg>
                {{ role.is_primary ? 'Principal' : 'Définir Principal' }}
              </button>
              
              <button 
                class="action-btn delete" 
                (click)="onRemoveRole(role)" 
                title="Retirer de l'entreprise">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
                Retirer
              </button>
            </div>
          </div>
          
          <div class="role-details">
            <div class="role-item">
              <label>Rôle:</label>
              <app-editable-field
                [value]="role.role || ''"
                [fieldType]="'text'"
                [fieldName]="'role'"
                placeholder="Rôle dans l'entreprise"
                (valueChanged)="onUpdateRole(role, 'role', $event)">
              </app-editable-field>
            </div>
            
            <div class="role-item">
              <label>Département:</label>
              <app-editable-field
                [value]="role.department || ''"
                [fieldType]="'text'"
                [fieldName]="'department'"
                placeholder="Département"
                (valueChanged)="onUpdateRole(role, 'department', $event)">
              </app-editable-field>
            </div>
          </div>
          
          <div class="role-meta">
            <span class="role-added">Ajouté le {{ role.added_at | date:'dd/MM/yyyy' }}</span>
            <span class="role-status" [class]="role.is_primary ? 'primary' : 'secondary'">
              {{ role.is_primary ? 'Contact Principal' : 'Contact Secondaire' }}
            </span>
          </div>
        </div>
        
        <div class="no-roles" *ngIf="companyRoles.length === 0">
          <div class="no-roles-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
          </div>
          <h4>Aucun rôle d'entreprise</h4>
          <p>Ce contact n'est associé à aucune entreprise.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-company {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .company-roles-header {
      margin-bottom: 24px;
    }

    .section-title h3 {
      margin: 0;
      color: #f3f4f6;
      font-size: 20px;
      font-weight: 600;
    }

    .company-roles-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 24px;
    }

    .company-role-card {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      padding: 24px;
      transition: all 0.2s;
    }

    .company-role-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    }

    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .company-info {
      flex: 1;
      min-width: 0;
    }

    .company-name {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .company-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
      transition: color 0.2s;
    }

    .company-link:hover {
      color: #60a5fa;
      text-decoration: underline;
    }

    .primary-badge {
      background: #10b981;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .company-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .company-industry {
      font-size: 14px;
      color: #d1d5db;
      font-weight: 500;
    }

    .company-location {
      font-size: 12px;
      color: #9ca3af;
    }

    .company-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .company-role-card:hover .company-actions {
      opacity: 1;
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

    .role-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .role-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .role-item label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #333;
      padding-top: 12px;
    }

    .role-added {
      font-size: 12px;
      color: #9ca3af;
    }

    .role-status {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .role-status.primary {
      background: #10b981;
      color: white;
    }

    .role-status.secondary {
      background: #374151;
      color: #d1d5db;
    }

    .no-roles {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
      grid-column: 1 / -1;
    }

    .no-roles-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-roles h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-roles p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .contact-company {
        padding: 16px;
      }

      .company-roles-list {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .company-role-card {
        padding: 16px;
      }

      .company-header {
        flex-direction: column;
        gap: 12px;
      }

      .company-actions {
        opacity: 1;
        justify-content: flex-end;
      }

      .role-details {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .role-meta {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
    }
  `]
})
export class ContactCompanyTabComponent implements OnInit, OnDestroy {
  @Input() contactId: number = 0;
  @Output() updateRole = new EventEmitter<{role: CompanyContact, field: string, value: any}>();
  @Output() setPrimary = new EventEmitter<CompanyContact>();
  @Output() removeRole = new EventEmitter<CompanyContact>();

  private destroy$ = new Subject<void>();

  companyRoles: CompanyContact[] = [];

  constructor(private contactStateService: ContactStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.contactStateService.contactState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.companyRoles = state.companyRoles;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event handlers
  onUpdateRole(role: CompanyContact, field: string, value: any): void {
    this.updateRole.emit({ role, field, value });
  }

  onSetPrimary(role: CompanyContact): void {
    this.setPrimary.emit(role);
  }

  onRemoveRole(role: CompanyContact): void {
    this.removeRole.emit(role);
  }
}
