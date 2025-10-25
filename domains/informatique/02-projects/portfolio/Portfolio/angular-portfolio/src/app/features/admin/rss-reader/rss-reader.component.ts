import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RssService, RSSFeed, RSSArticle, RSSTag, RSSStats } from '@core/services/rss.service';

@Component({
  selector: 'app-rss-reader',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="rss-reader">
      <!-- Header -->
      <div class="rss-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">📰</span>
            Agrégateur RSS
          </h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="showAddFeedModal = true">
              <span class="btn-icon">➕</span>
              Ajouter un flux
            </button>
            <button class="btn btn-secondary" (click)="refreshAllFeeds()" [disabled]="isRefreshing">
              <span class="btn-icon" [class.spinning]="isRefreshing">🔄</span>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">📡</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_feeds }}</div>
            <div class="stat-label">Flux RSS</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_articles }}</div>
            <div class="stat-label">Articles</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔴</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.unread_articles }}</div>
            <div class="stat-label">Non lus</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.starred_articles }}</div>
            <div class="stat-label">Favoris</div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="rss-content">
        <!-- Sidebar -->
        <div class="rss-sidebar">
          <!-- Filters -->
          <div class="filter-section">
            <h3>Filtres</h3>
            <div class="filter-group">
              <label>
                <input type="checkbox" [(ngModel)]="filters.unreadOnly" (change)="applyFilters()">
                Non lus uniquement
              </label>
            </div>
            <div class="filter-group">
              <label>
                <input type="checkbox" [(ngModel)]="filters.starredOnly" (change)="applyFilters()">
                Favoris uniquement
              </label>
            </div>
          </div>

          <!-- Feeds List -->
          <div class="feeds-section">
            <h3>Flux RSS</h3>
            <div class="feeds-list">
              <div 
                class="feed-item" 
                *ngFor="let feed of feeds" 
                [class.active]="selectedFeedId === feed.id"
                (click)="selectFeed(feed.id)">
                <div class="feed-info">
                  <div class="feed-title">{{ feed.title || 'Flux sans titre' }}</div>
                  <div class="feed-url">{{ feed.url }}</div>
                  <div class="feed-stats">
                    {{ feed.article_count }} articles
                    <span *ngIf="feed.last_fetched" class="last-fetch">
                      • {{ formatDate(feed.last_fetched) }}
                    </span>
                  </div>
                </div>
                <div class="feed-actions">
                  <button class="btn-icon" (click)="refreshFeed(feed.id)" title="Actualiser">
                    🔄
                  </button>
                  <button class="btn-icon" (click)="editFeed(feed)" title="Modifier">
                    ✏️
                  </button>
                  <button class="btn-icon delete" (click)="deleteFeed(feed.id)" title="Supprimer">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="tags-section" *ngIf="tags.length > 0">
            <h3>Tags</h3>
            <div class="tags-list">
              <span 
                class="tag" 
                *ngFor="let tag of tags"
                [style.background-color]="tag.color + '20'"
                [style.border-color]="tag.color"
                (click)="filterByTag(tag.name)">
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Articles List -->
        <div class="rss-main">
          <div class="articles-header">
            <h2>
              {{ selectedFeedId ? getFeedTitle(selectedFeedId) : 'Tous les articles' }}
              <span class="article-count">({{ filteredArticles.length }})</span>
            </h2>
            <div class="sort-controls">
              <select [(ngModel)]="sortBy" (change)="sortArticles()">
                <option value="published_desc">Plus récent</option>
                <option value="published_asc">Plus ancien</option>
                <option value="title_asc">Titre A-Z</option>
                <option value="title_desc">Titre Z-A</option>
              </select>
            </div>
          </div>

          <div class="articles-list">
            <div 
              class="article-item" 
              *ngFor="let article of filteredArticles"
              [class.read]="article.read"
              [class.starred]="article.starred">
              
              <div class="article-header">
                <h3 class="article-title" (click)="selectArticle(article)">
                  {{ article.title }}
                </h3>
                <div class="article-actions">
                  <button 
                    class="btn-icon" 
                    [class.active]="article.starred"
                    (click)="toggleStar(article.id)"
                    title="Favori">
                    ⭐
                  </button>
                  <button 
                    class="btn-icon" 
                    [class.active]="article.read"
                    (click)="toggleRead(article.id)"
                    title="Marquer comme lu">
                    ✓
                  </button>
                  <a 
                    [href]="article.url" 
                    target="_blank" 
                    class="btn-icon"
                    title="Ouvrir dans un nouvel onglet">
                    🔗
                  </a>
                </div>
              </div>

              <div class="article-meta">
                <span class="article-feed">{{ getFeedTitle(article.feed_id) }}</span>
                <span class="article-author" *ngIf="article.author">• {{ article.author }}</span>
                <span class="article-date" *ngIf="article.published_at">
                  • {{ formatDate(article.published_at) }}
                </span>
              </div>

              <div class="article-summary" *ngIf="article.summary">
                {{ article.summary }}
              </div>
            </div>

            <div class="empty-state" *ngIf="filteredArticles.length === 0">
              <div class="empty-icon">📰</div>
              <div class="empty-text">Aucun article trouvé</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Article Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedArticle" (click)="closeArticleDetail()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ selectedArticle.title }}</h2>
            <button class="btn-icon" (click)="closeArticleDetail()">✕</button>
          </div>
          <div class="modal-body">
            <div class="article-detail-meta">
              <span class="article-feed">{{ getFeedTitle(selectedArticle.feed_id) }}</span>
              <span class="article-author" *ngIf="selectedArticle.author">• {{ selectedArticle.author }}</span>
              <span class="article-date" *ngIf="selectedArticle.published_at">
                • {{ formatDate(selectedArticle.published_at) }}
              </span>
            </div>
            <div class="article-detail-content" [innerHTML]="selectedArticle.content_full || selectedArticle.summary">
            </div>
          </div>
          <div class="modal-footer">
            <div class="modal-actions">
              <button 
                class="btn" 
                [class.btn-primary]="!selectedArticle.starred"
                [class.btn-secondary]="selectedArticle.starred"
                (click)="toggleStar(selectedArticle.id)">
                {{ selectedArticle.starred ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
              </button>
              <button 
                class="btn" 
                [class.btn-primary]="!selectedArticle.read"
                [class.btn-secondary]="selectedArticle.read"
                (click)="toggleRead(selectedArticle.id)">
                {{ selectedArticle.read ? 'Marquer non lu' : 'Marquer comme lu' }}
              </button>
              <a 
                [href]="selectedArticle.url" 
                target="_blank" 
                class="btn btn-primary">
                Ouvrir l'article original
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Feed Modal -->
      <div class="modal-overlay" *ngIf="showAddFeedModal" (click)="closeAddFeedModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ajouter un flux RSS</h2>
            <button class="btn-icon" (click)="closeAddFeedModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="addFeed()" #feedForm="ngForm">
              <div class="form-group">
                <label for="url">URL du flux RSS *</label>
                <input 
                  type="url" 
                  id="url" 
                  name="url" 
                  [(ngModel)]="newFeed.url" 
                  required 
                  class="form-input"
                  placeholder="https://example.com/rss">
              </div>
              <div class="form-group">
                <label for="title">Titre (optionnel)</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  [(ngModel)]="newFeed.title" 
                  class="form-input"
                  placeholder="Titre personnalisé">
              </div>
              <div class="form-group">
                <label for="description">Description (optionnel)</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="newFeed.description" 
                  class="form-textarea"
                  placeholder="Description du flux"></textarea>
              </div>
              <div class="form-group">
                <label for="fetch_frequency">Fréquence de vérification</label>
                <select id="fetch_frequency" name="fetch_frequency" [(ngModel)]="newFeed.fetch_frequency" class="form-select">
                  <option value="1800">30 minutes</option>
                  <option value="3600" selected>1 heure</option>
                  <option value="7200">2 heures</option>
                  <option value="14400">4 heures</option>
                  <option value="86400">24 heures</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeAddFeedModal()">
                Annuler
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                (click)="addFeed()"
                [disabled]="!feedForm.form.valid || isAddingFeed">
                {{ isAddingFeed ? 'Ajout en cours...' : 'Ajouter le flux' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rss-reader {
      min-height: 100vh;
      background: #0f172a;
      color: #f1f5f9;
    }

    .rss-header {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 20px 0;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .title-icon {
      font-size: 1.5em;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .stats-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #60a5fa;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #94a3b8;
    }

    .rss-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 30px;
    }

    .rss-sidebar {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      height: fit-content;
    }

    .filter-section,
    .feeds-section,
    .tags-section {
      margin-bottom: 30px;
    }

    .filter-section h3,
    .feeds-section h3,
    .tags-section h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: #f1f5f9;
    }

    .filter-group {
      margin-bottom: 12px;
    }

    .filter-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .feeds-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .feed-item {
      background: #334155;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .feed-item:hover {
      background: #475569;
    }

    .feed-item.active {
      background: #1e3a5f;
      border-color: #60a5fa;
    }

    .feed-title {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }

    .feed-url {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .feed-stats {
      font-size: 0.8rem;
      color: #cbd5e1;
    }

    .last-fetch {
      color: #94a3b8;
    }

    .feed-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tag:hover {
      opacity: 0.8;
    }

    .rss-main {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
    }

    .articles-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #334155;
    }

    .articles-header h2 {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
    }

    .article-count {
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: normal;
    }

    .sort-controls select {
      background: #334155;
      border: 1px solid #475569;
      color: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .articles-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .article-item {
      background: #334155;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .article-item:hover {
      background: #475569;
    }

    .article-item.read {
      opacity: 0.7;
    }

    .article-item.starred {
      border-color: #fbbf24;
    }

    .article-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .article-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      cursor: pointer;
      flex: 1;
      margin-right: 12px;
    }

    .article-title:hover {
      color: #60a5fa;
    }

    .article-actions {
      display: flex;
      gap: 4px;
    }

    .article-meta {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .article-summary {
      font-size: 0.9rem;
      line-height: 1.5;
      color: #cbd5e1;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 1.1rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.3rem;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #334155;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .article-detail-meta {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #334155;
    }

    .article-detail-content {
      line-height: 1.6;
      color: #cbd5e1;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f1f5f9;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 12px;
      background: #334155;
      border: 1px solid #475569;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 14px;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    /* Button Styles */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
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
      background: #334155;
      color: #f1f5f9;
    }

    .btn-icon.active {
      color: #fbbf24;
    }

    .btn-icon.delete:hover {
      color: #ef4444;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .rss-content {
        grid-template-columns: 1fr;
      }
      
      .rss-sidebar {
        order: 2;
      }
      
      .rss-main {
        order: 1;
      }
      
      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
    }
  `]
})
export class RssReaderComponent implements OnInit {
  feeds: RSSFeed[] = [];
  articles: RSSArticle[] = [];
  filteredArticles: RSSArticle[] = [];
  tags: RSSTag[] = [];
  stats: RSSStats | null = null;
  
  selectedFeedId: number | null = null;
  selectedArticle: RSSArticle | null = null;
  showAddFeedModal = false;
  
  isRefreshing = false;
  isAddingFeed = false;
  
  filters = {
    unreadOnly: false,
    starredOnly: false
  };
  
  sortBy = 'published_desc';
  
  newFeed = {
    url: '',
    title: '',
    description: '',
    fetch_frequency: 3600
  };

  private rssService = inject(RssService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadFeeds();
    this.loadArticles();
    this.loadTags();
    this.loadStats();
  }

  loadFeeds() {
    this.rssService.getFeeds().subscribe({
      next: (feeds) => {
        this.feeds = feeds;
      },
      error: (error) => {
        console.error('Error loading feeds:', error);
      }
    });
  }

  loadArticles() {
    this.rssService.getArticles({ limit: 100 }).subscribe({
      next: (articles) => {
        this.articles = articles;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading articles:', error);
      }
    });
  }

  loadTags() {
    this.rssService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
      }
    });
  }

  loadStats() {
    this.rssService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  selectFeed(feedId: number) {
    this.selectedFeedId = feedId;
    this.applyFilters();
  }

  selectArticle(article: RSSArticle) {
    this.selectedArticle = article;
    if (!article.read) {
      this.toggleRead(article.id);
    }
  }

  closeArticleDetail() {
    this.selectedArticle = null;
  }

  applyFilters() {
    let filtered = [...this.articles];
    
    if (this.selectedFeedId) {
      filtered = filtered.filter(article => article.feed_id === this.selectedFeedId);
    }
    
    if (this.filters.unreadOnly) {
      filtered = filtered.filter(article => !article.read);
    }
    
    if (this.filters.starredOnly) {
      filtered = filtered.filter(article => article.starred);
    }
    
    this.filteredArticles = filtered;
    this.sortArticles();
  }

  sortArticles() {
    this.filteredArticles.sort((a, b) => {
      switch (this.sortBy) {
        case 'published_desc':
          return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
        case 'published_asc':
          return new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }

  filterByTag(tagName: string) {
    // Implementation for tag filtering
    console.log('Filter by tag:', tagName);
  }

  toggleRead(articleId: number) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;
    
    const newReadStatus = !article.read;
    
    this.rssService.updateArticle(articleId, { read: newReadStatus }).subscribe({
      next: (updatedArticle) => {
        article.read = updatedArticle.read;
        this.loadStats();
      },
      error: (error) => {
        console.error('Error updating article:', error);
      }
    });
  }

  toggleStar(articleId: number) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;
    
    this.rssService.toggleStar(articleId).subscribe({
      next: (updatedArticle) => {
        article.starred = updatedArticle.starred;
        this.loadStats();
      },
      error: (error) => {
        console.error('Error toggling star:', error);
      }
    });
  }

  refreshFeed(feedId: number) {
    this.rssService.fetchArticles(feedId).subscribe({
      next: (newArticles) => {
        this.loadArticles();
        this.loadStats();
      },
      error: (error) => {
        console.error('Error refreshing feed:', error);
      }
    });
  }

  refreshAllFeeds() {
    this.isRefreshing = true;
    const refreshPromises = this.feeds.map(feed => 
      this.rssService.fetchArticles(feed.id).toPromise()
    );
    
    Promise.all(refreshPromises).then(() => {
      this.loadArticles();
      this.loadStats();
      this.isRefreshing = false;
    }).catch(error => {
      console.error('Error refreshing feeds:', error);
      this.isRefreshing = false;
    });
  }

  addFeed() {
    if (!this.newFeed.url) return;
    
    this.isAddingFeed = true;
    this.rssService.createFeed(this.newFeed).subscribe({
      next: (feed) => {
        this.feeds.unshift(feed);
        this.closeAddFeedModal();
        this.loadStats();
        this.isAddingFeed = false;
      },
      error: (error) => {
        console.error('Error adding feed:', error);
        this.isAddingFeed = false;
      }
    });
  }

  editFeed(feed: RSSFeed) {
    // Implementation for editing feed
    console.log('Edit feed:', feed);
  }

  deleteFeed(feedId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce flux RSS ?')) return;
    
    this.rssService.deleteFeed(feedId).subscribe({
      next: () => {
        this.feeds = this.feeds.filter(f => f.id !== feedId);
        this.articles = this.articles.filter(a => a.feed_id !== feedId);
        this.applyFilters();
        this.loadStats();
      },
      error: (error) => {
        console.error('Error deleting feed:', error);
      }
    });
  }

  closeAddFeedModal() {
    this.showAddFeedModal = false;
    this.newFeed = {
      url: '',
      title: '',
      description: '',
      fetch_frequency: 3600
    };
  }

  getFeedTitle(feedId: number): string {
    const feed = this.feeds.find(f => f.id === feedId);
    return feed ? (feed.title || 'Flux sans titre') : 'Flux inconnu';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'À l\'instant';
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }
}
