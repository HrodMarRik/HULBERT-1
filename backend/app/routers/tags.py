from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from ..db import get_db
from ..models import Tag, User
from ..schemas import TagResponse, TagCreate, TagSuggestion
from ..security import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/test")
def test_tags():
    """Test endpoint pour vérifier que le router fonctionne"""
    return {"message": "Tags router is working"}


@router.get("", response_model=List[TagResponse])
def get_all_tags(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    limit: int = Query(100, description="Maximum number of tags to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère tous les tags avec filtrage optionnel par type d'entité"""
    query = db.query(Tag)
    
    if entity_type:
        query = query.filter(Tag.entity_type == entity_type)
    
    tags = query.order_by(desc(Tag.usage_count), Tag.name).limit(limit).all()
    return tags


@router.get("/suggestions", response_model=List[TagSuggestion])
def get_tag_suggestions(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    query: Optional[str] = Query(None, description="Search query for tag names"),
    limit: int = Query(10, description="Maximum number of suggestions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère des suggestions de tags basées sur la recherche"""
    db_query = db.query(Tag)
    
    if entity_type:
        db_query = db_query.filter(Tag.entity_type == entity_type)
    
    if query:
        db_query = db_query.filter(Tag.name.ilike(f"%{query}%"))
    
    tags = db_query.order_by(desc(Tag.usage_count), Tag.name).limit(limit).all()
    
    suggestions = [
        TagSuggestion(
            name=tag.name,
            usage_count=tag.usage_count
        )
        for tag in tags
    ]
    
    return suggestions


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau tag"""
    # Vérifier si le tag existe déjà
    existing_tag = db.query(Tag).filter(Tag.name == tag_data.name).first()
    if existing_tag:
        raise HTTPException(
            status_code=400,
            detail=f"Le tag '{tag_data.name}' existe déjà"
        )
    
    # Créer le nouveau tag
    tag = Tag(
        name=tag_data.name,
        entity_type=tag_data.entity_type,
        created_by_user_id=current_user.id
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return tag


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un tag par son ID"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag non trouvé")
    
    return tag


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un tag"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag non trouvé")
    
    db.delete(tag)
    db.commit()
    
    return {"message": "Tag supprimé avec succès"}


@router.post("/increment-usage")
def increment_tag_usage(
    tag_names: List[str],
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Incrémente le compteur d'utilisation pour une liste de tags"""
    for tag_name in tag_names:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if tag:
            tag.usage_count += 1
            if entity_type and not tag.entity_type:
                tag.entity_type = entity_type
    
    db.commit()
    return {"message": "Compteurs d'utilisation mis à jour"}


@router.get("/stats/summary")
def get_tags_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les statistiques des tags"""
    total_tags = db.query(Tag).count()
    
    # Tags par type d'entité
    entity_stats = db.query(
        Tag.entity_type,
        func.count(Tag.id).label('count')
    ).group_by(Tag.entity_type).all()
    
    # Tags les plus utilisés
    most_used = db.query(Tag).order_by(desc(Tag.usage_count)).limit(10).all()
    
    return {
        "total_tags": total_tags,
        "by_entity_type": {stat.entity_type or "all": stat.count for stat in entity_stats},
        "most_used": [
            {
                "name": tag.name,
                "usage_count": tag.usage_count,
                "entity_type": tag.entity_type
            }
            for tag in most_used
        ]
    }
