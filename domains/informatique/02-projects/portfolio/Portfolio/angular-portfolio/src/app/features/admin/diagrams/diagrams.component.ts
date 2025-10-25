import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import mermaid from 'mermaid';

interface Diagram {
  id: string;
  name: string;
  type: 'mermaid' | 'plantuml';
  content: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

interface DiagramTemplate {
  id: string;
  name: string;
  type: 'mermaid' | 'plantuml';
  description: string;
  template: string;
  category: string;
}

@Component({
  selector: 'app-diagrams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="diagrams-container">
      <div class="header">
        <h1>Générateur de Diagrammes</h1>
        <p>Créez des diagrammes avec Mermaid et PlantUML</p>
      </div>

      <div class="main-content">
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="diagram-list">
            <div class="list-header">
              <h3>Mes Diagrammes</h3>
              <button class="btn btn-primary" (click)="createNewDiagram()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                Nouveau
              </button>
            </div>
            
            <div class="diagram-items">
              <div class="diagram-item" 
                   *ngFor="let diagram of diagrams"
                   [class.active]="selectedDiagram?.id === diagram.id"
                   (click)="selectDiagram(diagram)">
                <div class="diagram-info">
                  <h4>{{ diagram.name }}</h4>
                  <p>{{ diagram.type.toUpperCase() }}</p>
                </div>
                <div class="diagram-actions">
                  <button class="btn-icon" (click)="duplicateDiagram(diagram)" title="Dupliquer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                    </svg>
                  </button>
                  <button class="btn-icon delete" (click)="deleteDiagram(diagram.id)" title="Supprimer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="templates-section">
            <h3>Templates</h3>
            <div class="template-list">
              <div class="template-item" 
                   *ngFor="let template of templates"
                   (click)="useTemplate(template)">
                <div class="template-info">
                  <h4>{{ template.name }}</h4>
                  <p>{{ template.description }}</p>
                </div>
                <span class="template-type">{{ template.type.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Editor -->
        <div class="editor">
          <div class="editor-header" *ngIf="selectedDiagram">
            <div class="diagram-info">
              <h2>{{ selectedDiagram.name }}</h2>
              <span class="diagram-type">{{ selectedDiagram.type.toUpperCase() }}</span>
            </div>
            <div class="editor-actions">
              <button class="btn btn-secondary" (click)="toggleMode()">
                {{ isVisualMode ? 'Mode Code' : 'Mode Visuel' }}
              </button>
              <button class="btn btn-primary" (click)="exportDiagram()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Exporter
              </button>
            </div>
          </div>

          <div class="editor-content" *ngIf="selectedDiagram">
            <!-- Visual Mode -->
            <div class="visual-mode" *ngIf="isVisualMode">
              <div class="diagram-preview">
                <div class="preview-header">
                  <h3>Aperçu</h3>
                  <button class="btn btn-secondary" (click)="refreshPreview()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                    </svg>
                    Actualiser
                  </button>
                </div>
                <div class="preview-content">
                  <div class="mermaid-preview" *ngIf="selectedDiagram.type === 'mermaid'">
                    <div #mermaidContainer class="mermaid-diagram"></div>
                  </div>
                  <div class="plantuml-preview" *ngIf="selectedDiagram.type === 'plantuml'">
                    <div class="plantuml-placeholder">
                      <p>PlantUML Preview</p>
                      <p class="code-preview">{{ selectedDiagram.content }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Code Mode -->
            <div class="code-mode" *ngIf="!isVisualMode">
              <div class="code-editor">
                <div class="editor-toolbar">
                  <div class="toolbar-group">
                    <button class="btn-icon" (click)="formatCode()" title="Formater">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                      </svg>
                    </button>
                    <button class="btn-icon" (click)="validateCode()" title="Valider">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea 
                  class="code-textarea"
                  [(ngModel)]="selectedDiagram.content"
                  (blur)="saveDiagram()"
                  placeholder="Entrez votre code de diagramme...">
                </textarea>
              </div>
            </div>
          </div>

          <div class="empty-editor" *ngIf="!selectedDiagram">
            <div class="empty-content">
              <div class="empty-icon">📊</div>
              <h3>Sélectionnez un diagramme</h3>
              <p>Choisissez un diagramme existant ou créez-en un nouveau pour commencer à éditer.</p>
              <button class="btn btn-primary" (click)="createNewDiagram()">
                Créer un nouveau diagramme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diagrams-container {
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

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .list-header h3 {
      font-size: 16px;
      color: #f1f5f9;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
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

    .btn-secondary {
      background: #64748b;
      color: white;
    }

    .btn-secondary:hover {
      background: #475569;
    }

    .diagram-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 25px;
    }

    .diagram-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #334155;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .diagram-item:hover {
      background: #475569;
      border-color: #64748b;
    }

    .diagram-item.active {
      background: #1e3a5f;
      border: 1px solid #60a5fa;
    }

    .diagram-info h4 {
      font-size: 14px;
      color: #f1f5f9;
      margin-bottom: 4px;
    }

    .diagram-info p {
      font-size: 12px;
      color: #94a3b8;
    }

    .diagram-actions {
      display: flex;
      gap: 4px;
    }

    .btn-icon {
      background: rgba(148, 163, 184, 0.1);
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #cbd5e1;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.2);
      border-color: #60a5fa;
    }

    .btn-icon.delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
    }

    .templates-section h3 {
      font-size: 16px;
      color: #f1f5f9;
      margin-bottom: 15px;
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .template-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #334155;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .template-item:hover {
      background: #475569;
      border-color: #64748b;
    }

    .template-info h4 {
      font-size: 13px;
      color: #f1f5f9;
      margin-bottom: 2px;
    }

    .template-info p {
      font-size: 11px;
      color: #94a3b8;
    }

    .template-type {
      font-size: 10px;
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .editor {
      background: #1e293b;
      border-radius: 10px;
      padding: 20px;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .diagram-info h2 {
      font-size: 20px;
      color: #f1f5f9;
      margin-bottom: 4px;
    }

    .diagram-type {
      font-size: 12px;
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .editor-actions {
      display: flex;
      gap: 10px;
    }

    .visual-mode {
      height: 600px;
    }

    .diagram-preview {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .preview-header h3 {
      font-size: 16px;
      color: #f1f5f9;
    }

    .preview-content {
      flex: 1;
      background: #1a1a1a;
      border-radius: 6px;
      padding: 20px;
      overflow: auto;
      color: #f1f5f9;
      border: 1px solid #374151;
    }

    .mermaid-preview {
      height: 100%;
    }

    .mermaid-diagram {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }

    .mermaid-preview pre {
      background: transparent !important;
      color: #f1f5f9 !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .mermaid-preview svg {
      background: transparent !important;
      max-width: 100%;
      height: auto;
    }

    .plantuml-preview {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #f1f5f9;
    }

    .plantuml-placeholder {
      text-align: center;
    }

    .code-preview {
      background: #2d3748;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      margin-top: 15px;
      color: #e2e8f0;
      border: 1px solid #4a5568;
    }

    .code-mode {
      height: 600px;
    }

    .code-editor {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .toolbar-group {
      display: flex;
      gap: 8px;
    }

    .code-textarea {
      flex: 1;
      background: #0a0a0a;
      border: 2px solid rgba(148, 163, 184, 0.3);
      border-radius: 8px;
      padding: 20px;
      color: #f8fafc;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      resize: none;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .code-textarea:focus {
      outline: none;
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .empty-editor {
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-content {
      text-align: center;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .empty-content h3 {
      font-size: 20px;
      color: #f1f5f9;
      margin-bottom: 10px;
    }

    .empty-content p {
      font-size: 14px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .main-content {
        grid-template-columns: 1fr;
      }
      
      .editor-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }
    }
  `]
})
export class DiagramsComponent implements OnInit, AfterViewInit {
  @ViewChild('mermaidContainer', { static: false }) mermaidContainer!: ElementRef;

  diagrams: Diagram[] = [
    {
      id: '1',
      name: 'Architecture API',
      type: 'mermaid',
      content: `graph TD
    A[Client] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[User Service]
    B --> E[Product Service]
    C --> F[Database]
    D --> F
    E --> F`,
      description: 'Architecture de l\'API REST',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    },
    {
      id: '2',
      name: 'Flow Utilisateur',
      type: 'mermaid',
      content: `sequenceDiagram
    participant U as User
    participant A as App
    participant D as Database
    
    U->>A: Login
    A->>D: Check credentials
    D-->>A: User data
    A-->>U: Success response`,
      description: 'Flux de connexion utilisateur',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    }
  ];

  templates: DiagramTemplate[] = [
    {
      id: '1',
      name: 'Flowchart Simple',
      type: 'mermaid',
      description: 'Diagramme de flux basique',
      category: 'Flowchart',
      template: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`
    },
    {
      id: '2',
      name: 'Sequence Diagram',
      type: 'mermaid',
      description: 'Diagramme de séquence',
      category: 'Sequence',
      template: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob
    B-->>A: Hello Alice`
    },
    {
      id: '3',
      name: 'Class Diagram',
      type: 'plantuml',
      description: 'Diagramme de classes UML',
      category: 'UML',
      template: `@startuml
class User {
  +id: int
  +name: string
  +email: string
  +login()
  +logout()
}

class Admin {
  +permissions: string[]
  +manageUsers()
}

User <|-- Admin
@enduml`
    }
  ];

  selectedDiagram: Diagram | null = null;
  isVisualMode: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeMermaid();
    if (this.diagrams.length > 0) {
      this.selectDiagram(this.diagrams[0]);
    }
  }

  ngAfterViewInit() {
    // Initialiser le rendu après que la vue soit prête
    setTimeout(() => {
      if (this.selectedDiagram && this.selectedDiagram.type === 'mermaid') {
        this.renderMermaidDiagram();
      }
    }, 100);
  }

  private initializeMermaid() {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#f1f5f9',
        primaryBorderColor: '#60a5fa',
        lineColor: '#94a3b8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#334155',
        background: '#1a1a1a',
        mainBkg: '#1a1a1a',
        secondBkg: '#2d3748',
        tertiaryBkg: '#374151'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false
      }
    });
  }

  selectDiagram(diagram: Diagram) {
    this.selectedDiagram = diagram;
    // Rendre le diagramme après sélection
    setTimeout(() => {
      if (diagram.type === 'mermaid') {
        this.renderMermaidDiagram();
      }
    }, 100);
  }

  createNewDiagram() {
    const newDiagram: Diagram = {
      id: Date.now().toString(),
      name: 'Nouveau Diagramme',
      type: 'mermaid',
      content: 'graph TD\n    A[Start] --> B[End]',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    };
    this.diagrams.push(newDiagram);
    this.selectDiagram(newDiagram);
  }

  duplicateDiagram(diagram: Diagram) {
    const duplicated: Diagram = {
      ...diagram,
      id: Date.now().toString(),
      name: diagram.name + ' (Copie)',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.diagrams.push(duplicated);
    this.selectDiagram(duplicated);
  }

  deleteDiagram(id: string) {
    this.diagrams = this.diagrams.filter(d => d.id !== id);
    if (this.selectedDiagram?.id === id) {
      this.selectedDiagram = this.diagrams.length > 0 ? this.diagrams[0] : null;
    }
  }

  useTemplate(template: DiagramTemplate) {
    const newDiagram: Diagram = {
      id: Date.now().toString(),
      name: template.name,
      type: template.type,
      content: template.template,
      description: template.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true
    };
    this.diagrams.push(newDiagram);
    this.selectDiagram(newDiagram);
  }

  toggleMode() {
    this.isVisualMode = !this.isVisualMode;
  }

  refreshPreview() {
    // Implémenter le rafraîchissement de la prévisualisation
    if (this.selectedDiagram && this.selectedDiagram.type === 'mermaid') {
      this.renderMermaidDiagram();
    }
  }

  private async renderMermaidDiagram() {
    if (!this.selectedDiagram || !this.mermaidContainer) {
      return;
    }

    try {
      // Vider le conteneur
      this.mermaidContainer.nativeElement.innerHTML = '';
      
      // Générer un ID unique pour ce diagramme
      const diagramId = `mermaid-${this.selectedDiagram.id}-${Date.now()}`;
      
      // Rendre le diagramme
      const { svg } = await mermaid.render(diagramId, this.selectedDiagram.content);
      
      // Insérer le SVG dans le conteneur
      this.mermaidContainer.nativeElement.innerHTML = svg;
      
      // Appliquer des styles supplémentaires si nécessaire
      const svgElement = this.mermaidContainer.nativeElement.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.background = 'transparent';
      }
    } catch (error) {
      console.error('Erreur lors du rendu du diagramme Mermaid:', error);
      this.mermaidContainer.nativeElement.innerHTML = `
        <div style="color: #ef4444; padding: 20px; text-align: center;">
          <h4>Erreur de rendu</h4>
          <p>Le diagramme ne peut pas être affiché. Vérifiez la syntaxe.</p>
          <pre style="background: #2d3748; padding: 10px; border-radius: 4px; margin-top: 10px; color: #e2e8f0;">${this.selectedDiagram.content}</pre>
        </div>
      `;
    }
  }

  formatCode() {
    if (this.selectedDiagram) {
      // Implement code formatting
      console.log('Formatting code');
    }
  }

  validateCode() {
    if (this.selectedDiagram) {
      // Implement code validation
      console.log('Validating code');
    }
  }

  saveDiagram() {
    if (this.selectedDiagram) {
      this.selectedDiagram.updatedAt = new Date();
      // Here you would save to backend
      console.log('Saving diagram:', this.selectedDiagram);
      
      // Rafraîchir la prévisualisation après sauvegarde
      if (this.selectedDiagram.type === 'mermaid') {
        setTimeout(() => {
          this.renderMermaidDiagram();
        }, 100);
      }
    }
  }

  exportDiagram() {
    if (!this.selectedDiagram) return;

    const content = this.selectedDiagram.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.selectedDiagram.name}.${this.selectedDiagram.type}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
