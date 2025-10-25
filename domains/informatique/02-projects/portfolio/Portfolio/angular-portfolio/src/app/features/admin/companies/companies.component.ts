import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CompanyService } from '../../../core/services/company.service';
import { Company, CompanyCreate, CompanyStats } from '../../../models/company.model';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="companies-container">
      <!-- Header -->
      <div class="companies-header">
        <div class="header-content">
          <h1>Companies Management</h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              New Company
            </button>
            <button class="btn btn-secondary" (click)="refreshCompanies()">
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
          
          <div class="stat-card" (click)="filterByStatus('client')">
            <div class="stat-icon client">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.client }}</div>
              <div class="stat-label">Clients</div>
            </div>
          </div>
          
          <div class="stat-card" (click)="filterByStatus('prospect')">
            <div class="stat-icon prospect">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.prospect }}</div>
              <div class="stat-label">Prospects</div>
            </div>
          </div>
          
          <div class="stat-card" (click)="filterByStatus('archived')">
            <div class="stat-icon archived">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,3H21V7H3V3M4,8H20V21H4V8M9.5,11A0.5,0.5 0 0,0 9,11.5V13H15V11.5A0.5,0.5 0 0,0 14.5,11H9.5Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.archived }}</div>
              <div class="stat-label">Archived</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon projects">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.active_projects }}</div>
              <div class="stat-label">Active Projects</div>
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
                 placeholder="Search companies..." 
                 class="filter-input">
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Status</option>
            <option value="client">Client</option>
            <option value="prospect">Prospect</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedIndustry" (change)="applyFilters()" class="filter-select">
            <option value="">All Industries</option>
            <option *ngFor="let industry of industries" [value]="industry">{{ industry }}</option>
          </select>
        </div>
      </div>

      <!-- Companies Grid -->
      <div class="companies-grid">
        <div *ngFor="let company of filteredCompanies" 
             class="company-card" 
             [class.status-client]="company.status === 'client'"
             [class.status-prospect]="company.status === 'prospect'"
             [class.status-archived]="company.status === 'archived'"
             (click)="viewCompany(company)">
          
          <div class="company-header">
            <div class="company-logo">
              <img *ngIf="company.logo_url" [src]="company.logo_url" [alt]="company.name">
              <div *ngIf="!company.logo_url" class="logo-placeholder">
                {{ company.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="company-info">
              <h3 class="company-name">{{ company.name }}</h3>
              <p class="company-industry">{{ company.industry || 'No industry' }}</p>
            </div>
            <div class="company-status">
              <span class="status-badge" [class]="'status-' + company.status">
                {{ getStatusDisplay(company.status) }}
              </span>
            </div>
          </div>

          <div class="company-details">
            <div class="company-contact" *ngIf="company.email">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
              </svg>
              {{ company.email }}
            </div>
            <div class="company-contact" *ngIf="company.phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
              </svg>
              {{ company.phone }}
            </div>
          </div>

          <div class="company-stats">
            <div class="stat-item clickable-link" 
                 *ngIf="company.contacts_count && company.contacts_count > 0"
                 (click)="viewContacts(company.id, $event)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
              {{ company.contacts_count || 0 }} contacts
            </div>
            <div class="stat-item" 
                 *ngIf="!company.contacts_count || company.contacts_count === 0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
              {{ company.contacts_count || 0 }} contacts
            </div>
            <div class="stat-item clickable-link" 
                 *ngIf="company.projects_count && company.projects_count > 0"
                 (click)="viewProjects(company.id, $event)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              {{ company.projects_count || 0 }} projects
            </div>
            <div class="stat-item" 
                 *ngIf="!company.projects_count || company.projects_count === 0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              {{ company.projects_count || 0 }} projects
            </div>
          </div>

          <div class="company-footer">
            <div class="company-tags" *ngIf="company.tags">
              <span *ngFor="let tag of getTags(company.tags)" class="tag">{{ tag }}</span>
            </div>
            <div class="company-actions">
              <button class="action-btn" (click)="editCompany(company, $event)" title="Edit Company">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
              </button>
              <button class="action-btn" (click)="archiveCompany(company, $event)" title="Archive Company">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,3H21V7H3V3M4,8H20V21H4V8M9.5,11A0.5,0.5 0 0,0 9,11.5V13H15V11.5A0.5,0.5 0 0,0 14.5,11H9.5Z"/>
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
            <h2>{{ editingCompany ? 'Edit Company' : 'Create New Company' }}</h2>
            <button class="close-btn" (click)="closeModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          </div>
          
          <form class="modal-form" (ngSubmit)="saveCompany()">
            <div class="form-group">
              <label>Company Name *</label>
              <input type="text" [(ngModel)]="companyForm.name" name="name" required>
            </div>
            
            <div class="form-group">
              <label>Industry</label>
              <input type="text" [(ngModel)]="companyForm.industry" name="industry">
            </div>
            
            <div class="form-group">
              <label>Website</label>
              <input type="url" [(ngModel)]="companyForm.website" name="website">
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="companyForm.email" name="email">
            </div>
            
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" [(ngModel)]="companyForm.phone" name="phone">
            </div>
            
            <div class="form-group">
              <label>Address</label>
              <textarea [(ngModel)]="companyForm.address" name="address" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="companyForm.status" name="status">
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" [(ngModel)]="companyForm.tags" name="tags" placeholder="tech, startup, enterprise">
            </div>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea [(ngModel)]="companyForm.notes" name="notes" rows="4"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Company</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .companies-container {
      padding: 20px;
      background: #1a1a1a;
      color: #e0e0e0;
      min-height: 100vh;
    }

    .companies-header {
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
    .stat-icon.client { background: #2196f3; color: white; }
    .stat-icon.prospect { background: #ff9800; color: white; }
    .stat-icon.archived { background: #6c757d; color: white; }
    .stat-icon.projects { background: #9c27b0; color: white; }

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

    /* Companies Grid */
    .companies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .company-card {
      background: #2d2d2d;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .company-card:hover {
      background: #404040;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .company-card.status-client { border-left-color: #2196f3; }
    .company-card.status-prospect { border-left-color: #ff9800; }
    .company-card.status-archived { border-left-color: #6c757d; }

    .company-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .company-logo {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-placeholder {
      width: 100%;
      height: 100%;
      background: #007acc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
    }

    .company-info {
      flex: 1;
    }

    .company-name {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .company-industry {
      margin: 0;
      font-size: 14px;
      color: #888;
    }

    .company-status {
      flex-shrink: 0;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.status-client { background: #2196f3; color: white; }
    .status-badge.status-prospect { background: #ff9800; color: white; }
    .status-badge.status-archived { background: #6c757d; color: white; }

    .company-details {
      margin-bottom: 16px;
    }

    .company-contact {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #ccc;
    }

    .company-contact svg {
      color: #888;
    }

    .company-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #888;
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

    .stat-item svg {
      color: #666;
    }

    .company-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .company-tags {
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

    .company-actions {
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
      .companies-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .companies-grid {
        grid-template-columns: 1fr;
      }

      .filters-container {
        flex-direction: column;
      }

      .filter-group {
        min-width: auto;
      }
    }
  `]
})
export class CompaniesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  stats: CompanyStats | null = null;
  industries: string[] = [];
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedIndustry = '';
  selectedCompany: string | null = null;
  
  // Modal
  showModal = false;
  editingCompany: Company | null = null;
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

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadCompanies();
    this.loadStats();
    
    // Check for query parameters to filter by company
    this.route.queryParams.subscribe(params => {
      if (params['company_id']) {
        this.selectedCompany = params['company_id'];
        this.applyFilters();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCompanies() {
    this.companyService.getCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.companies = companies;
          this.filteredCompanies = companies;
          this.extractIndustries();
        },
        error: (error) => {
          console.error('Error loading companies:', error);
        }
      });
  }

  loadStats() {
    this.companyService.getStats()
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

  extractIndustries() {
    const industriesSet = new Set<string>();
    this.companies.forEach(company => {
      if (company.industry) {
        industriesSet.add(company.industry);
      }
    });
    this.industries = Array.from(industriesSet).sort();
  }

  applyFilters() {
    this.filteredCompanies = this.companies.filter(company => {
      const matchesSearch = !this.searchTerm || 
        company.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        company.notes?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || company.status === this.selectedStatus;
      const matchesIndustry = !this.selectedIndustry || company.industry === this.selectedIndustry;
      const matchesCompany = !this.selectedCompany || company.id.toString() === this.selectedCompany;
      
      return matchesSearch && matchesStatus && matchesIndustry && matchesCompany;
    });
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.selectedIndustry = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  resetAllFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedIndustry = '';
    this.selectedCompany = null;
    this.applyFilters();
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'client': return 'Client';
      case 'prospect': return 'Prospect';
      case 'archived': return 'Archived';
      default: return status;
    }
  }

  getTags(tagsString: string): string[] {
    if (!tagsString) return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
  }

  viewCompany(company: Company) {
    this.router.navigate(['/admin/companies', company.id]);
  }

  viewContacts(companyId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/contacts'], { 
      queryParams: { company_id: companyId } 
    });
  }

  viewProjects(companyId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/projects'], { 
      queryParams: { company_id: companyId } 
    });
  }

  editCompany(company: Company, event: Event) {
    event.stopPropagation();
    this.editingCompany = company;
    this.companyForm = {
      name: company.name,
      industry: company.industry || '',
      website: company.website || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      status: company.status,
      notes: company.notes || '',
      tags: company.tags || '',
      logo_url: company.logo_url || ''
    };
    this.showModal = true;
  }

  archiveCompany(company: Company, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to archive ${company.name}?`)) {
      this.companyService.updateCompany(company.id, { status: 'archived' })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCompanies();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error archiving company:', error);
            alert('Error archiving company');
          }
        });
    }
  }

  openCreateModal() {
    this.editingCompany = null;
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
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingCompany = null;
  }

  saveCompany() {
    if (this.editingCompany) {
      // Update existing company
      this.companyService.updateCompany(this.editingCompany.id, this.companyForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCompanies();
            this.loadStats();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating company:', error);
            alert('Error updating company');
          }
        });
    } else {
      // Create new company
      this.companyService.createCompany(this.companyForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCompanies();
            this.loadStats();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating company:', error);
            alert('Error creating company');
          }
        });
    }
  }

  refreshCompanies() {
    this.loadCompanies();
    this.loadStats();
  }
}
