import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContactStateService } from '../services/contact-state.service';

@Component({
  selector: 'app-contact-documents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact-documents">
      <!-- Documents Header -->
      <div class="documents-header">
        <div class="section-title">
          <h3>Documents du contact ({{ documents.length }})</h3>
        </div>
        
        <div class="documents-actions">
          <button class="btn-primary" (click)="onAddDocument()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Ajouter Document
          </button>
        </div>
      </div>

      <!-- Documents List -->
      <div class="documents-list">
        <div class="document-item" *ngFor="let document of documents">
          <div class="document-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          
          <div class="document-info">
            <div class="document-name">{{ document.filename }}</div>
            <div class="document-meta">
              <span class="document-type">{{ document.file_type || 'Type inconnu' }}</span>
              <span class="document-size" *ngIf="document.file_size">{{ formatFileSize(document.file_size) }}</span>
              <span class="document-date">{{ document.uploaded_at | date:'dd/MM/yyyy à HH:mm' }}</span>
            </div>
            <div class="document-description" *ngIf="document.description">
              {{ document.description }}
            </div>
          </div>
          
          <div class="document-actions">
            <button 
              class="action-btn download" 
              (click)="onDownloadDocument(document)" 
              title="Télécharger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
              </svg>
            </button>
            
            <button 
              class="action-btn edit" 
              (click)="onEditDocument(document)" 
              title="Modifier">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
              </svg>
            </button>
            
            <button 
              class="action-btn delete" 
              (click)="onDeleteDocument(document)" 
              title="Supprimer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="no-documents" *ngIf="documents.length === 0">
          <div class="no-documents-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <h4>Aucun document</h4>
          <p>Commencez par ajouter votre premier document.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-documents {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .documents-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title h3 {
      margin: 0;
      color: #f3f4f6;
      font-size: 20px;
      font-weight: 600;
    }

    .btn-primary {
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

    .btn-primary:hover {
      background: #2563eb;
    }

    .documents-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #2d2d2d;
      border-radius: 8px;
      border: 1px solid #404040;
      transition: all 0.2s;
    }

    .document-item:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .document-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #374151;
      border-radius: 8px;
      color: #9ca3af;
      flex-shrink: 0;
    }

    .document-info {
      flex: 1;
      min-width: 0;
    }

    .document-name {
      font-weight: 600;
      color: #f3f4f6;
      margin-bottom: 4px;
      word-break: break-word;
    }

    .document-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 4px;
    }

    .document-description {
      font-size: 14px;
      color: #d1d5db;
      line-height: 1.4;
    }

    .document-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .document-item:hover .document-actions {
      opacity: 1;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.download {
      background: #3b82f6;
      color: white;
    }

    .action-btn.download:hover {
      background: #2563eb;
    }

    .action-btn.edit {
      background: #10b981;
      color: white;
    }

    .action-btn.edit:hover {
      background: #059669;
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    .no-documents {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
    }

    .no-documents-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-documents h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-documents p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .contact-documents {
        padding: 16px;
      }

      .documents-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .document-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .document-actions {
        opacity: 1;
        justify-content: center;
      }

      .document-meta {
        flex-direction: column;
        gap: 4px;
      }
    }
  `]
})
export class ContactDocumentsTabComponent implements OnInit, OnDestroy {
  @Input() contactId: number = 0;
  @Output() addDocument = new EventEmitter<void>();
  @Output() downloadDocument = new EventEmitter<any>();
  @Output() editDocument = new EventEmitter<any>();
  @Output() deleteDocument = new EventEmitter<any>();

  private destroy$ = new Subject<void>();

  documents: any[] = [];

  constructor(private contactStateService: ContactStateService) {}

  ngOnInit(): void {
    // Subscribe to state changes
    this.contactStateService.contactState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.documents = state.documents;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event handlers
  onAddDocument(): void {
    this.addDocument.emit();
  }

  onDownloadDocument(document: any): void {
    this.downloadDocument.emit(document);
  }

  onEditDocument(document: any): void {
    this.editDocument.emit(document);
  }

  onDeleteDocument(document: any): void {
    this.deleteDocument.emit(document);
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
