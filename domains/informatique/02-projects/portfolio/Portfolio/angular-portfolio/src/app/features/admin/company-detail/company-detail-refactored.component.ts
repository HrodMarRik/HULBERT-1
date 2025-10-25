import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Project } from '../../../models/project.model';

// Import the new components
import { CompanyOverviewTabComponent } from './components/company-overview-tab.component';
import { CompanyContactsTabComponent } from './components/company-contacts-tab.component';
import { CompanyProjectsTabComponent } from './components/company-projects-tab.component';

// Import services
import { CompanyStateService } from './services/company-state.service';
import { CompanyService } from '../../../core/services/company.service';
import { CompanyContactService } from '../../../core/services/company-contact.service';
import { ProjectService } from '../../../core/services/project.service';

// Import models
import { CompanyResponse, CompanyContact } from '../../../models/company.model';
import { ProjectResponse } from '../../../models/project.model';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    CompanyOverviewTabComponent,
    CompanyContactsTabComponent,
    CompanyProjectsTabComponent
  ],
  template: `
    <div class="company-detail-container">
      <!-- Company Header -->
      <div class="company-header" *ngIf="company">
        <div class="company-title">
          <h1>{{ company.name }}</h1>
          <div class="company-industry">
            <span class="industry-badge">{{ company.industry || 'Non spécifié' }}</span>
          </div>
        </div>
        
        <div class="company-actions">
          <button class="btn-secondary" (click)="goBack()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
            Retour
          </button>
        </div>
      </div>

      <!-- Company Tabs -->
      <div class="company-tabs">
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
          <app-company-overview-tab
            *ngIf="activeTab === 'overview'"
            [company]="company"
            (updateCompany)="onUpdateCompany($event)">
          </app-company-overview-tab>

          <!-- Contacts Tab -->
          <app-company-contacts-tab
            *ngIf="activeTab === 'contacts'"
            [companyId]="companyId"
            (addContact)="onAddContact()"
            (updateContact)="onUpdateContact($event)"
            (updateContactRole)="onUpdateContactRole($event)"
            (setPrimaryContact)="onSetPrimaryContact($event)"
            (deleteContact)="onDeleteContact($event)">
          </app-company-contacts-tab>

          <!-- Projects Tab -->
          <app-company-projects-tab
            *ngIf="activeTab === 'projects'"
            [companyId]="companyId"
            (addProject)="onAddProject()"
            (updateProject)="onUpdateProject($event)"
            (editProject)="onEditProject($event)"
            (deleteProject)="onDeleteProject($event)"
            (addBudget)="onAddBudget($event)">
          </app-company-projects-tab>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-detail-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    }

    .company-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .company-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #f3f4f6;
    }

    .company-industry {
      display: flex;
      align-items: center;
    }

    .industry-badge {
      background: #374151;
      color: #d1d5db;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .company-actions {
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

    .company-tabs {
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
      .company-header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .company-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .company-title h1 {
        font-size: 24px;
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
export class CompanyDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  companyId: number = 0;
  company: CompanyResponse | null = null;
  activeTab = 'overview';

  tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13', count: 0 },
    { id: 'contacts', label: 'Contacts', icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z', count: 0 },
    { id: 'projects', label: 'Projets', icon: 'M3,3V21H21V3M5,5H19V19H5M7,7V17H9V7M11,10V17H13V10M15,13V17H17V13', count: 0 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyStateService: CompanyStateService,
    private companyService: CompanyService,
    private companyContactService: CompanyContactService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.companyId = +params['id'];
        if (this.companyId) {
          this.loadCompany();
        }
      });

    // Subscribe to state changes
    this.companyStateService.companyState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.company = state.company;
        this.activeTab = state.activeTab;
        this.updateTabCounts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCompany(): void {
    this.companyStateService.setLoading(true);
    
    this.companyService.getCompanyDetail(this.companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (company) => {
          this.companyStateService.setCompany(company);
          this.loadCompanyContacts();
          this.loadCompanyProjects();
          this.companyStateService.setLoading(false);
        },
        error: (error) => {
          console.error('Error loading company:', error);
          this.companyStateService.setError('Erreur lors du chargement de l\'entreprise');
          this.companyStateService.setLoading(false);
        }
      });
  }

  private loadCompanyContacts(): void {
    this.companyContactService.getCompanyContacts(this.companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.companyStateService.setContacts(response.contacts);
        },
        error: (error) => {
          console.error('Error loading company contacts:', error);
        }
      });
  }

  private loadCompanyProjects(): void {
    this.projectService.getProjectsByCompany(this.companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects: Project[]) => {
          this.companyStateService.setProjects(projects);
        },
        error: (error: any) => {
          console.error('Error loading company projects:', error);
        }
      });
  }

  private updateTabCounts(): void {
    const state = this.companyStateService.getCurrentState();
    this.tabs = this.tabs.map(tab => {
      switch (tab.id) {
        case 'contacts':
          return { ...tab, count: state.contacts.length };
        case 'projects':
          return { ...tab, count: state.projects.length };
        default:
          return tab;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.companyStateService.setActiveTab(tab);
  }

  goBack(): void {
    this.router.navigate(['/admin/companies']);
  }

  // Event handlers for child components
  onUpdateCompany(data: { field: string, value: any }): void {
    if (this.company) {
      this.companyService.updateCompanyField(this.company.id, data.field, data.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.companyStateService.updateCompanyField(data.field, data.value);
          },
          error: (error) => {
            console.error('Error updating company:', error);
          }
        });
    }
  }

  onAddContact(): void {
    // TODO: Implement contact addition modal
    console.log('Add contact clicked');
  }

  onUpdateContact(data: { contact: CompanyContact, field: string, value: any }): void {
    // TODO: Implement contact field update
    console.log('Update contact field:', data);
  }

  onUpdateContactRole(data: { contact: CompanyContact, field: string, value: any }): void {
    this.companyContactService.updateCompanyContact(data.contact.id, { [data.field]: data.value })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.companyStateService.updateContact(data.contact.id, { [data.field]: data.value });
        },
        error: (error) => {
          console.error('Error updating contact role:', error);
        }
      });
  }

  onSetPrimaryContact(contact: CompanyContact): void {
    this.companyContactService.setPrimaryContact(this.companyId, contact.contact_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload contacts to update primary status
          this.loadCompanyContacts();
        },
        error: (error) => {
          console.error('Error setting primary contact:', error);
        }
      });
  }

  onDeleteContact(contact: CompanyContact): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      this.companyContactService.deleteCompanyContact(contact.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.companyStateService.removeContact(contact.id);
          },
          error: (error) => {
            console.error('Error deleting contact:', error);
          }
        });
    }
  }

  onAddProject(): void {
    // TODO: Implement project addition modal
    console.log('Add project clicked');
  }

  onUpdateProject(data: { project: ProjectResponse, field: string, value: any }): void {
    this.projectService.updateProjectField(data.project.id, data.field, data.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.companyStateService.updateProject(data.project.id, { [data.field]: data.value });
        },
        error: (error) => {
          console.error('Error updating project:', error);
        }
      });
  }

  onEditProject(project: ProjectResponse): void {
    // Navigate to project detail
    this.router.navigate(['/admin/projects', project.id]);
  }

  onDeleteProject(project: ProjectResponse): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      this.projectService.deleteProject(project.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.companyStateService.removeProject(project.id);
          },
          error: (error) => {
            console.error('Error deleting project:', error);
          }
        });
    }
  }

  onAddBudget(project: ProjectResponse): void {
    // TODO: Implement budget addition modal
    console.log('Add budget for project:', project);
  }
}
