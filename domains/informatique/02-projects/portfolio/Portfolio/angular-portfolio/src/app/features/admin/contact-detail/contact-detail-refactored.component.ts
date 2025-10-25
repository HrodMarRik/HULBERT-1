import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import the new components
import { ContactOverviewTabComponent } from './components/contact-overview-tab.component';
import { ContactCompanyTabComponent } from './components/contact-company-tab.component';
import { ContactProjectsTabComponent } from './components/contact-projects-tab.component';
import { ContactDocumentsTabComponent } from './components/contact-documents-tab.component';

// Import services
import { ContactStateService } from './services/contact-state.service';
import { ContactService } from '../../../core/services/contact.service';
import { CompanyContactService } from '../../../core/services/company-contact.service';
import { ProjectService } from '../../../core/services/project.service';

// Import models
import { ContactResponse, ContactDetailResponse } from '../../../models/contact.model';
import { CompanyContact } from '../../../models/company.model';
import { ProjectContact } from '../../../models/project.model';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    CommonModule,
    ContactOverviewTabComponent,
    ContactCompanyTabComponent,
    ContactProjectsTabComponent,
    ContactDocumentsTabComponent
  ],
  template: `
    <div class="contact-detail-container">
      <!-- Contact Header -->
      <div class="contact-header" *ngIf="contact">
        <div class="contact-title">
          <div class="contact-avatar">
            {{ getContactInitials(contact) }}
          </div>
          <div class="contact-info">
            <h1>{{ contact.first_name }} {{ contact.last_name }}</h1>
            <div class="contact-subtitle">
              <span class="contact-position" *ngIf="contact.position">{{ contact.position }}</span>
              <span class="contact-company" *ngIf="getPrimaryCompany()">Entreprise #{{ getPrimaryCompany()?.company_id }}</span>
            </div>
          </div>
        </div>
        
        <div class="contact-actions">
          <button class="btn-secondary" (click)="goBack()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
            Retour
          </button>
        </div>
      </div>

      <!-- Contact Tabs -->
      <div class="contact-tabs">
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
          <app-contact-overview-tab
            *ngIf="activeTab === 'overview'"
            [contact]="contact"
            (updateContact)="onUpdateContact($event)">
          </app-contact-overview-tab>

          <!-- Company Tab -->
          <app-contact-company-tab
            *ngIf="activeTab === 'company'"
            [contactId]="contactId"
            (updateRole)="onUpdateCompanyRole($event)"
            (setPrimary)="onSetPrimaryCompany($event)"
            (removeRole)="onRemoveCompanyRole($event)">
          </app-contact-company-tab>

          <!-- Projects Tab -->
          <app-contact-projects-tab
            *ngIf="activeTab === 'projects'"
            [contactId]="contactId"
            (updateRole)="onUpdateProjectRole($event)"
            (removeRole)="onRemoveProjectRole($event)">
          </app-contact-projects-tab>

          <!-- Documents Tab -->
          <app-contact-documents-tab
            *ngIf="activeTab === 'documents'"
            [contactId]="contactId"
            (addDocument)="onAddDocument()"
            (downloadDocument)="onDownloadDocument($event)"
            (editDocument)="onEditDocument($event)"
            (deleteDocument)="onDeleteDocument($event)">
          </app-contact-documents-tab>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-detail-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .contact-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    }

    .contact-title {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .contact-avatar {
      width: 60px;
      height: 60px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      flex-shrink: 0;
    }

    .contact-info h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: #f3f4f6;
    }

    .contact-subtitle {
      display: flex;
      gap: 12px;
      font-size: 14px;
      color: #9ca3af;
    }

    .contact-position {
      font-weight: 500;
    }

    .contact-company {
      color: #3b82f6;
    }

    .contact-actions {
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

    .contact-tabs {
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

    /* Responsive Design */
    @media (max-width: 768px) {
      .contact-header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .contact-title {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .contact-info h1 {
        font-size: 24px;
      }

      .contact-subtitle {
        justify-content: center;
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
export class ContactDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  contactId: number = 0;
  contact: ContactResponse | null = null;
  activeTab = 'overview';

  tabs = [
    { id: 'overview', label: 'Overview', icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z', count: 0 },
    { id: 'company', label: 'Entreprises', icon: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z', count: 0 },
    { id: 'projects', label: 'Projets', icon: 'M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13', count: 0 },
    { id: 'documents', label: 'Documents', icon: 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z', count: 0 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactStateService: ContactStateService,
    private contactService: ContactService,
    private companyContactService: CompanyContactService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.contactId = +params['id'];
        if (this.contactId) {
          this.loadContact();
        }
      });

    // Subscribe to state changes
    this.contactStateService.contactState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.contact = state.contact;
        this.activeTab = state.activeTab;
        this.updateTabCounts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContact(): void {
    this.contactStateService.setLoading(true);
    
    this.contactService.getContactDetail(this.contactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contactDetail) => {
          this.contactStateService.setContactDetail(contactDetail);
          this.contactStateService.setContact(contactDetail);
          this.loadContactRoles();
          this.loadContactDocuments();
          this.contactStateService.setLoading(false);
        },
        error: (error) => {
          console.error('Error loading contact:', error);
          this.contactStateService.setError('Erreur lors du chargement du contact');
          this.contactStateService.setLoading(false);
        }
      });
  }

  private loadContactRoles(): void {
    // Load company roles
    this.companyContactService.getContactCompanies(this.contactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companyRoles) => {
          this.contactStateService.setCompanyRoles(companyRoles);
        },
        error: (error) => {
          console.error('Error loading contact company roles:', error);
        }
      });

    // Load project roles
    this.projectService.getContactProjects(this.contactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projectRoles: any[]) => {
          this.contactStateService.setProjectRoles(projectRoles);
        },
        error: (error: any) => {
          console.error('Error loading contact project roles:', error);
        }
      });
  }

  private loadContactDocuments(): void {
    // TODO: Implement document loading
    this.contactStateService.setDocuments([]);
  }

  private updateTabCounts(): void {
    const state = this.contactStateService.getCurrentState();
    this.tabs = this.tabs.map(tab => {
      switch (tab.id) {
        case 'company':
          return { ...tab, count: state.companyRoles.length };
        case 'projects':
          return { ...tab, count: state.projectRoles.length };
        case 'documents':
          return { ...tab, count: state.documents.length };
        default:
          return tab;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.contactStateService.setActiveTab(tab);
  }

  goBack(): void {
    this.router.navigate(['/admin/contacts']);
  }

  getContactInitials(contact: ContactResponse | null): string {
    if (!contact) return '??';
    return `${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase();
  }

  getPrimaryCompany(): CompanyContact | null {
    return this.contactStateService.getPrimaryCompany();
  }

  // Event handlers for child components
  onUpdateContact(data: { field: string, value: any }): void {
    if (this.contact) {
      this.contactService.updateContactField(this.contact.id, data.field, data.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.contactStateService.updateContactField(data.field, data.value);
          },
          error: (error) => {
            console.error('Error updating contact:', error);
          }
        });
    }
  }

  onUpdateCompanyRole(data: { role: CompanyContact, field: string, value: any }): void {
    this.companyContactService.updateCompanyContact(data.role.id, { [data.field]: data.value })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.contactStateService.updateCompanyRole(data.role.company_id, { [data.field]: data.value });
        },
        error: (error) => {
          console.error('Error updating company role:', error);
        }
      });
  }

  onSetPrimaryCompany(role: CompanyContact): void {
    this.companyContactService.setPrimaryContact(role.company_id, role.contact_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload company roles to update primary status
          this.loadContactRoles();
        },
        error: (error) => {
          console.error('Error setting primary company:', error);
        }
      });
  }

  onRemoveCompanyRole(role: CompanyContact): void {
    if (confirm('Êtes-vous sûr de vouloir retirer ce contact de l\'entreprise ?')) {
      this.companyContactService.deleteCompanyContact(role.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.contactStateService.setCompanyRoles(
              this.contactStateService.getCompanyRoles().filter(r => r.id !== role.id)
            );
          },
          error: (error) => {
            console.error('Error removing company role:', error);
          }
        });
    }
  }

  onUpdateProjectRole(data: { role: ProjectContact, field: string, value: any }): void {
    // TODO: Implement project role update
    console.log('Update project role:', data);
  }

  onRemoveProjectRole(role: ProjectContact): void {
    if (confirm('Êtes-vous sûr de vouloir retirer ce contact du projet ?')) {
      // TODO: Implement project role removal
      console.log('Remove project role:', role);
    }
  }

  onAddDocument(): void {
    // TODO: Implement document addition
    console.log('Add document clicked');
  }

  onDownloadDocument(document: any): void {
    // TODO: Implement document download
    console.log('Download document:', document);
  }

  onEditDocument(document: any): void {
    // TODO: Implement document edit
    console.log('Edit document:', document);
  }

  onDeleteDocument(document: any): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      // TODO: Implement document deletion
      console.log('Delete document:', document);
    }
  }
}
