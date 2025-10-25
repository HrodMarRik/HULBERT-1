import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface BusinessPlanSection {
  id: string;
  title: string;
  content: string;
  aiGenerated: boolean;
  lastModified: Date;
}

interface BusinessPlanTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

@Component({
  selector: 'app-business-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="business-plan-container">
      <div class="header">
        <h1>Business Plan Generator</h1>
        <p>Créez des business plans professionnels avec l'IA</p>
      </div>

      <div class="main-content">
        <!-- Templates Section -->
        <div class="templates-section">
          <h2>Templates Disponibles</h2>
          <div class="templates-grid">
            <div class="template-card" 
                 *ngFor="let template of templates" 
                 (click)="selectTemplate(template)"
                 [class.selected]="selectedTemplate?.id === template.id">
              <h3>{{ template.name }}</h3>
              <p>{{ template.description }}</p>
              <div class="template-sections">
                <span class="section-count">{{ template.sections.length }} sections</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Editor Section -->
        <div class="editor-section" *ngIf="selectedTemplate">
          <div class="editor-header">
            <h2>{{ selectedTemplate.name }}</h2>
            <div class="editor-actions">
              <button class="btn btn-primary" (click)="generateWithAI()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
                Générer avec IA
              </button>
              <button class="btn btn-secondary" (click)="exportPlan()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Exporter
              </button>
            </div>
          </div>

          <div class="sections-container">
            <div class="section-item" *ngFor="let section of businessPlanSections">
              <div class="section-header">
                <h3>{{ section.title }}</h3>
                <div class="section-actions">
                  <button class="btn-icon" (click)="regenerateSection(section.id)" title="Régénérer avec IA">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12H4A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z"/>
                    </svg>
                  </button>
                  <span class="ai-badge" *ngIf="section.aiGenerated">IA</span>
                </div>
              </div>
              <textarea 
                class="section-content"
                [(ngModel)]="section.content"
                (blur)="saveSection(section)"
                placeholder="Contenu de la section...">
              </textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .business-plan-container {
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
      grid-template-columns: 1fr 2fr;
      gap: 30px;
    }

    .templates-section h2 {
      font-size: 20px;
      color: #f1f5f9;
      margin-bottom: 20px;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .template-card {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .template-card:hover {
      border-color: #60a5fa;
      transform: translateY(-2px);
    }

    .template-card.selected {
      border-color: #60a5fa;
      background: #1e3a5f;
    }

    .template-card h3 {
      font-size: 16px;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .template-card p {
      font-size: 14px;
      color: #cbd5e1;
      margin-bottom: 12px;
    }

    .template-sections {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-count {
      font-size: 12px;
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
    }

    .editor-section {
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

    .editor-header h2 {
      font-size: 20px;
      color: #f1f5f9;
    }

    .editor-actions {
      display: flex;
      gap: 10px;
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

    .btn-secondary {
      background: #64748b;
      color: white;
    }

    .btn-secondary:hover {
      background: #475569;
    }

    .sections-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-item {
      background: #334155;
      border-radius: 8px;
      padding: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .section-header h3 {
      font-size: 16px;
      color: #f1f5f9;
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 10px;
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

    .ai-badge {
      font-size: 10px;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }

    .section-content {
      width: 100%;
      min-height: 120px;
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 6px;
      padding: 12px;
      color: #f1f5f9;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
    }

    .section-content:focus {
      outline: none;
      border-color: #60a5fa;
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
export class BusinessPlanComponent implements OnInit {
  templates: BusinessPlanTemplate[] = [
    {
      id: 'startup',
      name: 'Startup Tech',
      description: 'Business plan pour une startup technologique',
      sections: ['Executive Summary', 'Market Analysis', 'Product Description', 'Marketing Strategy', 'Financial Projections']
    },
    {
      id: 'saas',
      name: 'SaaS Business',
      description: 'Plan d\'affaires pour une entreprise SaaS',
      sections: ['Executive Summary', 'Problem & Solution', 'Market Size', 'Business Model', 'Go-to-Market', 'Financial Projections']
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      description: 'Business plan pour un site e-commerce',
      sections: ['Executive Summary', 'Market Research', 'Product Catalog', 'Marketing Plan', 'Operations', 'Financial Plan']
    }
  ];

  selectedTemplate: BusinessPlanTemplate | null = null;
  businessPlanSections: BusinessPlanSection[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Initialize with first template
    if (this.templates.length > 0) {
      this.selectTemplate(this.templates[0]);
    }
  }

  selectTemplate(template: BusinessPlanTemplate) {
    this.selectedTemplate = template;
    this.businessPlanSections = template.sections.map(section => ({
      id: section.toLowerCase().replace(/\s+/g, '-'),
      title: section,
      content: '',
      aiGenerated: false,
      lastModified: new Date()
    }));
  }

  generateWithAI() {
    if (!this.selectedTemplate) return;

    this.businessPlanSections.forEach(section => {
      section.content = this.generateAIContent(section.title);
      section.aiGenerated = true;
      section.lastModified = new Date();
    });
  }

  regenerateSection(sectionId: string) {
    const section = this.businessPlanSections.find(s => s.id === sectionId);
    if (section) {
      section.content = this.generateAIContent(section.title);
      section.aiGenerated = true;
      section.lastModified = new Date();
    }
  }

  saveSection(section: BusinessPlanSection) {
    section.lastModified = new Date();
    // Here you would save to backend
    console.log('Saving section:', section);
  }

  exportPlan() {
    if (!this.selectedTemplate) return;

    const planContent = this.businessPlanSections
      .map(section => `# ${section.title}\n\n${section.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([planContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.selectedTemplate.name}-business-plan.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private generateAIContent(sectionTitle: string): string {
    // Simulated AI content generation
    const templates: { [key: string]: string } = {
      'executive-summary': `Notre entreprise propose une solution innovante qui répond aux besoins du marché moderne. Avec une équipe expérimentée et une vision claire, nous visons à capturer une part significative du marché et à générer des revenus croissants.`,
      'market-analysis': `Le marché cible représente une opportunité de croissance importante. Les tendances actuelles montrent une demande croissante pour notre type de solution. La concurrence existe mais notre approche différenciée nous positionne favorablement.`,
      'product-description': `Notre produit combine fonctionnalité et simplicité d'utilisation. Il offre des avantages clairs par rapport aux solutions existantes et répond directement aux besoins identifiés de nos clients potentiels.`,
      'marketing-strategy': `Notre stratégie marketing s'appuie sur une approche multi-canal incluant le digital marketing, les partenariats stratégiques et le marketing de contenu. Nous visons à établir une présence forte dans notre secteur.`,
      'financial-projections': `Nos projections financières montrent une croissance soutenue sur les 3 prochaines années. Nous prévoyons d'atteindre la rentabilité dès la deuxième année et de générer des revenus récurrents importants.`
    };

    return templates[sectionTitle.toLowerCase().replace(/\s+/g, '-')] || 
           `Cette section couvre les aspects importants de ${sectionTitle}. Le contenu détaillé sera développé en fonction des spécificités de votre projet et des données de marché disponibles.`;
  }
}
