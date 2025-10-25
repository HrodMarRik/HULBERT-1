from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from ..db import get_db
from ..security import get_current_user
from ..models import ActivityLog, User
from ..schemas import ActivityLogResponse

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/logs", response_model=List[ActivityLogResponse])
def get_activity_logs(
    action: Optional[str] = None,
    target: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les logs d'activité (projets, événements, agents)"""
    query = db.query(ActivityLog)
    
    if action:
        query = query.filter(ActivityLog.action.contains(action))
    if target:
        query = query.filter(ActivityLog.target.contains(target))
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    logs = query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return logs

