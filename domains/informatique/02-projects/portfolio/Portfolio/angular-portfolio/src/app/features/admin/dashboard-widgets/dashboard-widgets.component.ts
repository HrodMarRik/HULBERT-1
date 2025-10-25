import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService, DashboardWidgetsData, Todo } from '../../../core/services/dashboard.service';
import { WidgetLayoutService, WidgetPosition } from '../../../core/services/widget-layout.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// Import des widgets
import { ProjectsStatsWidgetComponent } from './projects-stats-widget.component';
import { TicketsStatsWidgetComponent } from './tickets-stats-widget.component';
import { TodoListWidgetComponent } from './todo-list-widget.component';
import { RecentErrorsWidgetComponent } from './recent-errors-widget.component';
import { InvoicingStatsWidgetComponent } from './invoicing-stats-widget.component';
import { CalendarWidgetComponent } from './calendar-widget.component';
import { AgentMetricsWidgetComponent } from './agent-metrics-widget.component';
import { WeatherWidgetComponent } from './weather-widget.component';
import { ContactsStatsWidgetComponent } from './contacts-stats-widget.component';
import { CompaniesStatsWidgetComponent } from './companies-stats-widget.component';
import { RssWidgetComponent } from './rss-widget.component';
import { EmailSecurityWidgetComponent } from './email-security-widget.component';
import { PortfolioWidgetComponent } from './portfolio-widget.component';
import { WishlistWidgetComponent } from './wishlist-widget.component';
import { EmailCampaignsWidgetComponent } from './email-campaigns-widget.component';

