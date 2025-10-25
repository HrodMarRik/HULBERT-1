import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, interval, of } from 'rxjs';
import { takeUntil, catchError, switchMap } from 'rxjs/operators';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Ticket, TicketCreate, TicketUpdate, TicketStats, TicketComment } from '../../../models/ticket.model';
import { Project } from '../../../models/project.model';
import { TicketModalComponent, TicketContext } from './components/ticket-modal.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TicketModalComponent],
  template: `
    <div class="tickets-container admin-page-container">
      <!-- Header -->
      <div class="tickets-header">
        <div class="header-content">
          <h1>Système de Tickets</h1>
          <p class="header-subtitle">Gérez vos demandes et problèmes de manière organisée</p>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="navigateToLogs()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
            </svg>
            Logs
          </button>
          <button class="action-btn primary" (click)="openTicketModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Nouveau Ticket
          </button>
          <button class="action-btn secondary" (click)="toggleView()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"/>
            </svg>
            {{ isKanbanView ? 'Vue Liste' : 'Vue Kanban' }}
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="tickets-content">

      <!-- Stats Cards - Compact Layout -->
      <div class="stats-container-compact">
        
        <!-- Status Block -->
        <div class="stats-block-compact">
          <h3 class="block-title-compact">Status</h3>
          <div class="stats-grid-compact">
            <div class="stat-card-compact clickable" (click)="resetAllFilters()" title="Reset all filters">
              <div class="stat-icon-compact total">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ stats?.total || 0 }}</div>
                <div class="stat-label-compact">Total</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByStatus('open')" title="Filter by Open status">
              <div class="stat-icon-compact open">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getStatusCount('open') }}</div>
                <div class="stat-label-compact">Open</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByStatus('in_progress')" title="Filter by In Progress status">
              <div class="stat-icon-compact progress">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getStatusCount('in_progress') }}</div>
                <div class="stat-label-compact">Progress</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByStatus('resolved')" title="Filter by Resolved status">
              <div class="stat-icon-compact resolved">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getStatusCount('resolved') }}</div>
                <div class="stat-label-compact">Resolved</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Priority Block -->
        <div class="stats-block-compact">
          <h3 class="block-title-compact">Priority</h3>
          <div class="stats-grid-compact">
            <div class="stat-card-compact clickable" (click)="filterByPriority('critical')" title="Filter by Critical priority">
              <div class="stat-icon-compact critical">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ stats?.critical || 0 }}</div>
                <div class="stat-label-compact">Critical</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByPriority('high')" title="Filter by High priority">
              <div class="stat-icon-compact high">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ stats?.high || 0 }}</div>
                <div class="stat-label-compact">High</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByPriority('medium')" title="Filter by Medium priority">
              <div class="stat-icon-compact medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ stats?.medium || 0 }}</div>
                <div class="stat-label-compact">Medium</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByPriority('low')" title="Filter by Low priority">
              <div class="stat-icon-compact low">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ stats?.low || 0 }}</div>
                <div class="stat-label-compact">Low</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Theme Block -->
        <div class="stats-block-compact">
          <h3 class="block-title-compact">Theme</h3>
          <div class="stats-grid-compact">
            <div class="stat-card-compact clickable" (click)="filterByTheme('Bug')" title="Filter by Bug theme">
              <div class="stat-icon-compact bug">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getThemeCount('Bug') }}</div>
                <div class="stat-label-compact">Bug</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByTheme('Feature')" title="Filter by Feature theme">
              <div class="stat-icon-compact feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getThemeCount('Feature') }}</div>
                <div class="stat-label-compact">Feature</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByTheme('Support')" title="Filter by Support theme">
              <div class="stat-icon-compact support">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getThemeCount('Support') }}</div>
                <div class="stat-label-compact">Support</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByTheme('Question')" title="Filter by Question theme">
              <div class="stat-icon-compact question">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getThemeCount('Question') }}</div>
                <div class="stat-label-compact">Question</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByTheme('Documentation')" title="Filter by Documentation theme">
              <div class="stat-icon-compact documentation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getThemeCount('Documentation') }}</div>
                <div class="stat-label-compact">Docs</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Assignment Block -->
        <div class="stats-block-compact">
          <h3 class="block-title-compact">Assignment</h3>
          <div class="stats-grid-compact">
            <div class="stat-card-compact clickable" (click)="filterByAssigned('HrodMarRik')" title="Filter by HrodMarRik assignment">
              <div class="stat-icon-compact assigned">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getAssignedCount('HrodMarRik') }}</div>
                <div class="stat-label-compact">My Tickets</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByAssigned('Non assigné')" title="Filter by unassigned tickets">
              <div class="stat-icon-compact unassigned">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getAssignedCount('Non assigné') }}</div>
                <div class="stat-label-compact">Unassigned</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Project Block -->
        <div class="stats-block-compact">
          <h3 class="block-title-compact">Projets</h3>
          <div class="stats-grid-compact">
            <div class="stat-card-compact clickable" (click)="filterByProject('')" title="Voir tous les tickets">
              <div class="stat-icon-compact project">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ tickets.length }}</div>
                <div class="stat-label-compact">Tous</div>
              </div>
            </div>
            <div class="stat-card-compact clickable" (click)="filterByProject('unassigned')" title="Tickets sans projet">
              <div class="stat-icon-compact unassigned">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                </svg>
              </div>
              <div class="stat-content-compact">
                <div class="stat-number-compact">{{ getTicketsWithoutProject() }}</div>
                <div class="stat-label-compact">Sans projet</div>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-left">
            <div class="filter-group">
              <label>Status:</label>
              <select [(ngModel)]="filters.status" (ngModelChange)="applyFilters()">
                <option value="">Active (excluding resolved)</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="all">All (including resolved)</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Priority:</label>
              <select [(ngModel)]="filters.priority" (ngModelChange)="applyFilters()">
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Theme:</label>
              <select [(ngModel)]="filters.theme" (ngModelChange)="applyFilters()">
                <option value="">All</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="Support">Support</option>
                <option value="Question">Question</option>
                <option value="Documentation">Documentation</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Assigned to:</label>
              <select [(ngModel)]="filters.assigned_to" (ngModelChange)="applyFilters()">
                <option value="">All</option>
                <option value="HrodMarRik">HrodMarRik</option>
                <option value="Agent">Agent</option>
                <option value="Non assigné">Unassigned</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Projet:</label>
              <select [(ngModel)]="filters.project_id" (ngModelChange)="applyFilters()">
                <option value="">Tous les projets</option>
                <option *ngFor="let project of projects" [value]="project.id">
                  {{ project.title }}
                </option>
              </select>
            </div>
        </div>
        
        <!-- Priority Quick Create Buttons -->
        <div class="priority-buttons">
          <span class="priority-label">Quick create:</span>
          <button class="priority-btn low" (click)="openTicketModal({ type: 'normal' }, 'question')" title="Create Question ticket">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            Question
          </button>
          <button class="priority-btn medium" (click)="openTicketModal({ type: 'normal' }, 'feature')" title="Create Feature ticket">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            Feature
          </button>
          <button class="priority-btn high" (click)="openTicketModal({ type: 'normal' }, 'bug')" title="Create Bug ticket">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
            Bug
          </button>
          <button class="priority-btn critical" (click)="openTicketModal({ type: 'normal' }, 'bug')" title="Create Critical Bug ticket">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
            </svg>
            Bug Critique
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="tickets-content">
        <!-- List View -->
        <div *ngIf="!isKanbanView" class="tickets-list">
          <div class="list-header">
            <h2>Liste des Tickets</h2>
            <div class="list-actions">
              <button class="action-btn secondary" (click)="refreshTickets()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Actualiser
              </button>
            </div>
          </div>
          <div class="tickets-grid">
            <div *ngFor="let ticket of filteredTickets" 
                 class="ticket-card priority-{{ ticket.priority }}" 
                 [class.resolved]="ticket.status === 'resolved'"
                 (click)="openEditTicketModal(ticket)">
              <div class="ticket-header">
                <div class="ticket-info">
                  <h3 class="ticket-title">{{ ticket.title }}</h3>
                  <div class="ticket-meta">
                    <span class="ticket-id">#{{ ticket.id }}</span>
                    <span class="ticket-theme">{{ ticket.theme }}</span>
                    <span class="ticket-priority" [class]="'priority-' + ticket.priority">{{ ticket.priority }}</span>
                    <span class="ticket-project" *ngIf="ticket.project_id">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                      </svg>
                      {{ getProjectName(ticket.project_id) }}
                    </span>
                    <span *ngIf="ticket.status === 'resolved'" class="resolved-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                      RÉSOLU
                    </span>
                  </div>
                </div>
                <div class="ticket-status">
                  <span class="status-badge" [class]="'status-' + ticket.status">{{ getStatusDisplay(ticket.status) }}</span>
                </div>
              </div>
              <div class="ticket-content">
                <p class="ticket-description">{{ ticket.description | slice:0:150 }}{{ ticket.description.length > 150 ? '...' : '' }}</p>
                <div class="ticket-footer">
                  <div class="ticket-dates">
                    <span class="created-date">Created: {{ ticket.created_at | date:'short' }}</span>
                    <span *ngIf="ticket.due_date" class="due-date">Due: {{ ticket.due_date | date:'short' }}</span>
                  </div>
                  <div class="ticket-assignment">
                    <span *ngIf="ticket.assigned_to" class="assigned-to">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                      </svg>
                      {{ ticket.assigned_to }}
                    </span>
                    <span *ngIf="!ticket.assigned_to" class="unassigned">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                      </svg>
                      Unassigned
                    </span>
                  </div>
                  <div class="ticket-actions">
                    <!-- Bouton pour ticket Open -->
                    <button *ngIf="ticket.status === 'open'" class="status-btn status-btn-progress" (click)="changeTicketStatus(ticket, 'in_progress'); $event.stopPropagation()" title="Start working on this ticket">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                      </svg>
                      In Progress
                    </button>
                    
                    <!-- Boutons pour ticket In Progress -->
                    <div *ngIf="ticket.status === 'in_progress'" class="status-buttons-group">
                      <button class="status-btn status-btn-resolved" (click)="changeTicketStatus(ticket, 'resolved'); $event.stopPropagation()" title="Mark as resolved">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                        </svg>
                        Resolve
                      </button>
                      <button class="status-btn status-btn-closed" (click)="changeTicketStatus(ticket, 'closed'); $event.stopPropagation()" title="Close this ticket">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                        Close
                      </button>
                    </div>
                    
                    <!-- Bouton pour ticket Resolved/Closed -->
                    <button *ngIf="ticket.status === 'resolved' || ticket.status === 'closed'" class="status-btn status-btn-open" (click)="changeTicketStatus(ticket, 'open'); $event.stopPropagation()" title="Reopen this ticket">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H9L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21M17,20H7V9H17V20Z"/>
                      </svg>
                      Reopen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kanban View -->
        <div *ngIf="isKanbanView && tickets && tickets.length > 0" class="kanban-board">
          <div class="kanban-column" 
               cdkDropList="open" 
               [cdkDropListData]="openTickets"
               (cdkDropListDropped)="drop($event)">
            <div class="column-header">
              <h3>Ouverts</h3>
                <span class="column-count">{{ openTickets.length || 0 }}</span>
            </div>
            <div class="column-content">
              <div *ngFor="let ticket of openTickets; trackBy: trackByTicket" 
                   class="kanban-card" 
                   cdkDrag
                   (click)="openEditTicketModal(ticket)">
                <div class="card-header">
                  <span class="card-id">#{{ ticket.id }}</span>
                  <span class="card-priority" [class]="'priority-' + ticket.priority">{{ ticket.priority }}</span>
                </div>
                <h4 class="card-title">{{ ticket.title }}</h4>
                <p class="card-description">{{ ticket.description | slice:0:100 }}{{ ticket.description.length > 100 ? '...' : '' }}</p>
                <div class="card-footer">
                  <span class="card-theme">{{ ticket.theme }}</span>
                  <span class="card-comments">{{ ticket.comment_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column" 
               cdkDropList="in_progress" 
               [cdkDropListData]="inProgressTickets"
               (cdkDropListDropped)="drop($event)">
            <div class="column-header">
              <h3>En Cours</h3>
                <span class="column-count">{{ inProgressTickets.length || 0 }}</span>
            </div>
            <div class="column-content">
              <div *ngFor="let ticket of inProgressTickets; trackBy: trackByTicket" 
                   class="kanban-card" 
                   cdkDrag
                   (click)="openEditTicketModal(ticket)">
                <div class="card-header">
                  <span class="card-id">#{{ ticket.id }}</span>
                  <span class="card-priority" [class]="'priority-' + ticket.priority">{{ ticket.priority }}</span>
                </div>
                <h4 class="card-title">{{ ticket.title }}</h4>
                <p class="card-description">{{ ticket.description | slice:0:100 }}{{ ticket.description.length > 100 ? '...' : '' }}</p>
                <div class="card-footer">
                  <span class="card-theme">{{ ticket.theme }}</span>
                  <span class="card-comments">{{ ticket.comment_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column" 
               cdkDropList="resolved" 
               [cdkDropListData]="resolvedTickets"
               (cdkDropListDropped)="drop($event)">
            <div class="column-header">
              <h3>Résolus</h3>
                <span class="column-count">{{ resolvedTickets.length || 0 }}</span>
            </div>
            <div class="column-content">
              <div *ngFor="let ticket of resolvedTickets; trackBy: trackByTicket" 
                   class="kanban-card" 
                   cdkDrag
                   (click)="openEditTicketModal(ticket)">
                <div class="card-header">
                  <span class="card-id">#{{ ticket.id }}</span>
                  <span class="card-priority" [class]="'priority-' + ticket.priority">{{ ticket.priority }}</span>
                </div>
                <h4 class="card-title">{{ ticket.title }}</h4>
                <p class="card-description">{{ ticket.description | slice:0:100 }}{{ ticket.description.length > 100 ? '...' : '' }}</p>
                <div class="card-footer">
                  <span class="card-theme">{{ ticket.theme }}</span>
                  <span class="card-comments">{{ ticket.comment_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="kanban-column" 
               cdkDropList="closed" 
               [cdkDropListData]="closedTickets"
               (cdkDropListDropped)="drop($event)">
            <div class="column-header">
              <h3>Fermés</h3>
                <span class="column-count">{{ closedTickets.length || 0 }}</span>
            </div>
            <div class="column-content">
              <div *ngFor="let ticket of closedTickets; trackBy: trackByTicket" 
                   class="kanban-card" 
                   cdkDrag
                   (click)="openEditTicketModal(ticket)">
                <div class="card-header">
                  <span class="card-id">#{{ ticket.id }}</span>
                  <span class="card-priority" [class]="'priority-' + ticket.priority">{{ ticket.priority }}</span>
                </div>
                <h4 class="card-title">{{ ticket.title }}</h4>
                <p class="card-description">{{ ticket.description | slice:0:100 }}{{ ticket.description.length > 100 ? '...' : '' }}</p>
                <div class="card-footer">
                  <span class="card-theme">{{ ticket.theme }}</span>
                  <span class="card-comments">{{ ticket.comment_count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message si pas de tickets -->
        <div *ngIf="isKanbanView && (!tickets || tickets.length === 0)" class="no-tickets">
          <div class="no-tickets-content">
            <h3>Aucun ticket disponible</h3>
            <p>Créez votre premier ticket pour commencer à utiliser le système de gestion.</p>
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Créer un ticket
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Ticket Modal -->
    <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Créer un nouveau ticket</h2>
          <button class="close-btn" (click)="closeCreateModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="createTicket()">
            <div class="form-group">
              <label>Titre *</label>
              <input type="text" [(ngModel)]="newTicket.title" name="title" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newTicket.description" name="description" rows="4"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Thème *</label>
                <select [(ngModel)]="newTicket.theme" name="theme" required>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Fonctionnalité</option>
                  <option value="Support">Support</option>
                  <option value="Question">Question</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priorité *</label>
                <select [(ngModel)]="newTicket.priority" name="priority" required>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Assigné à</label>
                <div class="assignment-controls">
                  <select [(ngModel)]="newTicket.assigned_to" name="assigned_to">
                    <option value="">Non assigné</option>
                    <option value="HrodMarRik">HrodMarRik</option>
                    <option value="Agent">Agent</option>
                  </select>
                  <div class="assignment-buttons">
                    <button type="button" class="assignment-btn self" (click)="assignToSelf()" [disabled]="!currentUser">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                      </svg>
                      Moi
                    </button>
                    <div class="agent-dropdown">
                      <button type="button" class="assignment-btn agent" (click)="showAgentDropdown = !showAgentDropdown">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                        </svg>
                        Agent
                      </button>
                      <div *ngIf="showAgentDropdown" class="agent-list">
                        <div *ngFor="let agent of availableAgents" 
                             class="agent-item" 
                             (click)="assignToAgent(agent.id); showAgentDropdown = false">
                          {{ agent.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Date d'échéance</label>
                <input type="datetime-local" [(ngModel)]="newTicket.due_date" name="due_date">
              </div>
            </div>
            <div class="form-group">
              <label>Tags</label>
              <input type="text" [(ngModel)]="newTicket.tags" name="tags" placeholder="Séparés par des virgules">
            </div>
            <div class="form-group">
              <label>Heures estimées</label>
              <input type="number" [(ngModel)]="newTicket.estimated_hours" name="estimated_hours" step="0.5">
            </div>
            <div class="form-group">
              <label>Projet (optionnel)</label>
              <select [(ngModel)]="newTicket.project_id" name="project_id">
                <option value="">Aucun projet</option>
                <option *ngFor="let project of projects" [value]="project.id">{{ project.title }}</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="action-btn secondary" (click)="closeCreateModal()">Annuler</button>
              <button type="submit" class="action-btn primary" [disabled]="!newTicket.title || !newTicket.description">Créer</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- New Ticket Modal -->
    <app-ticket-modal
      [isVisible]="showTicketModal"
      [editingTicket]="editingTicket"
      [context]="ticketContext"
      [prefilledTemplate]="prefilledTemplate"
      (close)="closeTicketModal()"
      (save)="onTicketSave($event)"
      (delete)="onTicketDelete($event)">
    </app-ticket-modal>
  `,
  styles: [`
    .tickets-container {
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .tickets-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px 24px 24px;
      background: #1a1a1a;
    }

    .tickets-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border-radius: 0 0 12px 12px;
      margin-bottom: 20px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #fff;
    }

    .header-subtitle {
      margin: 0;
      color: #888;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      background: #404040;
      border: none;
      color: #e0e0e0;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn:hover {
      background: #505050;
      transform: translateY(-1px);
    }

    .action-btn.primary {
      background: #007acc;
      color: white;
    }

    .action-btn.primary:hover {
      background: #005a9e;
    }

    .action-btn.secondary {
      background: #666;
    }

    .action-btn.secondary:hover {
      background: #777;
    }

    /* Compact Stats Layout */
    .stats-container-compact {
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .stats-block-compact {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      flex: 1;
      min-width: 200px;
    }
    
    .block-title-compact {
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #404040;
      padding-bottom: 4px;
    }
    
    .stats-grid-compact {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
    }
    
    .stat-card-compact {
      background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
      border-radius: 6px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
      border: 1px solid #404040;
      cursor: pointer;
    }
    
    .stat-card-compact:hover {
      background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .stat-icon-compact {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-content-compact {
      text-align: center;
    }
    
    .stat-number-compact {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }
    
    .stat-label-compact {
      font-size: 9px;
      color: #ccc;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    /* Priority Colors for Compact Stats */
    .stat-icon-compact.critical { background: #dc3545; color: #fff; }
    .stat-icon-compact.high { background: #fd7e14; color: #fff; }
    .stat-icon-compact.medium { background: #28a745; color: #fff; }
    .stat-icon-compact.low { background: #007bff; color: #fff; }
    .stat-icon-compact.open { background: #4caf50; color: #fff; }
    .stat-icon-compact.progress { background: #ffc107; color: #000; }
    .stat-icon-compact.resolved { background: #2196f3; color: #fff; }
    .stat-icon-compact.total { background: #6c757d; color: #fff; }
    .stat-icon-compact.bug { background: #dc3545; color: #fff; }
    .stat-icon-compact.feature { background: #17a2b8; color: #fff; }
    .stat-icon-compact.support { background: #6f42c1; color: #fff; }
    .stat-icon-compact.question { background: #fd7e14; color: #fff; }
    .stat-icon-compact.documentation { background: #28a745; color: #fff; }
    .stat-icon-compact.assigned { background: #20c997; color: #fff; }
    .stat-icon-compact.unassigned { background: #6c757d; color: #fff; }
    .stat-icon-compact.project { background: #6f42c1; color: #fff; }

    /* Priority Colors - Consistent across all components */
    .stat-icon.critical { background: #dc3545; color: #fff; }
    .stat-icon.high { background: #fd7e14; color: #fff; }
    .stat-icon.medium { background: #28a745; color: #fff; }
    .stat-icon.low { background: #007bff; color: #fff; }

    /* Priority Colors for Ticket Cards - Consistent */
    .ticket-card.priority-critical { border-left: 4px solid #dc3545; }
    .ticket-card.priority-high { border-left: 4px solid #fd7e14; }
    .ticket-card.priority-medium { border-left: 4px solid #28a745; }
    .ticket-card.priority-low { border-left: 4px solid #007bff; }

    /* Priority Badge Colors - Consistent */
    .ticket-priority.priority-critical { background: #dc3545; color: #fff; }
    .ticket-priority.priority-high { background: #fd7e14; color: #fff; }
    .ticket-priority.priority-medium { background: #28a745; color: #fff; }
    .ticket-priority.priority-low { background: #007bff; color: #fff; }

    .stat-card {
      background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid #555;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #007acc, #00d4aa);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stat-card.clickable {
      cursor: pointer;
    }

    .stat-card.clickable:hover {
      background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
      border-color: #666;
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    }

    .stat-card.clickable:hover::before {
      opacity: 1;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }

    .stat-icon::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: inherit;
      opacity: 0.1;
      border-radius: inherit;
    }

    .stat-icon.total { background: rgba(0, 122, 204, 0.2); color: #007acc; }
    .stat-icon.open { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
    .stat-icon.progress { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
    .stat-icon.critical { background: rgba(244, 67, 54, 0.2); color: #f44336; }

    .stat-icon.high { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
    .stat-icon.medium { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
    .stat-icon.low { background: rgba(76, 175, 80, 0.2); color: #4caf50; }

    .stat-icon.resolved { background: rgba(76, 175, 80, 0.2); color: #4caf50; }

    .stat-icon.bug { background: rgba(244, 67, 54, 0.2); color: #f44336; }
    .stat-icon.feature { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
    .stat-icon.support { background: rgba(156, 39, 176, 0.2); color: #9c27b0; }
    .stat-icon.question { background: rgba(0, 188, 212, 0.2); color: #00bcd4; }
    .stat-icon.documentation { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }

    .stat-icon.assigned { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
    .stat-icon.unassigned { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .stat-label {
      font-size: 11px;
      font-weight: 500;
      color: #b0b0b0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }

    .filters-section {
      background: #2d2d2d;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }

    .filters-left {
      display: flex;
      gap: 24px;
      align-items: center;
      flex-wrap: wrap;
    }

    .priority-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .priority-label {
      color: #e0e0e0;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    .priority-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .priority-btn.low {
      background: #4caf50;
      color: white;
    }

    .priority-btn.low:hover {
      background: #45a049;
      transform: translateY(-1px);
    }

    .priority-btn.medium {
      background: #ff9800;
      color: white;
    }

    .priority-btn.medium:hover {
      background: #f57c00;
      transform: translateY(-1px);
    }

    .priority-btn.high {
      background: #f44336;
      color: white;
    }

    .priority-btn.high:hover {
      background: #d32f2f;
      transform: translateY(-1px);
    }

    .priority-btn.critical {
      background: #9c27b0;
      color: white;
    }

    .priority-btn.critical:hover {
      background: #7b1fa2;
      transform: translateY(-1px);
    }

    .refresh-btn {
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover {
      background: #5a6268;
      transform: translateY(-1px);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group label {
      font-size: 14px;
      font-weight: 500;
      color: #e0e0e0;
    }

    .filter-group select {
      background: #404040;
      border: 1px solid #555;
      color: #e0e0e0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #007acc;
    }

    .tickets-content {
      background: #2d2d2d;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #404040;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #404040;
    }

    .list-header h2 {
      margin: 0;
      font-size: 20px;
      color: #fff;
    }

    .list-actions {
      display: flex;
      gap: 12px;
    }

    .tickets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }

    .ticket-card {
      background: #404040;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid #555;
      margin-bottom: 8px;
    }

    /* Bordures colorées selon la priorité - juste une bordure fine */
    .ticket-card.priority-critical {
      border-left: 4px solid #dc3545;
    }

    .ticket-card.priority-high {
      border-left: 4px solid #fd7e14;
    }

    .ticket-card.priority-medium {
      border-left: 4px solid #28a745;
    }

    .ticket-card.priority-low {
      border-left: 4px solid #007bff;
    }

    /* Effet grisé pour les tickets résolus */
    .ticket-card.resolved {
      opacity: 0.6;
      background: #353535;
      position: relative;
    }

    .ticket-card.resolved::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%);
      pointer-events: none;
      border-radius: 12px;
    }

    .ticket-card:hover {
      background: #4a4a4a;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .ticket-card.resolved:hover {
      background: #3a3a3a;
      opacity: 0.8;
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .ticket-title {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .ticket-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .resolved-badge {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .ticket-id {
      background: #666;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .ticket-theme {
      background: #007acc;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .ticket-priority {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .ticket-project {
      background: #6f42c1;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .ticket-project svg {
      width: 12px;
      height: 12px;
    }

    /* Pastilles de priorité dans les tickets */
    .ticket-priority.priority-critical { background: #dc3545; color: #fff; }
    .ticket-priority.priority-high { background: #fd7e14; color: #fff; }
    .ticket-priority.priority-medium { background: #28a745; color: #fff; }
    .ticket-priority.priority-low { background: #007bff; color: #fff; }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-open { background: #4caf50; color: #fff; }
    .status-in_progress { background: #ffc107; color: #000; }
    .status-resolved { background: #2196f3; color: #fff; }
    .status-closed { background: #666; color: #fff; }

    .ticket-description {
      color: #ccc;
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    /* Ticket Footer Layout */
    .ticket-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #888;
      margin-top: 8px;
      gap: 12px;
    }
    
    .ticket-dates {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }
    
    .ticket-assignment {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }
    
    .assigned-to, .unassigned {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #ccc;
    }
    
    .assigned-to svg {
      color: #20c997;
    }
    
    .unassigned svg {
      color: #6c757d;
    }
    
    .ticket-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    
    /* Status Buttons - New Design */
    .status-btn {
      border: none;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;
      min-height: 28px;
    }
    
    .status-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .status-btn svg {
      color: #fff;
    }
    
    .status-buttons-group {
      display: flex;
      gap: 4px;
    }
    
    /* Status Button Colors - Matching Stats */
    .status-btn-progress {
      background: #ffc107; /* Yellow - same as progress stats */
      color: #000;
    }
    
    .status-btn-progress:hover {
      background: #e0a800;
    }
    
    .status-btn-resolved {
      background: #2196f3; /* Blue - same as resolved stats */
      color: #fff;
    }
    
    .status-btn-resolved:hover {
      background: #1976d2;
    }
    
    .status-btn-closed {
      background: #6c757d; /* Gray - same as closed stats */
      color: #fff;
    }
    
    .status-btn-closed:hover {
      background: #5a6268;
    }
    
    .status-btn-open {
      background: #4caf50; /* Green - same as open stats */
      color: #fff;
    }
    
    .status-btn-open:hover {
      background: #45a049;
    }

    .ticket-dates {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .assigned-to {
      color: #4caf50;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(76, 175, 80, 0.1);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 13px;
    }

    .ticket-stats {
      display: flex;
      gap: 12px;
    }

    .comment-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Kanban Board */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      min-height: 600px;
    }

    /* Message pas de tickets */
    .no-tickets {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 40px;
    }

    .no-tickets-content {
      text-align: center;
      max-width: 400px;
    }

    .no-tickets-content h3 {
      color: #e0e0e0;
      margin-bottom: 16px;
      font-size: 24px;
    }

    .no-tickets-content p {
      color: #888;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .no-tickets-content .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .kanban-column {
      background: #404040;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #555;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #555;
    }

    .column-header h3 {
      margin: 0;
      font-size: 16px;
      color: #fff;
    }

    .column-count {
      background: #666;
      color: #fff;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .column-content {
      min-height: 500px;
    }

    .kanban-card {
      background: #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid #555;
    }

    .kanban-card:hover {
      background: #3a3a3a;
      transform: translateY(-1px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .card-id {
      background: #666;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .card-priority {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .card-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .card-description {
      color: #ccc;
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #888;
    }

    .card-theme {
      background: #007acc;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .card-comments {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
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
      border: 1px solid #404040;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      color: #fff;
    }

    .close-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #404040;
      color: #fff;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #e0e0e0;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      background: #404040;
      border: 1px solid #555;
      color: #e0e0e0;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #007acc;
    }

    .assignment-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .assignment-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .assignment-btn {
      background: #404040;
      border: 1px solid #555;
      color: #e0e0e0;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .assignment-btn:hover {
      background: #505050;
      border-color: #007acc;
    }

    .assignment-btn.self {
      background: #007acc;
      color: white;
    }

    .assignment-btn.self:hover {
      background: #005a9e;
    }

    .assignment-btn.agent {
      background: #4caf50;
      color: white;
    }

    .assignment-btn.agent:hover {
      background: #45a049;
    }

    .assignment-btn:disabled {
      background: #666;
      color: #888;
      cursor: not-allowed;
    }

    .agent-dropdown {
      position: relative;
    }

    .agent-list {
      position: absolute;
      top: 100%;
      left: 0;
      background: #2d2d2d;
      border: 1px solid #555;
      border-radius: 6px;
      min-width: 150px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .agent-item {
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s ease;
      font-size: 12px;
    }

    .agent-item:hover {
      background: #404040;
    }

    .agent-item:first-child {
      border-radius: 6px 6px 0 0;
    }

    .agent-item:last-child {
      border-radius: 0 0 6px 6px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #404040;
    }

    .ticket-detail {
      display: grid;
      gap: 24px;
    }

    .ticket-info {
      background: #404040;
      border-radius: 8px;
      padding: 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .info-row label {
      font-weight: 500;
      color: #e0e0e0;
    }

    .info-row select,
    .info-row input {
      background: #2d2d2d;
      border: 1px solid #555;
      color: #e0e0e0;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .ticket-description h3,
    .ticket-comments h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #fff;
    }

    .ticket-description textarea {
      width: 100%;
      background: #404040;
      border: 1px solid #555;
      color: #e0e0e0;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
    }

    .comment-form {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .comment-form textarea {
      flex: 1;
      background: #404040;
      border: 1px solid #555;
      color: #e0e0e0;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      background: #404040;
      border-radius: 8px;
      padding: 16px;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .comment-author {
      font-weight: 500;
      color: #007acc;
    }

    .comment-date {
      font-size: 12px;
      color: #888;
    }

    .comment-content {
      color: #e0e0e0;
      line-height: 1.5;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .tickets-container {
        padding: 16px;
      }

      .tickets-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .tickets-grid {
        grid-template-columns: 1fr;
      }

      .kanban-board {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-content {
        width: 95%;
        margin: 20px;
      }
    }
  `]
})
export class TicketsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  stats: TicketStats | null = null;
  
  // View state
  isKanbanView = false;
  showCreateModal = false;
  showTicketModal = false;
  editingTicket: Ticket | null = null;
  ticketContext: TicketContext = { type: 'normal' };
  prefilledTemplate?: 'bug' | 'feature' | 'question';
  
  // Filters
  filters = {
    status: '',
    priority: '',
    theme: '',
    assigned_to: '',
    project_id: ''
  };
  
  // New ticket form
  newTicket: TicketCreate = {
    title: '',
    description: '',
    theme: 'Bug',
    priority: 'medium',
    status: 'open',
    assigned_to: '',
    due_date: '',
    tags: '',
    estimated_hours: 1
  };
  
  // Available agents for assignment
  availableAgents: any[] = [];
  currentUser: any = null;
  showAgentDropdown = false;
  
  // Projects for linking tickets
  projects: Project[] = [];
  
  // Kanban columns
  openTickets: Ticket[] = [];
  inProgressTickets: Ticket[] = [];
  resolvedTickets: Ticket[] = [];
  closedTickets: Ticket[] = [];

  constructor(private http: HttpClient, private router: Router) {
    // Initialize Kanban arrays to prevent undefined errors
    this.openTickets = [];
    this.inProgressTickets = [];
    this.resolvedTickets = [];
    this.closedTickets = [];
  }

  ngOnInit() {
    this.loadTickets();
    this.loadStats();
    this.loadAgents();
    this.loadCurrentUser();
    this.loadProjects();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAgents() {
    this.http.get<any[]>('http://localhost:8000/api/agents')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading agents:', error);
          return of([]);
        })
      )
      .subscribe({
        next: (agents) => {
          // Ajouter votre nom en premier dans la liste
          this.availableAgents = [
            { id: 0, name: 'HrodMarRik' },
            ...agents
          ];
        }
      });
  }

  private loadCurrentUser() {
    // Récupérer les informations de l'utilisateur depuis le token JWT
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser = {
          id: payload.sub,
          username: payload.username || 'HrodMarRik'
        };
      } catch (error) {
        console.error('Error parsing token:', error);
        this.currentUser = { id: 1, username: 'HrodMarRik' };
      }
    }
  }

  private loadProjects() {
    this.http.get<Project[]>('http://localhost:8000/api/projects')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading projects:', error);
          return of([]);
        })
      )
      .subscribe(projects => {
        this.projects = projects;
      });
  }

  private startAutoRefresh() {
    interval(30000) // Refresh every 30 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTickets();
        this.loadStats();
      });
  }

  loadTickets() {
    this.http.get<Ticket[]>('http://localhost:8000/api/tickets')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading tickets:', error);
          return of([]);
        })
      )
      .subscribe({
        next: (tickets) => {
          this.tickets = tickets;
          this.applyFilters();
          this.updateKanbanColumns();
        }
      });
  }

  loadStats() {
    this.http.get<TicketStats>('http://localhost:8000/api/tickets/stats/summary')
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading stats:', error);
          return of({
            total: 0,
            open: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unread_count: 0
          });
        })
      )
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        }
      });
  }

  applyFilters() {
    this.filteredTickets = this.tickets.filter(ticket => {
      // Si "all" est sélectionné, afficher tous les tickets
      if (this.filters.status === 'all') {
        if (this.filters.priority && ticket.priority !== this.filters.priority) return false;
        if (this.filters.theme && ticket.theme !== this.filters.theme) return false;
        if (this.filters.assigned_to && ticket.assigned_to !== this.filters.assigned_to) return false;
        if (this.filters.project_id === 'unassigned' && ticket.project_id) return false;
        if (this.filters.project_id && this.filters.project_id !== 'unassigned' && ticket.project_id !== parseInt(this.filters.project_id)) return false;
        return true;
      }
      
      // Exclure les tickets résolus par défaut, sauf si explicitement recherchés
      if (ticket.status === 'resolved' && this.filters.status !== 'resolved') {
        return false;
      }
      
      if (this.filters.status && ticket.status !== this.filters.status) return false;
      if (this.filters.priority && ticket.priority !== this.filters.priority) return false;
      if (this.filters.theme && ticket.theme !== this.filters.theme) return false;
      if (this.filters.assigned_to && ticket.assigned_to !== this.filters.assigned_to) return false;
      if (this.filters.project_id === 'unassigned' && ticket.project_id) return false;
      if (this.filters.project_id && this.filters.project_id !== 'unassigned' && ticket.project_id !== parseInt(this.filters.project_id)) return false;
      return true;
    }).sort((a, b) => {
      // Tri personnalisé : En cours → Critique → High → Medium → Low
      // Priorité combinée : statut + priorité
      const getPriorityScore = (ticket: any) => {
        let score = 0;
        
        // Statut en cours = priorité maximale
        if (ticket.status === 'in_progress') {
          score += 1000;
        }
        
        // Puis par priorité
        const priorityScores = { 'critical': 100, 'high': 80, 'medium': 60, 'low': 40 };
        score += priorityScores[ticket.priority as keyof typeof priorityScores] || 0;
        
        return score;
      };
      
      const aScore = getPriorityScore(a);
      const bScore = getPriorityScore(b);
      
      // Si score différent, trier par score (plus élevé en premier)
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // Si même score, trier par date de création (plus vieux en premier)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    this.updateKanbanColumns();
  }

  updateKanbanColumns() {
    // S'assurer que les tableaux sont initialisés
    if (!this.openTickets) this.openTickets = [];
    if (!this.inProgressTickets) this.inProgressTickets = [];
    if (!this.resolvedTickets) this.resolvedTickets = [];
    if (!this.closedTickets) this.closedTickets = [];
    
    if (!this.filteredTickets || this.filteredTickets.length === 0) {
      this.openTickets = [];
      this.inProgressTickets = [];
      this.resolvedTickets = [];
      this.closedTickets = [];
      return;
    }
    
    this.openTickets = this.filteredTickets.filter(t => t.status === 'open');
    this.inProgressTickets = this.filteredTickets.filter(t => t.status === 'in_progress');
    this.resolvedTickets = this.filteredTickets.filter(t => t.status === 'resolved');
    this.closedTickets = this.filteredTickets.filter(t => t.status === 'closed');
  }

  toggleView() {
    this.isKanbanView = !this.isKanbanView;
  }

  trackByTicket(index: number, ticket: Ticket): number {
    return ticket.id;
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.initializeDefaultTicket();
  }

  openTicketModal(context?: TicketContext, template?: 'bug' | 'feature' | 'question') {
    this.ticketContext = context || { type: 'normal' };
    this.prefilledTemplate = template;
    this.editingTicket = null;
    this.showTicketModal = true;
  }

  openEditTicketModal(ticket: Ticket) {
    this.editingTicket = ticket;
    this.ticketContext = { type: 'normal' };
    this.prefilledTemplate = undefined;
    this.showTicketModal = true;
  }

  closeTicketModal() {
    this.showTicketModal = false;
    this.editingTicket = null;
    this.ticketContext = { type: 'normal' };
    this.prefilledTemplate = undefined;
  }

  onTicketSave(event: {ticket: any, data: TicketCreate | TicketUpdate}) {
    if (event.ticket) {
      // Mode édition - update the ticket with the new data
      this.updateTicketFromModal(event.ticket, event.data);
    } else {
      // Mode création - update the newTicket with the data and create
      Object.assign(this.newTicket, event.data);
      this.createTicket();
    }
    this.closeTicketModal();
  }

  onTicketDelete(ticketId: number) {
    this.deleteTicket(ticketId);
    this.closeTicketModal();
  }

  private updateTicketFromModal(ticket: Ticket, data: TicketUpdate) {
    console.log('Updating ticket:', ticket.id, 'with data:', data);
    
    this.http.patch<Ticket>(`http://localhost:8000/api/tickets/${ticket.id}`, data)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error updating ticket:', error);
          console.error('Error details:', error.error);
          return of(null);
        })
      )
      .subscribe({
        next: (updatedTicket) => {
          if (updatedTicket) {
            console.log('Ticket updated successfully:', updatedTicket);
            // Update the ticket in the list
            const index = this.tickets.findIndex(t => t.id === updatedTicket.id);
            if (index !== -1) {
              this.tickets[index] = updatedTicket;
            }
            this.applyFilters();
            this.loadStats();
          }
        }
      });
  }

  deleteTicket(ticketId: number) {
    this.http.delete(`http://localhost:8000/api/tickets/${ticketId}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error deleting ticket:', error);
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          // Remove the ticket from the list
          this.tickets = this.tickets.filter(t => t.id !== ticketId);
          this.applyFilters();
          this.loadStats();
        }
      });
  }

  createTicketWithPriority(priority: string) {
    this.openTicketModal({ type: 'normal' });
    // Le template sera appliqué automatiquement par le modal
  }

  private initializeDefaultTicket() {
    // Préremplir avec des valeurs par défaut intelligentes
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    this.newTicket = {
      title: '',
      description: '',
      theme: 'Bug',
      priority: 'medium',
      status: 'open',
      assigned_to: 'HrodMarRik', // Vous êtes assigné par défaut
      due_date: tomorrow.toISOString().slice(0, 16), // Format datetime-local
      tags: '',
      estimated_hours: 1
    };
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  assignToSelf() {
    // Assigner le ticket à vous-même
    this.newTicket.assigned_to = 'HrodMarRik';
  }

  assignToAgent(agentId: string) {
    const agent = this.availableAgents.find(a => a.id === agentId);
    if (agent) {
      this.newTicket.assigned_to = agent.name;
    }
  }

  createTicket() {
    // Only send fields that the backend expects
    const ticketData = {
      title: this.newTicket.title,
      description: this.newTicket.description,
      theme: this.newTicket.theme,
      priority: this.newTicket.priority,
      status: this.newTicket.status,
      assigned_to: this.newTicket.assigned_to
    };

    this.http.post<Ticket>('http://localhost:8000/api/tickets', ticketData)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error creating ticket:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (ticket) => {
          if (ticket) {
            this.tickets.unshift(ticket);
            this.applyFilters();
            this.loadStats();
            this.closeCreateModal();
          }
        }
      });
  }





  // Méthodes de filtrage au clic sur les statistiques
  filterByStatus(status: string) {
    this.filters.status = status;
    this.filters.priority = '';  // Réinitialiser la priorité
    this.filters.theme = '';     // Réinitialiser le thème
    this.filters.assigned_to = ''; // Réinitialiser l'attribution
    this.filters.project_id = ''; // Réinitialiser le projet
    this.applyFilters();
  }

  filterByPriority(priority: string) {
    this.filters.priority = priority;
    this.filters.status = '';    // Réinitialiser le statut
    this.filters.theme = '';     // Réinitialiser le thème
    this.filters.assigned_to = ''; // Réinitialiser l'attribution
    this.filters.project_id = ''; // Réinitialiser le projet
    this.applyFilters();
  }

  filterByTheme(theme: string) {
    this.filters.theme = theme;
    this.filters.status = '';    // Réinitialiser le statut
    this.filters.priority = ''; // Réinitialiser la priorité
    this.filters.assigned_to = ''; // Réinitialiser l'attribution
    this.filters.project_id = ''; // Réinitialiser le projet
    this.applyFilters();
  }

  getTicketsWithoutProject(): number {
    return this.tickets.filter(ticket => !ticket.project_id).length;
  }

  filterByProject(projectId: string) {
    if (projectId === 'unassigned') {
      this.filters.project_id = 'unassigned';
    } else {
      this.filters.project_id = projectId;
    }
    this.filters.status = '';    // Réinitialiser le statut
    this.filters.priority = ''; // Réinitialiser la priorité
    this.filters.theme = '';     // Réinitialiser le thème
    this.filters.assigned_to = ''; // Réinitialiser l'attribution
    this.applyFilters();
  }

  // Méthode pour actualiser les tickets
  refreshTickets() {
    this.loadTickets();
    this.loadStats();
  }

  // Méthode pour naviguer vers les logs de tickets
  navigateToLogs() {
    this.router.navigate(['/admin/ticket-logs']);
  }


  // Méthode pour changer le statut d'un ticket
  changeTicketStatus(ticket: Ticket, newStatus?: string) {
    let targetStatus: string;
    
    if (newStatus) {
      // Si un nouveau statut est fourni, l'utiliser directement
      targetStatus = newStatus;
    } else {
      // Logique de transition automatique (pour compatibilité)
      switch (ticket.status) {
        case 'open':
          targetStatus = 'in_progress';
          break;
        case 'in_progress':
          // Demander à l'utilisateur s'il veut fermer ou résoudre
          const choice = confirm('Do you want to close or resolve this ticket?\n\nOK = Resolve\nCancel = Close');
          targetStatus = choice ? 'resolved' : 'closed';
          break;
        case 'resolved':
        case 'closed':
          targetStatus = 'open';
          break;
        default:
          targetStatus = 'in_progress';
      }
    }
    
    // Mettre à jour le ticket
    const updateData = {
      status: targetStatus
    };
    
    this.http.patch<Ticket>(`http://localhost:8000/api/tickets/${ticket.id}`, updateData)
      .subscribe({
        next: (updatedTicket) => {
          // Mettre à jour le ticket dans la liste
          const index = this.tickets.findIndex(t => t.id === ticket.id);
          if (index !== -1) {
            this.tickets[index] = updatedTicket;
            this.applyFilters();
            this.loadStats();
          }
        },
        error: (error) => {
          console.error('Error updating ticket status:', error);
          alert('Error updating ticket status');
        }
      });
  }

  // Méthode pour compter les tickets par statut
  getStatusCount(status: string): number {
    return this.tickets.filter(ticket => ticket.status === status).length;
  }

  getProjectName(projectId?: number): string {
    if (!projectId) return 'Aucun projet';
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.title : 'Projet inconnu';
  }

  // Méthode pour compter les tickets par thème
  getThemeCount(theme: string): number {
    return this.tickets.filter(ticket => ticket.theme === theme).length;
  }

  // Méthode pour compter les tickets par attribution
  getAssignedCount(assignedTo: string): number {
    return this.tickets.filter(ticket => ticket.assigned_to === assignedTo).length;
  }

  // Méthode pour réinitialiser tous les filtres
  resetAllFilters() {
    this.filters = {
      status: '',
      priority: '',
      theme: '',
      assigned_to: '',
      project_id: ''
    };
    this.applyFilters();
  }

  // Méthode pour filtrer par attribution
  filterByAssigned(assignedTo: string) {
    this.filters.assigned_to = assignedTo;
    this.filters.status = '';
    this.filters.priority = '';
    this.filters.theme = '';
    this.filters.project_id = '';
    this.applyFilters();
  }

  // Méthode pour formater l'affichage du statut
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'open':
        return 'Ouvert';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  }

  drop(event: CdkDragDrop<Ticket[]>) {
    try {
      // Vérifier que les données existent
      if (!event.container.data || !event.previousContainer.data) {
        console.warn('Drop event: missing container data');
        return;
      }

      if (event.previousContainer === event.container) {
        // Réorganisation dans la même colonne
        if (event.container.data.length > 0) {
          moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        }
      } else {
        // Transfert entre colonnes
        if (event.previousContainer.data.length > 0) {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          
          // Update ticket status based on the new column
          const ticket = event.container.data[event.currentIndex];
          let newStatus = '';
          
          if (event.container.id === 'open') newStatus = 'open';
          else if (event.container.id === 'in_progress') newStatus = 'in_progress';
          else if (event.container.id === 'resolved') newStatus = 'resolved';
          else if (event.container.id === 'closed') newStatus = 'closed';
          
          if (newStatus && ticket && ticket.status !== newStatus) {
            ticket.status = newStatus;
            this.updateTicketStatus(ticket.id, newStatus);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du drop:', error);
    }
  }

  private updateTicketStatus(ticketId: number, status: string) {
    this.http.patch<Ticket>(`http://localhost:8000/api/tickets/${ticketId}`, { status })
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error updating ticket status:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (updatedTicket) => {
          if (updatedTicket) {
            // Update the ticket in the list
            const index = this.tickets.findIndex(t => t.id === updatedTicket.id);
            if (index !== -1) {
              this.tickets[index] = updatedTicket;
            }
            this.loadStats();
          }
        }
      });
  }

}