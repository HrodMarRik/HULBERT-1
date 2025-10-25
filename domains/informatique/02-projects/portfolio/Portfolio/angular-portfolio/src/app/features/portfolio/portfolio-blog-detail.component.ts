import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PortfolioService, PortfolioBlogPost } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-portfolio-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="portfolio-blog-detail" *ngIf="post">
      <!-- Hero Section -->
      <section class="blog-hero">
        <div class="container">
          <div class="hero-content">
            <div class="blog-breadcrumb">
              <a routerLink="/portfolio/blog">← Retour au blog</a>
            </div>
            <div class="blog-header">
              <div class="blog-info">
                <div class="blog-badges">
                  <span class="badge featured" *ngIf="post.featured">⭐ Article en vedette</span>
                  <span class="badge published" *ngIf="post.published">✅ Publié</span>
                </div>
                <h1 class="blog-title">{{ post.title }}</h1>
                <p class="blog-excerpt" *ngIf="post.excerpt">{{ post.excerpt }}</p>
                <div class="blog-meta">
                  <div class="meta-item">
                    <span class="meta-label">Publié le :</span>
                    <span class="meta-value">{{ formatDate(post.published_at || post.created_at) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Temps de lecture :</span>
                    <span class="meta-value">{{ calculateReadTime(post.content) }} min</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Vues :</span>
                    <span class="meta-value">{{ post.views }}</span>
                  </div>
                </div>
                <div class="blog-tags" *ngIf="post.tags">
                  <span class="tag" *ngFor="let tag of post.tags">{{ tag }}</span>
                </div>
              </div>
              <div class="blog-image" *ngIf="post.cover_image">
                <img [src]="post.cover_image" [alt]="post.title">
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Blog Content -->
      <section class="blog-content">
        <div class="container">
          <div class="content-grid">
            <div class="main-content">
              <!-- Article Content -->
              <article class="article-content">
                <div class="content-body" [innerHTML]="formatContent(post.content)"></div>
              </article>

              <!-- Article Footer -->
              <div class="article-footer">
                <div class="article-actions">
                  <button class="action-btn" (click)="shareArticle()">
                    <span class="btn-icon">📤</span>
                    Partager
                  </button>
                  <button class="action-btn" (click)="bookmarkArticle()">
                    <span class="btn-icon">🔖</span>
                    Sauvegarder
                  </button>
                </div>
                <div class="article-stats">
                  <div class="stat-item">
                    <span class="stat-icon">👁️</span>
                    <span class="stat-text">{{ post.views }} vues</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-text">{{ calculateReadTime(post.content) }} min de lecture</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="sidebar">
              <!-- Table of Contents -->
              <div class="toc-card" *ngIf="tableOfContents.length > 0">
                <h3>Table des matières</h3>
                <nav class="toc-nav">
                  <a *ngFor="let item of tableOfContents" 
                     [href]="'#' + item.id" 
                     class="toc-link"
                     [class.active]="activeSection === item.id">
                    {{ item.text }}
                  </a>
                </nav>
              </div>

              <!-- Article Info -->
              <div class="info-card">
                <h3>Informations</h3>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Auteur</span>
                    <span class="info-value">Votre Développeur</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Publié le</span>
                    <span class="info-value">{{ formatDate(post.published_at || post.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mis à jour</span>
                    <span class="info-value">{{ formatDate(post.updated_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Statut</span>
                    <span class="info-value" [class.published]="post.published">
                      {{ post.published ? 'Publié' : 'Brouillon' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Related Articles -->
              <div class="related-card" *ngIf="relatedPosts.length > 0">
                <h3>Articles similaires</h3>
                <div class="related-list">
                  <div class="related-item" *ngFor="let relatedPost of relatedPosts" 
                       [routerLink]="['/portfolio/blog', relatedPost.slug]">
                    <div class="related-image" *ngIf="relatedPost.cover_image">
                      <img [src]="relatedPost.cover_image" [alt]="relatedPost.title">
                    </div>
                    <div class="related-content">
                      <h4 class="related-title">{{ relatedPost.title }}</h4>
                      <div class="related-meta">
                        <span class="related-date">{{ formatDate(relatedPost.published_at || relatedPost.created_at) }}</span>
                        <span class="related-views">{{ relatedPost.views }} vues</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Newsletter -->
              <div class="newsletter-card">
                <h3>Newsletter</h3>
                <p class="newsletter-text">
                  Recevez les derniers articles directement dans votre boîte mail.
                </p>
                <a routerLink="/portfolio/contact" class="btn btn-primary">
                  <span class="btn-icon">📧</span>
                  S'abonner
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">Cet article vous a plu ?</h2>
            <p class="cta-description">
              Découvrez mes autres articles et projets pour en savoir plus.
            </p>
            <div class="cta-actions">
              <a routerLink="/portfolio/blog" class="btn btn-primary btn-large">
                <span class="btn-icon">📝</span>
                Voir tous les articles
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

    <!-- Loading State -->
    <div class="loading-state" *ngIf="!post">
      <div class="loading-spinner"></div>
      <p>Chargement de l'article...</p>
    </div>
  `,
  styles: [`
    .portfolio-blog-detail {
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
    }

    .blog-breadcrumb {
      margin-bottom: 30px;
    }

    .blog-breadcrumb a {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 500;
    }

    .blog-breadcrumb a:hover {
      color: #93c5fd;
    }

    .blog-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .blog-badges {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
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

    .blog-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #f1f5f9;
      line-height: 1.1;
    }

    .blog-excerpt {
      font-size: 1.3rem;
      color: #94a3b8;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .blog-meta {
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

    .blog-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      background: #334155;
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .blog-image {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .blog-image img {
      width: 100%;
      height: 400px;
      object-fit: cover;
    }

    /* Content */
    .blog-content {
      padding: 80px 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 60px;
    }

    .article-content {
      background: #1e293b;
      padding: 40px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .content-body {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #cbd5e1;
    }

    .content-body h1,
    .content-body h2,
    .content-body h3,
    .content-body h4,
    .content-body h5,
    .content-body h6 {
      color: #f1f5f9;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .content-body h2 {
      font-size: 1.8rem;
      border-bottom: 2px solid #334155;
      padding-bottom: 0.5rem;
    }

    .content-body h3 {
      font-size: 1.5rem;
    }

    .content-body p {
      margin-bottom: 1.5rem;
    }

    .content-body ul,
    .content-body ol {
      margin-bottom: 1.5rem;
      padding-left: 2rem;
    }

    .content-body li {
      margin-bottom: 0.5rem;
    }

    .content-body blockquote {
      border-left: 4px solid #60a5fa;
      padding-left: 1.5rem;
      margin: 2rem 0;
      font-style: italic;
      color: #94a3b8;
    }

    .content-body code {
      background: #334155;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
    }

    .content-body pre {
      background: #0f172a;
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 2rem 0;
    }

    .content-body pre code {
      background: none;
      padding: 0;
    }

    .content-body img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 2rem 0;
    }

    .content-body a {
      color: #60a5fa;
      text-decoration: none;
    }

    .content-body a:hover {
      color: #93c5fd;
      text-decoration: underline;
    }

    /* Article Footer */
    .article-footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .article-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #334155;
      color: #f1f5f9;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #475569;
      transform: translateY(-1px);
    }

    .article-stats {
      display: flex;
      gap: 20px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 14px;
    }

    .stat-icon {
      font-size: 1.1em;
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .toc-card,
    .info-card,
    .related-card,
    .newsletter-card {
      background: #1e293b;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #334155;
    }

    .toc-card h3,
    .info-card h3,
    .related-card h3,
    .newsletter-card h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f1f5f9;
    }

    .toc-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toc-link {
      color: #94a3b8;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .toc-link:hover,
    .toc-link.active {
      background: #334155;
      color: #60a5fa;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-label {
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .info-value {
      color: #f1f5f9;
      font-weight: 600;
    }

    .info-value.published {
      color: #10b981;
    }

    .related-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .related-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #334155;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .related-item:hover {
      background: #475569;
      transform: translateX(4px);
    }

    .related-image {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .related-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .related-content {
      flex: 1;
    }

    .related-title {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: #f1f5f9;
    }

    .related-meta {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .newsletter-text {
      color: #94a3b8;
      margin-bottom: 20px;
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

    /* Responsive */
    @media (max-width: 768px) {
      .blog-header {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .blog-title {
        font-size: 2rem;
      }

      .content-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .article-content {
        padding: 30px 20px;
      }

      .article-footer {
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;
      }

      .cta-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class PortfolioBlogDetailComponent implements OnInit {
  post: PortfolioBlogPost | null = null;
  relatedPosts: PortfolioBlogPost[] = [];
  tableOfContents: { id: string; text: string }[] = [];
  activeSection = '';

  constructor(
    private portfolioService: PortfolioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadPost(slug);
      }
    });
  }

  loadPost(slug: string) {
    this.portfolioService.getBlogPostBySlug(slug).subscribe(post => {
      this.post = post;
      this.generateTableOfContents(post.content);
      this.loadRelatedPosts(post.tags || []);
      this.incrementViews(post.id);
    });
  }

  loadRelatedPosts(tags: string[]) {
    this.portfolioService.getBlogPosts().subscribe(posts => {
      this.relatedPosts = posts
        .filter(p => p.id !== this.post?.id && p.published)
        .filter(p => p.tags && p.tags.some(tag => tags.includes(tag)))
        .slice(0, 3);
    });
  }

  generateTableOfContents(content: string) {
    const headings = content.match(/<h[2-6][^>]*>.*?<\/h[2-6]>/gi);
    if (headings) {
      this.tableOfContents = headings.map((heading, index) => {
        const text = heading.replace(/<[^>]*>/g, '');
        const id = `heading-${index}`;
        return { id, text };
      });
    }
  }

  incrementViews(postId: number) {
    this.portfolioService.incrementBlogViews(postId).subscribe();
  }

  formatContent(content: string): string {
    return content
      .replace(/\n/g, '<br>')
      .replace(/<h([2-6])/g, (match, level) => {
        const index = this.tableOfContents.findIndex(item => 
          item.text === match.replace(/<h[2-6][^>]*>/, '').replace(/<\/h[2-6]>/, '')
        );
        return `<h${level} id="heading-${index}"`;
      });
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
      month: 'long',
      day: 'numeric'
    });
  }

  shareArticle() {
    if (navigator.share) {
      navigator.share({
        title: this.post?.title,
        text: this.post?.excerpt,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  }

  bookmarkArticle() {
    // Simple bookmark functionality
    alert('Article sauvegardé !');
  }
}
