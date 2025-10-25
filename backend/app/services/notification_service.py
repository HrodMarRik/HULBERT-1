import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models import Notification, User
from app.schemas import NotificationCreate

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        
    def create_notification(self, notification_data: NotificationCreate, user_id: int) -> Notification:
        """Créer une nouvelle notification"""
        notification = Notification(
            user_id=user_id,
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            link=notification_data.link
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def get_notifications(self, user_id: int, unread_only: bool = False) -> List[Notification]:
        """Récupérer les notifications d'un utilisateur"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.read == False)
        return query.order_by(Notification.created_at.desc()).all()
    
    def get_notification(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Récupérer une notification par ID"""
        return self.db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()
    
    def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Marquer une notification comme lue"""
        notification = self.get_notification(notification_id, user_id)
        if not notification:
            return None
        
        notification.read = True
        notification.read_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def mark_all_as_read(self, user_id: int) -> int:
        """Marquer toutes les notifications comme lues"""
        count = self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.read == False
            )
        ).update({
            'read': True,
            'read_at': datetime.utcnow()
        })
        self.db.commit()
        return count
    
    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Supprimer une notification"""
        notification = self.get_notification(notification_id, user_id)
        if not notification:
            return False
        
        self.db.delete(notification)
        self.db.commit()
        return True
    
    def get_unread_count(self, user_id: int) -> int:
        """Récupérer le nombre de notifications non lues"""
        return self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.read == False
            )
        ).count()
    
    def create_system_notification(self, user_id: int, type: str, title: str, message: str, link: Optional[str] = None) -> Notification:
        """Créer une notification système"""
        notification_data = NotificationCreate(
            type=type,
            title=title,
            message=message,
            link=link
        )
        return self.create_notification(notification_data, user_id)
    
    def create_email_campaign_notification(self, user_id: int, campaign_name: str, status: str) -> Notification:
        """Créer une notification pour une campagne email"""
        if status == "sent":
            title = "Campagne envoyée"
            message = f"La campagne '{campaign_name}' a été envoyée avec succès."
            link = "/admin/email-campaigns"
        elif status == "failed":
            title = "Échec d'envoi"
            message = f"L'envoi de la campagne '{campaign_name}' a échoué."
            link = "/admin/email-campaigns"
        elif status == "scheduled":
            title = "Campagne planifiée"
            message = f"La campagne '{campaign_name}' a été planifiée."
            link = "/admin/email-campaigns"
        else:
            title = "Campagne mise à jour"
            message = f"La campagne '{campaign_name}' a été mise à jour."
            link = "/admin/email-campaigns"
        
        return self.create_system_notification(
            user_id=user_id,
            type="email_campaign",
            title=title,
            message=message,
            link=link
        )
    
    def create_ticket_notification(self, user_id: int, ticket_title: str, action: str) -> Notification:
        """Créer une notification pour un ticket"""
        if action == "created":
            title = "Nouveau ticket"
            message = f"Un nouveau ticket a été créé : '{ticket_title}'"
            link = "/admin/tickets"
        elif action == "updated":
            title = "Ticket mis à jour"
            message = f"Le ticket '{ticket_title}' a été mis à jour."
            link = "/admin/tickets"
        elif action == "closed":
            title = "Ticket fermé"
            message = f"Le ticket '{ticket_title}' a été fermé."
            link = "/admin/tickets"
        else:
            title = "Ticket modifié"
            message = f"Le ticket '{ticket_title}' a été modifié."
            link = "/admin/tickets"
        
        return self.create_system_notification(
            user_id=user_id,
            type="ticket",
            title=title,
            message=message,
            link=link
        )
    
    def create_project_notification(self, user_id: int, project_name: str, action: str) -> Notification:
        """Créer une notification pour un projet"""
        if action == "created":
            title = "Nouveau projet"
            message = f"Un nouveau projet a été créé : '{project_name}'"
            link = "/admin/projects"
        elif action == "updated":
            title = "Projet mis à jour"
            message = f"Le projet '{project_name}' a été mis à jour."
            link = "/admin/projects"
        elif action == "completed":
            title = "Projet terminé"
            message = f"Le projet '{project_name}' a été marqué comme terminé."
            link = "/admin/projects"
        else:
            title = "Projet modifié"
            message = f"Le projet '{project_name}' a été modifié."
            link = "/admin/projects"
        
        return self.create_system_notification(
            user_id=user_id,
            type="project",
            title=title,
            message=message,
            link=link
        )
    
    def cleanup_old_notifications(self, days: int = 30) -> int:
        """Nettoyer les anciennes notifications"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        count = self.db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).delete()
        self.db.commit()
        return count
