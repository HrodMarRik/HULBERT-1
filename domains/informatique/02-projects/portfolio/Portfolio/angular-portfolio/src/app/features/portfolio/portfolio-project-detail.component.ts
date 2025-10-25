import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PortfolioService, PortfolioProject } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="portfolio-project-detail" *ngIf="project">
      <!-- Hero Section -->
      <section class="project-hero">
        <div class="container">
          <div class="hero-content">
            <div class="project-breadcrumb">
              <a routerLink="/portfolio/projects">← Retour aux projets</a>
            </div>
            <div class="project-header">
              <div class="project-info">
                <div class="project-category">{{ project.category }}</div>
                <h1 class="project-title">{{ project.title }}</h1>
                <p class="project-subtitle">{{ project.short_description }}</p>
                <div class="project-meta">
                  <div class="meta-item">
                    <span class="meta-label">Date de création :</span>
                    <span class="meta-value">{{ formatDate(project.created_at) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Statut :</span>
                    <span class="meta-value" [class.published]="project.published">
                      {{ project.published ? 'Publié' : 'Brouillon' }}
                    </span>
                  </div>
                  <div class="meta-item" *ngIf="project.featured">
                    <span class="meta-label">⭐</span>
                    <span class="meta-value">Projet en vedette</span>
                  </div>
                </div>
                <div class="project-actions">
                  <a *ngIf="project.url" [href]="project.url" target="_blank" class="btn btn-primary">
                    <span class="btn-icon">🌐</span>
                    Voir le site web
                  </a>
                  <a *ngIf="project.github_url" [href]="project.github_url" target="_blank" class="btn btn-secondary">
                    <span class="btn-icon">📁</span>
                    Code source
                  </a>
                </div>
              </div>
              <div class="project-image" *ngIf="project.images && project.images.length > 0">
                <img [src]="project.images[0]" [alt]="project.title">
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Project Content -->
      <section class="project-content">
        <div class="container">
          <div class="content-grid">
            <div class="main-content">
              <!-- Description -->
              <div class="content-section">
                <h2>Description du projet</h2>
                <div class="description-content" [innerHTML]="formatDescription(project.description)"></div>
              </div>

              <!-- Technologies -->
              <div class="content-section" *ngIf="project.technologies && project.technologies.length > 0">
                <h2>Technologies utilisées</h2>
                <div class="technologies-grid">
                  <div class="tech-item" *ngFor="let tech of project.technologies">
                    <span class="tech-icon">{{ getTechIcon(tech) }}</span>
                    <span class="tech-name">{{ tech }}</span>
                  </div>
                </div>
              </div>

              <!-- Images Gallery -->
              <div class="content-section" *ngIf="project.images && project.images.length > 1">
                <h2>Galerie d'images</h2>
                <div class="images-gallery">
                  <div class="gallery-item" *ngFor="let image of project.images.slice(1)" 
                       (click)="openImageModal(image)">
                    <img [src]="image" [alt]="project.title">
                  </div>
                </div>
              </div>
            </div>

            <div class="sidebar">
              <!-- Project Stats -->
              <div class="stats-card">
                <h3>Statistiques du projet</h3>
                <div class="stats-list">
                  <div class="stat-item">
                    <span class="stat-label">Technologies</span>
                    <span class="stat-value">{{ project.technologies?.length || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Images</span>
                    <span class="stat-value">{{ project.images?.length || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Liens externes</span>
                    <span class="stat-value">{{ getExternalLinksCount() }}</span>
                  </div>
                </div>
              </div>

              <!-- Project Links -->
              <div class="links-card" *ngIf="project.url || project.github_url">
                <h3>Liens du projet</h3>
                <div class="links-list">
                  <a *ngIf="project.url" [href]="project.url" target="_blank" class="project-link">
                    <span class="link-icon">🌐</span>
                    <span class="link-text">Site web</span>
                    <span class="link-arrow">→</span>
                  </a>
                  <a *ngIf="project.github_url" [href]="project.github_url" target="_blank" class="project-link">
                    <span class="link-icon">📁</span>
                    <span class="link-text">GitHub</span>
                    <span class="link-arrow">→</span>
                  </a>
                </div>
              </div>

              <!-- Project Info -->
              <div class="info-card">
                <h3>Informations</h3>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Catégorie</span>
                    <span class="info-value">{{ project.category }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Créé le</span>
                    <span class="info-value">{{ formatDate(project.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mis à jour</span>
                    <span class="info-value">{{ formatDate(project.updated_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Statut</span>
                    <span class="info-value" [class.published]="project.published">
                      {{ project.published ? 'Publié' : 'Brouillon' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Related Projects -->
      <section class="related-projects" *ngIf="relatedProjects.length > 0">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Projets similaires</h2>
            <p class="section-subtitle">Découvrez d'autres projets de la même catégorie</p>
          </div>
          <div class="related-grid">
            <div class="related-card" *ngFor="let relatedProject of relatedProjects" 
                 [routerLink]="['/portfolio/projects', relatedProject.id]">
              <div class="related-image" *ngIf="relatedProject.images && relatedProject.images.length > 0">
                <img [src]="relatedProject.images[0]" [alt]="relatedProject.title">
              </div>
              <div class="related-content">
                <div class="related-category">{{ relatedProject.category }}</div>
                <h3 class="related-title">{{ relatedProject.title }}</h3>
                <p class="related-description">{{ relatedProject.short_description || relatedProject.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">Ce projet vous intéresse ?</h2>
            <p class="cta-description">
              Discutons de votre projet et créons ensemble quelque chose d'extraordinaire.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/contact" class="btn btn-primary btn-large">
                <span class="btn-icon">💬</span>
                Me contacter
              </a>
              <a routerLink="/portfolio/projects" class="btn btn-secondary btn-large">
                <span class="btn-icon">🚀</span>
                Voir tous les projets
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Loading State -->
    <div class="loading-state" *ngIf="!project">
      <div class="loading-spinner"></div>
      <p>Chargement du projet...</p>
    </div>

    <!-- Image Modal -->
    <div class="image-modal" *ngIf="selectedImage" (click)="closeImageModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closeImageModal()">×</button>
        <img [src]="selectedImage" [alt]="project?.title">
      </div>
    </div>
  `,
  styles: [`
    .portfolio-project-detail {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Hero Section */
    .project-hero {
      padding: 100px 0 60px;
    }

    .project-breadcrumb {
      margin-bottom: 30px;
    }

    .project-breadcrumb a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 500;
    }

    .project-breadcrumb a:hover {
      color: #93c5fd;
    }

    .project-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .project-category {
      color: #60a5fa;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }

    .project-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #f1f5f9;
      line-height: 1.1;
    }

    .project-subtitle {
      font-size: 1.3rem;
      color: #94a3b8;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .project-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 30px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .meta-label {
      color: #94a3b8;
      font-weight: 500;
    }

    .meta-value {
      color: #f1f5f9;
      font-weight: 600;
    }

    .meta-value.published {
      color: #10b981;
    }

    .project-actions {
      display: flex;
      gap: 16px;
    }

    .project-image {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .project-image img {
      width: 100%;
      height: 400px;
      object-fit: cover;
    }

    /* Content */
    .project-content {
      padding: 80px 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 60px;
    }

    .content-section {
      margin-bottom: 60px;
    }

    .content-section h2 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 24px;
      color: #60a5fa;
    }

    .description-content {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #cbd5e1;
    }

    .description-content p {
      margin-bottom: 16px;
    }

    /* Technologies */
    .technologies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .tech-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #1e293b;
      border-radius: 8px;
      border: 1px solid #334155;
    }

    .tech-icon {
      font-size: 1.5rem;
    }

    .tech-name {
      font-weight: 500;
      color: #f1f5f9;
    }

    /* Images Gallery */
    .images-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .gallery-item {
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .gallery-item:hover {
      transform: scale(1.05);
    }

    .gallery-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .stats-card,
    .links-card,
    .info-card {
      background: #1e293b;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .stats-card h3,
    .links-card h3,
    .info-card h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f1f5f9;
    }

    .stats-list,
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item,
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-label,
    .info-label {
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .stat-value,
    .info-value {
      color: #f1f5f9;
      font-weight: 600;
    }

    .info-value.published {
      color: #10b981;
    }

    .links-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .project-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #334155;
      border-radius: 8px;
      color: #f1f5f9;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .project-link:hover {
      background: #475569;
      transform: translateX(4px);
    }

    .link-icon {
      font-size: 1.2em;
    }

    .link-text {
      flex: 1;
      font-weight: 500;
    }

    .link-arrow {
      color: #60a5fa;
    }

    /* Related Projects */
    .related-projects {
      padding: 80px 0;
      background: #1e293b;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
    }

    .section-subtitle {
      font-size: 1.2rem;
      color: #94a3b8;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }

    .related-card {
      background: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .related-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .related-image {
      height: 200px;
      overflow: hidden;
    }

    .related-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .related-content {
      padding: 24px;
    }

    .related-category {
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .related-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .related-description {
      color: #94a3b8;
      line-height: 1.6;
    }

    /* CTA Section */
    .cta-section {
      background: linear-gradient(135deg, #1e293b, #334155);
      text-align: center;
      padding: 80px 0;
    }

    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
    }

    .cta-description {
      font-size: 1.2rem;
      color: #94a3b8;
      margin-bottom: 40px;
    }

    .cta-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: transparent;
      color: #60a5fa;
      border: 2px solid #60a5fa;
    }

    .btn-secondary:hover {
      background: #60a5fa;
      color: white;
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 1.1rem;
    }

    .btn-icon {
      font-size: 1.2em;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #94a3b8;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #334155;
      border-top: 4px solid #60a5fa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Image Modal */
    .image-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }

    .modal-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
    }

    .modal-content img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .project-header {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .project-title {
        font-size: 2rem;
      }

      .content-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .technologies-grid {
        grid-template-columns: 1fr;
      }

      .images-gallery {
        grid-template-columns: 1fr;
      }

      .related-grid {
        grid-template-columns: 1fr;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class PortfolioProjectDetailComponent implements OnInit {
  project: PortfolioProject | null = null;
  relatedProjects: PortfolioProject[] = [];
  selectedImage: string | null = null;

  constructor(
    private portfolioService: PortfolioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const projectId = +params['id'];
      if (projectId) {
        this.loadProject(projectId);
      }
    });
  }

  loadProject(projectId: number) {
    this.portfolioService.getProject(projectId).subscribe(project => {
      this.project = project;
      this.loadRelatedProjects(project.category, projectId);
    });
  }

  loadRelatedProjects(category: string, currentProjectId: number) {
    this.portfolioService.getProjects().subscribe(projects => {
      this.relatedProjects = projects
        .filter(p => p.category === category && p.id !== currentProjectId)
        .slice(0, 3);
    });
  }

  getExternalLinksCount(): number {
    if (!this.project) return 0;
    let count = 0;
    if (this.project.url) count++;
    if (this.project.github_url) count++;
    return count;
  }

  getTechIcon(tech: string): string {
    const icons: { [key: string]: string } = {
      'Angular': '🅰️',
      'React': '⚛️',
      'Vue': '💚',
      'TypeScript': '🔷',
      'JavaScript': '🟨',
      'Python': '🐍',
      'FastAPI': '⚡',
      'Django': '🎸',
      'Node.js': '🟢',
      'PostgreSQL': '🐘',
      'MongoDB': '🍃',
      'Docker': '🐳',
      'AWS': '☁️',
      'Git': '📁',
      'HTML': '🌐',
      'CSS': '🎨',
      'SCSS': '💄',
      'Bootstrap': '🎯',
      'Tailwind': '🎨'
    };
    return icons[tech] || '💻';
  }

  formatDescription(description: string): string {
    return description.replace(/\n/g, '<br>');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openImageModal(image: string) {
    this.selectedImage = image;
  }

  closeImageModal() {
    this.selectedImage = null;
  }
}
