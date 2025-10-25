import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RSSArticle {
  id: number;
  title: string;
  feed_name: string;
  published_at: string;
  read: boolean;
}

@Component({
  selector: 'app-rss-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card rss-widget">
      <div class="widget-header">
        <div class="widget-icon">📰</div>
        <div class="widget-title">Flux RSS</div>
        <div class="widget-value">{{ articles.length }}</div>
      </div>
      
      <div class="widget-content">
        <div class="articles-list" *ngIf="articles.length > 0">
          <div class="article-item" *ngFor="let article of articles.slice(0, 3)">
            <div class="article-header">
              <span class="article-feed">{{ article.feed_name }}</span>
              <span class="article-status" *ngIf="!article.read">🔵</span>
            </div>
            <div class="article-title">{{ article.title }}</div>
            <div class="article-date">{{ formatDate(article.published_at) }}</div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="articles.length === 0">
          <div class="empty-icon">📰</div>
          <div class="empty-text">Aucun article récent</div>
        </div>
      </div>
      
      <div class="widget-footer">
        <a href="/admin/rss" class="view-more">Voir tous les articles →</a>
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      background: #1e293b;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 14px;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .widget-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      border-color: rgba(59, 130, 246, 0.4);
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .widget-icon {
      font-size: 20px;
    }
    
    .widget-title {
      font-size: 15px;
      font-weight: 600;
      color: #f1f5f9;
      flex: 1;
    }

    .widget-value {
      font-size: 20px;
      font-weight: 700;
      color: #60a5fa;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .articles-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .article-item {
      padding: 10px;
      background: #334155;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      transition: all 0.2s ease;
    }
    
    .article-item:hover {
      background: #3f4d61;
      border-color: rgba(96, 165, 250, 0.3);
    }
    
    .article-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    
    .article-feed {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .article-status {
      font-size: 8px;
    }
    
    .article-title {
      font-size: 12px;
      color: #f1f5f9;
      font-weight: 500;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .article-date {
      font-size: 10px;
      color: #64748b;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 20px;
      text-align: center;
    }
    
    .empty-icon {
      font-size: 36px;
      margin-bottom: 8px;
      opacity: 0.5;
    }
    
    .empty-text {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .widget-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .view-more {
      color: #60a5fa;
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
      display: block;
      text-align: center;
      transition: color 0.2s ease;
    }
    
    .view-more:hover {
      color: #93c5fd;
    }
  `]
})
export class RssWidgetComponent implements OnInit {
  @Input() articles: RSSArticle[] = [];

  ngOnInit() {
    // Données de test
    if (this.articles.length === 0) {
      this.articles = [
        {
          id: 1,
          title: 'Angular 18 Released with New Features',
          feed_name: 'Angular Blog',
          published_at: new Date().toISOString(),
          read: false
        },
        {
          id: 2,
          title: 'TypeScript 5.4 Performance Improvements',
          feed_name: 'TypeScript News',
          published_at: new Date(Date.now() - 3600000).toISOString(),
          read: true
        },
        {
          id: 3,
          title: 'Best Practices for FastAPI Development',
          feed_name: 'Python Weekly',
          published_at: new Date(Date.now() - 7200000).toISOString(),
          read: false
        }
      ];
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }
}

