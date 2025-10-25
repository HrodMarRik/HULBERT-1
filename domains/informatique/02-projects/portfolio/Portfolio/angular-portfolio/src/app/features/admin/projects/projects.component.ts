import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { CompanyService } from '../../../core/services/company.service';
import { ContactService } from '../../../core/services/contact.service';
import { Project, ProjectCreate, ProjectStats } from '../../../models/project.model';
import { Company } from '../../../models/company.model';
import { Contact } from '../../../models/contact.model';
import { ProjectModalComponent } from './components/project-modal.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectModalComponent],
  template: `
    <div class="projects-container">
      <!-- Header -->
      <div class="projects-header">
        <div class="header-content">
          <h1>Projects Management</h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              New Project
            </button>
            <button class="btn btn-secondary" (click)="refreshProjects()">
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
          
          <div class="stat-card" (click)="filterByStatus('planning')">
            <div class="stat-icon planning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,11H15L13.5,7L9,11M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.planning }}</div>
              <div class="stat-label">Planning</div>
            </div>
          </div>
          
          <div class="stat-card" (click)="filterByStatus('active')">
            <div class="stat-icon active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.active }}</div>
              <div class="stat-label">Active</div>
            </div>
          </div>
          
          <div class="stat-card" (click)="filterByStatus('completed')">
            <div class="stat-icon completed">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.by_status.completed }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon budget">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatCurrency(stats.total_budget) }}</div>
              <div class="stat-label">Total Budget</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon progress">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.average_progress }}%</div>
              <div class="stat-label">Avg Progress</div>
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
                 placeholder="Search projects..." 
                 class="filter-input">
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedCompany" (change)="applyFilters()" class="filter-select">
            <option value="">All Companies</option>
            <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
          </select>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="projects-grid">
        <div *ngFor="let project of filteredProjects" 
             class="project-card" 
             [class.status-planning]="project.status === 'planning'"
             [class.status-active]="project.status === 'active'"
             [class.status-on-hold]="project.status === 'on-hold'"
             [class.status-completed]="project.status === 'completed'"
             [class.status-cancelled]="project.status === 'cancelled'"
             (click)="viewProject(project)">
          
          <div class="project-header">
            <div class="project-info">
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-company" 
                 *ngIf="project.company_id" 
                 (click)="viewCompany(project.company_id, $event)"
                 class="clickable-link">
                {{ project.company_name }}
              </p>
              <p class="project-company" 
                 *ngIf="!project.company_id">
                {{ project.company_name }}
              </p>
              <p class="project-contact" 
                 *ngIf="project.primary_contact_id" 
                 (click)="viewContact(project.primary_contact_id, $event)"
                 class="clickable-link">
                Contact: {{ project.primary_contact_name }}
              </p>
              <p class="project-contact" 
                 *ngIf="project.primary_contact_name && !project.primary_contact_id">
                Contact: {{ project.primary_contact_name }}
              </p>
            </div>
            <div class="project-status">
              <span class="status-badge" [class]="'status-' + project.status">
                {{ getStatusDisplay(project.status) }}
              </span>
            </div>
          </div>

          <div class="project-description" *ngIf="project.description">
            <p>{{ project.description | slice:0:150 }}{{ project.description.length > 150 ? '...' : '' }}</p>
          </div>

          <div class="project-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="project.progress_percentage"></div>
            </div>
            <span class="progress-text">{{ project.progress_percentage }}%</span>
          </div>

          <div class="project-details">
            <div class="detail-item" *ngIf="project.start_date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
              </svg>
              Start: {{ project.start_date | date:'short' }}
            </div>
            <div class="detail-item" *ngIf="project.end_date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
              </svg>
              End: {{ project.end_date | date:'short' }}
            </div>
            <div class="detail-item" *ngIf="project.budget">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
              </svg>
              {{ formatCurrency(project.budget) }}
            </div>
            <div class="detail-item" *ngIf="project.team_assigned">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
              {{ project.team_assigned }}
            </div>
          </div>

          <div class="project-footer">
            <div class="project-actions">
              <button class="action-btn" (click)="editProject(project, $event)" title="Edit Project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
              </button>
              <button class="action-btn" (click)="updateProgress(project, $event)" title="Update Progress">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Modal -->
      <app-project-modal
        [showModal]="showModal"
        [editingProject]="editingProject"
        [context]="modalContext"
        (close)="closeModal()"
        (save)="onProjectSaved($event)">
      </app-project-modal>
    </div>
  `,
  styles: [`
    .projects-container {
      padding: 20px;
      background: #1a1a1a;
      color: #e0e0e0;
      min-height: 100vh;
    }

    .projects-header {
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
    .stat-icon.planning { background: #ff9800; color: white; }
    .stat-icon.active { background: #2196f3; color: white; }
    .stat-icon.completed { background: #4caf50; color: white; }
    .stat-icon.budget { background: #9c27b0; color: white; }
    .stat-icon.progress { background: #00bcd4; color: white; }

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

    /* Projects Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .project-card {
      background: #2d2d2d;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .project-card:hover {
      background: #404040;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .project-card.status-planning { border-left-color: #ff9800; }
    .project-card.status-active { border-left-color: #2196f3; }
    .project-card.status-on-hold { border-left-color: #6c757d; }
    .project-card.status-completed { border-left-color: #4caf50; }
    .project-card.status-cancelled { border-left-color: #f44336; }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .project-info {
      flex: 1;
    }

    .project-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .project-company {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #888;
    }

    .project-contact {
      margin: 0;
      font-size: 13px;
      color: #666;
    }

    .clickable-link {
      color: #0099ff;
      cursor: pointer;
      text-decoration: none;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    .clickable-link:hover {
      color: #ffffff;
      background-color: rgba(0, 153, 255, 0.15);
      text-decoration: none;
      transform: translateY(-1px);
    }

    .clickable-link::after {
      content: "↗";
      font-size: 10px;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .clickable-link:hover::after {
      opacity: 1;
    }

    .project-status {
      flex-shrink: 0;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.status-planning { background: #ff9800; color: white; }
    .status-badge.status-active { background: #2196f3; color: white; }
    .status-badge.status-on-hold { background: #6c757d; color: white; }
    .status-badge.status-completed { background: #4caf50; color: white; }
    .status-badge.status-cancelled { background: #f44336; color: white; }

    .project-description {
      margin-bottom: 16px;
    }

    .project-description p {
      margin: 0;
      font-size: 14px;
      color: #ccc;
      line-height: 1.4;
    }

    .project-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #404040;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2196f3, #4caf50);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      font-weight: 600;
      color: #888;
      min-width: 35px;
    }

    .project-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #888;
    }

    .detail-item svg {
      color: #666;
    }

    .project-footer {
      display: flex;
      justify-content: flex-end;
    }

    .project-actions {
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
      max-width: 700px;
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

    .budget-info {
      margin: 16px 0;
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(0, 122, 204, 0.1);
      border: 1px solid rgba(0, 122, 204, 0.3);
      border-radius: 8px;
      color: #007acc;
      font-size: 14px;
    }

    .info-message svg {
      flex-shrink: 0;
    }

    .company-select-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .company-select-container select {
      flex: 1;
    }

    .btn-small {
      padding: 6px 10px;
      font-size: 12px;
      white-space: nowrap;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .projects-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .projects-grid {
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

      .project-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  companies: Company[] = [];
  contacts: Contact[] = [];
  stats: ProjectStats | null = null;
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedCompany = '';
  
  // Modal
  showModal = false;
  editingProject: Project | null = null;
  modalContext: any = null;

  constructor(
    private projectService: ProjectService,
    private companyService: CompanyService,
    private contactService: ContactService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadProjects();
    this.loadCompanies();
    this.loadContacts();
    this.loadStats();
    
    // Check for query parameters to pre-fill form
    this.route.queryParams.subscribe(params => {
      if (params['company_id'] || params['primary_contact_id']) {
        this.modalContext = {
          type: 'company',
          company_id: params['company_id'] ? parseInt(params['company_id']) : null,
          primary_contact_id: params['primary_contact_id'] ? parseInt(params['primary_contact_id']) : null,
          company_name: params['company_name'] || null,
          contact_name: params['contact_name'] || null
        };
        this.showModal = true;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    this.projectService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          this.filteredProjects = projects;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
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

  loadContacts() {
    this.contactService.getContacts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contacts) => {
          this.contacts = contacts;
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
        }
      });
  }

  loadStats() {
    this.projectService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: ProjectStats) => {
          this.stats = stats;
        },
        error: (error: any) => {
          console.error('Error loading stats:', error);
        }
      });
  }

  getCompanyContacts(companyId: number | undefined): Contact[] {
    if (!companyId) return [];
    return this.contacts.filter(contact => contact.company_id === companyId);
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter(project => {
      const matchesSearch = !this.searchTerm || 
        project.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.company_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.team_assigned?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || project.status === this.selectedStatus;
      const matchesCompany = !this.selectedCompany || project.company_id.toString() === this.selectedCompany;
      
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
      case 'planning': return 'Planning';
      case 'active': return 'Active';
      case 'on-hold': return 'On Hold';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  viewProject(project: Project) {
    this.router.navigate(['/admin/projects', project.id]);
  }

  viewCompany(companyId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/companies', companyId]);
  }

  viewContact(contactId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/contacts', contactId]);
  }

  editProject(project: Project, event: Event) {
    event.stopPropagation();
    this.editingProject = project;
    this.modalContext = null;
    this.showModal = true;
  }

  updateProgress(project: Project, event: Event) {
    event.stopPropagation();
    const newProgress = prompt(`Update progress for "${project.title}" (0-100):`, project.progress_percentage.toString());
    if (newProgress !== null) {
      const progress = parseInt(newProgress);
      if (progress >= 0 && progress <= 100) {
        this.projectService.updateProject(project.id, { progress_percentage: progress })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadProjects();
              this.loadStats();
            },
            error: (error) => {
              console.error('Error updating progress:', error);
              alert('Error updating progress');
            }
          });
      } else {
        alert('Progress must be between 0 and 100');
      }
    }
  }

  openCreateModal() {
    this.editingProject = null;
    this.modalContext = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingProject = null;
    this.modalContext = null;
  }

  onProjectSaved(event: {project: any, data: ProjectCreate | any}) {
    this.loadProjects();
    this.loadStats();
    this.closeModal();
  }

  refreshProjects() {
    this.loadProjects();
    this.loadStats();
  }

  hasPersonalCompany(): boolean {
    return this.companies.some(company => 
      company.name.toLowerCase().includes('perso') || 
      company.name.toLowerCase().includes('personal')
    );
  }

  createPersonalCompany() {
    const companyData = {
      name: 'Perso',
      industry: 'Personal',
      status: 'client',
      notes: 'Personal projects company'
    };

    this.companyService.createCompany(companyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCompany) => {
          this.loadCompanies();
          console.log('Personal company created:', newCompany);
        },
        error: (error) => {
          console.error('Error creating personal company:', error);
          alert('Error creating personal company');
        }
      });
  }

  handleProjectError(error: any) {
    if (error.status === 422) {
      // Erreur de validation
      const errorDetails = error.error?.detail || error.error;
      let message = 'Validation error:\n';
      
      if (Array.isArray(errorDetails)) {
        errorDetails.forEach((detail: any) => {
          message += `- ${detail.loc?.join('.')}: ${detail.msg}\n`;
        });
      } else if (typeof errorDetails === 'string') {
        message += errorDetails;
      } else {
        message += 'Please check all required fields are filled correctly.';
      }
      
      alert(message);
    } else if (error.status === 400) {
      alert('Bad request: Please check your input data.');
    } else if (error.status === 500) {
      alert('Server error: Please try again later.');
    } else {
      alert(`Error creating project: ${error.message || 'Unknown error'}`);
    }
  }
}
