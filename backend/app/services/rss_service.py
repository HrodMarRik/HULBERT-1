import logging
import feedparser
# import trafilatura  # Temporarily disabled due to installation issues
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import RSSFeed, RSSArticle, RSSTag
from app.schemas import (
    RSSFeedCreate, RSSFeedUpdate,
    RSSArticleUpdate,
    RSSTagCreate
)

logger = logging.getLogger(__name__)


class RSSService:
    def __init__(self, db: Session):
        self.db = db

    # --- Feeds ---
    def create_feed(self, feed: RSSFeedCreate, user_id: int) -> RSSFeed:
        """Ajouter un flux RSS"""
        try:
            # Fetch feed info
            parsed = feedparser.parse(feed.url)
            
            db_feed = RSSFeed(
                **feed.dict(),
                user_id=user_id,
                title=feed.title or parsed.feed.get('title', 'Untitled Feed'),
                description=feed.description or parsed.feed.get('description', '')
            )
            
            self.db.add(db_feed)
            self.db.commit()
            self.db.refresh(db_feed)
            
            # Fetch initial articles
            self.fetch_articles(db_feed.id, user_id)
            
            return db_feed
        except Exception as e:
            logger.error(f"Error creating RSS feed: {e}")
            self.db.rollback()
            raise

    def get_feeds(self, user_id: int, active_only: bool = False, tag: Optional[str] = None) -> List[RSSFeed]:
        """Liste des flux RSS"""
        query = self.db.query(RSSFeed).filter(RSSFeed.user_id == user_id)
        
        if active_only:
            query = query.filter(RSSFeed.active == True)
        
        if tag:
            # Filter by tag (JSON contains)
            query = query.filter(RSSFeed.tags.contains([tag]))
        
        return query.order_by(RSSFeed.created_at.desc()).all()

    def get_feed(self, feed_id: int, user_id: int) -> Optional[RSSFeed]:
        """Obtenir un flux RSS"""
        return self.db.query(RSSFeed).filter(
            RSSFeed.id == feed_id,
            RSSFeed.user_id == user_id
        ).first()

    def update_feed(self, feed_id: int, feed: RSSFeedUpdate, user_id: int) -> Optional[RSSFeed]:
        """Mettre à jour un flux RSS"""
        db_feed = self.get_feed(feed_id, user_id)
        if not db_feed:
            return None
        
        for key, value in feed.dict(exclude_unset=True).items():
            setattr(db_feed, key, value)
        
        self.db.commit()
        self.db.refresh(db_feed)
        return db_feed

    def delete_feed(self, feed_id: int, user_id: int) -> bool:
        """Supprimer un flux RSS"""
        db_feed = self.get_feed(feed_id, user_id)
        if not db_feed:
            return False
        
        self.db.delete(db_feed)
        self.db.commit()
        return True

    def fetch_articles(self, feed_id: int, user_id: int) -> List[RSSArticle]:
        """Récupérer les articles d'un flux"""
        db_feed = self.get_feed(feed_id, user_id)
        if not db_feed:
            return []
        
        try:
            parsed = feedparser.parse(db_feed.url)
            new_articles = []
            
            for entry in parsed.entries:
                article_url = entry.get('link', '')
                
                # Check if article already exists
                existing = self.db.query(RSSArticle).filter(
                    RSSArticle.url == article_url,
                    RSSArticle.user_id == user_id
                ).first()
                
                if existing:
                    continue
                
                # Extract full content
                content_full = None
                try:
                    # downloaded = trafilatura.fetch_url(article_url)  # Temporarily disabled
                    # if downloaded:
                    #     content_full = trafilatura.extract(downloaded)  # Temporarily disabled
                    pass  # Full content extraction disabled temporarily
                except Exception as e:
                    logger.warning(f"Could not extract full content for {article_url}: {e}")
                
                # Parse published date
                published_at = None
                if 'published_parsed' in entry and entry.published_parsed:
                    published_at = datetime(*entry.published_parsed[:6])
                
                article = RSSArticle(
                    feed_id=feed_id,
                    user_id=user_id,
                    title=entry.get('title', 'Untitled'),
                    url=article_url,
                    content_full=content_full,
                    summary=entry.get('summary', ''),
                    author=entry.get('author', None),
                    published_at=published_at
                )
                
                self.db.add(article)
                new_articles.append(article)
            
            # Update feed stats
            db_feed.last_fetched = datetime.utcnow()
            db_feed.article_count = self.db.query(RSSArticle).filter(
                RSSArticle.feed_id == feed_id
            ).count()
            
            self.db.commit()
            
            logger.info(f"Fetched {len(new_articles)} new articles from feed {feed_id}")
            return new_articles
            
        except Exception as e:
            logger.error(f"Error fetching articles from feed {feed_id}: {e}")
            self.db.rollback()
            return []

    # --- Articles ---
    def get_articles(
        self,
        user_id: int,
        feed_id: Optional[int] = None,
        read: Optional[bool] = None,
        starred: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[RSSArticle]:
        """Liste des articles"""
        query = self.db.query(RSSArticle).filter(RSSArticle.user_id == user_id)
        
        if feed_id:
            query = query.filter(RSSArticle.feed_id == feed_id)
        
        if read is not None:
            query = query.filter(RSSArticle.read == read)
        
        if starred is not None:
            query = query.filter(RSSArticle.starred == starred)
        
        return query.order_by(RSSArticle.published_at.desc()).limit(limit).offset(offset).all()

    def get_article(self, article_id: int, user_id: int) -> Optional[RSSArticle]:
        """Obtenir un article"""
        return self.db.query(RSSArticle).filter(
            RSSArticle.id == article_id,
            RSSArticle.user_id == user_id
        ).first()

    def update_article(self, article_id: int, article: RSSArticleUpdate, user_id: int) -> Optional[RSSArticle]:
        """Mettre à jour un article"""
        db_article = self.get_article(article_id, user_id)
        if not db_article:
            return None
        
        for key, value in article.dict(exclude_unset=True).items():
            setattr(db_article, key, value)
        
        self.db.commit()
        self.db.refresh(db_article)
        return db_article

    def mark_read(self, article_id: int, user_id: int) -> Optional[RSSArticle]:
        """Marquer comme lu"""
        return self.update_article(article_id, RSSArticleUpdate(read=True), user_id)

    def mark_unread(self, article_id: int, user_id: int) -> Optional[RSSArticle]:
        """Marquer comme non lu"""
        return self.update_article(article_id, RSSArticleUpdate(read=False), user_id)

    def toggle_star(self, article_id: int, user_id: int) -> Optional[RSSArticle]:
        """Toggle starred status"""
        db_article = self.get_article(article_id, user_id)
        if not db_article:
            return None
        
        db_article.starred = not db_article.starred
        self.db.commit()
        self.db.refresh(db_article)
        return db_article

    # --- Tags ---
    def create_tag(self, tag: RSSTagCreate, user_id: int) -> RSSTag:
        """Créer un tag"""
        db_tag = RSSTag(**tag.dict(), user_id=user_id)
        self.db.add(db_tag)
        self.db.commit()
        self.db.refresh(db_tag)
        return db_tag

    def get_tags(self, user_id: int) -> List[RSSTag]:
        """Liste des tags"""
        return self.db.query(RSSTag).filter(RSSTag.user_id == user_id).all()

    def delete_tag(self, tag_id: int, user_id: int) -> bool:
        """Supprimer un tag"""
        db_tag = self.db.query(RSSTag).filter(
            RSSTag.id == tag_id,
            RSSTag.user_id == user_id
        ).first()
        
        if not db_tag:
            return False
        
        self.db.delete(db_tag)
        self.db.commit()
        return True

    # --- Stats ---
    def get_stats(self, user_id: int) -> Dict[str, Any]:
        """Statistiques RSS"""
        total_feeds = self.db.query(RSSFeed).filter(RSSFeed.user_id == user_id).count()
        active_feeds = self.db.query(RSSFeed).filter(
            RSSFeed.user_id == user_id,
            RSSFeed.active == True
        ).count()
        
        total_articles = self.db.query(RSSArticle).filter(RSSArticle.user_id == user_id).count()
        unread_articles = self.db.query(RSSArticle).filter(
            RSSArticle.user_id == user_id,
            RSSArticle.read == False
        ).count()
        starred_articles = self.db.query(RSSArticle).filter(
            RSSArticle.user_id == user_id,
            RSSArticle.starred == True
        ).count()
        
        return {
            "total_feeds": total_feeds,
            "active_feeds": active_feeds,
            "total_articles": total_articles,
            "unread_articles": unread_articles,
            "starred_articles": starred_articles
        }

    # --- Auto Fetch ---
    def auto_fetch_all(self) -> None:
        """Auto-fetch articles from all active feeds (for background job)"""
        feeds = self.db.query(RSSFeed).filter(RSSFeed.active == True).all()
        
        for feed in feeds:
            # Check if it's time to fetch
            if feed.last_fetched:
                time_since_fetch = (datetime.utcnow() - feed.last_fetched).total_seconds()
                if time_since_fetch < feed.fetch_frequency:
                    continue
            
            try:
                self.fetch_articles(feed.id, feed.user_id)
            except Exception as e:
                logger.error(f"Error auto-fetching feed {feed.id}: {e}")

