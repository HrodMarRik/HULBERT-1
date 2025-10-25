from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime

from ..db import get_db
from ..security import get_current_user
from ..models import Project, Company, Contact, ProjectPhase, ProjectDeliverable, Document, User, ProjectNote, CalendarEvent, ProjectContact, BudgetContribution
from ..schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse,
    ProjectPhaseCreate, ProjectPhaseUpdate, ProjectPhaseResponse,
    ProjectDeliverableCreate, ProjectDeliverableUpdate, ProjectDeliverableResponse,
    CompanyResponse, ContactResponse,
    DocumentCreate, DocumentResponse,
    ProjectNoteCreate, ProjectNoteUpdate, ProjectNoteResponse,
    CalendarEventResponse,
    ProjectContactCreate, ProjectContactUpdate, ProjectContactResponse,
    BudgetContributionCreate, BudgetContributionResponse
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/tags", response_model=List[dict])
def get_project_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Endpoint temporaire pour récupérer les tags de projets"""
    # Pour l'instant, retournons des tags statiques
    return [
        {"id": 1, "name": "urgent", "entity_type": "project", "usage_count": 5},
        {"id": 2, "name": "important", "entity_type": "project", "usage_count": 3},
        {"id": 3, "name": "web-development", "entity_type": "project", "usage_count": 8},
        {"id": 4, "name": "mobile-app", "entity_type": "project", "usage_count": 2},
        {"id": 5, "name": "design", "entity_type": "project", "usage_count": 6},
    ]


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    primary_contact_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date_from: Optional[datetime] = None,
    start_date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les projets avec filtres optionnels"""
    query = db.query(Project)
    
    if company_id:
        query = query.filter(Project.company_id == company_id)
    if status:
        query = query.filter(Project.status == status)
    if primary_contact_id:
        query = query.filter(Project.primary_contact_id == primary_contact_id)
    if start_date_from:
        query = query.filter(Project.start_date >= start_date_from)
    if start_date_to:
        query = query.filter(Project.start_date <= start_date_to)
    if search:
        search_filter = or_(
            Project.title.contains(search),
            Project.description.contains(search),
            Project.team_assigned.contains(search)
        )
        query = query.filter(search_filter)
    
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()
    
    # Ajouter les noms des relations
    for project in projects:
        if project.company:
            project.company_name = project.company.name
        if project.primary_contact:
            project.primary_contact_name = f"{project.primary_contact.first_name} {project.primary_contact.last_name}"
    
    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau projet avec budget initial à 0"""
    project_dict = project_data.dict()
    project_dict['budget'] = 0.0  # Force le budget à 0 à la création
    project_dict['created_by_user_id'] = current_user.id
    
    project = Project(**project_dict)
    db.add(project)
    db.commit()
    db.refresh(project)
    
    if project.company:
        project.company_name = project.company.name
    if project.primary_contact:
        project.primary_contact_name = f"{project.primary_contact.first_name} {project.primary_contact.last_name}"
    
    return project


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un projet avec ses phases, livrables et documents"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.company:
        project.company_name = project.company.name
    if project.primary_contact:
        project.primary_contact_name = f"{project.primary_contact.first_name} {project.primary_contact.last_name}"
    
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un projet (budget non modifiable directement)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_dict = project_data.dict(exclude_unset=True)
    
    # Interdire la modification directe du budget
    if 'budget' in update_dict:
        raise HTTPException(
            status_code=400, 
            detail="Budget cannot be modified directly. Use budget contribution endpoints instead."
        )
    
    for field, value in update_dict.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    if project.company:
        project.company_name = project.company.name
    if project.primary_contact:
        project.primary_contact_name = f"{project.primary_contact.first_name} {project.primary_contact.last_name}"
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None


@router.get("/stats/summary")
def get_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère les statistiques globales des projets"""
    total = db.query(func.count(Project.id)).scalar()
    planning = db.query(func.count(Project.id)).filter(Project.status == "planning").scalar()
    active = db.query(func.count(Project.id)).filter(Project.status == "active").scalar()
    on_hold = db.query(func.count(Project.id)).filter(Project.status == "on-hold").scalar()
    completed = db.query(func.count(Project.id)).filter(Project.status == "completed").scalar()
    cancelled = db.query(func.count(Project.id)).filter(Project.status == "cancelled").scalar()
    
    # Budget total
    total_budget = db.query(func.sum(Project.budget)).scalar() or 0
    
    # Progression moyenne
    avg_progress = db.query(func.avg(Project.progress_percentage)).scalar() or 0
    
    return {
        "total": total,
        "by_status": {
            "planning": planning,
            "active": active,
            "on-hold": on_hold,
            "completed": completed,
            "cancelled": cancelled
        },
        "total_budget": total_budget,
        "average_progress": round(avg_progress, 2)
    }


