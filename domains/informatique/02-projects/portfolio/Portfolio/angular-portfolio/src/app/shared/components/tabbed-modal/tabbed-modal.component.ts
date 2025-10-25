import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

@Component({
  selector: 'app-tabbed-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-content">
            <h2>{{ title }}</h2>
            <div class="header-actions" *ngIf="showQuickActions && quickActionTemplates.length > 0">
              <div class="quick-actions">
                <span class="quick-actions-label">Modèles rapides:</span>
                <button 
                  *ngFor="let template of quickActionTemplates"
                  class="quick-action-btn"
                  (click)="onQuickAction(template)"
                  [title]="template.description">
                  {{ template.label }}
                </button>
              </div>
            </div>
          </div>
          <button class="close-btn" (click)="onClose()" [disabled]="isLoading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav" *ngIf="tabs.length > 1">
          <button 
            *ngFor="let tab of tabs; let i = index"
            class="tab-button"
            [class.active]="activeTabIndex === i"
            [class.error]="tab.error"
            [class.disabled]="tab.disabled"
            (click)="setActiveTab(i)"
            [disabled]="tab.disabled || isLoading">
            <svg *ngIf="tab.icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path [attr.d]="getIconPath(tab.icon)"/>
            </svg>
            <span>{{ tab.label }}</span>
            <span *ngIf="tab.required" class="required-indicator">*</span>
            <span *ngIf="tab.error" class="error-indicator" title="{{ tab.error }}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M13,17H11V15H13V17M13,13H11V7H13V13Z"/>
              </svg>
            </span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div class="tab-content">
            <ng-container *ngFor="let tab of tabs; let i = index">
              <div 
                *ngIf="activeTabIndex === i"
                class="tab-panel"
                [attr.data-tab-id]="tab.id">
                <ng-container [ngTemplateOutlet]="tabContent" [ngTemplateOutletContext]="{ $implicit: tab, index: i }"></ng-container>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <div class="footer-left">
            <button 
              *ngIf="showDeleteButton"
              type="button" 
              class="btn-danger" 
              (click)="onDelete()"
              [disabled]="isLoading">
              Supprimer
            </button>
          </div>
          
          <div class="footer-right">
            <button 
              type="button" 
              class="btn-secondary" 
              (click)="onClose()"
              [disabled]="isLoading">
              Annuler
            </button>
            <button 
              type="button" 
              class="btn-primary" 
              (click)="onSave()"
              [disabled]="!isFormValid || isLoading"
              [class.loading]="isLoading">
              <span *ngIf="!isLoading">{{ saveButtonText }}</span>
              <span *ngIf="isLoading">Enregistrement...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      padding: 20px;
    }

    .modal-content {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
    }

    .header-content {
      flex: 1;
    }

    .modal-header h2 {
      margin: 0 0 8px 0;
      color: #f3f4f6;
      font-size: 20px;
      font-weight: 600;
    }

    .header-actions {
      margin-top: 8px;
    }

    .quick-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .quick-actions-label {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 500;
    }

    .quick-action-btn {
      background: #374151;
      border: 1px solid #4b5563;
      color: #d1d5db;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-action-btn:hover {
      background: #4b5563;
      color: #f3f4f6;
    }

    .close-btn {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .close-btn:hover:not(:disabled) {
      background: #374151;
      color: #f3f4f6;
    }

    .close-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tabs-nav {
      display: flex;
      border-bottom: 1px solid #404040;
      background: #1a1a1a;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      position: relative;
    }

    .tab-button:hover:not(:disabled) {
      color: #d1d5db;
      background: #2d2d2d;
    }

    .tab-button.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: #2d2d2d;
    }

    .tab-button.error {
      color: #ef4444;
    }

    .tab-button.error.active {
      color: #ef4444;
      border-bottom-color: #ef4444;
    }

    .tab-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .required-indicator {
      color: #ef4444;
      font-weight: 700;
      font-size: 12px;
    }

    .error-indicator {
      color: #ef4444;
      margin-left: 4px;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .tab-content {
      min-height: 200px;
    }

    .tab-panel {
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-top: 1px solid #404040;
      background: #1a1a1a;
    }

    .footer-left,
    .footer-right {
      display: flex;
      gap: 12px;
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    .btn-primary.loading {
      position: relative;
    }

    .btn-primary.loading::after {
      content: '';
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: translateY(-50%) rotate(360deg); }
    }

    .btn-secondary {
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .modal-overlay {
        padding: 10px;
      }

      .modal-content {
        max-height: 95vh;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: 16px;
      }

      .tabs-nav {
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .tabs-nav::-webkit-scrollbar {
        display: none;
      }

      .tab-button {
        white-space: nowrap;
        flex-shrink: 0;
      }

      .modal-footer {
        flex-direction: column;
        gap: 12px;
      }

      .footer-left,
      .footer-right {
        width: 100%;
        justify-content: center;
      }

      .btn-primary,
      .btn-secondary,
      .btn-danger {
        flex: 1;
        justify-content: center;
      }

      .quick-actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class TabbedModalComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Input() title: string = '';
  @Input() tabs: TabConfig[] = [];
  @Input() activeTabIndex: number = 0;
  @Input() isFormValid: boolean = true;
  @Input() isLoading: boolean = false;
  @Input() saveButtonText: string = 'Enregistrer';
  @Input() showDeleteButton: boolean = false;
  @Input() showQuickActions: boolean = true;
  @Input() quickActionTemplates: Array<{label: string, description: string, data: any}> = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() quickAction = new EventEmitter<any>();
  @Output() tabChange = new EventEmitter<{tabIndex: number, tab: TabConfig}>();

  @ContentChild('tabContent') tabContent!: TemplateRef<any>;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Validation initiale des onglets
    this.validateTabs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(index: number): void {
    if (index < 0 || index >= this.tabs.length || this.tabs[index].disabled) {
      return;
    }

    this.activeTabIndex = index;
    this.tabChange.emit({
      tabIndex: index,
      tab: this.tabs[index]
    });
  }

  onClose(): void {
    if (this.isLoading) return;
    this.close.emit();
  }

  onSave(): void {
    if (!this.isFormValid || this.isLoading) return;
    this.save.emit();
  }

  onDelete(): void {
    if (this.isLoading) return;
    this.delete.emit();
  }

  onQuickAction(template: any): void {
    this.quickAction.emit(template);
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getIconPath(iconName: string): string {
    const iconPaths: {[key: string]: string} = {
      'info': 'M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
      'user': 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
      'calendar': 'M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V8H19V19Z',
      'settings': 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
      'tag': 'M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z'
    };
    return iconPaths[iconName] || iconPaths['info'];
  }

  private validateTabs(): void {
    if (this.tabs.length === 0) {
      console.warn('TabbedModal: No tabs provided');
      return;
    }

    if (this.activeTabIndex < 0 || this.activeTabIndex >= this.tabs.length) {
      this.activeTabIndex = 0;
    }

    // Vérifier que l'onglet actif n'est pas désactivé
    if (this.tabs[this.activeTabIndex].disabled) {
      const firstEnabledTab = this.tabs.findIndex(tab => !tab.disabled);
      if (firstEnabledTab >= 0) {
        this.activeTabIndex = firstEnabledTab;
      }
    }
  }
}
