import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PortfolioService, PortfolioProject } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="portfolio-projects">
      <!-- Hero Section -->
      <section class="projects-hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="gradient-text">Mes Projets</span>
            </h1>
            <p class="hero-subtitle">
              Découvrez mes réalisations et l'évolution de mes compétences
            </p>
          </div>
        </div>
      </section>

      <!-- Filters -->
      <section class="projects-filters">
        <div class="container">
          <div class="filters-content">
            <div class="filter-group">
              <label for="category-filter">Catégorie :</label>
              <select id="category-filter" [(ngModel)]="selectedCategory" (change)="filterProjects()">
                <option value="">Toutes les catégories</option>
                <option *ngFor="let category of categories" [value]="category">
                  {{ category }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label for="status-filter">Statut :</label>
              <select id="status-filter" [(ngModel)]="selectedStatus" (change)="filterProjects()">
                <option value="">Tous les projets</option>
                <option value="featured">Projets en vedette</option>
                <option value="published">Projets publiés</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="sort-filter">Trier par :</label>
              <select id="sort-filter" [(ngModel)]="sortBy" (change)="sortProjects()">
                <option value="date">Date de création</option>
                <option value="name">Nom du projet</option>
                <option value="category">Catégorie</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- Projects Grid -->
      <section class="projects-grid-section">
        <div class="container">
          <div class="projects-stats" *ngIf="allProjects.length > 0">
            <div class="stat-item">
              <span class="stat-number">{{ allProjects.length }}</span>
              <span class="stat-label">Projets total</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ featuredCount }}</span>
              <span class="stat-label">En vedette</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ publishedCount }}</span>
              <span class="stat-label">Publiés</span>
            </div>
          </div>

          <div class="projects-grid" *ngIf="filteredProjects.length > 0">
            <div class="project-card" *ngFor="let project of filteredProjects" 
                 [routerLink]="['/portfolio/projects', project.id]">
              <div class="project-image" *ngIf="project.images && project.images.length > 0">
                <img [src]="project.images[0]" [alt]="project.title">
                <div class="project-overlay">
                  <div class="project-actions">
                    <button class="action-btn" *ngIf="project.url" (click)="openUrl(project.url, $event)">
                      <span class="btn-icon">🌐</span>
                      Site web
                    </button>
                    <button class="action-btn" *ngIf="project.github_url" (click)="openUrl(project.github_url, $event)">
                      <span class="btn-icon">📁</span>
                      Code source
                    </button>
                  </div>
                </div>
                <div class="project-badges">
                  <span class="badge featured" *ngIf="project.featured">⭐ En vedette</span>
                  <span class="badge published" *ngIf="project.published">✅ Publié</span>
                </div>
              </div>
              <div class="project-content">
                <div class="project-header">
                  <div class="project-category">{{ project.category }}</div>
                  <div class="project-date">{{ formatDate(project.created_at) }}</div>
                </div>
                <h3 class="project-title">{{ project.title }}</h3>
                <p class="project-description">{{ project.short_description || project.description }}</p>
                <div class="project-technologies" *ngIf="project.technologies">
                  <span class="tech-tag" *ngFor="let tech of project.technologies.slice(0, 4)">
                    {{ tech }}
                  </span>
                  <span class="tech-more" *ngIf="project.technologies.length > 4">
                    +{{ project.technologies.length - 4 }}
                  </span>
                </div>
                <div class="project-footer">
                  <div class="project-links">
                    <a *ngIf="project.url" [href]="project.url" target="_blank" class="project-link" (click)="$event.stopPropagation()">
                      <span class="link-icon">🌐</span>
                      Site web
                    </a>
                    <a *ngIf="project.github_url" [href]="project.github_url" target="_blank" class="project-link" (click)="$event.stopPropagation()">
                      <span class="link-icon">📁</span>
                      GitHub
                    </a>
                  </div>
                  <div class="project-status">
                    <span class="status-indicator" [class.active]="project.published"></span>
                    {{ project.published ? 'Publié' : 'Brouillon' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="filteredProjects.length === 0">
            <div class="empty-icon">🚀</div>
            <h3 class="empty-title">Aucun projet trouvé</h3>
            <p class="empty-description">
              Aucun projet ne correspond à vos critères de recherche.
              Essayez de modifier les filtres.
            </p>
            <button class="btn btn-primary" (click)="clearFilters()">
              <span class="btn-icon">🔄</span>
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">Un projet en tête ?</h2>
            <p class="cta-description">
              Discutons de votre idée et créons ensemble quelque chose d'extraordinaire.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/contact" class="btn btn-primary btn-large">
                <span class="btn-icon">💬</span>
                Commencer un projet
              </a>
              <a routerLink="/portfolio/about" class="btn btn-secondary btn-large">
                <span class="btn-icon">👨‍💻</span>
                En savoir plus
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .portfolio-projects {
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
    .projects-hero {
      padding: 100px 0 60px;
      text-align: center;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.3rem;
      color: #94a3b8;
    }

    /* Filters */
    .projects-filters {
      padding: 40px 0;
      background: #1e293b;
    }

    .filters-content {
      display: flex;
      gap: 30px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-group label {
      font-weight: 600;
      color: #f1f5f9;
    }

    .filter-group select {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #475569;
      background: #0f172a;
      color: #f1f5f9;
      font-size: 14px;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #60a5fa;
    }

    /* Projects Stats */
    .projects-stats {
      display: flex;
      gap: 40px;
      margin-bottom: 40px;
      padding: 20px 0;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #60a5fa;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    /* Projects Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .project-card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .project-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .project-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .project-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .project-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .project-card:hover .project-overlay {
      opacity: 1;
    }

    .project-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .project-badges {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge.featured {
      background: #fbbf24;
      color: #92400e;
    }

    .badge.published {
      background: #10b981;
      color: #064e3b;
    }

    .project-content {
      padding: 24px;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .project-category {
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .project-date {
      color: #94a3b8;
      font-size: 12px;
    }

    .project-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .project-description {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .project-technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .tech-tag {
      background: #334155;
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .tech-more {
      background: #475569;
      color: #94a3b8;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .project-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .project-links {
      display: flex;
      gap: 12px;
    }

    .project-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #60a5fa;
      text-decoration: none;
      font-size: 12px;
      transition: color 0.2s ease;
    }

    .project-link:hover {
      color: #93c5fd;
    }

    .link-icon {
      font-size: 12px;
    }

    .project-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #94a3b8;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6b7280;
    }

    .status-indicator.active {
      background: #10b981;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .empty-description {
      color: #94a3b8;
      margin-bottom: 30px;
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

    /* Responsive */
    @media (max-width: 768px) {
      .filters-content {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        justify-content: space-between;
      }

      .projects-stats {
        justify-content: center;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }

      .project-footer {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class PortfolioProjectsComponent implements OnInit {
  allProjects: PortfolioProject[] = [];
  filteredProjects: PortfolioProject[] = [];
  categories: string[] = [];
  selectedCategory = '';
  selectedStatus = '';
  sortBy = 'date';
  featuredCount = 0;
  publishedCount = 0;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.portfolioService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      this.filteredProjects = [...projects];
      this.categories = [...new Set(projects.map(p => p.category))];
      this.featuredCount = projects.filter(p => p.featured).length;
      this.publishedCount = projects.filter(p => p.published).length;
    });
  }

  filterProjects() {
    let filtered = [...this.allProjects];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Filter by status
    if (this.selectedStatus === 'featured') {
      filtered = filtered.filter(p => p.featured);
    } else if (this.selectedStatus === 'published') {
      filtered = filtered.filter(p => p.published);
    }

    this.filteredProjects = filtered;
    this.sortProjects();
  }

  sortProjects() {
    this.filteredProjects.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.sortBy = 'date';
    this.filteredProjects = [...this.allProjects];
    this.sortProjects();
  }

  openUrl(url: string, event: Event) {
    event.stopPropagation();
    window.open(url, '_blank');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short'
    });
  }
}
