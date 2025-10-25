import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

import { WidgetService } from './services/widget.service';
import { WidgetConfig, WidgetCatalogItem, WidgetType } from './models/widget.interface';
import { TicketStatsWidgetComponent } from './widgets/ticket-stats-widget.component';
import { AgentStatsWidgetComponent } from './widgets/agent-stats-widget.component';
import { QuickActionsWidgetComponent } from './widgets/quick-actions-widget.component';
import { OpenTicketsWidgetComponent } from './widgets/open-tickets-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TicketStatsWidgetComponent, AgentStatsWidgetComponent, QuickActionsWidgetComponent, OpenTicketsWidgetComponent],
  template: `
    <div class="dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="dashboard-actions">
          <button class="btn-primary" (click)="toggleEditMode()">
            {{ isEditing ? "Quitter l'édition" : "Mode Édition" }}
          </button>
          <button class="btn-secondary" (click)="toggleAddWidgetDropdown()">
            + Ajouter Widget
          </button>
        </div>
      </div>

      <!-- Widget Dropdown -->
      <div class="widget-dropdown" [class.open]="showAddWidgetDropdown">
        <div class="dropdown-content">
          <div *ngFor="let category of getWidgetCategories()" class="category-section">
            <h4>{{ category }}</h4>
            <div class="widget-buttons">
              <button 
                *ngFor="let widget of getWidgetsByCategory(category)"
                class="widget-btn"
                (click)="addWidget(widget.type)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path [attr.d]="widget.icon" />
                </svg>
                {{ widget.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid" [class.grid-visible]="isEditing">
        <div *ngFor="let widget of widgets; trackBy: trackByWidgetId" 
             class="widget-wrapper"
             [style]="getWidgetStyles(widget)">
          
          <!-- Widget Content -->
          <ng-container [ngSwitch]="widget.type">
            <!-- Ticket Stats Widget -->
            <app-ticket-stats-widget 
              *ngSwitchCase="'ticket-stats'"
              [config]="widget"
              [isEditing]="isEditing"
              (removeRequested)="removeWidget(widget.id)">
            </app-ticket-stats-widget>

            <!-- Agent Stats Widget -->
            <app-agent-stats-widget 
              *ngSwitchCase="'agent-stats'"
              [config]="widget"
              [isEditing]="isEditing"
              (removeRequested)="removeWidget(widget.id)">
            </app-agent-stats-widget>

            <!-- Quick Actions Widget -->
            <app-quick-actions-widget 
              *ngSwitchCase="'quick-actions'"
              [config]="widget"
              [isEditing]="isEditing"
              (removeRequested)="removeWidget(widget.id)">
            </app-quick-actions-widget>

            <!-- Open Tickets Widget -->
            <app-open-tickets-widget 
              *ngSwitchCase="'open-tickets'"
              [config]="widget"
              [isEditing]="isEditing"
              (removeRequested)="removeWidget(widget.id)">
            </app-open-tickets-widget>
          </ng-container>

          <!-- Widget Controls (en mode édition) -->
          <div *ngIf="isEditing" class="widget-controls">
            <button class="control-btn move-btn" (click)="moveWidgetUp(widget)" title="Déplacer vers le haut">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
              </svg>
            </button>
            <button class="control-btn move-btn" (click)="moveWidgetDown(widget)" title="Déplacer vers le bas">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
              </svg>
            </button>
            <button class="control-btn move-btn" (click)="moveWidgetLeft(widget)" title="Déplacer vers la gauche">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41,7.41L14,6L8,12L14,18L15.41,16.59L10.83,12L15.41,7.41Z" />
              </svg>
            </button>
            <button class="control-btn move-btn" (click)="moveWidgetRight(widget)" title="Déplacer vers la droite">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59,16.59L10,18L16,12L10,6L8.59,7.41L13.17,12L8.59,16.59Z" />
              </svg>
            </button>
            <button class="control-btn remove-btn" (click)="removeWidget(widget.id)" title="Supprimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="widgets.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <h3>Aucun widget configuré</h3>
        <p>Ajoutez votre premier widget pour commencer à personnaliser votre dashboard.</p>
        <button class="btn-primary" (click)="toggleAddWidgetDropdown()">
          + Ajouter un Widget
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #1a1a1a;
      position: relative;
    }

    .dashboard-header {
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

    .dashboard-header h1 {
      margin: 0;
      color: #fff;
      font-size: 24px;
    }

    .dashboard-actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-width: 120px;
    }

    .btn-primary {
      background: #007acc;
      color: white;
    }

    .btn-primary:hover {
      background: #005a9e;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #404040;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #505050;
      transform: translateY(-1px);
    }

    /* Widget Dropdown */
    .widget-dropdown {
      position: fixed;
      top: 80px;
      right: 20px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      max-height: 70vh;
    }

    .widget-dropdown.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-content {
      padding: 16px;
      min-width: 300px;
    }

    .category-section {
      margin-bottom: 16px;
    }

    .category-section h4 {
      margin: 0 0 8px 0;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
    }

    .widget-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .widget-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #404040;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .widget-btn:hover {
      background: #505050;
      transform: translateY(-1px);
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: 200px;
      gap: 20px;
      padding: 20px;
      min-height: calc(100vh - 80px);
    }

    .dashboard-grid.grid-visible {
      background-image: 
        linear-gradient(to right, rgba(0, 122, 204, 0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 122, 204, 0.1) 1px, transparent 1px);
      background-size: calc(100% / 12) 200px;
      background-position: 0 0;
    }

    .widget-wrapper {
      position: relative;
      background: #2d2d2d;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .widget-wrapper:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    /* Widget Controls */
    .widget-controls {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 6px;
      padding: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .widget-wrapper:hover .widget-controls {
      opacity: 1;
    }

    .control-btn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 6px;
      border-radius: 4px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .control-btn.move-btn:hover {
      color: #007acc;
    }

    .control-btn.remove-btn:hover {
      color: #e53935;
    }

    /* Empty State */
    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #888;
      z-index: 10;
    }

    .empty-icon {
      margin-bottom: 16px;
    }

    .empty-icon svg {
      color: #555;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #fff;
      font-size: 18px;
    }

    .empty-state p {
      margin: 0 0 20px 0;
      color: #888;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 12px;
        padding: 15px;
      }

      .dashboard-actions {
        width: 100%;
        justify-content: center;
      }

      .btn-primary, .btn-secondary {
        min-width: 100px;
        font-size: 12px;
        padding: 8px 12px;
      }

      .dashboard-grid {
        grid-template-columns: repeat(6, 1fr);
        gap: 15px;
        padding: 15px;
      }

      .widget-dropdown {
        right: 10px;
        left: 10px;
        max-width: calc(100vw - 20px);
      }
    }

    @media (max-width: 480px) {
      .dashboard-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        padding: 10px;
      }

      .widget-controls {
        flex-direction: column;
        gap: 2px;
      }

      .control-btn {
        padding: 4px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  widgets: WidgetConfig[] = [];
  isEditing = false;
  showAddWidgetDropdown = false;

  constructor(
    private widgetService: WidgetService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWidgets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWidgets(): void {
    this.widgetService.widgets$.pipe(takeUntil(this.destroy$)).subscribe(widgets => {
      this.widgets = widgets;
    });
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.showAddWidgetDropdown = false;
    }
  }

  toggleAddWidgetDropdown(): void {
    this.showAddWidgetDropdown = !this.showAddWidgetDropdown;
  }

  addWidget(widgetType: string): void {
    this.widgetService.addWidget(widgetType as WidgetType);
    this.showAddWidgetDropdown = false;
  }

  removeWidget(widgetId: string): void {
    this.widgetService.removeWidget(widgetId);
  }


  getWidgetCategories(): string[] {
    return this.widgetService.getWidgetCategories();
  }

  getWidgetsByCategory(category: string): WidgetCatalogItem[] {
    return this.widgetService.getWidgetCatalogByCategory(category);
  }

  getWidgetName(widgetType: string): string {
    const catalog = this.widgetService.getWidgetCatalog();
    const widget = catalog.find(w => w.type === widgetType);
    return widget?.name || widgetType;
  }

  getWidgetIcon(widgetType: string): string {
    const catalog = this.widgetService.getWidgetCatalog();
    const widget = catalog.find(w => w.type === widgetType);
    return widget?.icon || 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z';
  }

  trackByWidgetId(index: number, widget: WidgetConfig): string {
    return widget.id;
  }

  getWidgetStyles(widget: WidgetConfig): any {
    return {
      'grid-column': `${widget.position.col + 1} / span ${widget.size.cols}`,
      'grid-row': `${widget.position.row + 1} / span ${widget.size.rows}`
    };
  }

  moveWidgetUp(widget: WidgetConfig): void {
    if (widget.position.row > 0) {
      this.widgetService.updateWidget(widget.id, {
        position: { ...widget.position, row: widget.position.row - 1 }
      });
    }
  }

  moveWidgetDown(widget: WidgetConfig): void {
    this.widgetService.updateWidget(widget.id, {
      position: { ...widget.position, row: widget.position.row + 1 }
    });
  }

  moveWidgetLeft(widget: WidgetConfig): void {
    if (widget.position.col > 0) {
      this.widgetService.updateWidget(widget.id, {
        position: { ...widget.position, col: widget.position.col - 1 }
      });
    }
  }

  moveWidgetRight(widget: WidgetConfig): void {
    if (widget.position.col + widget.size.cols < 12) {
      this.widgetService.updateWidget(widget.id, {
        position: { ...widget.position, col: widget.position.col + 1 }
      });
    }
  }
}
