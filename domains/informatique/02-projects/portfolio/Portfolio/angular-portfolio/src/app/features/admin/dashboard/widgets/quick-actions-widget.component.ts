import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { WidgetBaseComponent } from '../widgets/widget-base.component';
import { WidgetConfig } from '../models/widget.interface';

@Component({
  selector: 'app-quick-actions-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" [class.editing]="isEditing">
      <div class="widget-header">
        <div class="widget-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Actions Rapides
        </div>
        <div class="widget-actions">
          <button class="action-btn remove" (click)="remove()" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="widget-content">
        <div class="actions-grid">
          <button class="action-card primary" (click)="navigateTo('/admin/tickets')">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <div class="action-info">
              <div class="action-title">Tickets</div>
              <div class="action-description">Gérer les tickets</div>
            </div>
          </button>
          
          <button class="action-card secondary" (click)="navigateTo('/admin/agents')">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
              </svg>
            </div>
            <div class="action-info">
              <div class="action-title">Agents</div>
              <div class="action-description">Surveiller les agents</div>
            </div>
          </button>
          
          <button class="action-card tertiary" (click)="navigateTo('/admin/domains')">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <div class="action-info">
              <div class="action-title">Domaines</div>
              <div class="action-description">Explorer les fichiers</div>
            </div>
          </button>
          
          <button class="action-card quaternary" (click)="createNewTicket()">
            <div class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            </div>
            <div class="action-info">
              <div class="action-title">Nouveau</div>
              <div class="action-description">Créer un ticket</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .widget-container {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget-container:hover {
      border-color: #555;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .widget-container.editing {
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    .widget-header {
      background: #404040;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #555;
    }

    .widget-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #e0e0e0;
    }

    .widget-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: #888;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      background: #555;
      color: #e0e0e0;
    }

    .action-btn.remove:hover {
      background: #f44336;
      color: white;
    }

    .widget-content {
      flex: 1;
      padding: 16px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      height: 100%;
    }

    .action-card {
      background: #404040;
      border: 1px solid #555;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .action-card.primary {
      border-color: #007acc;
    }

    .action-card.primary:hover {
      background: rgba(0, 122, 204, 0.1);
      border-color: #007acc;
    }

    .action-card.secondary {
      border-color: #4caf50;
    }

    .action-card.secondary:hover {
      background: rgba(76, 175, 80, 0.1);
      border-color: #4caf50;
    }

    .action-card.tertiary {
      border-color: #ff9800;
    }

    .action-card.tertiary:hover {
      background: rgba(255, 152, 0, 0.1);
      border-color: #ff9800;
    }

    .action-card.quaternary {
      border-color: #9c27b0;
    }

    .action-card.quaternary:hover {
      background: rgba(156, 39, 176, 0.1);
      border-color: #9c27b0;
    }

    .action-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
    }

    .action-card.primary .action-icon {
      background: rgba(0, 122, 204, 0.2);
      color: #007acc;
    }

    .action-card.secondary .action-icon {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .action-card.tertiary .action-icon {
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }

    .action-card.quaternary .action-icon {
      background: rgba(156, 39, 176, 0.2);
      color: #9c27b0;
    }

    .action-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .action-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .action-description {
      font-size: 11px;
      color: #888;
      line-height: 1.3;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .actions-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .action-card {
        padding: 12px;
        flex-direction: row;
        text-align: left;
      }
      
      .action-icon {
        width: 32px;
        height: 32px;
      }
    }
  `]
})
export class QuickActionsWidgetComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  constructor(private router: Router) {
    super();
  }

  get widgetTitle(): string {
    return 'Actions Rapides';
  }

  get widgetIcon(): string {
    return 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  protected loadData(): void {
    // Pas de données à charger pour ce widget
    this.setLoading(false);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  createNewTicket(): void {
    // Naviguer vers les tickets avec un paramètre pour ouvrir le modal de création
    this.router.navigate(['/admin/tickets'], { 
      queryParams: { action: 'create' } 
    });
  }
}
