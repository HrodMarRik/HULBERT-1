from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db
from app.security import get_current_user
from app.models import User
from app.services.notification_service import NotificationService
from app.schemas import (
    NotificationCreate, NotificationResponse
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/", response_model=NotificationResponse)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle notification"""
    service = NotificationService(db)
    notification = service.create_notification(notification_data, current_user.id)
    return notification


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les notifications de l'utilisateur"""
    service = NotificationService(db)
    notifications = service.get_notifications(current_user.id, unread_only)
    return notifications


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une notification par ID"""
    service = NotificationService(db)
    notification = service.get_notification(notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marquer une notification comme lue"""
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marquer toutes les notifications comme lues"""
    service = NotificationService(db)
    count = service.mark_all_as_read(current_user.id)
    return {"message": f"{count} notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une notification"""
    service = NotificationService(db)
    success = service.delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}


@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer le nombre de notifications non lues"""
    service = NotificationService(db)
    count = service.get_unread_count(current_user.id)
    return {"unread_count": count}


# Endpoints système pour créer des notifications automatiques
@router.post("/system/email-campaign")
def create_email_campaign_notification(
    campaign_name: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une notification pour une campagne email"""
    service = NotificationService(db)
    notification = service.create_email_campaign_notification(
        current_user.id, campaign_name, status
    )
    return notification


@router.post("/system/ticket")
def create_ticket_notification(
    ticket_title: str,
    action: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une notification pour un ticket"""
    service = NotificationService(db)
    notification = service.create_ticket_notification(
        current_user.id, ticket_title, action
    )
    return notification


@router.post("/system/project")
def create_project_notification(
    project_name: str,
    action: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une notification pour un projet"""
    service = NotificationService(db)
    notification = service.create_project_notification(
        current_user.id, project_name, action
    )
    return notification