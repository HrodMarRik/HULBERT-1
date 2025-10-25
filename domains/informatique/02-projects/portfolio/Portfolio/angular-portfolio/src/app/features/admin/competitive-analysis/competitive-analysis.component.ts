import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { COMPETITIVE_ANALYSIS_QUESTIONS, QuestionnaireStep, Question } from './questions.data';
import { AnalysisStorageService, CompetitiveAnalysisReport, AnalysisResponse } from './analysis-storage.service';
import { RecommendationEngineService, CompetitiveInsights } from './recommendation-engine.service';

@Component({
  selector: 'app-competitive-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="competitive-analysis-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <button class="btn-back" (click)="goBack()" *ngIf="currentView !== 'list'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              Retour
            </button>
            <div>
        <h1>Analyse Concurrentielle</h1>
              <p *ngIf="currentView === 'list'">Gérez vos analyses et créez de nouveaux rapports</p>
              <p *ngIf="currentView === 'wizard'">{{ currentAnalysis?.title || 'Nouvelle Analyse' }}</p>
              <p *ngIf="currentView === 'report'">Rapport d'analyse concurrentielle</p>
            </div>
      </div>
          <div class="header-actions" *ngIf="currentView === 'list'">
            <button class="btn btn-primary" (click)="startNewAnalysis()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Nouvelle Analyse
            </button>
          </div>
        </div>
          </div>

      <!-- Name Modal -->
      <div class="modal-overlay" *ngIf="showNameModal" (click)="cancelNewAnalysis()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Nouvelle Analyse Concurrentielle</h3>
            <button class="modal-close" (click)="cancelNewAnalysis()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="analysisTitle">Nom de l'analyse</label>
              <input 
                type="text" 
                id="analysisTitle"
                [(ngModel)]="newAnalysisTitle" 
                placeholder="Ex: Analyse concurrentielle Q4 2025"
                class="form-input"
                (keyup.enter)="confirmNewAnalysis()"
                (keyup.escape)="cancelNewAnalysis()"
                #titleInput
              >
              <small class="form-help">Choisissez un nom descriptif pour votre analyse</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cancelNewAnalysis()">Annuler</button>
            <button class="btn btn-primary" (click)="confirmNewAnalysis()" [disabled]="!newAnalysisTitle.trim()">
              Créer l'analyse
            </button>
          </div>
        </div>
          </div>

      <!-- List View -->
      <div class="list-view" *ngIf="currentView === 'list'">
        <div class="analyses-grid" *ngIf="analyses.length > 0">
          <div class="analysis-card" *ngFor="let analysis of analyses">
            <div class="analysis-header">
              <div class="analysis-status" [class.completed]="analysis.status === 'completed'">
                {{ analysis.status === 'completed' ? 'Complétée' : 'Brouillon' }}
              </div>
              <div class="analysis-date">
                {{ analysis.updatedAt | date:'dd/MM/yyyy' }}
              </div>
            </div>
            <h3>{{ analysis.title }}</h3>
            <div class="analysis-meta" *ngIf="analysis.metadata">
              <span *ngIf="analysis.metadata.sector">{{ analysis.metadata.sector }}</span>
              <span *ngIf="analysis.metadata.mainCompetitor">vs {{ analysis.metadata.mainCompetitor }}</span>
            </div>
            <div class="analysis-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getProgress(analysis)"></div>
              </div>
              <span class="progress-text">{{ getProgress(analysis) }}% complété</span>
            </div>
            <div class="analysis-actions">
              <button class="btn btn-secondary" (click)="continueAnalysis(analysis)">
                {{ analysis.status === 'completed' ? 'Voir' : 'Continuer' }}
              </button>
              <button class="btn-icon" (click)="duplicateAnalysis(analysis)" title="Dupliquer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                </svg>
              </button>
              <button class="btn-icon" (click)="exportAnalysis(analysis)" title="Exporter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </button>
              <button class="btn-icon delete" (click)="deleteAnalysis(analysis.id)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                  </button>
                </div>
              </div>
                </div>
        
        <div class="empty-state" *ngIf="analyses.length === 0">
          <div class="empty-icon">📊</div>
          <h3>Aucune analyse</h3>
          <p>Créez votre première analyse concurrentielle pour commencer</p>
          <button class="btn btn-primary" (click)="startNewAnalysis()">
            Créer une analyse
          </button>
                </div>
              </div>

      <!-- Wizard View -->
      <div class="wizard-view" *ngIf="currentView === 'wizard'">
        <!-- Progress Bar -->
        <div class="wizard-progress">
          <div class="progress-steps">
            <div class="progress-step" 
                 *ngFor="let step of steps; let i = index"
                 [class.active]="i === currentStepIndex"
                 [class.completed]="i < currentStepIndex"
                 (click)="goToStep(i)">
              <div class="step-number">
                <span *ngIf="i < currentStepIndex">✓</span>
                <span *ngIf="i >= currentStepIndex">{{ i + 1 }}</span>
              </div>
              <div class="step-info">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-icon">{{ step.icon }}</div>
                </div>
              </div>
            </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" [style.width.%]="(currentStepIndex / steps.length) * 100"></div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="wizard-content" *ngIf="currentStep">
          <div class="step-header">
            <h2>{{ currentStep.title }}</h2>
            <p>{{ currentStep.description }}</p>
          </div>

          <div class="questions-container">
              <div class="question-item" *ngFor="let question of currentStep.questions">
                <label class="question-label">
                  {{ question.text }}
                  <span class="required" *ngIf="question.required">*</span>
                  <div class="tooltip" *ngIf="question.helpText">
                    <svg class="tooltip-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M11,12H13V6H11V12Z"/>
                    </svg>
                    <div class="tooltip-content">
                      <div class="tooltip-text">{{ question.helpText }}</div>
                      <div class="tooltip-arrow"></div>
                    </div>
                  </div>
                </label>
                <p class="question-help" *ngIf="question.helpText && false">{{ question.helpText }}</p>

              <!-- Text Input -->
              <input *ngIf="question.type === 'text'" 
                     type="text"
                     class="form-input"
                     [placeholder]="question.placeholder || ''"
                     [(ngModel)]="responses[question.id]"
                     (ngModelChange)="onResponseChange()">

              <!-- Number Input -->
              <input *ngIf="question.type === 'number'" 
                     type="number"
                     class="form-input"
                     [placeholder]="question.placeholder || ''"
                     [min]="question.min ?? null"
                     [max]="question.max ?? null"
                     [(ngModel)]="responses[question.id]"
                     (ngModelChange)="onResponseChange()">

              <!-- Currency Input -->
              <div *ngIf="question.type === 'currency'" class="currency-input">
                <input type="number"
                       class="form-input"
                       [placeholder]="question.placeholder || '0'"
                       [(ngModel)]="responses[question.id]"
                       (ngModelChange)="onResponseChange()">
                <span class="currency-symbol">€</span>
              </div>

              <!-- Textarea -->
              <textarea *ngIf="question.type === 'textarea'"
                        class="form-textarea"
                        [placeholder]="question.placeholder || ''"
                        [(ngModel)]="responses[question.id]"
                        (ngModelChange)="onResponseChange()"
                        rows="4"></textarea>

              <!-- Select -->
              <select *ngIf="question.type === 'select'"
                      class="form-select"
                      [(ngModel)]="responses[question.id]"
                      (ngModelChange)="onResponseChange()">
                <option value="">Sélectionnez une option</option>
                <option *ngFor="let option of question.options" [value]="option">
                  {{ option }}
                </option>
              </select>

              <!-- Multi-select -->
              <div *ngIf="question.type === 'multiselect'" class="multiselect-options">
                <label *ngFor="let option of question.options" class="checkbox-label">
                  <input type="checkbox"
                         [checked]="isOptionSelected(question.id, option)"
                         (change)="toggleMultiSelect(question.id, option)">
                  <span>{{ option }}</span>
                </label>
              </div>

              <!-- Scale -->
              <div *ngIf="question.type === 'scale'" class="scale-input">
                <input type="range"
                       class="form-range"
                       [min]="question.min || 1"
                       [max]="question.max || 10"
                       [(ngModel)]="responses[question.id]"
                       (ngModelChange)="onResponseChange()">
                <div class="scale-labels">
                  <span>{{ question.min || 1 }}</span>
                  <span class="scale-value">{{ responses[question.id] || (question.min || 1) }}</span>
                  <span>{{ question.max || 10 }}</span>
                </div>
                </div>
              </div>
            </div>

          <!-- Navigation Buttons -->
          <div class="wizard-navigation">
            <button class="btn btn-secondary" 
                    (click)="previousStep()" 
                    [disabled]="currentStepIndex === 0">
              Précédent
            </button>
            <div class="nav-center">
              <button class="btn btn-outline" (click)="saveAndExit()">
                Sauvegarder et quitter
              </button>
              <span class="auto-save-indicator" *ngIf="autoSaveEnabled">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3M19,19H5V5H16.17L19,7.83V19M12,12A3,3 0 0,0 9,15A3,3 0 0,0 12,18A3,3 0 0,0 15,15A3,3 0 0,0 12,12Z"/>
                    </svg>
                Sauvegarde auto
              </span>
            </div>
            <button class="btn btn-primary" 
                    (click)="nextStep()"
                    [disabled]="!canProceed()">
              {{ isLastStep() ? 'Générer le rapport' : 'Suivant' }}
                  </button>
                </div>
              </div>
            </div>

      <!-- Report View -->
      <div class="report-view" *ngIf="currentView === 'report' && insights">
        <div class="report-header">
          <h2>Rapport d'Analyse Concurrentielle</h2>
          <div class="report-actions">
            <button class="btn btn-secondary" (click)="editAnalysis()">
              Modifier l'analyse
            </button>
            <button class="btn btn-primary" (click)="downloadPDF()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
              Télécharger PDF
                  </button>
                </div>
        </div>

        <!-- Scores Overview -->
        <div class="scores-section">
          <h3>Scores Globaux</h3>
          <div class="scores-grid">
            <div class="score-card">
              <div class="score-label">Innovation</div>
              <div class="score-value">{{ insights.scores.innovation }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.innovation * 10"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-label">Prix</div>
              <div class="score-value">{{ insights.scores.pricing }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.pricing * 10"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-label">Qualité</div>
              <div class="score-value">{{ insights.scores.quality }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.quality * 10"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-label">Marketing</div>
              <div class="score-value">{{ insights.scores.marketing }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.marketing * 10"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-label">Finance</div>
              <div class="score-value">{{ insights.scores.financial }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.financial * 10"></div>
                </div>
              </div>
            <div class="score-card">
              <div class="score-label">Opérationnel</div>
              <div class="score-value">{{ insights.scores.operational }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.operational * 10"></div>
            </div>
                </div>
            <div class="score-card overall">
              <div class="score-label">Score Global</div>
              <div class="score-value">{{ insights.scores.overall }}/10</div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="insights.scores.overall * 10"></div>
                </div>
              </div>
            </div>
        </div>

        <!-- Market Position -->
        <div class="insights-section">
          <h3>Position sur le Marché</h3>
          <div class="insight-card">
            <p>{{ insights.marketPosition }}</p>
          </div>
        </div>

        <!-- Competitive Advantage -->
        <div class="insights-section">
          <h3>Avantage Concurrentiel</h3>
          <div class="insight-card">
            <p>{{ insights.competitiveAdvantage }}</p>
          </div>
        </div>

        <!-- Threats & Opportunities -->
        <div class="swot-grid">
          <div class="swot-section threats">
            <h3>Menaces Principales</h3>
            <ul>
              <li *ngFor="let threat of insights.mainThreats">{{ threat }}</li>
            </ul>
          </div>
          <div class="swot-section opportunities">
            <h3>Opportunités Clés</h3>
            <ul>
              <li *ngFor="let opportunity of insights.keyOpportunities">{{ opportunity }}</li>
            </ul>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendations-section">
          <h3>Recommandations Stratégiques</h3>
          <div class="recommendations-grid">
            <div class="recommendation-card" 
                 *ngFor="let rec of insights.strategicRecommendations"
                 [class.priority-high]="rec.priority === 'high'"
                 [class.priority-medium]="rec.priority === 'medium'"
                 [class.priority-low]="rec.priority === 'low'">
              <div class="rec-header">
                <div class="rec-category">{{ rec.category }}</div>
                <div class="rec-priority">{{ rec.priority === 'high' ? 'Priorité Haute' : rec.priority === 'medium' ? 'Priorité Moyenne' : 'Priorité Basse' }}</div>
              </div>
              <h4>{{ rec.title }}</h4>
              <p>{{ rec.description }}</p>
              <div class="rec-meta">
                <span><strong>Impact:</strong> {{ rec.impact }}</span>
                <span><strong>Effort:</strong> {{ rec.effort }}</span>
                <span><strong>Délai:</strong> {{ rec.timeframe }}</span>
                <span><strong>Coût:</strong> {{ rec.cost }}</span>
                <span><strong>Risque:</strong> {{ rec.riskLevel === 'high' ? 'Élevé' : rec.riskLevel === 'medium' ? 'Moyen' : 'Faible' }}</span>
              </div>
              <div class="rec-actions">
                <strong>Actions recommandées:</strong>
                <ul>
                  <li *ngFor="let action of rec.actions">{{ action }}</li>
                </ul>
              </div>
              <div class="rec-metrics" *ngIf="rec.successMetrics">
                <strong>Métriques de succès:</strong>
                <ul>
                  <li *ngFor="let metric of rec.successMetrics">{{ metric }}</li>
                </ul>
              </div>
              <div class="rec-dependencies" *ngIf="rec.dependencies">
                <strong>Dépendances:</strong>
                <ul>
                  <li *ngFor="let dep of rec.dependencies">{{ dep }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './competitive-analysis.component.scss'
})
export class CompetitiveAnalysisComponent implements OnInit, OnDestroy, AfterViewInit {
  currentView: 'list' | 'wizard' | 'report' = 'list';
  analyses: CompetitiveAnalysisReport[] = [];
  currentAnalysis: CompetitiveAnalysisReport | null = null;
  
  steps: QuestionnaireStep[] = COMPETITIVE_ANALYSIS_QUESTIONS;
  currentStepIndex: number = 0;
  currentStep: QuestionnaireStep | null = null;
  
  responses: { [key: string]: any } = {};
  autoSaveEnabled: boolean = true;
  autoSaveInterval: any;
  showNameModal = false;
  newAnalysisTitle = '';
  
  @ViewChild('titleInput', { static: false }) titleInput!: ElementRef<HTMLInputElement>;
  
  insights: CompetitiveInsights | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: AnalysisStorageService,
    private recommendationEngine: RecommendationEngineService
  ) {}

  ngOnInit() {
    this.loadAnalyses();
    this.checkAutoSave();
  }

  ngAfterViewInit() {
    // Auto-focus will be handled when modal opens
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  loadAnalyses() {
    this.storageService.getAll().subscribe(
      analyses => {
        this.analyses = analyses.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },
      error => console.error('Error loading analyses:', error)
    );
  }

  checkAutoSave() {
    const autoSaved = this.storageService.getAutoSaved();
    if (autoSaved) {
      if (confirm('Une analyse en cours a été trouvée. Voulez-vous la reprendre ?')) {
        this.continueAnalysis(autoSaved);
      } else {
        this.storageService.clearAutoSave();
      }
    }
  }

  startNewAnalysis() {
    this.showNameModal = true;
    this.newAnalysisTitle = `Analyse ${new Date().toLocaleDateString()}`;
    
    // Auto-focus on input after modal opens
    setTimeout(() => {
      if (this.titleInput) {
        this.titleInput.nativeElement.focus();
        this.titleInput.nativeElement.select();
      }
    }, 100);
  }

  confirmNewAnalysis() {
    if (this.newAnalysisTitle && this.newAnalysisTitle.trim()) {
      this.currentAnalysis = {
        id: `local-${Date.now()}`,
        title: this.newAnalysisTitle.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        currentStep: 0,
        responses: []
      };

      this.responses = {};
      this.currentStepIndex = 0;
      this.currentStep = this.steps[0];
      this.currentView = 'wizard';
      this.startAutoSave();
      this.showNameModal = false;
    }
  }

  cancelNewAnalysis() {
    this.showNameModal = false;
    this.newAnalysisTitle = '';
  }

  continueAnalysis(analysis: CompetitiveAnalysisReport) {
    this.currentAnalysis = analysis;
    this.loadResponses(analysis.responses);
    this.currentStepIndex = analysis.currentStep || 0;
    this.currentStep = this.steps[this.currentStepIndex];
    
    if (analysis.status === 'completed') {
      this.generateReport();
    } else {
      this.currentView = 'wizard';
      this.startAutoSave();
    }
  }

  loadResponses(responses: AnalysisResponse[]) {
    this.responses = {};
    responses.forEach(r => {
      this.responses[r.questionId] = r.answer;
    });
  }

  goToStep(index: number) {
    if (index < 0 || index >= this.steps.length) return;
    this.currentStepIndex = index;
    this.currentStep = this.steps[index];
  }

  previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.currentStep = this.steps[this.currentStepIndex];
    }
  }

  nextStep() {
    if (!this.canProceed()) return;

    if (this.isLastStep()) {
      this.completeAnalysis();
    } else {
      this.currentStepIndex++;
      this.currentStep = this.steps[this.currentStepIndex];
      this.saveProgress();
    }
  }

  canProceed(): boolean {
    if (!this.currentStep) return false;
    
    const requiredQuestions = this.currentStep.questions.filter(q => q.required);
    return requiredQuestions.every(q => {
      const answer = this.responses[q.id];
      if (answer === undefined || answer === null || answer === '') return false;
      if (Array.isArray(answer) && answer.length === 0) return false;
      return true;
    });
  }

  isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  onResponseChange() {
    // Trigger auto-save
  }

  toggleMultiSelect(questionId: string, option: string) {
    if (!this.responses[questionId]) {
      this.responses[questionId] = [];
    }
    
    const index = this.responses[questionId].indexOf(option);
    if (index > -1) {
      this.responses[questionId].splice(index, 1);
    } else {
      this.responses[questionId].push(option);
    }
    
    this.onResponseChange();
  }

  isOptionSelected(questionId: string, option: string): boolean {
    return this.responses[questionId]?.includes(option) || false;
  }

  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, 30000); // Every 30 seconds
  }

  autoSave() {
    if (!this.currentAnalysis) return;
    
    this.currentAnalysis.updatedAt = new Date();
    this.currentAnalysis.currentStep = this.currentStepIndex;
    this.currentAnalysis.responses = this.convertResponsesToArray();
    this.currentAnalysis.metadata = this.extractMetadata();
    
    this.storageService.autoSave(this.currentAnalysis);
  }

  saveProgress() {
    if (!this.currentAnalysis) return;
    
    this.currentAnalysis.updatedAt = new Date();
    this.currentAnalysis.currentStep = this.currentStepIndex;
    this.currentAnalysis.responses = this.convertResponsesToArray();
    this.currentAnalysis.metadata = this.extractMetadata();
    
    this.storageService.save(this.currentAnalysis).subscribe(
      saved => {
        this.currentAnalysis = saved;
        console.log('Progress saved');
      },
      error => console.error('Error saving progress:', error)
    );
  }

  saveAndExit() {
    this.saveProgress();
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.storageService.clearAutoSave();
    this.currentView = 'list';
    this.loadAnalyses();
  }

  completeAnalysis() {
    if (!this.currentAnalysis) return;
    
    this.currentAnalysis.status = 'completed';
    this.currentAnalysis.updatedAt = new Date();
    this.currentAnalysis.responses = this.convertResponsesToArray();
    this.currentAnalysis.metadata = this.extractMetadata();
    
    this.storageService.save(this.currentAnalysis).subscribe(
      saved => {
        this.currentAnalysis = saved;
        if (this.autoSaveInterval) {
          clearInterval(this.autoSaveInterval);
        }
        this.storageService.clearAutoSave();
        this.generateReport();
      },
      error => console.error('Error completing analysis:', error)
    );
  }

  generateReport() {
    if (!this.currentAnalysis) return;
    
    this.insights = this.recommendationEngine.generateInsights(this.currentAnalysis.responses);
    this.currentView = 'report';
  }

  editAnalysis() {
    if (!this.currentAnalysis) return;
    this.currentAnalysis.status = 'draft';
    this.currentStepIndex = this.currentAnalysis.currentStep || 0;
    this.currentStep = this.steps[this.currentStepIndex];
    this.currentView = 'wizard';
    this.startAutoSave();
  }

  convertResponsesToArray(): AnalysisResponse[] {
    return Object.keys(this.responses).map(questionId => ({
      questionId,
      answer: this.responses[questionId],
      timestamp: new Date()
    }));
  }

  extractMetadata(): any {
    return {
      sector: this.responses['q1_1'] || '',
      marketSize: this.responses['q1_2'] || 0,
      mainCompetitor: this.responses['q2_3'] || ''
    };
  }

  getProgress(analysis: CompetitiveAnalysisReport): number {
    if (analysis.status === 'completed') return 100;
    const totalQuestions = this.steps.reduce((sum, step) => sum + step.questions.length, 0);
    const answeredQuestions = analysis.responses.length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  }

  duplicateAnalysis(analysis: CompetitiveAnalysisReport) {
    const duplicated = this.storageService.duplicate(analysis);
    this.loadAnalyses();
  }

  exportAnalysis(analysis: CompetitiveAnalysisReport) {
    this.storageService.exportAnalysis(analysis);
  }

  deleteAnalysis(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) return;
    
    this.storageService.delete(id).subscribe(
      () => {
        this.loadAnalyses();
      },
      error => console.error('Error deleting analysis:', error)
    );
  }

  downloadPDF() {
    alert('Génération du PDF en cours... (fonctionnalité à implémenter)');
  }

  goBack() {
    if (this.currentView === 'wizard' && this.currentAnalysis?.status !== 'completed') {
      if (confirm('Voulez-vous sauvegarder avant de quitter ?')) {
        this.saveAndExit();
      } else {
        if (this.autoSaveInterval) {
          clearInterval(this.autoSaveInterval);
        }
        this.currentView = 'list';
      }
    } else {
      this.currentView = 'list';
    }
  }
}