@Component({
  selector: 'app-dashboard-widgets',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ProjectsStatsWidgetComponent,
    TicketsStatsWidgetComponent,
    TodoListWidgetComponent,
    RecentErrorsWidgetComponent,
    InvoicingStatsWidgetComponent,
    CalendarWidgetComponent,
    AgentMetricsWidgetComponent,
    WeatherWidgetComponent,
    ContactsStatsWidgetComponent,
    CompaniesStatsWidgetComponent,
    RssWidgetComponent,
    EmailSecurityWidgetComponent,
    PortfolioWidgetComponent,
    WishlistWidgetComponent,
    EmailCampaignsWidgetComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1 class="dashboard-title">Dashboard</h1>
        <div class="dashboard-actions">
          <button (click)="resetLayout()" class="reset-btn" title="Réinitialiser la disposition">
            🔄 Réinitialiser
          </button>
          <button (click)="refreshData()" class="refresh-btn" [disabled]="loading">
            <span class="refresh-icon" [class.spinning]="loading">🔄</span>
            Actualiser
          </button>
          <div class="last-update" *ngIf="lastUpdate">
            Dernière mise à jour: {{ formatTime(lastUpdate) }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading && !widgetsData">
        <div class="loading-spinner"></div>
        <div class="loading-text">Chargement des données...</div>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <div class="error-icon">❌</div>
        <div class="error-message">{{ error }}</div>
        <button (click)="refreshData()" class="retry-btn">Réessayer</button>
      </div>

      <!-- Widgets Grid with Drag & Drop -->
      <div class="widgets-scroll-container" *ngIf="widgetsData && !loading">
        <div class="widgets-grid" 
             cdkDropList
             (cdkDropListDropped)="onWidgetDrop($event)">
          <!-- Dynamic Widgets with Drag & Drop -->
          <div *ngFor="let widget of widgets" 
               class="widget"
               cdkDrag
               [style.grid-column]="'span ' + widget.cols"
               [style.grid-row]="'span ' + widget.rows">
            
            <!-- Drag Handle -->
            <div class="drag-handle" cdkDragHandle>
              <span class="drag-icon">⋮⋮</span>
            </div>
            
            <!-- Widget Content -->
            <ng-container [ngSwitch]="widget.id">
              <app-projects-stats-widget *ngSwitchCase="'projects'" [data]="widgetsData.projects_stats"></app-projects-stats-widget>
              <app-invoicing-stats-widget *ngSwitchCase="'invoicing'" [data]="widgetsData.invoicing_stats"></app-invoicing-stats-widget>
              <app-tickets-stats-widget *ngSwitchCase="'tickets'" [data]="widgetsData.tickets_stats"></app-tickets-stats-widget>
              <app-calendar-widget *ngSwitchCase="'calendar'" [data]="widgetsData.calendar_stats" [upcomingEvents]="upcomingEvents"></app-calendar-widget>
              <app-todo-list-widget *ngSwitchCase="'todo'" [todos]="todos"></app-todo-list-widget>
              <app-contacts-stats-widget *ngSwitchCase="'contacts'" [data]="widgetsData.contacts_stats"></app-contacts-stats-widget>
              <app-companies-stats-widget *ngSwitchCase="'companies'" [data]="widgetsData.companies_stats"></app-companies-stats-widget>
              <app-recent-errors-widget *ngSwitchCase="'errors'" [errors]="widgetsData.recent_errors"></app-recent-errors-widget>
              <app-agent-metrics-widget *ngSwitchCase="'agents'" [agents]="widgetsData.agent_metrics"></app-agent-metrics-widget>
              <app-weather-widget *ngSwitchCase="'weather'"></app-weather-widget>
              <app-rss-widget *ngSwitchCase="'rss'"></app-rss-widget>
              <app-email-security-widget *ngSwitchCase="'email-security'"></app-email-security-widget>
              <app-portfolio-widget *ngSwitchCase="'portfolio'"></app-portfolio-widget>
              <app-wishlist-widget *ngSwitchCase="'wishlist'"></app-wishlist-widget>
              <app-email-campaigns-widget *ngSwitchCase="'email-campaigns'"></app-email-campaigns-widget>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background: #0f172a;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .dashboard-title {
      font-size: 28px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .dashboard-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .reset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .reset-btn:hover {
      background: #334155;
      border-color: #f87171;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid rgba(59, 130, 246, 0.5);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #334155;
      border-color: #60a5fa;
    }

    .refresh-btn:disabled {
      background: #1e293b;
      border-color: rgba(148, 163, 184, 0.3);
      color: #64748b;
      cursor: not-allowed;
    }

    .refresh-icon {
      font-size: 16px;
      transition: transform 0.3s ease;
    }

    .refresh-icon.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .last-update {
      font-size: 12px;
      color: #94a3b8;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #334155;
      border-top: 4px solid #60a5fa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .loading-text {
      font-size: 16px;
      color: #cbd5e1;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-message {
      font-size: 16px;
      color: #f87171;
      margin-bottom: 16px;
    }

    .retry-btn {
      padding: 8px 16px;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid rgba(248, 113, 113, 0.5);
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      background: #334155;
      border-color: #f87171;
    }

    .widgets-scroll-container {
      min-height: calc(100vh - 200px);
      padding-right: 8px;
    }


    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      grid-auto-rows: minmax(140px, auto);
      padding-bottom: 16px;
    }

    .widget {
      min-height: 140px;
      position: relative;
      cursor: move;
    }

    /* Drag & Drop Styles */
    .widget.cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      border-radius: 10px;
    }

    .widget.cdk-drag-placeholder {
      opacity: 0.3;
      background: #334155;
      border: 2px dashed #60a5fa;
      border-radius: 10px;
    }

    .widget.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .widgets-grid.cdk-drop-list-dragging .widget:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-handle {
      position: absolute;
      top: 8px;
      right: 8px;
      cursor: grab;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(51, 65, 85, 0.7);
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .widget:hover .drag-handle {
      opacity: 1;
    }

    .drag-icon {
      font-size: 14px;
      color: #94a3b8;
      font-weight: bold;
      letter-spacing: -2px;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .widgets-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .widgets-grid {
        grid-template-columns: 1fr;
      }

      .widget {
        min-height: 180px;
      }
    }

    /* Widget Card Styles (shared) */
    .widget-card {
      background: #1e293b;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 14px;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .widget-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .widget-icon {
      font-size: 20px;
    }

    .widget-title {
      font-size: 15px;
      font-weight: 600;
      color: #f1f5f9;
      flex: 1;
    }

    .widget-value {
      font-size: 20px;
      font-weight: 700;
      color: #60a5fa;
    }

    .widget-content {
      flex: 1;
    }

    .widget-footer {
      margin-top: auto;
      padding-top: 16px;
    }

    .view-more {
      color: #60a5fa;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    .view-more:hover {
      color: #93c5fd;
      text-decoration: underline;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-item {
      text-align: center;
      padding: 8px;
      background: #334155;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }

    .stat-label {
      font-size: 11px;
      color: #cbd5e1;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .budget-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      background: #1e3a5f;
      border-radius: 8px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .budget-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 6px;
    }

    .budget-label {
      font-size: 13px;
      color: #cbd5e1;
    }

    .budget-value {
      font-size: 14px;
      font-weight: 600;
    }

    .budget-value.income {
      color: #34d399;
    }

    .budget-value.expense {
      color: #f87171;
    }
  `]
})
export class DashboardWidgetsComponent implements OnInit, OnDestroy {
  widgetsData: DashboardWidgetsData | null = null;
  todos: Todo[] = [];
  upcomingEvents: any[] = [];
  loading = false;
  error: string | null = null;
  lastUpdate: Date | null = null;
  widgets: WidgetPosition[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private widgetLayoutService: WidgetLayoutService
  ) {}

  ngOnInit() {
    // Charger le layout des widgets
    this.widgets = this.widgetLayoutService.loadLayout();
    
    // Charger les données
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.loading = true;
    this.error = null;

    // Charger les données principales des widgets
    this.dashboardService.getWidgetsData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.widgetsData = data;
          this.lastUpdate = new Date();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des données:', error);
          this.error = 'Erreur lors du chargement des données';
          this.loading = false;
        }
      });

    // Charger les todos
    this.dashboardService.getTodos('pending', undefined, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (todos) => {
          this.todos = todos.slice(0, 10); // Limiter à 10 todos
        },
        error: (error) => {
          console.error('Erreur lors du chargement des todos:', error);
        }
      });

    // Charger les erreurs récentes
    this.dashboardService.getRecentErrors(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (errors) => {
          if (this.widgetsData) {
            this.widgetsData.recent_errors = errors;
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des erreurs:', error);
        }
      });
  }

  refreshData() {
    this.loadData();
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Gérer le drag & drop des widgets
   */
  onWidgetDrop(event: CdkDragDrop<any>) {
    moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
    
    // Mettre à jour l'ordre
    this.widgets.forEach((widget, index) => {
      widget.order = index;
    });
    
    // Sauvegarder immédiatement dans LocalStorage et débouncer l'API
    this.widgetLayoutService.saveLayout(this.widgets);
  }

  /**
   * Réinitialiser le layout aux valeurs par défaut
   */
  resetLayout() {
    if (confirm('Voulez-vous vraiment réinitialiser la disposition des widgets ?')) {
      this.widgets = this.widgetLayoutService.resetLayout();
    }
  }
}
