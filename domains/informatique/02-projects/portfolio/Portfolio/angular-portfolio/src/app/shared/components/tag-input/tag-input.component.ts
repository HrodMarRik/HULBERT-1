import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TagsService, TagSuggestion } from '../../services/tags.service';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="tag-input-container">
      <!-- Tags affichés -->
      <div class="tags-display" *ngIf="tags.length > 0">
        <div class="tag-item" *ngFor="let tag of tags; trackBy: trackByTag">
          <span class="tag-name">{{ tag }}</span>
          <button 
            type="button" 
            class="tag-remove" 
            (click)="removeTag(tag)"
            title="Supprimer le tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Input pour nouveau tag -->
      <div class="tag-input-wrapper">
        <input
          type="text"
          class="tag-input-field"
          [(ngModel)]="inputValue"
          (input)="onInputChange($event)"
          (keydown)="onKeyDown($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          [placeholder]="placeholder"
          [disabled]="disabled">
        
        <!-- Suggestions dropdown -->
        <div class="suggestions-dropdown" *ngIf="showSuggestions && suggestions.length > 0">
          <div 
            class="suggestion-item"
            *ngFor="let suggestion of suggestions; let i = index"
            [class.selected]="i === selectedSuggestionIndex"
            (click)="selectSuggestion(suggestion)"
            (mouseenter)="selectedSuggestionIndex = i">
            <span class="suggestion-name">{{ suggestion.name }}</span>
            <span class="suggestion-count" *ngIf="suggestion.usage_count > 0">
              {{ suggestion.usage_count }}
            </span>
          </div>
          
          <!-- Option pour créer nouveau tag -->
          <div 
            class="suggestion-item create-new"
            *ngIf="shouldShowCreateNewOption()"
            (click)="createNewTag(inputValue)">
            <span class="create-text">Créer "{{ inputValue }}"</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Message d'aide -->
      <div class="tag-help" *ngIf="helpText">
        {{ helpText }}
      </div>
    </div>
  `,
  styles: [`
    .tag-input-container {
      position: relative;
      width: 100%;
    }

    .tags-display {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .tag-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #3b82f6;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .tag-name {
      flex: 1;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      transition: background-color 0.2s;
    }

    .tag-remove:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .tag-input-wrapper {
      position: relative;
    }

    .tag-input-field {
      width: 100%;
      padding: 10px 12px;
      background: #374151;
      color: #f3f4f6;
      border: 1px solid #4b5563;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .tag-input-field:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tag-input-field:disabled {
      background: #2d2d2d;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 2px;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 14px;
    }

    .suggestion-item:hover,
    .suggestion-item.selected {
      background: #374151;
    }

    .suggestion-item.create-new {
      border-top: 1px solid #404040;
      color: #3b82f6;
      font-weight: 500;
    }

    .suggestion-name {
      flex: 1;
      color: #f3f4f6;
    }

    .suggestion-count {
      color: #9ca3af;
      font-size: 12px;
      background: #404040;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .create-text {
      flex: 1;
    }

    .tag-help {
      margin-top: 4px;
      color: #9ca3af;
      font-size: 12px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .suggestions-dropdown {
        max-height: 150px;
      }
      
      .suggestion-item {
        padding: 10px 12px;
      }
    }
  `]
})
export class TagInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() entityType?: string;
  @Input() placeholder: string = 'Ajouter des tags...';
  @Input() helpText: string = 'Séparez les tags par des virgules';
  @Input() maxTags: number = 10;
  @Input() disabled: boolean = false;

  @Output() tagsChange = new EventEmitter<string[]>();

  private destroy$ = new Subject<void>();
  private inputSubject$ = new Subject<string>();

  tags: string[] = [];
  inputValue: string = '';
  suggestions: TagSuggestion[] = [];
  showSuggestions: boolean = false;
  selectedSuggestionIndex: number = -1;

  // ControlValueAccessor
  private onChange = (value: string[]) => {};
  private onTouched = () => {};

  constructor(private tagsService: TagsService) {}

  ngOnInit(): void {
    // Écouter les changements d'input avec debounce
    this.inputSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.getSuggestions(query)),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.suggestions = suggestions;
      this.selectedSuggestionIndex = -1;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inputValue = target.value;
    this.inputSubject$.next(this.inputValue);
    
    if (this.inputValue.trim()) {
      this.showSuggestions = true;
    } else {
      this.showSuggestions = false;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions) {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        this.addCurrentInput();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.suggestions.length - 1
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(
          this.selectedSuggestionIndex - 1,
          -1
        );
        break;
      
      case 'Enter':
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        } else {
          this.addCurrentInput();
        }
        break;
      
      case 'Escape':
        this.showSuggestions = false;
        this.selectedSuggestionIndex = -1;
        break;
    }
  }

  onFocus(): void {
    if (this.inputValue.trim()) {
      this.showSuggestions = true;
    }
  }

  onBlur(): void {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 150);
  }

  selectSuggestion(suggestion: TagSuggestion): void {
    this.addTag(suggestion.name);
    this.inputValue = '';
    this.showSuggestions = false;
  }

  createNewTag(tagName: string): void {
    const validation = this.tagsService.validateTagName(tagName);
    if (!validation.valid) {
      console.warn('Tag validation failed:', validation.error);
      return;
    }

    this.tagsService.createTag({ 
      name: tagName.trim(), 
      entity_type: this.entityType 
    }).subscribe({
      next: () => {
        this.addTag(tagName.trim());
        this.inputValue = '';
        this.showSuggestions = false;
      },
      error: (error) => {
        console.error('Error creating tag:', error);
        // Ajouter quand même le tag localement
        this.addTag(tagName.trim());
        this.inputValue = '';
        this.showSuggestions = false;
      }
    });
  }

  addCurrentInput(): void {
    const tagName = this.inputValue.trim();
    if (!tagName) return;

    const validation = this.tagsService.validateTagName(tagName);
    if (!validation.valid) {
      console.warn('Tag validation failed:', validation.error);
      return;
    }

    this.addTag(tagName);
    this.inputValue = '';
    this.showSuggestions = false;
  }

  addTag(tagName: string): void {
    const normalizedTag = tagName.trim().toLowerCase();
    
    if (this.tags.length >= this.maxTags) {
      console.warn(`Maximum ${this.maxTags} tags allowed`);
      return;
    }

    if (this.tags.some(tag => tag.toLowerCase() === normalizedTag)) {
      return; // Tag déjà présent
    }

    this.tags.push(tagName.trim());
    this.emitChange();
  }

  removeTag(tagToRemove: string): void {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
    this.emitChange();
  }

  private getSuggestions(query: string): Observable<TagSuggestion[]> {
    if (!query.trim()) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    return this.tagsService.getSuggestions(this.entityType, query);
  }

  private emitChange(): void {
    this.onChange(this.tags);
    this.tagsChange.emit(this.tags);
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }

  shouldShowCreateNewOption(): boolean {
    if (!this.inputValue || !this.inputValue.trim()) {
      return false;
    }
    
    if (!this.suggestions || this.suggestions.length === 0) {
      return true;
    }
    
    const inputLower = this.inputValue.toLowerCase();
    return !this.suggestions.some(s => s.name.toLowerCase() === inputLower);
  }

  // ControlValueAccessor implementation
  writeValue(value: string[]): void {
    this.tags = value || [];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
