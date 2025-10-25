import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models import EmailTemplate, EmailCampaign, EmailRecipient, EmailList, Contact, Project
from app.schemas import (
    EmailTemplateCreate, EmailTemplateUpdate,
    EmailCampaignCreate, EmailCampaignUpdate,
    EmailRecipientCreate, EmailListCreate, EmailListUpdate
)

logger = logging.getLogger(__name__)


class EmailCampaignService:
    def __init__(self, db: Session):
        self.db = db
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        
    # Email Templates
    def create_template(self, template_data: EmailTemplateCreate, user_id: int) -> EmailTemplate:
        """Créer un nouveau template email"""
        template = EmailTemplate(
            name=template_data.name,
            type=template_data.type,
            subject=template_data.subject,
            body_html=template_data.body_html,
            variables=template_data.variables,
            created_by_user_id=user_id
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def get_templates(self, user_id: int, template_type: Optional[str] = None) -> List[EmailTemplate]:
        """Récupérer les templates email"""
        query = self.db.query(EmailTemplate).filter(EmailTemplate.created_by_user_id == user_id)
        if template_type:
            query = query.filter(EmailTemplate.type == template_type)
        return query.order_by(EmailTemplate.created_at.desc()).all()
    
    def get_template(self, template_id: int, user_id: int) -> Optional[EmailTemplate]:
        """Récupérer un template par ID"""
        return self.db.query(EmailTemplate).filter(
            and_(
                EmailTemplate.id == template_id,
                EmailTemplate.created_by_user_id == user_id
            )
        ).first()
    
    def update_template(self, template_id: int, template_data: EmailTemplateUpdate, user_id: int) -> Optional[EmailTemplate]:
        """Mettre à jour un template"""
        template = self.get_template(template_id, user_id)
        if not template:
            return None
        
        if template_data.name is not None:
            template.name = template_data.name
        if template_data.type is not None:
            template.type = template_data.type
        if template_data.subject is not None:
            template.subject = template_data.subject
        if template_data.body_html is not None:
            template.body_html = template_data.body_html
        if template_data.variables is not None:
            template.variables = template_data.variables
        
        template.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def delete_template(self, template_id: int, user_id: int) -> bool:
        """Supprimer un template"""
        template = self.get_template(template_id, user_id)
        if not template:
            return False
        
        self.db.delete(template)
        self.db.commit()
        return True
    
    # Email Campaigns
    def create_campaign(self, campaign_data: EmailCampaignCreate, user_id: int) -> EmailCampaign:
        """Créer une nouvelle campagne email"""
        campaign = EmailCampaign(
            project_id=campaign_data.project_id,
            template_id=campaign_data.template_id,
            name=campaign_data.name,
            subject=campaign_data.subject,
            body_html=campaign_data.body_html,
            scheduled_at=campaign_data.scheduled_at,
            created_by_user_id=user_id
        )
        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign
    
    def get_campaigns(self, user_id: int, project_id: Optional[int] = None) -> List[EmailCampaign]:
        """Récupérer les campagnes email"""
        query = self.db.query(EmailCampaign).filter(EmailCampaign.created_by_user_id == user_id)
        if project_id:
            query = query.filter(EmailCampaign.project_id == project_id)
        return query.order_by(EmailCampaign.created_at.desc()).all()
    
    def get_campaign(self, campaign_id: int, user_id: int) -> Optional[EmailCampaign]:
        """Récupérer une campagne par ID"""
        return self.db.query(EmailCampaign).filter(
            and_(
                EmailCampaign.id == campaign_id,
                EmailCampaign.created_by_user_id == user_id
            )
        ).first()
    
    def update_campaign(self, campaign_id: int, campaign_data: EmailCampaignUpdate, user_id: int) -> Optional[EmailCampaign]:
        """Mettre à jour une campagne"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign:
            return None
        
        if campaign_data.name is not None:
            campaign.name = campaign_data.name
        if campaign_data.subject is not None:
            campaign.subject = campaign_data.subject
        if campaign_data.body_html is not None:
            campaign.body_html = campaign_data.body_html
        if campaign_data.status is not None:
            campaign.status = campaign_data.status
        if campaign_data.scheduled_at is not None:
            campaign.scheduled_at = campaign_data.scheduled_at
        
        campaign.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(campaign)
        return campaign
    
    def delete_campaign(self, campaign_id: int, user_id: int) -> bool:
        """Supprimer une campagne"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign:
            return False
        
        self.db.delete(campaign)
        self.db.commit()
        return True
    
    # Email Recipients
    def add_recipients_to_campaign(self, campaign_id: int, recipients_data: List[EmailRecipientCreate], user_id: int) -> List[EmailRecipient]:
        """Ajouter des destinataires à une campagne"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign:
            return []
        
        recipients = []
        for recipient_data in recipients_data:
            recipient = EmailRecipient(
                campaign_id=campaign_id,
                contact_id=recipient_data.contact_id,
                email=recipient_data.email,
                name=recipient_data.name
            )
            recipients.append(recipient)
            self.db.add(recipient)
        
        # Mettre à jour le nombre total de destinataires
        campaign.total_recipients = len(self.db.query(EmailRecipient).filter(EmailRecipient.campaign_id == campaign_id).all())
        
        self.db.commit()
        for recipient in recipients:
            self.db.refresh(recipient)
        return recipients
    
    def get_campaign_recipients(self, campaign_id: int, user_id: int) -> List[EmailRecipient]:
        """Récupérer les destinataires d'une campagne"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign:
            return []
        
        return self.db.query(EmailRecipient).filter(EmailRecipient.campaign_id == campaign_id).all()
    
    def get_campaign_stats(self, campaign_id: int, user_id: int) -> Dict[str, Any]:
        """Récupérer les statistiques d'une campagne"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign:
            return {}
        
        recipients = self.get_campaign_recipients(campaign_id, user_id)
        
        stats = {
            "campaign_id": campaign_id,
            "total_recipients": len(recipients),
            "sent_count": len([r for r in recipients if r.status in ["sent", "opened", "clicked"]]),
            "opened_count": len([r for r in recipients if r.status in ["opened", "clicked"]]),
            "clicked_count": len([r for r in recipients if r.status == "clicked"]),
            "bounced_count": len([r for r in recipients if r.status == "bounced"]),
        }
        
        # Calculer les taux
        if stats["total_recipients"] > 0:
            stats["open_rate"] = stats["opened_count"] / stats["total_recipients"]
            stats["click_rate"] = stats["clicked_count"] / stats["total_recipients"]
            stats["bounce_rate"] = stats["bounced_count"] / stats["total_recipients"]
        else:
            stats["open_rate"] = 0.0
            stats["click_rate"] = 0.0
            stats["bounce_rate"] = 0.0
        
        return stats
    
    # Email Lists
    def create_email_list(self, list_data: EmailListCreate, user_id: int) -> EmailList:
        """Créer une nouvelle liste de diffusion"""
        email_list = EmailList(
            name=list_data.name,
            description=list_data.description,
            contact_ids=list_data.contact_ids,
            filters=list_data.filters,
            created_by_user_id=user_id
        )
        
        # Calculer le nombre total de contacts
        if list_data.contact_ids:
            email_list.total_contacts = len(list_data.contact_ids)
        elif list_data.filters:
            # Appliquer les filtres pour compter les contacts
            email_list.total_contacts = self._count_contacts_by_filters(list_data.filters, user_id)
        
        self.db.add(email_list)
        self.db.commit()
        self.db.refresh(email_list)
        return email_list
    
    def get_email_lists(self, user_id: int) -> List[EmailList]:
        """Récupérer les listes de diffusion"""
        return self.db.query(EmailList).filter(EmailList.created_by_user_id == user_id).order_by(EmailList.created_at.desc()).all()
    
    def get_email_list(self, list_id: int, user_id: int) -> Optional[EmailList]:
        """Récupérer une liste par ID"""
        return self.db.query(EmailList).filter(
            and_(
                EmailList.id == list_id,
                EmailList.created_by_user_id == user_id
            )
        ).first()
    
    def update_email_list(self, list_id: int, list_data: EmailListUpdate, user_id: int) -> Optional[EmailList]:
        """Mettre à jour une liste de diffusion"""
        email_list = self.get_email_list(list_id, user_id)
        if not email_list:
            return None
        
        if list_data.name is not None:
            email_list.name = list_data.name
        if list_data.description is not None:
            email_list.description = list_data.description
        if list_data.contact_ids is not None:
            email_list.contact_ids = list_data.contact_ids
            email_list.total_contacts = len(list_data.contact_ids)
        if list_data.filters is not None:
            email_list.filters = list_data.filters
            email_list.total_contacts = self._count_contacts_by_filters(list_data.filters, user_id)
        
        email_list.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(email_list)
        return email_list
    
    def delete_email_list(self, list_id: int, user_id: int) -> bool:
        """Supprimer une liste de diffusion"""
        email_list = self.get_email_list(list_id, user_id)
        if not email_list:
            return False
        
        self.db.delete(email_list)
        self.db.commit()
        return True
    
    def _count_contacts_by_filters(self, filters: Dict[str, Any], user_id: int) -> int:
        """Compter les contacts selon les filtres"""
        query = self.db.query(Contact).filter(Contact.user_id == user_id)
        
        if "company_id" in filters:
            query = query.filter(Contact.company_id == filters["company_id"])
        if "status" in filters:
            query = query.filter(Contact.status == filters["status"])
        if "tags" in filters:
            # Recherche dans les tags JSON
            for tag in filters["tags"]:
                query = query.filter(Contact.tags.contains([tag]))
        
        return query.count()
    
    def get_contacts_from_list(self, list_id: int, user_id: int) -> List[Contact]:
        """Récupérer les contacts d'une liste de diffusion"""
        email_list = self.get_email_list(list_id, user_id)
        if not email_list:
            return []
        
        if email_list.contact_ids:
            # Liste statique d'IDs
            return self.db.query(Contact).filter(
                and_(
                    Contact.id.in_(email_list.contact_ids),
                    Contact.user_id == user_id
                )
            ).all()
        elif email_list.filters:
            # Liste dynamique basée sur les filtres
            query = self.db.query(Contact).filter(Contact.user_id == user_id)
            
            if "company_id" in email_list.filters:
                query = query.filter(Contact.company_id == email_list.filters["company_id"])
            if "status" in email_list.filters:
                query = query.filter(Contact.status == email_list.filters["status"])
            if "tags" in email_list.filters:
                for tag in email_list.filters["tags"]:
                    query = query.filter(Contact.tags.contains([tag]))
            
            return query.all()
        
        return []
    
    # SendGrid Integration (simulation pour le développement)
    def send_campaign(self, campaign_id: int, user_id: int) -> bool:
        """Envoyer une campagne email (simulation)"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign or campaign.status != "draft":
            return False
        
        # Simulation d'envoi
        campaign.status = "sending"
        campaign.sent_at = datetime.utcnow()
        
        recipients = self.get_campaign_recipients(campaign_id, user_id)
        
        # Simuler l'envoi à chaque destinataire
        for recipient in recipients:
            recipient.status = "sent"
            recipient.sent_at = datetime.utcnow()
        
        campaign.status = "sent"
        campaign.sent_count = len(recipients)
        
        self.db.commit()
        
        logger.info(f"Campaign {campaign_id} sent to {len(recipients)} recipients")
        return True
    
    def schedule_campaign(self, campaign_id: int, scheduled_at: datetime, user_id: int) -> bool:
        """Planifier l'envoi d'une campagne"""
        campaign = self.get_campaign(campaign_id, user_id)
        if not campaign or campaign.status != "draft":
            return False
        
        campaign.status = "scheduled"
        campaign.scheduled_at = scheduled_at
        
        self.db.commit()
        return True
