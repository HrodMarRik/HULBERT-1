import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.dependencies import get_current_user
from app.services.rss_service import RSSService
from app.schemas import (
    RSSFeedCreate, RSSFeedUpdate, RSSFeedResponse,
    RSSArticleResponse, RSSArticleUpdate,
    RSSTagCreate, RSSTagResponse,
    RSSStatsResponse
)

router = APIRouter(prefix="/api/rss", tags=["RSS"])
logger = logging.getLogger(__name__)


# --- Feeds ---
@router.post("/feeds", response_model=RSSFeedResponse, status_code=status.HTTP_201_CREATED)
def create_feed(
    feed: RSSFeedCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un flux RSS"""
    service = RSSService(db)
    try:
        db_feed = service.create_feed(feed, current_user.id)
        return db_feed
    except Exception as e:
        logger.error(f"Error creating feed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/feeds", response_model=List[RSSFeedResponse])
def get_feeds(
    active_only: bool = Query(False),
    tag: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des flux RSS"""
    service = RSSService(db)
    feeds = service.get_feeds(current_user.id, active_only=active_only, tag=tag)
    return feeds


@router.get("/feeds/{feed_id}", response_model=RSSFeedResponse)
def get_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir un flux RSS"""
    service = RSSService(db)
    feed = service.get_feed(feed_id, current_user.id)
    if not feed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed not found")
    return feed


@router.patch("/feeds/{feed_id}", response_model=RSSFeedResponse)
def update_feed(
    feed_id: int,
    feed: RSSFeedUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un flux RSS"""
    service = RSSService(db)
    updated_feed = service.update_feed(feed_id, feed, current_user.id)
    if not updated_feed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed not found")
    return updated_feed


@router.delete("/feeds/{feed_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un flux RSS"""
    service = RSSService(db)
    success = service.delete_feed(feed_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed not found")


@router.post("/feeds/{feed_id}/fetch", response_model=List[RSSArticleResponse])
def fetch_articles(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les articles d'un flux maintenant"""
    service = RSSService(db)
    articles = service.fetch_articles(feed_id, current_user.id)
    return articles


# --- Articles ---
@router.get("/articles", response_model=List[RSSArticleResponse])
def get_articles(
    feed_id: Optional[int] = Query(None),
    read: Optional[bool] = Query(None),
    starred: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des articles"""
    service = RSSService(db)
    articles = service.get_articles(
        current_user.id,
        feed_id=feed_id,
        read=read,
        starred=starred,
        limit=limit,
        offset=offset
    )
    return articles


@router.get("/articles/{article_id}", response_model=RSSArticleResponse)
def get_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir un article"""
    service = RSSService(db)
    article = service.get_article(article_id, current_user.id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.patch("/articles/{article_id}", response_model=RSSArticleResponse)
def update_article(
    article_id: int,
    article: RSSArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un article"""
    service = RSSService(db)
    updated_article = service.update_article(article_id, article, current_user.id)
    if not updated_article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return updated_article


@router.post("/articles/{article_id}/mark-read", response_model=RSSArticleResponse)
def mark_read(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer comme lu"""
    service = RSSService(db)
    article = service.mark_read(article_id, current_user.id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.post("/articles/{article_id}/mark-unread", response_model=RSSArticleResponse)
def mark_unread(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marquer comme non lu"""
    service = RSSService(db)
    article = service.mark_unread(article_id, current_user.id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.post("/articles/{article_id}/toggle-star", response_model=RSSArticleResponse)
def toggle_star(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle starred"""
    service = RSSService(db)
    article = service.toggle_star(article_id, current_user.id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


# --- Tags ---
@router.post("/tags", response_model=RSSTagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag: RSSTagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un tag"""
    service = RSSService(db)
    db_tag = service.create_tag(tag, current_user.id)
    return db_tag


@router.get("/tags", response_model=List[RSSTagResponse])
def get_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des tags"""
    service = RSSService(db)
    tags = service.get_tags(current_user.id)
    return tags


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un tag"""
    service = RSSService(db)
    success = service.delete_tag(tag_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")


# --- Stats ---
@router.get("/stats", response_model=RSSStatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques RSS"""
    service = RSSService(db)
    stats = service.get_stats(current_user.id)
    return stats

