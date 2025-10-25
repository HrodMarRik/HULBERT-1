import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectNote } from '../../../../models/project.model';
import { ProjectStateService } from '../services/project-state.service';

@Component({
  selector: 'app-project-notes-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="project-notes">
      <!-- Add Note Section -->
      <div class="add-note-section">
        <div class="add-note-header">
          <h3>Ajouter une note</h3>
        </div>
        
        <div class="add-note-form">
          <textarea 
            [(ngModel)]="newNoteContent"
            placeholder="Écrivez votre note ici..."
            rows="4"
            class="note-textarea">
          </textarea>
          
          <div class="add-note-actions">
            <button 
              class="btn-primary" 
              (click)="onAddNote()" 
              [disabled]="!newNoteContent.trim()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Ajouter Note
            </button>
            
            <button 
              class="btn-secondary" 
              (click)="onClearNote()" 
              [disabled]="!newNoteContent.trim()">
              Effacer
            </button>
          </div>
        </div>
      </div>

      <!-- Notes List -->
      <div class="notes-section">
        <div class="section-header">
          <h3>Notes du projet ({{ notes.length }})</h3>
          <div class="notes-filters">
            <select [(ngModel)]="selectedFilter" (ngModelChange)="onFilterChange()">
              <option value="all">Toutes les notes</option>
              <option value="recent">Récentes</option>
              <option value="important">Importantes</option>
            </select>
          </div>
        </div>
        
        <div class="notes-list">
          <div class="note-item" *ngFor="let note of getFilteredNotes()">
            <div class="note-header">
              <div class="note-author">
                <div class="author-avatar">
                  {{ getAuthorInitials(note.created_by_username || 'User') }}
                </div>
                <div class="author-info">
                  <div class="author-name">{{ note.created_by_username || 'Utilisateur' }}</div>
                  <div class="note-date">{{ note.created_at | date:'dd/MM/yyyy à HH:mm' }}</div>
                </div>
              </div>
              
              <div class="note-actions">
                <button 
                  class="action-btn edit" 
                  (click)="onEditNote(note)" 
                  title="Modifier">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                </button>
                <button 
                  class="action-btn delete" 
                  (click)="onDeleteNote(note)" 
                  title="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="note-content">
              <div class="note-text" [innerHTML]="formatNoteContent(note.content)"></div>
              
              <!-- Tags removed as they don't exist in the model -->
            </div>
            
            <div class="note-footer" *ngIf="note.updated_at !== note.created_at">
              <div class="note-updated">
                Modifié le {{ note.updated_at | date:'dd/MM/yyyy à HH:mm' }}
              </div>
            </div>
          </div>
          
          <div class="no-notes" *ngIf="getFilteredNotes().length === 0">
            <div class="no-notes-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h4>Aucune note</h4>
            <p>Commencez par ajouter votre première note.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-notes {
      padding: 24px;
      background: #1a1a1a;
      color: #f3f4f6;
    }

    .add-note-section {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      margin-bottom: 32px;
      overflow: hidden;
    }

    .add-note-header {
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
    }

    .add-note-header h3 {
      margin: 0;
      color: #f3f4f6;
    }

    .add-note-form {
      padding: 24px;
    }

    .note-textarea {
      width: 100%;
      padding: 16px;
      background: #374151;
      color: #f3f4f6;
      border: 1px solid #4b5563;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 100px;
      margin-bottom: 16px;
    }

    .note-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .note-textarea::placeholder {
      color: #9ca3af;
    }

    .add-note-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-primary,
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
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

    .btn-secondary {
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn-secondary:disabled {
      background: #2d2d2d;
      cursor: not-allowed;
    }

    .notes-section {
      background: #2d2d2d;
      border-radius: 12px;
      border: 1px solid #404040;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #404040;
    }

    .section-header h3 {
      margin: 0;
      color: #f3f4f6;
    }

    .notes-filters select {
      padding: 8px 12px;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
    }

    .notes-list {
      max-height: 600px;
      overflow-y: auto;
    }

    .note-item {
      padding: 20px 24px;
      border-bottom: 1px solid #333;
      transition: background-color 0.2s;
    }

    .note-item:hover {
      background: #374151;
    }

    .note-item:last-child {
      border-bottom: none;
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .note-author {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-avatar {
      width: 40px;
      height: 40px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      font-weight: 600;
      color: #f3f4f6;
      margin-bottom: 2px;
    }

    .note-date {
      font-size: 12px;
      color: #9ca3af;
    }

    .note-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .note-item:hover .note-actions {
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

    .action-btn.edit {
      background: #3b82f6;
      color: white;
    }

    .action-btn.edit:hover {
      background: #2563eb;
    }

    .action-btn.delete {
      background: #ef4444;
      color: white;
    }

    .action-btn.delete:hover {
      background: #dc2626;
    }

    .note-content {
      margin-bottom: 12px;
    }

    .note-text {
      color: #d1d5db;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .note-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .tag {
      background: #374151;
      color: #d1d5db;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .note-footer {
      border-top: 1px solid #333;
      padding-top: 8px;
    }

    .note-updated {
      font-size: 12px;
      color: #9ca3af;
      font-style: italic;
    }

    .no-notes {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
    }

    .no-notes-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-notes h4 {
      margin: 0 0 8px 0;
      color: #d1d5db;
    }

    .no-notes p {
      margin: 0;
      font-size: 14px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .project-notes {
        padding: 16px;
      }

      .add-note-form {
        padding: 16px;
      }

      .add-note-actions {
        flex-direction: column;
      }

      .section-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .note-header {
        flex-direction: column;
        gap: 12px;
      }

      .note-actions {
        opacity: 1;
        justify-content: flex-end;
      }

      .note-item {
        padding: 16px;
      }
    }
  `]
})
export class ProjectNotesTabComponent implements OnInit, OnDestroy {
  @Input() projectId: number = 0;
  @Output() addNote = new EventEmitter<string>();
  @Output() editNote = new EventEmitter<ProjectNote>();
  @Output() deleteNote = new EventEmitter<ProjectNote>();

  private destroy$ = new Subject<void>();

  // State
  notes: ProjectNote[] = [];
  newNoteContent = '';
  selectedFilter = 'all';

  constructor(private projectStateService: ProjectStateService) {}

  ngOnInit(): void {
    // Subscribe to project state changes
    this.projectStateService.projectState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.notes = state.notes;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Computed properties
  getFilteredNotes(): ProjectNote[] {
    let filtered = [...this.notes];

    switch (this.selectedFilter) {
      case 'recent':
        // Show notes from last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(note => new Date(note.created_at) > weekAgo);
        break;
      case 'important':
        // Show notes with important content (simplified filter)
        filtered = filtered.filter(note => 
          note.content.toLowerCase().includes('important') ||
          note.content.toLowerCase().includes('urgent') ||
          note.content.toLowerCase().includes('critical')
        );
        break;
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Event handlers
  onAddNote(): void {
    if (this.newNoteContent.trim()) {
      this.addNote.emit(this.newNoteContent.trim());
      this.newNoteContent = '';
    }
  }

  onClearNote(): void {
    this.newNoteContent = '';
  }

  onEditNote(note: ProjectNote): void {
    this.editNote.emit(note);
  }

  onDeleteNote(note: ProjectNote): void {
    this.deleteNote.emit(note);
  }

  onFilterChange(): void {
    // Filter is applied in getFilteredNotes()
  }

  // Utility methods
  getAuthorInitials(author: string): string {
    return author
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatNoteContent(content: string): string {
    // Convert line breaks to HTML
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
}
