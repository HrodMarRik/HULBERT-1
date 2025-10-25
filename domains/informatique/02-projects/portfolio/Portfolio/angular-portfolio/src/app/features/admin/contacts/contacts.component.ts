import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ContactService } from '../../../core/services/contact.service';
import { CompanyService } from '../../../core/services/company.service';
import { Contact, ContactCreate, ContactStats } from '../../../models/contact.model';
import { Company } from '../../../models/company.model';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  template: `
    <div class="contacts-container">
      <!-- Header -->
      <div class="contacts-header">
        <div class="header-content">
          <h1>Contacts Management</h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              New Contact
            </button>
            <button class="btn btn-secondary" (click)="refreshContacts()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-container" *ngIf="stats">
        <div class="stats-block">
          <div class="stat-card" (click)="resetAllFilters()">
            <div class="stat-icon total">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>
          
          <div class="stat-card" (click)="filterByStatus('active')">
            <div class="stat-icon active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.active }}</div>
              <div class="stat-label">Active</div>
            </div>
          </div>
          
          <div class="stat-card" (click)="filterByStatus('inactive')">
            <div class="stat-icon inactive">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.inactive }}</div>
              <div class="stat-label">Inactive</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-container">
        <div class="filter-group">
          <input type="text" 
                 [(ngModel)]="searchTerm" 
                 (input)="applyFilters()"
                 placeholder="Search contacts..." 
                 class="filter-input">
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedCompany" (change)="applyFilters()" class="filter-select">
            <option value="">All Companies</option>
            <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
          </select>
        </div>
      </div>

      <!-- Contacts Grid -->
      <div class="contacts-grid">
        <div *ngFor="let contact of filteredContacts" 
             class="contact-card" 
             [class.status-active]="contact.status === 'active'"
             [class.status-inactive]="contact.status === 'inactive'"
             (click)="viewContact(contact)">
          
          <div class="contact-header">
            <div class="contact-photo">
              <img *ngIf="contact.photo_url" [src]="contact.photo_url" [alt]="contact.first_name + ' ' + contact.last_name">
              <div *ngIf="!contact.photo_url" class="photo-placeholder">
                {{ contact.first_name.charAt(0) }}{{ contact.last_name.charAt(0) }}
              </div>
            </div>
            <div class="contact-info">
              <h3 class="contact-name">{{ contact.first_name }} {{ contact.last_name }}</h3>
              <p class="contact-position">{{ contact.position || 'No position' }}</p>
              <p class="contact-company" 
                 *ngIf="contact.company_id" 
                 (click)="viewCompany(contact.company_id, $event)"
                 class="clickable-link">
                {{ contact.company_name }}
              </p>
              <p class="contact-company" 
                 *ngIf="contact.company_name && !contact.company_id">
                {{ contact.company_name }}
              </p>
            </div>
            <div class="contact-status">
              <span class="status-badge" [class]="'status-' + contact.status">
                {{ getStatusDisplay(contact.status) }}
              </span>
            </div>
          </div>

          <div class="contact-details">
            <div class="contact-contact" *ngIf="contact.email">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
              </svg>
              {{ contact.email }}
            </div>
            <div class="contact-contact" *ngIf="contact.phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
              </svg>
              {{ contact.phone }}
            </div>
          </div>

          <div class="contact-footer">
            <div class="contact-tags" *ngIf="contact.tags">
              <span *ngFor="let tag of getTags(contact.tags)" class="tag">{{ tag }}</span>
            </div>
            <div class="contact-actions">
              <button class="action-btn" (click)="editContact(contact, $event)" title="Edit Contact">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
              </button>
              <button class="action-btn" (click)="deactivateContact(contact, $event)" title="Deactivate Contact">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingContact ? 'Edit Contact' : 'Create New Contact' }}</h2>
            <button class="close-btn" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          </div>
          
          <form class="modal-form" (ngSubmit)="saveContact()">
            <div class="form-row">
              <div class="form-group">
                <label>First Name *</label>
                <input type="text" [(ngModel)]="contactForm.first_name" name="first_name" required>
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" [(ngModel)]="contactForm.last_name" name="last_name" required>
              </div>
            </div>
            
            <div class="form-group">
              <label>Company</label>
              <select [(ngModel)]="contactForm.company_id" name="company_id">
                <option value="">No Company</option>
                <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
              </select>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Position</label>
                <input type="text" [(ngModel)]="contactForm.position" name="position">
              </div>
              <div class="form-group">
                <label>Department</label>
                <input type="text" [(ngModel)]="contactForm.department" name="department">
              </div>
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="contactForm.email" name="email">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="contactForm.phone" name="phone">
              </div>
              <div class="form-group">
                <label>Mobile</label>
                <input type="tel" [(ngModel)]="contactForm.mobile" name="mobile">
              </div>
            </div>
            
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="contactForm.status" name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" [(ngModel)]="contactForm.tags" name="tags" placeholder="decision-maker, technical, etc.">
            </div>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea [(ngModel)]="contactForm.notes" name="notes" rows="4"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Contact</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contacts-container {
      padding: 20px;
      background: #1a1a1a;
      color: #e0e0e0;
      min-height: 100vh;
    }

    .contacts-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007acc;
      color: white;
    }

    .btn-primary:hover {
      background: #005a9e;
    }

    .btn-secondary {
      background: #404040;
      color: #e0e0e0;
    }

    .btn-secondary:hover {
      background: #505050;
    }

    /* Stats Container */
    .stats-container {
      margin-bottom: 24px;
    }

    .stats-block {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .stat-card {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-card:hover {
      background: #404040;
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.total { background: #4caf50; color: white; }
    .stat-icon.active { background: #2196f3; color: white; }
    .stat-icon.inactive { background: #6c757d; color: white; }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #888;
    }

    /* Filters */
    .filters-container {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .filter-input, .filter-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #404040;
      border-radius: 6px;
      background: #2d2d2d;
      color: #e0e0e0;
      font-size: 14px;
    }

    .filter-input:focus, .filter-select:focus {
      outline: none;
      border-color: #007acc;
    }

    /* Contacts Grid */
    .contacts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .contact-card {
      background: #2d2d2d;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .contact-card:hover {
      background: #404040;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .contact-card.status-active { border-left-color: #2196f3; }
    .contact-card.status-inactive { border-left-color: #6c757d; }

    .contact-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .contact-photo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .contact-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      width: 100%;
      height: 100%;
      background: #007acc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
    }

    .contact-info {
      flex: 1;
    }

    .contact-name {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .contact-position {
      margin: 0 0 2px 0;
      font-size: 14px;
      color: #888;
    }

    .contact-company {
      margin: 0;
      font-size: 13px;
      color: #666;
    }

    .clickable-link {
      color: #007acc;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s ease;
    }

    .clickable-link:hover {
      color: #00a8e8;
    }

    .contact-status {
      flex-shrink: 0;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.status-active { background: #2196f3; color: white; }
    .status-badge.status-inactive { background: #6c757d; color: white; }

    .contact-details {
      margin-bottom: 16px;
    }

    .contact-contact {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #ccc;
    }

    .contact-contact svg {
      color: #888;
    }

    .contact-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .contact-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .tag {
      background: #404040;
      color: #ccc;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }

    .contact-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: #404040;
      border: none;
      border-radius: 4px;
      padding: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #505050;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #2d2d2d;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #404040;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
    }

    .close-btn:hover {
      color: #e0e0e0;
    }

    .modal-form {
      padding: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #404040;
      border-radius: 6px;
      background: #1a1a1a;
      color: #e0e0e0;
      font-size: 14px;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #007acc;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .contacts-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .contacts-grid {
        grid-template-columns: 1fr;
      }

      .filters-container {
        flex-direction: column;
      }

      .filter-group {
        min-width: auto;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ContactsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  contacts: Contact[] = [];
  filteredContacts: Contact[] = [];
  companies: Company[] = [];
  stats: ContactStats | null = null;
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedCompany = '';
  
  // Modal
  showModal = false;
  editingContact: Contact | null = null;
  preSelectedCompanyName: string = '';
  contactForm: ContactCreate = {
    company_id: undefined,
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
    photo_url: ''
  };

  constructor(
    private contactService: ContactService,
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadContacts();
    this.loadCompanies();
    this.loadStats();
    
    // Check for query parameters to pre-fill form
    this.route.queryParams.subscribe(params => {
      if (params['company_id']) {
        this.contactForm.company_id = parseInt(params['company_id']);
        this.showModal = true;
      }
      if (params['company_name']) {
        // Store company name for display
        this.preSelectedCompanyName = params['company_name'];
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContacts() {
    this.contactService.getContacts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contacts) => {
          this.contacts = contacts;
          this.filteredContacts = contacts;
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
        }
      });
  }

  loadCompanies() {
    this.companyService.getCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.companies = companies;
        },
        error: (error) => {
          console.error('Error loading companies:', error);
        }
      });
  }

  loadStats() {
    this.contactService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  applyFilters() {
    this.filteredContacts = this.contacts.filter(contact => {
      const matchesSearch = !this.searchTerm || 
        contact.first_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contact.last_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contact.position?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || contact.status === this.selectedStatus;
      const matchesCompany = !this.selectedCompany || contact.company_id?.toString() === this.selectedCompany;
      
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.selectedCompany = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  resetAllFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCompany = '';
    this.applyFilters();
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  }

  getTags(tagsString: string): string[] {
    if (!tagsString) return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
  }

  viewContact(contact: Contact) {
    this.router.navigate(['/admin/contacts', contact.id]);
  }

  viewCompany(companyId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/companies', companyId]);
  }

  editContact(contact: Contact, event: Event) {
    event.stopPropagation();
    this.editingContact = contact;
    this.contactForm = {
      company_id: contact.company_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      position: contact.position || '',
      department: contact.department || '',
      status: contact.status,
      notes: contact.notes || '',
      tags: contact.tags || '',
      photo_url: contact.photo_url || ''
    };
    this.showModal = true;
  }

  deactivateContact(contact: Contact, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to deactivate ${contact.first_name} ${contact.last_name}?`)) {
      this.contactService.updateContact(contact.id, { status: 'inactive' })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadContacts();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deactivating contact:', error);
            alert('Error deactivating contact');
          }
        });
    }
  }

  openCreateModal() {
    this.editingContact = null;
    this.contactForm = {
      company_id: undefined,
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
      photo_url: ''
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingContact = null;
  }

  saveContact() {
    if (this.editingContact) {
      this.contactService.updateContact(this.editingContact.id, this.contactForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadContacts();
            this.loadStats();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating contact:', error);
            alert('Error updating contact');
          }
        });
    } else {
      this.contactService.createContact(this.contactForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadContacts();
            this.loadStats();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating contact:', error);
            alert('Error creating contact');
          }
        });
    }
  }

  refreshContacts() {
    this.loadContacts();
    this.loadStats();
  }
}
