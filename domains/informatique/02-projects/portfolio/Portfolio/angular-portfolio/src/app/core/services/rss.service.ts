import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RSSFeed {
  id: number;
  url: string;
  title: string;
  description?: string;
  active: boolean;
  tags?: string[];
  user_id: number;
  created_at: string;
  last_fetched?: string;
  fetch_frequency: number;
  article_count: number;
}

export interface RSSArticle {
  id: number;
  feed_id: number;
  title: string;
  url: string;
  content_full?: string;
  summary?: string;
  author?: string;
  published_at?: string;
  read: boolean;
  starred: boolean;
  user_id: number;
  created_at: string;
}

export interface RSSTag {
  id: number;
  name: string;
  color: string;
  user_id: number;
  created_at: string;
}

export interface RSSStats {
  total_feeds: number;
  active_feeds: number;
  total_articles: number;
  unread_articles: number;
  starred_articles: number;
}

export interface CreateRSSFeedRequest {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  fetch_frequency?: number;
}

export interface UpdateRSSFeedRequest {
  title?: string;
  description?: string;
  active?: boolean;
  tags?: string[];
  fetch_frequency?: number;
}

export interface UpdateRSSArticleRequest {
  read?: boolean;
  starred?: boolean;
}

export interface CreateRSSTagRequest {
  name: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RssService {
  private apiUrl = `${environment.apiUrl}/rss`;

  constructor(private http: HttpClient) {}

  // --- Feeds ---
  createFeed(feed: CreateRSSFeedRequest): Observable<RSSFeed> {
    return this.http.post<RSSFeed>(`${this.apiUrl}/feeds`, feed);
  }

  getFeeds(activeOnly: boolean = false, tag?: string): Observable<RSSFeed[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('active_only', 'true');
    }
    if (tag) {
      params = params.set('tag', tag);
    }
    return this.http.get<RSSFeed[]>(`${this.apiUrl}/feeds`, { params });
  }

  getFeed(feedId: number): Observable<RSSFeed> {
    return this.http.get<RSSFeed>(`${this.apiUrl}/feeds/${feedId}`);
  }

  updateFeed(feedId: number, feed: UpdateRSSFeedRequest): Observable<RSSFeed> {
    return this.http.patch<RSSFeed>(`${this.apiUrl}/feeds/${feedId}`, feed);
  }

  deleteFeed(feedId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/feeds/${feedId}`);
  }

  fetchArticles(feedId: number): Observable<RSSArticle[]> {
    return this.http.post<RSSArticle[]>(`${this.apiUrl}/feeds/${feedId}/fetch`, {});
  }

  // --- Articles ---
  getArticles(filters?: {
    feed_id?: number;
    read?: boolean;
    starred?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<RSSArticle[]> {
    let params = new HttpParams();
    if (filters?.feed_id) {
      params = params.set('feed_id', filters.feed_id.toString());
    }
    if (filters?.read !== undefined) {
      params = params.set('read', filters.read.toString());
    }
    if (filters?.starred !== undefined) {
      params = params.set('starred', filters.starred.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params = params.set('offset', filters.offset.toString());
    }
    return this.http.get<RSSArticle[]>(`${this.apiUrl}/articles`, { params });
  }

  getArticle(articleId: number): Observable<RSSArticle> {
    return this.http.get<RSSArticle>(`${this.apiUrl}/articles/${articleId}`);
  }

  updateArticle(articleId: number, article: UpdateRSSArticleRequest): Observable<RSSArticle> {
    return this.http.patch<RSSArticle>(`${this.apiUrl}/articles/${articleId}`, article);
  }

  markRead(articleId: number): Observable<RSSArticle> {
    return this.http.post<RSSArticle>(`${this.apiUrl}/articles/${articleId}/mark-read`, {});
  }

  markUnread(articleId: number): Observable<RSSArticle> {
    return this.http.post<RSSArticle>(`${this.apiUrl}/articles/${articleId}/mark-unread`, {});
  }

  toggleStar(articleId: number): Observable<RSSArticle> {
    return this.http.post<RSSArticle>(`${this.apiUrl}/articles/${articleId}/toggle-star`, {});
  }

  // --- Tags ---
  createTag(tag: CreateRSSTagRequest): Observable<RSSTag> {
    return this.http.post<RSSTag>(`${this.apiUrl}/tags`, tag);
  }

  getTags(): Observable<RSSTag[]> {
    return this.http.get<RSSTag[]>(`${this.apiUrl}/tags`);
  }

  deleteTag(tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tags/${tagId}`);
  }

  // --- Stats ---
  getStats(): Observable<RSSStats> {
    return this.http.get<RSSStats>(`${this.apiUrl}/stats`);
  }
}

