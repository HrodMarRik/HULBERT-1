import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CalendarStateService, CalendarViewState } from '../services/calendar-state.service';

@Component({
  selector: 'app-calendar-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-bar">
      <div class="filters-left">
        <!-- View Toggle -->
        <div class="view-toggle">
          <button 
            class="view-btn" 
            [class.active]="viewState.viewMode === 'calendar'" 
            (click)="setViewMode('calendar')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
            </svg>
            Calendar
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewState.viewMode === 'list'" 
            (click)="setViewMode('list')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,13H5V11H3V13M3,17H5V15H3V17M3,9H5V7H3V9M7,13H21V11H7V13M7,17H21V15H7V17M7,7V9H21V7H7Z"/>
            </svg>
            List
          </button>
        </div>

        <!-- Display Controls -->
        <div class="display-controls">
          <button 
            class="control-btn" 
            [class.active]="viewState.showEvents" 
            (click)="toggleShowEvents()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V7H5V5H19M5,19V9H19V19H5Z"/>
            </svg>
            Events
          </button>
          <button 
            class="control-btn" 
            [class.active]="viewState.showTickets" 
            (click)="toggleShowTickets()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Tickets
          </button>
          <button 
            class="control-btn" 
            [class.active]="viewState.showLogs" 
            (click)="toggleShowLogs()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
            </svg>
            Logs
          </button>
        </div>

        <!-- Log Filter (only show when logs are enabled) -->
        <div class="log-filter" *ngIf="viewState.showLogs">
          <select [(ngModel)]="logEntityFilter" (ngModelChange)="onLogEntityFilterChange()">
            <option value="all">All Logs</option>
            <option value="ticket">Tickets</option>
            <option value="event">Events</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div class="filters-right">
        <!-- Search -->
        <div class="search-container">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search events, tickets, logs..." 
            [(ngModel)]="viewState.filters.search"
            (ngModelChange)="onSearchChange()">
        </div>

        <!-- Category Filter -->
        <div class="filter-group">
          <select 
            class="filter-select" 
            [(ngModel)]="viewState.filters.category" 
            (ngModelChange)="onCategoryChange()">
            <option value="all">All Categories</option>
            <option value="meeting">Meetings</option>
            <option value="project">Projects</option>
            <option value="deadline">Deadlines</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <select 
            class="filter-select" 
            [(ngModel)]="viewState.filters.status" 
            (ngModelChange)="onStatusChange()">
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Add Event Button -->
        <button class="add-event-btn" (click)="onAddEvent()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Add Event
        </button>
      </div>
    </div>
  `,
  styles: [`
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #1a1a1a;
      border-bottom: 1px solid #333;
      gap: 16px;
    }

    .filters-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .filters-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* View Toggle Styles */
    .view-toggle {
      display: flex;
      background: #2d2d2d;
      border-radius: 8px;
      padding: 4px;
      border: 1px solid #404040;
    }

    .view-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: transparent;
      color: #999;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      font-weight: 500;
    }

    .view-btn:hover {
      background: #404040;
      color: #f3f4f6;
    }

    .view-btn.active {
      background: #3b82f6;
      color: white;
    }

    /* Display Controls Styles */
    .display-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .control-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      font-weight: 500;
    }

    .control-btn:hover {
      background: #4b5563;
      border-color: #6b7280;
    }

    .control-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #2563eb;
    }

    /* Log Filter */
    .log-filter select {
      padding: 8px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 13px;
    }

    /* Search and Filter Styles */
    .search-container {
      position: relative;
    }

    .search-input {
      padding: 8px 12px;
      padding-left: 36px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
      width: 280px;
    }

    .search-input::placeholder {
      color: #9ca3af;
    }

    .filter-group {
      display: flex;
      align-items: center;
    }

    .filter-select {
      padding: 8px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
      min-width: 140px;
    }

    /* Add Event Button */
    .add-event-btn {
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

    .add-event-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }

      .filters-left,
      .filters-right {
        width: 100%;
        justify-content: center;
      }

      .search-input {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class CalendarFiltersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  viewState!: CalendarViewState;
  logEntityFilter = 'all';

  constructor(private calendarStateService: CalendarStateService) {}

  ngOnInit(): void {
    this.calendarStateService.viewState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.viewState = state;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setViewMode(mode: 'calendar' | 'list'): void {
    this.calendarStateService.setViewMode(mode);
  }

  toggleShowEvents(): void {
    this.calendarStateService.toggleShowEvents();
  }

  toggleShowTickets(): void {
    this.calendarStateService.toggleShowTickets();
  }

  toggleShowLogs(): void {
    this.calendarStateService.toggleShowLogs();
  }

  onSearchChange(): void {
    this.calendarStateService.setFilters({ search: this.viewState.filters.search });
  }

  onCategoryChange(): void {
    this.calendarStateService.setFilters({ category: this.viewState.filters.category });
  }

  onStatusChange(): void {
    this.calendarStateService.setFilters({ status: this.viewState.filters.status });
  }

  onLogEntityFilterChange(): void {
    // This would be handled by the parent component or a separate log service
    console.log('Log entity filter changed:', this.logEntityFilter);
  }

  onAddEvent(): void {
    // This would trigger the event creation modal
    console.log('Add event clicked');
  }
}
