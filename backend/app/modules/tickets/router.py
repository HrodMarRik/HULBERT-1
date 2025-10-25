from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from ..db import get_db
from ..security import get_current_user
from ..models import Ticket, TicketComment, TicketHistory, User
from ..schemas import (
    TicketCreate, TicketUpdate, TicketResponse, TicketDetailResponse,
    TicketCommentCreate, TicketCommentResponse, TicketHistoryResponse
)

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.get("", response_model=List[TicketResponse])
def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    theme: Optional[str] = None,
    assigned_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les tickets avec filtres optionnels"""
    query = db.query(Ticket)
    
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if theme:
        query = query.filter(Ticket.theme == theme)
    if assigned_to:
        query = query.filter(Ticket.assigned_to == assigned_to)
    
    tickets = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    
    # Ajouter le nombre de commentaires
    for ticket in tickets:
        ticket.comment_count = db.query(func.count(TicketComment.id)).filter(
            TicketComment.ticket_id == ticket.id
        ).scalar()
    
    return tickets


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau ticket"""
    ticket = Ticket(
        **ticket_data.dict(),
        created_by_user_id=current_user.id
    )
    db.add(ticket)
    db.flush()
    
    # Créer l'entrée d'historique
    history = TicketHistory(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="created"
    )
    db.add(history)
    
    db.commit()
    db.refresh(ticket)
    ticket.comment_count = 0
    
    return ticket


@router.get("/history", response_model=List[TicketHistoryResponse])
def get_ticket_history(
    ticket_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère l'historique des modifications de tickets"""
    query = db.query(TicketHistory).join(User, TicketHistory.user_id == User.id)
    
    if ticket_id:
        query = query.filter(TicketHistory.ticket_id == ticket_id)
    
    history = query.order_by(TicketHistory.created_at.desc()).limit(limit).all()
    
    # Ajouter le nom d'utilisateur à chaque entrée
    for entry in history:
        entry.user_name = entry.user.username if entry.user else "Unknown"
    
    return history


@router.get("/stats/summary")
def get_ticket_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les statistiques globales des tickets"""
    total = db.query(func.count(Ticket.id)).scalar()
    open_count = db.query(func.count(Ticket.id)).filter(Ticket.status == "open").scalar()
    in_progress = db.query(func.count(Ticket.id)).filter(Ticket.status == "in_progress").scalar()
    resolved = db.query(func.count(Ticket.id)).filter(Ticket.status == "resolved").scalar()
    closed = db.query(func.count(Ticket.id)).filter(Ticket.status == "closed").scalar()
    
    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed
    }


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un ticket avec ses commentaires et historique"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.comment_count = len(ticket.comments)
    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Enregistrer les changements dans l'historique
    update_dict = ticket_data.dict(exclude_unset=True)
    for field, new_value in update_dict.items():
        if new_value is not None:
            old_value = getattr(ticket, field)
            if old_value != new_value:
                history = TicketHistory(
                    ticket_id=ticket.id,
                    user_id=current_user.id,
                    action="updated",
                    field_name=field,
                    old_value=str(old_value) if old_value else None,
                    new_value=str(new_value)
                )
                db.add(history)
                setattr(ticket, field, new_value)
    
    # Mettre à jour les dates spéciales
    if ticket_data.status == "resolved" and ticket.resolved_at is None:
        ticket.resolved_at = datetime.utcnow()
    elif ticket_data.status == "closed" and ticket.closed_at is None:
        ticket.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ticket)
    ticket.comment_count = db.query(func.count(TicketComment.id)).filter(
        TicketComment.ticket_id == ticket.id
    ).scalar()
    
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(ticket)
    db.commit()
    return None


@router.post("/{ticket_id}/comments", response_model=TicketCommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: int,
    comment_data: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un commentaire à un ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    db.add(comment)
    
    # Ajouter à l'historique
    history = TicketHistory(
        ticket_id=ticket_id,
        user_id=current_user.id,
        action="commented"
    )
    db.add(history)
    
    db.commit()
    db.refresh(comment)
    
    return comment
