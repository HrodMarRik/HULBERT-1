from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime

from ..db import get_db
from ..security import get_current_user
from ..models import Company, Contact, Project, Interaction, Document, User, BudgetTransaction, Ticket
from ..schemas import (
    CompanyCreate, CompanyUpdate, CompanyResponse, CompanyDetailResponse,
    ContactCreate, ContactResponse,
    ProjectCreate, ProjectResponse,
    InteractionCreate, InteractionResponse,
    DocumentCreate, DocumentResponse
)

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=List[CompanyResponse])
def list_companies(
    status: Optional[str] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste toutes les entreprises avec filtres optionnels"""
    query = db.query(Company)
    
    if status:
        query = query.filter(Company.status == status)
    if industry:
        query = query.filter(Company.industry == industry)
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',')]
        for tag in tag_list:
            query = query.filter(Company.tags.contains(tag))
    if search:
        search_filter = or_(
            Company.name.contains(search),
            Company.email.contains(search),
            Company.notes.contains(search)
        )
        query = query.filter(search_filter)
    
    companies = query.order_by(Company.created_at.desc()).offset(skip).limit(limit).all()
    
    # Ajouter les compteurs
    for company in companies:
        company.contacts_count = len(company.contacts)
        company.projects_count = len(company.projects)
    
    return companies


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée une nouvelle entreprise"""
    company = Company(
        **company_data.dict(),
        created_by_user_id=current_user.id
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    company.contacts_count = 0
    company.projects_count = 0
    
    return company


@router.get("/{company_id}", response_model=CompanyDetailResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère une entreprise avec ses contacts, projets et interactions"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Ajouter les compteurs
    company.contacts_count = len(company.contacts)
    company.projects_count = len(company.projects)
    
    # Enrichir chaque projet avec des statistiques
    for project in company.projects:
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
    
    return company


@router.patch("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour une entreprise"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_dict = company_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    company.contacts_count = len(company.contacts)
    company.projects_count = len(company.projects)
    
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime une entreprise"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(company)
    db.commit()
    return None


@router.get("/stats/summary")
def get_company_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les statistiques globales des entreprises"""
    total = db.query(func.count(Company.id)).scalar()
    clients = db.query(func.count(Company.id)).filter(Company.status == "client").scalar()
    prospects = db.query(func.count(Company.id)).filter(Company.status == "prospect").scalar()
    archived = db.query(func.count(Company.id)).filter(Company.status == "archived").scalar()
    
    # Stats par industrie
    industries = db.query(Company.industry, func.count(Company.id)).group_by(Company.industry).all()
    
    # Projets actifs
    active_projects = db.query(func.count(Project.id)).filter(Project.status.in_(["planning", "active"])).scalar()
    
    return {
        "total": total,
        "by_status": {
            "client": clients,
            "prospect": prospects,
            "archived": archived
        },
        "by_industry": dict(industries),
        "active_projects": active_projects
    }


@router.post("/{company_id}/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact_to_company(
    company_id: int,
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un contact à une entreprise"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    contact = Contact(
        **contact_data.dict(),
        company_id=company_id,
        created_by_user_id=current_user.id
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    contact.company_name = company.name
    
    return contact


@router.post("/{company_id}/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def add_project_to_company(
    company_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un projet à une entreprise"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    project = Project(
        **project_data.dict(),
        company_id=company_id,
        created_by_user_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    project.company_name = company.name
    
    return project


@router.post("/{company_id}/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
def add_interaction_to_company(
    company_id: int,
    interaction_data: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute une interaction à une entreprise"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    interaction = Interaction(
        **interaction_data.dict(),
        company_id=company_id,
        user_id=current_user.id
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    interaction.user_name = current_user.username
    
    return interaction


@router.post("/{company_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def add_document_to_company(
    company_id: int,
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un document à une entreprise"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    document = Document(
        **document_data.dict(),
        company_id=company_id,
        uploaded_by_user_id=current_user.id
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document
