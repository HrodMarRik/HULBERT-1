import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export type FieldType = 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'currency' | 'url';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editable-field-container" 
         [class.editing]="isEditing"
         [class.saving]="saveState === 'saving'">
      
      <!-- Mode Lecture -->
      <div *ngIf="!isEditing" class="read-mode">
        <span class="field-label" *ngIf="showLabel">{{ label }}:</span>
        <span class="field-value" [class.empty]="!displayValue">
          {{ displayValue || placeholder || 'N/A' }}
        </span>
        
        <!-- Icône Edit au survol -->
        <button 
          *ngIf="!disabled" 
          class="edit-icon-btn"
          (click)="startEdit($event)"
          type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
          </svg>
        </button>
        
        <!-- Indicateur de sauvegarde -->
        <span *ngIf="saveState === 'saved'" class="save-indicator saved">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
          </svg>
        </span>
        <span *ngIf="saveState === 'error'" class="save-indicator error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
          </svg>
        </span>
      </div>
      
      <!-- Mode Édition -->
      <div *ngIf="isEditing" class="edit-mode">
        <span class="field-label" *ngIf="showLabel">{{ label }}:</span>
        
        <!-- Input Text/Email/Tel/URL/Number -->
        <input 
          *ngIf="fieldType === 'text' || fieldType === 'email' || fieldType === 'tel' || fieldType === 'url' || fieldType === 'number'"
          #inputElement
          [type]="fieldType === 'number' ? 'number' : 'text'"
          [attr.inputmode]="getInputMode()"
          [(ngModel)]="editValue"
          (ngModelChange)="onValueChange($event)"
          (blur)="finishEdit()"
          (keydown.escape)="cancelEdit()"
          (keydown.enter)="finishEdit()"
          [placeholder]="placeholder"
          class="edit-input"
          [class.error]="saveState === 'error'">
        
        <!-- Textarea -->
        <textarea 
          *ngIf="fieldType === 'textarea'"
          #textareaElement
          [(ngModel)]="editValue"
          (ngModelChange)="onValueChange($event)"
          (blur)="finishEdit()"
          (keydown.escape)="cancelEdit()"
          [placeholder]="placeholder"
          class="edit-textarea"
          [class.error]="saveState === 'error'"
          [rows]="textareaRows">
        </textarea>
        
        <!-- Date -->
        <input 
          *ngIf="fieldType === 'date'"
          #dateElement
          type="date"
          [(ngModel)]="editValue"
          (ngModelChange)="onValueChange($event)"
          (blur)="finishEdit()"
          (keydown.escape)="cancelEdit()"
          (keydown.enter)="finishEdit()"
          class="edit-input"
          [class.error]="saveState === 'error'">
        
        <!-- Select -->
        <select 
          *ngIf="fieldType === 'select'"
          #selectElement
          [(ngModel)]="editValue"
          (ngModelChange)="onValueChange($event)"
          (blur)="finishEdit()"
          (keydown.escape)="cancelEdit()"
          class="edit-select"
          [class.error]="saveState === 'error'">
          <option *ngFor="let option of selectOptions" [value]="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <!-- Currency -->
        <div *ngIf="fieldType === 'currency'" class="currency-input-group">
          <input 
            #currencyElement
            type="number"
            [(ngModel)]="editValue"
            (ngModelChange)="onValueChange($event)"
            (blur)="finishEdit()"
            (keydown.escape)="cancelEdit()"
            (keydown.enter)="finishEdit()"
            [placeholder]="placeholder"
            step="0.01"
            class="edit-input currency"
            [class.error]="saveState === 'error'">
          <span class="currency-symbol">{{ currencySymbol }}</span>
        </div>
        
        <!-- Spinner de sauvegarde -->
        <span *ngIf="saveState === 'saving'" class="save-spinner">
          <svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" stroke-dashoffset="0">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </span>
      </div>
    </div>
  `,
  styles: [`
    .editable-field-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 100px;
      transition: all 0.2s ease;
    }
    
    .read-mode {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
    
    .read-mode:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    .read-mode:hover .edit-icon-btn {
      opacity: 1;
    }
    
    .field-label {
      font-weight: 600;
      color: #888;
      font-size: 14px;
      white-space: nowrap;
    }
    
    .field-value {
      color: #e0e0e0;
      font-size: 14px;
      flex: 1;
    }
    
    .field-value.empty {
      color: #666;
      font-style: italic;
    }
    
    .edit-icon-btn {
      background: #404040;
      border: none;
      color: #888;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      opacity: 0;
    }
    
    .edit-icon-btn:hover {
      background: #505050;
      color: #e0e0e0;
    }
    
    .save-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    
    .save-indicator.saved {
      color: #10b981;
    }
    
    .save-indicator.error {
      color: #ef4444;
    }
    
    .edit-mode {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      animation: slideIn 0.2s ease;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .edit-input,
    .edit-textarea,
    .edit-select {
      background: #1a1a1a;
      border: 2px solid #007acc;
      border-radius: 4px;
      padding: 6px 8px;
      color: #e0e0e0;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      flex: 1;
      transition: border-color 0.2s ease;
    }
    
    .edit-input:focus,
    .edit-textarea:focus,
    .edit-select:focus {
      border-color: #00a8e8;
    }
    
    .edit-input.error,
    .edit-textarea.error,
    .edit-select.error {
      border-color: #ef4444;
    }
    
    .edit-textarea {
      resize: vertical;
      min-height: 60px;
    }
    
    .currency-input-group {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
    }
    
    .edit-input.currency {
      flex: 1;
    }
    
    .currency-symbol {
      color: #888;
      font-size: 14px;
      font-weight: 600;
    }
    
    .save-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007acc;
    }
    
    .spinner {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .editable-field-container {
        flex-direction: column;
        align-items: stretch;
      }
      
      .read-mode,
      .edit-mode {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class EditableFieldComponent implements OnInit, OnDestroy {
  @Input() value: any = '';
  @Input() fieldType: FieldType = 'text';
  @Input() fieldName: string = '';
  @Input() label: string = '';
  @Input() showLabel: boolean = false;
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() selectOptions: SelectOption[] = [];
  @Input() currencySymbol: string = '€';
  @Input() textareaRows: number = 3;
  @Input() debounceTime: number = 1000;
  
  @Output() valueChanged = new EventEmitter<any>();
  @Output() editStarted = new EventEmitter<void>();
  @Output() editFinished = new EventEmitter<void>();
  
  isEditing = false;
  isHovering = false;
  editValue: any = '';
  originalValue: any = '';
  saveState: SaveState = 'idle';
  
  private valueChange$ = new Subject<any>();
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.originalValue = this.value;
    this.editValue = this.value;
    
    // Setup debounced auto-save
    this.valueChange$
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.saveValue(value);
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  get displayValue(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return '';
    }
    
    if (this.fieldType === 'currency') {
      return `${this.value} ${this.currencySymbol}`;
    }
    
    if (this.fieldType === 'select') {
      const option = this.selectOptions.find(opt => opt.value === this.value);
      return option ? option.label : this.value;
    }
    
    if (this.fieldType === 'date' && this.value) {
      return new Date(this.value).toLocaleDateString('fr-FR');
    }
    
    return String(this.value);
  }
  
  onMouseEnter() {
    if (!this.disabled && !this.isEditing) {
      this.isHovering = true;
    }
  }
  
  onMouseLeave() {
    this.isHovering = false;
  }
  
  startEdit(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.disabled) return;
    
    this.isEditing = true;
    this.isHovering = false;
    this.editValue = this.value;
    this.originalValue = this.value;
    this.saveState = 'idle';
    this.editStarted.emit();
    
    // Focus on input after view update
    setTimeout(() => {
      const input = document.querySelector('.edit-input') as HTMLInputElement;
      const textarea = document.querySelector('.edit-textarea') as HTMLTextAreaElement;
      const select = document.querySelector('.edit-select') as HTMLSelectElement;
      
      if (input) input.focus();
      else if (textarea) textarea.focus();
      else if (select) select.focus();
    }, 50);
  }
  
  onValueChange(value: any) {
    if (value !== this.originalValue) {
      this.valueChange$.next(value);
    }
  }
  
  saveValue(value: any) {
    if (value === this.originalValue) {
      return;
    }
    
    this.saveState = 'saving';
    this.valueChanged.emit(value);
    
    // Simulate save success (parent component will handle actual save)
    setTimeout(() => {
      this.saveState = 'saved';
      this.originalValue = value;
      
      // Reset saved indicator after 2 seconds
      setTimeout(() => {
        if (this.saveState === 'saved') {
          this.saveState = 'idle';
        }
      }, 2000);
    }, 500);
  }
  
  finishEdit() {
    if (this.editValue !== this.originalValue && this.saveState !== 'saving') {
      // Force immediate save
      this.saveValue(this.editValue);
    }
    
    setTimeout(() => {
      this.isEditing = false;
      this.editFinished.emit();
    }, 300);
  }
  
  cancelEdit() {
    this.editValue = this.originalValue;
    this.isEditing = false;
    this.saveState = 'idle';
    this.editFinished.emit();
  }
  
  getInputMode(): string {
    switch (this.fieldType) {
      case 'email': return 'email';
      case 'tel': return 'tel';
      case 'number': return 'numeric';
      case 'url': return 'url';
      default: return 'text';
    }
  }
  
  // Method for parent to trigger error state
  setErrorState() {
    this.saveState = 'error';
    setTimeout(() => {
      if (this.saveState === 'error') {
        this.saveState = 'idle';
      }
    }, 3000);
  }
  
  // Method for parent to trigger success state
  setSuccessState() {
    this.saveState = 'saved';
    setTimeout(() => {
      if (this.saveState === 'saved') {
        this.saveState = 'idle';
      }
    }, 2000);
  }
}

