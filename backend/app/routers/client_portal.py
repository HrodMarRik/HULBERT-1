"""
Router pour le portail client
Endpoints publics et admin pour la gestion des tokens et tickets clients
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import get_current_user
from ..models import User, ClientTicketToken
from ..schemas import (
    ClientTicketTokenCreate,
    ClientTicketTokenUpdate,
    ClientTicketTokenResponse,
    ClientTicketCreate,
    TicketResponse
)
from ..services.client_portal_service import ClientPortalService
from ..exceptions import AppException

router = APIRouter(prefix="/api/client-portal", tags=["client-portal"])


# ============================================
# ENDPOINTS ADMIN (protégés)
# ============================================

@router.post("/tokens", response_model=ClientTicketTokenResponse)
def create_token(
    token_data: ClientTicketTokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Créer un nouveau token pour un client (ADMIN)
    """
    try:
        service = ClientPortalService(db)
        token = service.generate_token(
            contact_id=token_data.contact_id,
            project_id=token_data.project_id,
            created_by_user_id=current_user.id,
            expires_at=token_data.expires_at,
            max_tickets=token_data.max_tickets,
            password=token_data.password
        )
        return token
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/tokens", response_model=List[ClientTicketTokenResponse])
def list_tokens(
    contact_id: Optional[int] = None,
    project_id: Optional[int] = None,
    active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lister les tokens (ADMIN)
    """
    query = db.query(ClientTicketToken)
    
    if contact_id:
        query = query.filter(ClientTicketToken.contact_id == contact_id)
    if project_id:
        query = query.filter(ClientTicketToken.project_id == project_id)
    if active is not None:
        query = query.filter(ClientTicketToken.active == active)
    
    tokens = query.offset(skip).limit(limit).all()
    return tokens


@router.get("/tokens/{token_id}", response_model=ClientTicketTokenResponse)
def get_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer un token par ID (ADMIN)
    """
    token = db.query(ClientTicketToken).filter(ClientTicketToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    return token


@router.patch("/tokens/{token_id}", response_model=ClientTicketTokenResponse)
def update_token(
    token_id: int,
    token_data: ClientTicketTokenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mettre à jour un token (ADMIN)
    """
    token = db.query(ClientTicketToken).filter(ClientTicketToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if token_data.active is not None:
        token.active = token_data.active
    if token_data.expires_at is not None:
        token.expires_at = token_data.expires_at
    if token_data.max_tickets is not None:
        token.max_tickets = token_data.max_tickets
    
    db.commit()
    db.refresh(token)
    return token


@router.post("/tokens/{token_id}/regenerate", response_model=ClientTicketTokenResponse)
def regenerate_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Régénérer un token (nouveau UUID) (ADMIN)
    """
    try:
        service = ClientPortalService(db)
        token = service.regenerate_token(token_id, current_user.id)
        return token
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Désactiver un token (ADMIN)
    """
    try:
        service = ClientPortalService(db)
        service.deactivate_token(token_id)
        return None
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ============================================
# ENDPOINTS PUBLICS (non protégés)
# ============================================

@router.get("/auth/{token}")
def validate_token(
    token: str,
    password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Valider un token (PUBLIC)
    Retourne les informations du contact si valide
    """
    try:
        service = ClientPortalService(db)
        token_obj = service.validate_token(token, password)
        
        return {
            "valid": True,
            "contact": {
                "id": token_obj.contact.id,
                "first_name": token_obj.contact.first_name,
                "last_name": token_obj.contact.last_name,
                "email": token_obj.contact.email
            },
            "project_id": token_obj.project_id,
            "requires_password": token_obj.password_hash is not None
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/tickets", response_model=TicketResponse)
def create_client_ticket(
    ticket_data: ClientTicketCreate,
    token: str = Query(..., description="Token du client"),
    password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Créer un ticket via le portail client (PUBLIC)
    """
    try:
        service = ClientPortalService(db)
        ticket = service.create_client_ticket(
            token_str=token,
            title=ticket_data.title,
            description=ticket_data.description,
            theme=ticket_data.theme,
            priority=ticket_data.priority,
            password=password
        )
        return ticket
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/tickets", response_model=List[TicketResponse])
def get_client_tickets(
    token: str = Query(..., description="Token du client"),
    password: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Récupérer les tickets d'un client (PUBLIC)
    """
    try:
        service = ClientPortalService(db)
        tickets = service.get_client_tickets(token, password)
        return tickets
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

