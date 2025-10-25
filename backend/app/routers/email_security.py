import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.dependencies import get_current_user
from app.services.email_security_service import EmailSecurityService
from app.schemas import (
    MonitoredEmailCreate, MonitoredEmailUpdate, MonitoredEmailResponse,
    EmailSecurityCheckResponse, EmailSecurityAlertResponse,
    EmailSecurityStatsResponse
)

router = APIRouter(prefix="/api/email-security", tags=["Email Security"])
logger = logging.getLogger(__name__)


# --- Monitored Emails ---
@router.post("/emails", response_model=MonitoredEmailResponse, status_code=status.HTTP_201_CREATED)
def create_monitored_email(
    email: MonitoredEmailCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter un email à surveiller"""
    service = EmailSecurityService(db)
    try:
        db_email = service.create_monitored_email(email, current_user.id)
        return db_email
    except Exception as e:
        logger.error(f"Error creating monitored email: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/emails", response_model=List[MonitoredEmailResponse])
def get_monitored_emails(
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des emails surveillés"""
    service = EmailSecurityService(db)
    emails = service.get_monitored_emails(current_user.id, active_only=active_only)
    return emails


@router.get("/emails/{email_id}", response_model=MonitoredEmailResponse)
def get_monitored_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir un email surveillé"""
    service = EmailSecurityService(db)
    email = service.get_monitored_email(email_id, current_user.id)
    if not email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    return email


@router.patch("/emails/{email_id}", response_model=MonitoredEmailResponse)
def update_monitored_email(
    email_id: int,
    email: MonitoredEmailUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un email surveillé"""
    service = EmailSecurityService(db)
    updated_email = service.update_monitored_email(email_id, email, current_user.id)
    if not updated_email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    return updated_email


@router.delete("/emails/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitored_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un email surveillé"""
    service = EmailSecurityService(db)
    success = service.delete_monitored_email(email_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")


@router.post("/emails/{email_id}/check", response_model=EmailSecurityCheckResponse)
def check_email_security(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vérifier la sécurité d'un email maintenant"""
    service = EmailSecurityService(db)
    check = service.check_email_security(email_id, current_user.id)
    if not check:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email not found")
    return check


# --- Security Checks ---
@router.get("/checks", response_model=List[EmailSecurityCheckResponse])
def get_security_checks(
    email_id: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Historique des vérifications"""
    service = EmailSecurityService(db)
    checks = service.get_security_checks(current_user.id, email_id=email_id, limit=limit)
    return checks


@router.get("/checks/latest/{email_id}", response_model=EmailSecurityCheckResponse)
def get_latest_check(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dernière vérification pour un email"""
    service = EmailSecurityService(db)
    check = service.get_latest_check(email_id, current_user.id)
    if not check:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No checks found")
    return check


# --- Alerts ---
@router.get("/alerts", response_model=List[EmailSecurityAlertResponse])
def get_alerts(
    acknowledged: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des alertes"""
    service = EmailSecurityService(db)
    alerts = service.get_alerts(current_user.id, acknowledged=acknowledged)
    return alerts


@router.post("/alerts/{alert_id}/acknowledge", response_model=EmailSecurityAlertResponse)
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Acquitter une alerte"""
    service = EmailSecurityService(db)
    alert = service.acknowledge_alert(alert_id, current_user.id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


# --- Stats ---
@router.get("/stats", response_model=EmailSecurityStatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Statistiques de sécurité email"""
    service = EmailSecurityService(db)
    stats = service.get_stats(current_user.id)
    return stats
