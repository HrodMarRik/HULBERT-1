import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: string;
  category: string;
  tags: string[];
  code: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  isPublic: boolean;
}

interface CodeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-code-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="code-library-container">
      <div class="header">
        <h1>Bibliothèque de Code</h1>
        <p>Organisez et partagez vos snippets de code</p>
      </div>

      <div class="main-content">
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="search-section">
            <div class="search-box">
              <input type="text" 
                     placeholder="Rechercher du code..." 
                     [(ngModel)]="searchQuery"
                     (input)="onSearch()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
            </div>
          </div>

          <div class="filters-section">
            <h3>Catégories</h3>
            <div class="category-list">
              <div class="category-item" 
                   *ngFor="let category of categories"
                   [class.active]="selectedCategory === category.id"
                   (click)="selectCategory(category.id)">
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
            </div>
          </div>

          <div class="filters-section">
            <h3>Langages</h3>
            <div class="language-filters">
              <label class="filter-item" *ngFor="let language of languages">
                <input type="checkbox" 
                       [value]="language"
                       [(ngModel)]="selectedLanguages[language]"
                       (change)="onFilterChange()">
                <span>{{ language }}</span>
              </label>
            </div>
          </div>

          <div class="filters-section">
            <h3>Tags</h3>
            <div class="tag-filters">
              <span class="tag-item" 
                    *ngFor="let tag of popularTags"
                    [class.active]="selectedTags.includes(tag)"
                    (click)="toggleTag(tag)">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content">
          <div class="content-header">
            <h2>{{ getContentTitle() }}</h2>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary" (click)="testHighlighting()">
                Test Coloration
              </button>
              <button class="btn btn-primary" (click)="addSnippet()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                Nouveau Snippet
              </button>
            </div>
          </div>

          <div class="snippets-grid" *ngIf="filteredSnippets.length > 0">
            <div class="snippet-card" *ngFor="let snippet of filteredSnippets">
              <div class="snippet-header">
                <h3>{{ snippet.title }}</h3>
                <div class="snippet-actions">
                  <button class="btn-icon" (click)="copyCode(snippet)" title="Copier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="editSnippet(snippet)" title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                    </svg>
                  </button>
                  <button class="btn-icon delete" (click)="deleteSnippet(snippet.id)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <p class="snippet-description">{{ snippet.description }}</p>
              
              <div class="snippet-meta">
                <span class="language-badge">{{ snippet.language }}</span>
                <span class="category-badge">{{ snippet.category }}</span>
                <span class="usage-count">{{ snippet.usageCount }} utilisations</span>
              </div>
              
              <div class="snippet-tags">
                <span class="tag" *ngFor="let tag of snippet.tags">{{ tag }}</span>
              </div>
              
              <div class="snippet-code">
                <pre><code [innerHTML]="getHighlightedCode(snippet.code, snippet.language)"></code></pre>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="filteredSnippets.length === 0">
            <div class="empty-icon">📝</div>
            <h3>Aucun snippet trouvé</h3>
            <p>Essayez de modifier vos filtres ou ajoutez un nouveau snippet.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .code-library-container {
      padding: 20px;
      background: #0f172a;
      min-height: 100vh;
      color: #f1f5f9;
    }

    .header {
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 28px;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .header p {
      color: #94a3b8;
      font-size: 16px;
    }

    .main-content {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 30px;
    }

    .sidebar {
      background: #1e293b;
      border-radius: 10px;
      padding: 20px;
      height: fit-content;
    }

    .search-section {
      margin-bottom: 25px;
    }

    .search-box {
      position: relative;
    }

    .search-box input {
      width: 100%;
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 6px;
      padding: 10px 35px 10px 12px;
      color: #f1f5f9;
      font-size: 14px;
    }

    .search-box input:focus {
      outline: none;
      border-color: #60a5fa;
    }

    .search-box svg {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .filters-section {
      margin-bottom: 25px;
    }

    .filters-section h3 {
      font-size: 16px;
      color: #f1f5f9;
      margin-bottom: 15px;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .category-item:hover {
      background: #334155;
    }

    .category-item.active {
      background: #1e3a5f;
      color: #60a5fa;
    }

    .category-icon {
      font-size: 16px;
    }

    .category-name {
      flex: 1;
      font-size: 14px;
    }

    .category-count {
      font-size: 12px;
      color: #94a3b8;
    }

    .language-filters {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .filter-item input {
      margin: 0;
    }

    .tag-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag-item {
      background: #334155;
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tag-item:hover {
      background: #475569;
    }

    .tag-item.active {
      background: #3b82f6;
      color: white;
    }

    .content {
      background: #1e293b;
      border-radius: 10px;
      padding: 20px;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .content-header h2 {
      font-size: 20px;
      color: #f1f5f9;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .snippets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .snippet-card {
      background: #334155;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
    }

    .snippet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .snippet-header h3 {
      font-size: 18px;
      color: #f1f5f9;
    }

    .snippet-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
    }

    .btn-icon.delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .snippet-description {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .snippet-meta {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .language-badge, .category-badge {
      background: rgba(96, 165, 250, 0.1);
      color: #60a5fa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .usage-count {
      color: #94a3b8;
      font-size: 12px;
    }

    .snippet-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 15px;
    }

    .tag {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    }

    .snippet-code {
      background: #0a0a0a;
      border-radius: 8px;
      padding: 20px;
      overflow-x: auto;
      border: 1px solid #374151;
      position: relative;
    }

    .snippet-code pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #f8fafc;
    }

    .snippet-code code {
      color: #f8fafc;
      background: transparent;
    }

    /* Styles de coloration syntaxique intégrée */
    .snippet-code .keyword {
      color: #8b5cf6;
      font-weight: 600;
    }

    .snippet-code .constant {
      color: #f59e0b;
      font-weight: 600;
    }

    .snippet-code .string {
      color: #10b981;
    }

    .snippet-code .number {
      color: #f59e0b;
    }

    .snippet-code .comment {
      color: #6b7280;
      font-style: italic;
    }

    .snippet-code .function {
      color: #06b6d4;
      font-weight: 500;
    }

    .snippet-code .tag {
      color: #ef4444;
    }

    .snippet-code .attribute {
      color: #8b5cf6;
    }

    .snippet-code .selector {
      color: #ef4444;
    }

    .snippet-code .property {
      color: #06b6d4;
    }

    .snippet-code .punctuation {
      color: #d1d5db;
    }

    .snippet-code .variable {
      color: #f59e0b;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      font-size: 20px;
      color: #f1f5f9;
      margin-bottom: 10px;
    }

    .empty-state p {
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .main-content {
        grid-template-columns: 1fr;
      }
      
      .snippets-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CodeLibraryComponent implements OnInit, AfterViewInit {
  snippets: CodeSnippet[] = [
    {
      id: '1',
      title: 'API REST avec FastAPI',
      description: 'Exemple d\'API REST complète avec FastAPI',
      language: 'Python',
      category: 'Backend',
      tags: ['api', 'rest', 'fastapi', 'python'],
      code: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str = None
    price: float
    tax: float = None

@app.get("/items/", response_model=List[Item])
async def read_items():
    return items

@app.post("/items/", response_model=Item)
async def create_item(item: Item):
    items.append(item)
    return item`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 15,
      isPublic: true
    },
    {
      id: '2',
      title: 'Composant Angular avec Input/Output',
      description: 'Exemple de composant Angular avec communication parent-enfant',
      language: 'TypeScript',
      category: 'Frontend',
      tags: ['angular', 'typescript', 'component'],
      code: `import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-child',
  template: \`
    <div>
      <h3>{{ title }}</h3>
      <button (click)="onClick()">Click me</button>
    </div>
  \`
})
export class ChildComponent {
  @Input() title: string;
  @Output() clicked = new EventEmitter<string>();

  onClick() {
    this.clicked.emit('Button clicked!');
  }
}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 8,
      isPublic: true
    }
  ];

  categories: CodeCategory[] = [
    { id: 'all', name: 'Tous', description: 'Tous les snippets', icon: '📁', count: 2 },
    { id: 'backend', name: 'Backend', description: 'Code serveur', icon: '⚙️', count: 1 },
    { id: 'frontend', name: 'Frontend', description: 'Code client', icon: '🎨', count: 1 },
    { id: 'database', name: 'Base de données', description: 'Requêtes SQL', icon: '🗄️', count: 0 },
    { id: 'devops', name: 'DevOps', description: 'Déploiement et infrastructure', icon: '🚀', count: 0 }
  ];

  languages = ['Python', 'TypeScript', 'JavaScript', 'Java', 'C#', 'Go', 'Rust'];
  popularTags = ['api', 'rest', 'angular', 'react', 'vue', 'fastapi', 'express', 'sql', 'mongodb'];

  searchQuery: string = '';
  selectedCategory: string = 'all';
  selectedLanguages: { [key: string]: boolean } = {};
  selectedTags: string[] = [];
  filteredSnippets: CodeSnippet[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.filteredSnippets = this.snippets;
  }

  ngAfterViewInit() {
    // Plus besoin de coloration automatique, elle se fait via innerHTML
  }

  getHighlightedCode(code: string, language: string): string {
    if (!code || !language) return code;
    
    // Test simple pour voir si la méthode est appelée
    console.log('=== DEBUG COLORATION ===');
    console.log('Code:', code.substring(0, 50));
    console.log('Language:', language);
    
    let result = '';
    switch (language.toLowerCase()) {
      case 'python':
        result = this.highlightPython(code);
        break;
      case 'typescript':
      case 'javascript':
        result = this.highlightJavaScript(code);
        break;
      default:
        result = code;
    }
    
    console.log('Result:', result.substring(0, 100));
    console.log('=== FIN DEBUG ===');
    
    return result;
  }

  private highlightCode(code: string, language: string): string {
    switch (language.toLowerCase()) {
      case 'python':
        return this.highlightPython(code);
      case 'typescript':
      case 'javascript':
        return this.highlightJavaScript(code);
      case 'java':
        return this.highlightJava(code);
      case 'csharp':
        return this.highlightCSharp(code);
      case 'html':
        return this.highlightHTML(code);
      case 'css':
        return this.highlightCSS(code);
      case 'json':
        return this.highlightJSON(code);
      case 'sql':
        return this.highlightSQL(code);
      case 'bash':
      case 'shell':
        return this.highlightBash(code);
      default:
        return this.highlightGeneric(code);
    }
  }

  private highlightPython(code: string): string {
    console.log('Python highlighting called with:', code.substring(0, 30));
    
    // Test simple avec juste les keywords
    let result = code
      .replace(/\b(def|class|if|else|elif|for|while|try|except|finally|with|import|from|return|yield|lambda|and|or|not|in|is|as|pass|break|continue|raise|assert|del|global|nonlocal)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(True|False|None)\b/g, '<span class="constant">$1</span>')
      .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
      .replace(/\b(__\w+__|\w+)\s*(?=\()/g, '<span class="function">$1</span>');
    
    console.log('Python result:', result.substring(0, 100));
    return result;
  }

  private highlightJavaScript(code: string): string {
    return code
      .replace(/\b(function|const|let|var|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|class|extends|import|export|default|async|await|static|public|private|protected)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="constant">$1</span>')
      .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
      .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
      .replace(/\b\w+\s*(?=\()/g, '<span class="function">$&</span>');
  }

  private highlightJava(code: string): string {
    return code
      .replace(/\b(public|private|protected|static|final|abstract|class|interface|extends|implements|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|super|import|package|synchronized|volatile|transient|native|strictfp)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="constant">$1</span>')
      .replace(/\b\d+\.?\d*[fFdDlL]?\b/g, '<span class="number">$&</span>')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
      .replace(/\b\w+\s*(?=\()/g, '<span class="function">$&</span>');
  }

  private highlightCSharp(code: string): string {
    return code
      .replace(/\b(public|private|protected|internal|static|readonly|const|sealed|abstract|virtual|override|class|interface|struct|enum|namespace|using|if|else|for|foreach|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|base|get|set|add|remove|event|delegate|async|await|var|dynamic|object|string|int|bool|char|byte|short|long|float|double|decimal|void)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="constant">$1</span>')
      .replace(/\b\d+\.?\d*[fFdDmM]?\b/g, '<span class="number">$&</span>')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
      .replace(/\b\w+\s*(?=\()/g, '<span class="function">$&</span>');
  }

  private highlightHTML(code: string): string {
    return code
      .replace(/&lt;(\/?)([^&]+)&gt;/g, '<span class="tag">&lt;$1$2&gt;</span>')
      .replace(/(\w+)=/g, '<span class="attribute">$1</span>=')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/<!--[\s\S]*?-->/g, '<span class="comment">$&</span>');
  }

  private highlightCSS(code: string): string {
    return code
      .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="selector">$1</span> {')
      .replace(/([\w-]+)\s*:/g, '<span class="property">$1</span>:')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\b\d+\.?\d*(px|em|rem|%|vh|vw|pt|pc|in|cm|mm)?\b/g, '<span class="number">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
  }

  private highlightJSON(code: string): string {
    return code
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="constant">$1</span>')
      .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
      .replace(/([{}[\]])/g, '<span class="punctuation">$1</span>')
      .replace(/(:)/g, '<span class="punctuation">$1</span>');
  }

  private highlightSQL(code: string): string {
    return code
      .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|UNION|DISTINCT|COUNT|SUM|AVG|MIN|MAX|AS|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL)\b/gi, '<span class="keyword">$1</span>')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
      .replace(/--.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
  }

  private highlightBash(code: string): string {
    return code
      .replace(/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|printf|read|cd|ls|mkdir|rm|cp|mv|grep|sed|awk|chmod|chown|sudo|apt|yum|pip|npm|git)\b/g, '<span class="keyword">$1</span>')
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
      .replace(/\$\w+/g, '<span class="variable">$&</span>');
  }

  private highlightGeneric(code: string): string {
    return code
      .replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>')
      .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
      .replace(/([{}[\]();,])/g, '<span class="punctuation">$1</span>');
  }

  onSearch() {
    this.applyFilters();
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  toggleTag(tag: string) {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.snippets];

    // Search filter
    if (this.searchQuery) {
      filtered = filtered.filter(snippet => 
        snippet.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        snippet.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        snippet.code.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(snippet => 
        snippet.category.toLowerCase() === this.selectedCategory
      );
    }

    // Language filter
    const selectedLangs = Object.keys(this.selectedLanguages).filter(lang => this.selectedLanguages[lang]);
    if (selectedLangs.length > 0) {
      filtered = filtered.filter(snippet => selectedLangs.includes(snippet.language));
    }

    // Tags filter
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(snippet => 
        this.selectedTags.some(tag => snippet.tags.includes(tag))
      );
    }

    this.filteredSnippets = filtered;
  }

  getContentTitle(): string {
    if (this.selectedCategory === 'all') {
      return 'Tous les Snippets';
    }
    const category = this.categories.find(c => c.id === this.selectedCategory);
    return category ? category.name : 'Snippets';
  }

  testHighlighting() {
    const testCode = `def hello_world():
    print("Hello, World!")
    return True`;
    
    console.log('Testing highlighting...');
    const result = this.highlightPython(testCode);
    console.log('Test result:', result);
    
    // Créer un élément temporaire pour tester
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `<pre><code>${result}</code></pre>`;
    document.body.appendChild(tempDiv);
    
    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 3000);
  }

  addSnippet() {
    // Implement add snippet functionality
    console.log('Add new snippet');
  }

  editSnippet(snippet: CodeSnippet) {
    // Implement edit snippet functionality
    console.log('Edit snippet:', snippet);
  }

  deleteSnippet(id: string) {
    this.snippets = this.snippets.filter(s => s.id !== id);
    this.applyFilters();
  }

  copyCode(snippet: CodeSnippet) {
    navigator.clipboard.writeText(snippet.code).then(() => {
      // Show success message
      console.log('Code copied to clipboard');
    });
  }
}
