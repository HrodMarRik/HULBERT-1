from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db import get_db
from app.security import get_current_user
from app.models import User
from app.services.email_campaign_service import EmailCampaignService
from app.schemas import (
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateResponse,
    EmailCampaignCreate, EmailCampaignUpdate, EmailCampaignResponse,
    EmailRecipientCreate, EmailRecipientResponse,
    EmailListCreate, EmailListUpdate, EmailListResponse,
    CampaignStatsResponse
)

router = APIRouter(prefix="/api/email-campaigns", tags=["email-campaigns"])


# Email Templates
@router.post("/templates", response_model=EmailTemplateResponse)
def create_template(
    template_data: EmailTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouveau template email"""
    service = EmailCampaignService(db)
    template = service.create_template(template_data, current_user.id)
    return template


@router.get("/templates", response_model=List[EmailTemplateResponse])
def get_templates(
    template_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les templates email"""
    service = EmailCampaignService(db)
    templates = service.get_templates(current_user.id, template_type)
    return templates


@router.get("/templates/{template_id}", response_model=EmailTemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un template par ID"""
    service = EmailCampaignService(db)
    template = service.get_template(template_id, current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
def update_template(
    template_id: int,
    template_data: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour un template"""
    service = EmailCampaignService(db)
    template = service.update_template(template_id, template_data, current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un template"""
    service = EmailCampaignService(db)
    success = service.delete_template(template_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}


# Email Campaigns
@router.post("/campaigns", response_model=EmailCampaignResponse)
def create_campaign(
    campaign_data: EmailCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle campagne email"""
    service = EmailCampaignService(db)
    campaign = service.create_campaign(campaign_data, current_user.id)
    return campaign


@router.get("/campaigns", response_model=List[EmailCampaignResponse])
def get_campaigns(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les campagnes email"""
    service = EmailCampaignService(db)
    campaigns = service.get_campaigns(current_user.id, project_id)
    return campaigns


@router.get("/campaigns/{campaign_id}", response_model=EmailCampaignResponse)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une campagne par ID"""
    service = EmailCampaignService(db)
    campaign = service.get_campaign(campaign_id, current_user.id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.put("/campaigns/{campaign_id}", response_model=EmailCampaignResponse)
def update_campaign(
    campaign_id: int,
    campaign_data: EmailCampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour une campagne"""
    service = EmailCampaignService(db)
    campaign = service.update_campaign(campaign_id, campaign_data, current_user.id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une campagne"""
    service = EmailCampaignService(db)
    success = service.delete_campaign(campaign_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted successfully"}


@router.post("/campaigns/{campaign_id}/send")
def send_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Envoyer une campagne email"""
    service = EmailCampaignService(db)
    success = service.send_campaign(campaign_id, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot send campaign")
    return {"message": "Campaign sent successfully"}


@router.post("/campaigns/{campaign_id}/schedule")
def schedule_campaign(
    campaign_id: int,
    scheduled_at: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Planifier l'envoi d'une campagne"""
    service = EmailCampaignService(db)
    success = service.schedule_campaign(campaign_id, scheduled_at, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot schedule campaign")
    return {"message": "Campaign scheduled successfully"}


@router.get("/campaigns/{campaign_id}/stats", response_model=CampaignStatsResponse)
def get_campaign_stats(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les statistiques d'une campagne"""
    service = EmailCampaignService(db)
    stats = service.get_campaign_stats(campaign_id, current_user.id)
    if not stats:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return stats


# Email Recipients
@router.post("/campaigns/{campaign_id}/recipients", response_model=List[EmailRecipientResponse])
def add_recipients_to_campaign(
    campaign_id: int,
    recipients_data: List[EmailRecipientCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajouter des destinataires à une campagne"""
    service = EmailCampaignService(db)
    recipients = service.add_recipients_to_campaign(campaign_id, recipients_data, current_user.id)
    return recipients


@router.get("/campaigns/{campaign_id}/recipients", response_model=List[EmailRecipientResponse])
def get_campaign_recipients(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les destinataires d'une campagne"""
    service = EmailCampaignService(db)
    recipients = service.get_campaign_recipients(campaign_id, current_user.id)
    return recipients


# Email Lists
@router.post("/lists", response_model=EmailListResponse)
def create_email_list(
    list_data: EmailListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle liste de diffusion"""
    service = EmailCampaignService(db)
    email_list = service.create_email_list(list_data, current_user.id)
    return email_list


@router.get("/lists", response_model=List[EmailListResponse])
def get_email_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les listes de diffusion"""
    service = EmailCampaignService(db)
    email_lists = service.get_email_lists(current_user.id)
    return email_lists


@router.get("/lists/{list_id}", response_model=EmailListResponse)
def get_email_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une liste par ID"""
    service = EmailCampaignService(db)
    email_list = service.get_email_list(list_id, current_user.id)
    if not email_list:
        raise HTTPException(status_code=404, detail="Email list not found")
    return email_list


@router.put("/lists/{list_id}", response_model=EmailListResponse)
def update_email_list(
    list_id: int,
    list_data: EmailListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour une liste de diffusion"""
    service = EmailCampaignService(db)
    email_list = service.update_email_list(list_id, list_data, current_user.id)
    if not email_list:
        raise HTTPException(status_code=404, detail="Email list not found")
    return email_list


@router.delete("/lists/{list_id}")
def delete_email_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une liste de diffusion"""
    service = EmailCampaignService(db)
    success = service.delete_email_list(list_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Email list not found")
    return {"message": "Email list deleted successfully"}


# Dashboard Stats
@router.get("/dashboard/stats")
def get_email_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les statistiques pour le dashboard"""
    service = EmailCampaignService(db)
    
    # Statistiques générales
    campaigns = service.get_campaigns(current_user.id)
    templates = service.get_templates(current_user.id)
    email_lists = service.get_email_lists(current_user.id)
    
    # Calculer les totaux
    total_campaigns = len(campaigns)
    total_templates = len(templates)
    total_lists = len(email_lists)
    
    # Campagnes par statut
    campaigns_by_status = {}
    for campaign in campaigns:
        status = campaign.status
        campaigns_by_status[status] = campaigns_by_status.get(status, 0) + 1
    
    # Campagnes récentes (dernières 30 jours)
    recent_campaigns = [
        c for c in campaigns 
        if c.created_at >= datetime.utcnow().replace(day=1)  # Ce mois
    ]
    
    return {
        "total_campaigns": total_campaigns,
        "total_templates": total_templates,
        "total_lists": total_lists,
        "campaigns_by_status": campaigns_by_status,
        "recent_campaigns": len(recent_campaigns),
        "recent_campaigns_data": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "created_at": c.created_at,
                "total_recipients": c.total_recipients
            }
            for c in recent_campaigns[:5]  # 5 plus récentes
        ]
    }