# Project Phases
@router.post("/{project_id}/phases", response_model=ProjectPhaseResponse, status_code=status.HTTP_201_CREATED)
def add_phase_to_project(
    project_id: int,
    phase_data: ProjectPhaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute une phase à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    phase = ProjectPhase(
        **phase_data.dict(),
        project_id=project_id
    )
    db.add(phase)
    db.commit()
    db.refresh(phase)
    
    return phase


@router.patch("/{project_id}/phases/{phase_id}", response_model=ProjectPhaseResponse)
def update_project_phase(
    project_id: int,
    phase_id: int,
    phase_data: ProjectPhaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour une phase de projet"""
    phase = db.query(ProjectPhase).filter(
        ProjectPhase.id == phase_id,
        ProjectPhase.project_id == project_id
    ).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Project phase not found")
    
    update_dict = phase_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(phase, field, value)
    
    db.commit()
    db.refresh(phase)
    
    return phase


@router.delete("/{project_id}/phases/{phase_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_phase(
    project_id: int,
    phase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime une phase de projet"""
    phase = db.query(ProjectPhase).filter(
        ProjectPhase.id == phase_id,
        ProjectPhase.project_id == project_id
    ).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Project phase not found")
    
    db.delete(phase)
    db.commit()
    return None


# Project Deliverables
@router.post("/{project_id}/deliverables", response_model=ProjectDeliverableResponse, status_code=status.HTTP_201_CREATED)
def add_deliverable_to_project(
    project_id: int,
    deliverable_data: ProjectDeliverableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un livrable à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deliverable = ProjectDeliverable(
        **deliverable_data.dict(),
        project_id=project_id
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)
    
    return deliverable


@router.patch("/{project_id}/deliverables/{deliverable_id}", response_model=ProjectDeliverableResponse)
def update_project_deliverable(
    project_id: int,
    deliverable_id: int,
    deliverable_data: ProjectDeliverableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un livrable de projet"""
    deliverable = db.query(ProjectDeliverable).filter(
        ProjectDeliverable.id == deliverable_id,
        ProjectDeliverable.project_id == project_id
    ).first()
    if not deliverable:
        raise HTTPException(status_code=404, detail="Project deliverable not found")
    
    update_dict = deliverable_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(deliverable, field, value)
    
    # Si le statut passe à "completed", mettre à jour completed_at
    if deliverable_data.status == "completed" and not deliverable.completed_at:
        deliverable.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(deliverable)
    
    return deliverable


@router.delete("/{project_id}/deliverables/{deliverable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_deliverable(
    project_id: int,
    deliverable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un livrable de projet"""
    deliverable = db.query(ProjectDeliverable).filter(
        ProjectDeliverable.id == deliverable_id,
        ProjectDeliverable.project_id == project_id
    ).first()
    if not deliverable:
        raise HTTPException(status_code=404, detail="Project deliverable not found")
    
    db.delete(deliverable)
    db.commit()
    return None


# Project Documents
@router.post("/{project_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def add_document_to_project(
    project_id: int,
    document_data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un document à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    document = Document(
        **document_data.dict(),
        project_id=project_id,
        company_id=project.company_id,
        uploaded_by_user_id=current_user.id
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document


# Project Notes
@router.post("/{project_id}/notes", response_model=ProjectNoteResponse, status_code=status.HTTP_201_CREATED)
def add_note_to_project(
    project_id: int,
    note_data: ProjectNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute une note à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    note = ProjectNote(
        project_id=project_id,
        content=note_data.content,
        created_by_user_id=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Ajouter le nom d'utilisateur
    note.created_by_username = current_user.username
    
    return note


@router.get("/{project_id}/notes", response_model=List[ProjectNoteResponse])
def get_project_notes(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère toutes les notes d'un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    notes = db.query(ProjectNote).filter(ProjectNote.project_id == project_id)\
        .order_by(ProjectNote.created_at.desc()).all()
    
    # Ajouter les noms d'utilisateur
    for note in notes:
        note.created_by_username = note.created_by_user.username if note.created_by_user else None
    
    return notes


@router.put("/{project_id}/notes/{note_id}", response_model=ProjectNoteResponse)
def update_project_note(
    project_id: int,
    note_id: int,
    note_data: ProjectNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour une note de projet"""
    note = db.query(ProjectNote).filter(
        ProjectNote.id == note_id,
        ProjectNote.project_id == project_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Vérifier que l'utilisateur est l'auteur de la note
    if note.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")
    
    if note_data.content is not None:
        note.content = note_data.content
    
    db.commit()
    db.refresh(note)
    
    note.created_by_username = current_user.username
    return note


@router.delete("/{project_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_note(
    project_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime une note de projet"""
    note = db.query(ProjectNote).filter(
        ProjectNote.id == note_id,
        ProjectNote.project_id == project_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Vérifier que l'utilisateur est l'auteur de la note
    if note.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    db.delete(note)
    db.commit()
    return None


# Project Events
@router.get("/{project_id}/events", response_model=List[CalendarEventResponse])
def get_project_events(
    project_id: int,
    filter_type: Optional[str] = Query(None, description="Filter: 'upcoming', 'past', or None for all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère tous les événements liés à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    query = db.query(CalendarEvent).filter(CalendarEvent.project_id == project_id)
    
    now = datetime.utcnow()
    if filter_type == "upcoming":
        query = query.filter(CalendarEvent.start_datetime >= now)
    elif filter_type == "past":
        query = query.filter(CalendarEvent.start_datetime < now)
    
    events = query.order_by(CalendarEvent.start_datetime.desc()).all()
    
    # Ajouter les flags pour chaque événement
    results = []
    for event in events:
        response = CalendarEventResponse.model_validate(event)
        
        # Calculer les flags
        response.is_past = event.start_datetime < now
        response.is_today = event.start_datetime.date() == now.date()
        response.is_upcoming = event.start_datetime > now
        
        results.append(response)
    
    return results


# Project Contacts
@router.get("/{project_id}/contacts", response_model=List[ProjectContactResponse])
def get_project_contacts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère tous les contacts liés à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_contacts = db.query(ProjectContact).filter(ProjectContact.project_id == project_id).all()
    
    return project_contacts


@router.post("/{project_id}/contacts/{contact_id}", response_model=ProjectContactResponse)
def link_contact_to_project(
    project_id: int,
    contact_id: int,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lie un contact existant à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Vérifier si la liaison existe déjà
    existing_link = db.query(ProjectContact).filter(
        ProjectContact.project_id == project_id,
        ProjectContact.contact_id == contact_id
    ).first()
    
    if existing_link:
        raise HTTPException(status_code=400, detail="Contact already linked to this project")
    
    project_contact = ProjectContact(
        project_id=project_id,
        contact_id=contact_id,
        role=role
    )
    
    db.add(project_contact)
    db.commit()
    db.refresh(project_contact)
    
    return project_contact


@router.delete("/{project_id}/contacts/{contact_id}")
def unlink_contact_from_project(
    project_id: int,
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Délie un contact d'un projet"""
    project_contact = db.query(ProjectContact).filter(
        ProjectContact.project_id == project_id,
        ProjectContact.contact_id == contact_id
    ).first()
    
    if not project_contact:
        raise HTTPException(status_code=404, detail="Contact not linked to this project")
    
    db.delete(project_contact)
    db.commit()
    
    return {"message": "Contact unlinked from project"}


# Project Timeline
@router.get("/{project_id}/timeline")
def get_project_timeline(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère la timeline des activités d'un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    timeline = []
    
    # Ajouter la création du projet
    timeline.append({
        "id": f"project_created_{project.id}",
        "type": "project_created",
        "title": "Project Created",
        "description": f"Project '{project.title}' was created",
        "timestamp": project.created_at,
        "user": project.created_by_user.username if project.created_by_user else "Unknown",
        "icon": "📁"
    })
    
    # Ajouter les modifications du projet
    if project.updated_at != project.created_at:
        timeline.append({
            "id": f"project_updated_{project.id}",
            "type": "project_updated",
            "title": "Project Updated",
            "description": f"Project '{project.title}' was last updated",
            "timestamp": project.updated_at,
            "user": project.created_by_user.username if project.created_by_user else "Unknown",
            "icon": "✏️"
        })
    
    # Ajouter les notes
    notes = db.query(ProjectNote).filter(ProjectNote.project_id == project_id)\
        .order_by(ProjectNote.created_at.desc()).all()
    for note in notes:
        timeline.append({
            "id": f"note_{note.id}",
            "type": "note_added",
            "title": "Note Added",
            "description": note.content[:100] + "..." if len(note.content) > 100 else note.content,
            "timestamp": note.created_at,
            "user": note.created_by_user.username if note.created_by_user else "Unknown",
            "icon": "📝"
        })
    
    # Ajouter les documents uploadés
    documents = db.query(Document).filter(Document.project_id == project_id)\
        .order_by(Document.uploaded_at.desc()).all()
    for doc in documents:
        timeline.append({
            "id": f"document_{doc.id}",
            "type": "document_uploaded",
            "title": "Document Uploaded",
            "description": f"File '{doc.filename}' was uploaded",
            "timestamp": doc.uploaded_at,
            "user": doc.uploaded_by_user.username if doc.uploaded_by_user else "Unknown",
            "icon": "📄"
        })
    
    # Ajouter les événements liés
    events = db.query(CalendarEvent).filter(CalendarEvent.project_id == project_id)\
        .order_by(CalendarEvent.created_at.desc()).all()
    for event in events:
        timeline.append({
            "id": f"event_{event.id}",
            "type": "event_created",
            "title": "Event Created",
            "description": f"Event '{event.title}' was created",
            "timestamp": event.created_at,
            "user": event.created_by_user.username if event.created_by_user else "Unknown",
            "icon": "📅"
        })
    
    # Trier par timestamp décroissant
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return timeline


# =============================================================================
# BUDGET CONTRIBUTION ENDPOINTS
# =============================================================================

@router.post("/{project_id}/budget-contributions", response_model=BudgetContributionResponse, status_code=status.HTTP_201_CREATED)
def add_budget_contribution(
    project_id: int,
    contribution_data: BudgetContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute un apport de budget ou une dépense à un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Créer la contribution
    contribution = BudgetContribution(
        project_id=project_id,
        amount=contribution_data.amount,
        description=contribution_data.description,
        contribution_type=contribution_data.contribution_type,
        created_by_user_id=current_user.id
    )
    
    db.add(contribution)
    
    # Mettre à jour le budget du projet
    if contribution_data.contribution_type == "budget_add":
        project.budget += contribution_data.amount
    elif contribution_data.contribution_type == "expense":
        if project.budget < contribution_data.amount:
            raise HTTPException(
                status_code=400, 
                detail="Insufficient budget for this expense"
            )
        project.budget -= contribution_data.amount
    
    db.commit()
    db.refresh(contribution)
    
    return contribution


@router.get("/{project_id}/budget-contributions", response_model=List[BudgetContributionResponse])
def get_budget_contributions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère toutes les contributions budgétaires d'un projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contributions = db.query(BudgetContribution).filter(
        BudgetContribution.project_id == project_id
    ).order_by(BudgetContribution.created_at.desc()).all()
    
    return contributions


@router.delete("/{project_id}/budget-contributions/{contribution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_contribution(
    project_id: int,
    contribution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime une contribution budgétaire et ajuste le budget du projet"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    contribution = db.query(BudgetContribution).filter(
        BudgetContribution.id == contribution_id,
        BudgetContribution.project_id == project_id
    ).first()
    
    if not contribution:
        raise HTTPException(status_code=404, detail="Budget contribution not found")
    
    # Ajuster le budget du projet
    if contribution.contribution_type == "budget_add":
        project.budget -= contribution.amount
    elif contribution.contribution_type == "expense":
        project.budget += contribution.amount
    
    db.delete(contribution)
    db.commit()
