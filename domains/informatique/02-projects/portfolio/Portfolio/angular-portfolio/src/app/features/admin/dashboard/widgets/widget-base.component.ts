import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetConfig, WidgetData } from '../models/widget.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-widget-base',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-container" [class.editing]="isEditing">
      <div class="widget-header">
        <div class="widget-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path [attr.d]="widgetIcon"/>
          </svg>
          {{ widgetTitle }}
        </div>
        <div class="widget-actions">
          <button class="action-btn refresh" (click)="refresh()" [disabled]="data.loading" title="Actualiser">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button class="action-btn configure" (click)="configure()" title="Configurer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
          </button>
          <button class="action-btn remove" (click)="remove()" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="widget-content">
        <div *ngIf="data.loading" class="widget-loading">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
        
        <div *ngIf="data.error" class="widget-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
          </svg>
          <p>{{ data.error }}</p>
        </div>
        
        <ng-content *ngIf="!data.loading && !data.error"></ng-content>
      </div>
      
      <div class="widget-footer" *ngIf="data.lastUpdated">
        <span class="last-updated">Mis à jour: {{ data.lastUpdated | date:'short' }}</span>
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

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .widget-content {
      flex: 1;
      padding: 16px;
      overflow: hidden;
    }

    .widget-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #888;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #404040;
      border-top-color: #007acc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .widget-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #f44336;
      text-align: center;
    }

    .widget-footer {
      padding: 8px 16px;
      background: #404040;
      border-top: 1px solid #555;
    }

    .last-updated {
      font-size: 11px;
      color: #888;
    }
  `]
})
export abstract class WidgetBaseComponent implements OnInit, OnDestroy {
  @Input() config!: WidgetConfig;
  @Input() isEditing = false;
  @Output() refreshRequested = new EventEmitter<void>();
  @Output() configureRequested = new EventEmitter<void>();
  @Output() removeRequested = new EventEmitter<void>();

  data: WidgetData = {
    loading: false,
    error: undefined,
    lastUpdated: undefined
  };

  protected destroy$ = new Subject<void>();

  abstract get widgetTitle(): string;
  abstract get widgetIcon(): string;

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.loadData();
    this.refreshRequested.emit();
  }

  configure() {
    this.configureRequested.emit();
  }

  remove() {
    this.removeRequested.emit();
  }

  protected abstract loadData(): void;

  protected setLoading(loading: boolean) {
    this.data.loading = loading;
  }

  protected setError(error: string | undefined) {
    this.data.error = error;
  }

  protected setLastUpdated(date: Date) {
    this.data.lastUpdated = date;
  }
}
