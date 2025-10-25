import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PortfolioService, PortfolioBlogPost } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="portfolio-blog">
      <!-- Hero Section -->
      <section class="blog-hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="gradient-text">Blog</span>
            </h1>
            <p class="hero-subtitle">
              Mes réflexions sur le développement, la technologie et l'innovation
            </p>
          </div>
        </div>
      </section>

      <!-- Blog Filters -->
      <section class="blog-filters">
        <div class="container">
          <div class="filters-content">
            <div class="filter-group">
              <label for="category-filter">Catégorie :</label>
              <select id="category-filter" [(ngModel)]="selectedCategory" (change)="filterPosts()">
                <option value="">Tous les articles</option>
                <option *ngFor="let category of categories" [value]="category">
                  {{ category }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label for="status-filter">Type :</label>
              <select id="status-filter" [(ngModel)]="selectedStatus" (change)="filterPosts()">
                <option value="">Tous les articles</option>
                <option value="featured">Articles en vedette</option>
                <option value="published">Articles publiés</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="sort-filter">Trier par :</label>
              <select id="sort-filter" [(ngModel)]="sortBy" (change)="sortPosts()">
                <option value="date">Date de publication</option>
                <option value="title">Titre</option>
                <option value="views">Nombre de vues</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Post -->
      <section class="featured-post" *ngIf="featuredPost">
        <div class="container">
          <div class="featured-content">
            <div class="featured-image" *ngIf="featuredPost.cover_image">
              <img [src]="featuredPost.cover_image" [alt]="featuredPost.title">
            </div>
            <div class="featured-text">
              <div class="featured-badge">⭐ Article en vedette</div>
              <h2 class="featured-title">{{ featuredPost.title }}</h2>
              <p class="featured-excerpt">{{ featuredPost.excerpt || featuredPost.content }}</p>
              <div class="featured-meta">
                <div class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span class="meta-text">{{ formatDate(featuredPost.published_at || featuredPost.created_at) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-icon">👁️</span>
                  <span class="meta-text">{{ featuredPost.views }} vues</span>
                </div>
                <div class="meta-item" *ngIf="featuredPost.tags">
                  <span class="meta-icon">🏷️</span>
                  <span class="meta-text">{{ featuredPost.tags.slice(0, 2).join(', ') }}</span>
                </div>
              </div>
              <a [routerLink]="['/portfolio/blog', featuredPost.slug]" class="btn btn-primary">
                <span class="btn-icon">📖</span>
                Lire l'article
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Blog Posts Grid -->
      <section class="blog-posts">
        <div class="container">
          <div class="posts-stats" *ngIf="allPosts.length > 0">
            <div class="stat-item">
              <span class="stat-number">{{ allPosts.length }}</span>
              <span class="stat-label">Articles total</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ featuredCount }}</span>
              <span class="stat-label">En vedette</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ totalViews }}</span>
              <span class="stat-label">Vues total</span>
            </div>
          </div>

          <div class="posts-grid" *ngIf="filteredPosts.length > 0">
            <article class="post-card" *ngFor="let post of filteredPosts" 
                     [routerLink]="['/portfolio/blog', post.slug]">
              <div class="post-image" *ngIf="post.cover_image">
                <img [src]="post.cover_image" [alt]="post.title">
                <div class="post-badges">
                  <span class="badge featured" *ngIf="post.featured">⭐</span>
                  <span class="badge published" *ngIf="post.published">✅</span>
                </div>
              </div>
              <div class="post-content">
                <div class="post-header">
                  <div class="post-date">{{ formatDate(post.published_at || post.created_at) }}</div>
                  <div class="post-views">{{ post.views }} vues</div>
                </div>
                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-excerpt">{{ post.excerpt || post.content }}</p>
                <div class="post-tags" *ngIf="post.tags">
                  <span class="tag" *ngFor="let tag of post.tags.slice(0, 3)">{{ tag }}</span>
                  <span class="tag-more" *ngIf="post.tags.length > 3">
                    +{{ post.tags.length - 3 }}
                  </span>
                </div>
                <div class="post-footer">
                  <div class="post-status">
                    <span class="status-indicator" [class.active]="post.published"></span>
                    {{ post.published ? 'Publié' : 'Brouillon' }}
                  </div>
                  <div class="post-read-time">
                    <span class="read-icon">⏱️</span>
                    {{ calculateReadTime(post.content) }} min
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="filteredPosts.length === 0">
            <div class="empty-icon">📝</div>
            <h3 class="empty-title">Aucun article trouvé</h3>
            <p class="empty-description">
              Aucun article ne correspond à vos critères de recherche.
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
            <h2 class="cta-title">Restez informé</h2>
            <p class="cta-description">
              Abonnez-vous à ma newsletter pour recevoir les derniers articles et actualités.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/contact" class="btn btn-primary btn-large">
                <span class="btn-icon">📧</span>
                S'abonner à la newsletter
              </a>
              <a routerLink="/portfolio/projects" class="btn btn-secondary btn-large">
                <span class="btn-icon">🚀</span>
                Voir mes projets
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .portfolio-blog {
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
    .blog-hero {
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
    .blog-filters {
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

    /* Featured Post */
    .featured-post {
      padding: 80px 0;
    }

    .featured-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .featured-image {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .featured-image img {
      width: 100%;
      height: 400px;
      object-fit: cover;
    }

    .featured-badge {
      display: inline-block;
      background: #fbbf24;
      color: #92400e;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .featured-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #f1f5f9;
      line-height: 1.2;
    }

    .featured-excerpt {
      font-size: 1.2rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .featured-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 30px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-icon {
      font-size: 1.1em;
    }

    .meta-text {
      color: #cbd5e1;
      font-size: 0.9rem;
    }

    /* Posts Stats */
    .posts-stats {
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

    /* Posts Grid */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }

    .post-card {
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .post-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .post-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post-badges {
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

    .post-content {
      padding: 24px;
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .post-date {
      color: #94a3b8;
      font-size: 12px;
    }

    .post-views {
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
    }

    .post-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #f1f5f9;
    }

    .post-excerpt {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .tag {
      background: #334155;
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .tag-more {
      background: #475569;
      color: #94a3b8;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .post-status {
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

    .post-read-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #94a3b8;
    }

    .read-icon {
      font-size: 12px;
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

      .featured-content {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .featured-title {
        font-size: 2rem;
      }

      .posts-stats {
        justify-content: center;
      }

      .posts-grid {
        grid-template-columns: 1fr;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class PortfolioBlogComponent implements OnInit {
  allPosts: PortfolioBlogPost[] = [];
  filteredPosts: PortfolioBlogPost[] = [];
  featuredPost: PortfolioBlogPost | null = null;
  categories: string[] = [];
  selectedCategory = '';
  selectedStatus = '';
  sortBy = 'date';
  featuredCount = 0;
  totalViews = 0;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.portfolioService.getBlogPosts().subscribe(posts => {
      this.allPosts = posts;
      this.filteredPosts = [...posts];
      
      // Find featured post
      this.featuredPost = posts.find(p => p.featured) || null;
      
      // Extract categories from tags
      const allTags = posts.flatMap(p => p.tags || []);
      this.categories = [...new Set(allTags)];
      
      this.featuredCount = posts.filter(p => p.featured).length;
      this.totalViews = posts.reduce((sum, p) => sum + p.views, 0);
      
      this.filterPosts();
    });
  }

  filterPosts() {
    let filtered = [...this.allPosts];

    // Remove featured post from filtered list
    if (this.featuredPost) {
      filtered = filtered.filter(p => p.id !== this.featuredPost!.id);
    }

    // Filter by category (tags)
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.tags && p.tags.includes(this.selectedCategory));
    }

    // Filter by status
    if (this.selectedStatus === 'featured') {
      filtered = filtered.filter(p => p.featured);
    } else if (this.selectedStatus === 'published') {
      filtered = filtered.filter(p => p.published);
    }

    this.filteredPosts = filtered;
    this.sortPosts();
  }

  sortPosts() {
    this.filteredPosts.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'views':
          return b.views - a.views;
        case 'date':
        default:
          const dateA = new Date(a.published_at || a.created_at);
          const dateB = new Date(b.published_at || b.created_at);
          return dateB.getTime() - dateA.getTime();
      }
    });
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.sortBy = 'date';
    this.filterPosts();
  }

  calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
