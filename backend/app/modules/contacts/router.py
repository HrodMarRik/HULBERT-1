from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime

from ..db import get_db
from ..security import get_current_user
from ..models import Contact, Company, Project, Interaction, Document, User, BudgetTransaction, Ticket
from ..schemas import (
    ContactCreate, ContactUpdate, ContactResponse, ContactDetailResponse,
    CompanyResponse,
    InteractionCreate, InteractionResponse,
    DocumentCreate, DocumentResponse
)

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=List[ContactResponse])
def list_contacts(
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    position: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les contacts avec filtres optionnels"""
    query = db.query(Contact)
    
    if company_id:
        query = query.filter(Contact.company_id == company_id)
    if status:
        query = query.filter(Contact.status == status)
    if position:
        query = query.filter(Contact.position.contains(position))
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',')]
        for tag in tag_list:
            query = query.filter(Contact.tags.contains(tag))
    if search:
        search_filter = or_(
            Contact.first_name.contains(search),
            Contact.last_name.contains(search),
            Contact.email.contains(search),
            Contact.position.contains(search)
        )
        query = query.filter(search_filter)
    
    contacts = query.order_by(Contact.created_at.desc()).offset(skip).limit(limit).all()
    
    # Ajouter le nom de l'entreprise
    for contact in contacts:
        if contact.company:
            contact.company_name = contact.company.name
        else:
            contact.company_name = None
    
    return contacts


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau contact"""
    contact = Contact(
        **contact_data.dict(),
        created_by_user_id=current_user.id
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    if contact.company:
        contact.company_name = contact.company.name
    else:
        contact.company_name = None
    
    return contact


@router.get("/{contact_id}", response_model=ContactDetailResponse)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un contact avec ses interactions et documents"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    if contact.company:
        contact.company_name = contact.company.name
    
    # Enrichir chaque projet avec des statistiques
    for project in contact.projects_as_primary:
        # Calculer le budget dépensé
        transactions = db.query(BudgetTransaction).filter(
            BudgetTransaction.project_id == project.id
        ).all()
        
        total_spent = sum(t.amount for t in transactions if t.transaction_type == 'expense')
        total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
        
        # Calculer le budget total (utiliser le budget du projet ou les revenus)
        total_budget = project.budget if project.budget and project.budget > 0 else total_income
        remaining_budget = total_budget - total_spent
        
        # Compter les tickets actifs et complétés
        tickets = db.query(Ticket).filter(Ticket.project_id == project.id).all()
        active_tickets = sum(1 for t in tickets if t.status in ['open', 'in_progress'])
        completed_tickets = sum(1 for t in tickets if t.status in ['resolved', 'closed'])
        
        # Ajouter les statistiques au projet
        project.total_spent = total_spent
        project.remaining_budget = remaining_budget
        project.active_tickets_count = active_tickets
        project.completed_tickets_count = completed_tickets
    
    return contact


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un contact"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_dict = contact_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    
    if contact.company:
        contact.company_name = contact.company.name
    else:
        contact.company_name = None
    
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un contact"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return None


@router.get("/stats/summary")
def get_contact_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les statistiques globales des contacts"""
    total = db.query(func.count(Contact.id)).scalar()
    active = db.query(func.count(Contact.id)).filter(Contact.status == "active").scalar()
    inactive = db.query(func.count(Contact.id)).filter(Contact.status == "inactive").scalar()
    
    # Stats par entreprise
    companies = db.query(Company.name, func.count(Contact.id)).join(Contact).group_by(Company.name).all()
    
    # Stats par position
    positions = db.query(Contact.position, func.count(Contact.id)).filter(Contact.position.isnot(None)).group_by(Contact.position).all()
    
    return {
        "total": total,
        "by_status": {
            "active": active,
            "inactive": inactive
        },
        "by_company": dict(companies),
        "by_position": dict(positions)
    }


@router.post("/{contact_id}/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
def add_interaction_to_contact(
    contact_id: int,
    interaction_data: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute une interaction à un contact"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    interaction = Interaction(
        **interaction_data.dict(),
        contact_id=contact_id,
        company_id=contact.company_id,
        user_id=current_user.id
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    interaction.user_name = current_user.username
    
    return interaction


@router.post("/{contact_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def add_document_to_contact(
    contact_id: int,
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un document à un contact"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    document = Document(
        **document_data.dict(),
        contact_id=contact_id,
        company_id=contact.company_id,
        uploaded_by_user_id=current_user.id
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document
