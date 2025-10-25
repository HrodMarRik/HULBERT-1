import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventCapsule } from '../../../../../shared/components/event-capsule/event-capsule.component';
import { EventDisplayService } from '../../services/event-display.service';

export interface EventCapsuleWithDate extends EventCapsule {
  displayDate: Date;
}

@Component({
  selector: 'app-calendar-list-view-v2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="list-view-container">
      <!-- Header avec filtres -->
      <div class="list-header">
        <div class="header-content">
          <h2 class="view-title">Liste des événements</h2>
          <div class="filters">
            <div class="filter-group">
              <label class="filter-label">
                <input type="checkbox" [(ngModel)]="showPastEvents" (change)="onFilterChange()">
                Afficher les événements passés
              </label>
            </div>
            <select class="filter-select" [(ngModel)]="selectedStatus" (change)="onFilterChange()">
              <option value="">Tous les statuts</option>
              <option value="planned">Planifié</option>
              <option value="confirmed">Confirmé</option>
              <option value="cancelled">Annulé</option>
              <option value="completed">Terminé</option>
            </select>
            <select class="filter-select" [(ngModel)]="selectedCategory" (change)="onFilterChange()">
              <option value="">Toutes les catégories</option>
              <option value="work">Travail</option>
              <option value="personal">Personnel</option>
              <option value="meeting">Réunion</option>
              <option value="appointment">Rendez-vous</option>
            </select>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un événement..."
              [(ngModel)]="searchQuery"
              (input)="onFilterChange()">
          </div>
        </div>
      </div>

      <!-- Liste des événements -->
      <div class="events-list">
        <div *ngIf="filteredEvents.length === 0" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Aucun événement trouvé</h3>
          <p>{{ getEmptyMessage() }}</p>
        </div>

        <div *ngFor="let event of filteredEvents; trackBy: trackByEventId" 
             class="event-item"
             [class.event-past]="isPastEvent(event)"
             [class.event-today]="isTodayEvent(event)"
             [class.event-upcoming]="isUpcomingEvent(event)"
             (click)="onEventClick(event)"
             (contextmenu)="onEventContextMenu(event, $event)">
          
          <div class="event-main">
            <div class="event-time">
              <div class="event-date">{{ formatEventDate(event) }}</div>
              <div class="event-duration">{{ formatEventTime(event) }}</div>
            </div>
            
            <div class="event-content">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-details">
                <span *ngIf="event.location" class="event-location">
                  📍 {{ event.location }}
                </span>
                <span *ngIf="event.category" class="event-category">
                  🏷️ {{ getCategoryLabel(event.category) }}
                </span>
              </div>
              <div *ngIf="event.description" class="event-description">
                {{ event.description }}
              </div>
            </div>
          </div>

          <div class="event-actions">
            <div class="event-status" [class]="'status-' + (event.status || 'planned')">
              {{ getStatusLabel(event.status || 'planned') }}
            </div>
            <div *ngIf="event.priority === 'high'" class="priority-indicator">
              ⚠️ Priorité élevée
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button 
          class="pagination-btn" 
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)">
          ← Précédent
        </button>
        
        <span class="pagination-info">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>
        
        <button 
          class="pagination-btn" 
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)">
          Suivant →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .list-view-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #0f172a;
      color: #f1f5f9;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    }

    /* Header */
    .list-header {
      background: #1e293b;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      padding: 20px 24px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .view-title {
      font-size: 24px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .filters {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #f1f5f9;
      cursor: pointer;
      user-select: none;
    }

    .filter-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #3b82f6;
      cursor: pointer;
    }

    .filter-select {
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 8px;
      padding: 8px 12px;
      color: #f1f5f9;
      font-size: 14px;
      min-width: 140px;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .search-input {
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 8px;
      padding: 8px 12px;
      color: #f1f5f9;
      font-size: 14px;
      min-width: 200px;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    /* Liste des événements */
    .events-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .event-item {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .event-item:hover {
      background: #334155;
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }

    .event-item.event-past {
      opacity: 0.7;
      background: #1a202c;
    }

    .event-item.event-today {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    .event-item.event-upcoming {
      border-color: #f59e0b;
    }

    .event-main {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .event-time {
      min-width: 120px;
      text-align: center;
    }

    .event-date {
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .event-duration {
      font-size: 12px;
      color: #64748b;
    }

    .event-content {
      flex: 1;
    }

    .event-title {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .event-details {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #94a3b8;
    }

    .event-location,
    .event-category {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-description {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.5;
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .event-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .event-status {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .event-status.status-planned {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    .event-status.status-confirmed {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .event-status.status-cancelled {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .event-status.status-completed {
      background: rgba(107, 114, 128, 0.2);
      color: #9ca3af;
    }

    .priority-indicator {
      font-size: 12px;
      color: #f59e0b;
      font-weight: 600;
    }

    /* État vide */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #94a3b8;
    }

    .empty-state p {
      font-size: 14px;
      line-height: 1.5;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .pagination-btn {
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 8px;
      padding: 8px 16px;
      color: #f1f5f9;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #4b5563;
      border-color: #6b7280;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      font-size: 14px;
      color: #94a3b8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .filters {
        flex-direction: column;
        gap: 8px;
      }

      .filter-select,
      .search-input {
        min-width: auto;
        width: 100%;
      }

      .event-item {
        flex-direction: column;
        gap: 12px;
      }

      .event-main {
        flex-direction: column;
        gap: 12px;
      }

      .event-time {
        text-align: left;
        min-width: auto;
      }

      .event-actions {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }
  `]
})
export class CalendarListViewV2Component implements OnInit, OnChanges {
  @Input() events: any[] = [];
  @Input() tickets: any[] = [];
  @Input() logs: any[] = [];
  @Input() currentDate: Date = new Date();

  @Output() eventClick = new EventEmitter<EventCapsuleWithDate>();
  @Output() eventContextMenu = new EventEmitter<{event: EventCapsule, mouseEvent: MouseEvent}>();

  // Filtres et recherche
  selectedStatus = '';
  selectedCategory = '';
  searchQuery = '';
  showPastEvents = false; // Par défaut, masquer les événements passés
  filteredEvents: EventCapsuleWithDate[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  constructor(private eventDisplayService: EventDisplayService) {}

  ngOnInit(): void {
    console.log('🎯 CalendarListViewV2Component initialized');
    this.processEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] || changes['tickets'] || changes['logs']) {
      this.processEvents();
    }
  }

  private processEvents(): void {
    // Convertir les événements en capsules avec dates
    const eventCapsules: EventCapsuleWithDate[] = [];
    
    this.events.forEach(event => {
      const capsules = this.eventDisplayService.splitMultiDayEvent(event);
      capsules.forEach(capsule => {
        eventCapsules.push({
          ...capsule,
          displayDate: new Date(capsule.start_datetime)
        });
      });
    });

    // Trier par date de début
    eventCapsules.sort((a, b) => {
      return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
    });

    this.filteredEvents = eventCapsules;
    this.updatePagination();
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.filteredEvents];

    // Filtre par événements passés (par défaut masqués)
    if (!this.showPastEvents) {
      filtered = filtered.filter(event => !this.isPastEvent(event));
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(event => event.status === this.selectedStatus);
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      filtered = filtered.filter(event => event.category === this.selectedCategory);
    }

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query))
      );
    }

    this.filteredEvents = filtered;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPagedEvents(): EventCapsuleWithDate[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredEvents.slice(startIndex, endIndex);
  }

  // Event handlers
  onEventClick(event: EventCapsuleWithDate): void {
    console.log('🎯 LIST Event clicked:', event);
    this.eventClick.emit(event);
  }

  onEventContextMenu(event: EventCapsuleWithDate, mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    console.log('🎯 LIST Event context menu:', event);
    this.eventContextMenu.emit({ event, mouseEvent });
  }

  // Utilitaires
  trackByEventId(index: number, event: EventCapsuleWithDate): number {
    return event.id || index;
  }

  formatEventDate(event: EventCapsuleWithDate): string {
    const date = new Date(event.start_datetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  formatEventTime(event: EventCapsuleWithDate): string {
    const start = new Date(event.start_datetime);
    const end = event.end_datetime ? new Date(event.end_datetime) : null;
    
    const startTime = start.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (end) {
      const endTime = end.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'planned': 'Planifié',
      'confirmed': 'Confirmé',
      'cancelled': 'Annulé',
      'completed': 'Terminé'
    };
    return labels[status] || status;
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'work': 'Travail',
      'personal': 'Personnel',
      'meeting': 'Réunion',
      'appointment': 'Rendez-vous'
    };
    return labels[category] || category;
  }

  getEmptyMessage(): string {
    if (this.searchQuery.trim()) {
      return `Aucun événement ne correspond à "${this.searchQuery}"`;
    }
    if (this.selectedStatus || this.selectedCategory) {
      return 'Aucun événement ne correspond aux filtres sélectionnés';
    }
    if (!this.showPastEvents) {
      return 'Aucun événement à venir pour cette période';
    }
    return 'Aucun événement à afficher pour cette période';
  }

  isPastEvent(event: EventCapsuleWithDate): boolean {
    return new Date(event.start_datetime) < new Date();
  }

  isTodayEvent(event: EventCapsuleWithDate): boolean {
    const eventDate = new Date(event.start_datetime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }

  isUpcomingEvent(event: EventCapsuleWithDate): boolean {
    return new Date(event.start_datetime) > new Date();
  }
}
