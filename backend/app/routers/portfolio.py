from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db
from app.security import get_current_user
from app.models import User
from app.services.portfolio_service import PortfolioService
from app.schemas import (
    PortfolioProjectCreate, PortfolioProjectUpdate, PortfolioProjectResponse,
    PortfolioSkillCreate, PortfolioSkillUpdate, PortfolioSkillResponse,
    PortfolioTestimonialCreate, PortfolioTestimonialUpdate, PortfolioTestimonialResponse,
    PortfolioBlogPostCreate, PortfolioBlogPostUpdate, PortfolioBlogPostResponse,
    PortfolioContactCreate, PortfolioContactResponse, PortfolioStatsResponse
)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


# Portfolio Projects
@router.post("/projects", response_model=PortfolioProjectResponse)
def create_project(
    project_data: PortfolioProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouveau projet portfolio"""
    service = PortfolioService(db)
    project = service.create_project(project_data, current_user.id)
    return project


@router.get("/projects", response_model=List[PortfolioProjectResponse])
def get_projects(
    featured_only: bool = Query(False, description="Récupérer seulement les projets mis en avant"),
    published_only: bool = Query(False, description="Récupérer seulement les projets publiés"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les projets portfolio"""
    service = PortfolioService(db)
    projects = service.get_projects(current_user.id, featured_only, published_only)
    return projects


@router.get("/projects/{project_id}", response_model=PortfolioProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un projet par ID"""
    service = PortfolioService(db)
    project = service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/projects/{project_id}", response_model=PortfolioProjectResponse)
def update_project(
    project_id: int,
    project_data: PortfolioProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour un projet"""
    service = PortfolioService(db)
    project = service.update_project(project_id, project_data, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un projet"""
    service = PortfolioService(db)
    success = service.delete_project(project_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


# Portfolio Skills
@router.post("/skills", response_model=PortfolioSkillResponse)
def create_skill(
    skill_data: PortfolioSkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle compétence"""
    service = PortfolioService(db)
    skill = service.create_skill(skill_data, current_user.id)
    return skill


@router.get("/skills", response_model=List[PortfolioSkillResponse])
def get_skills(
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les compétences"""
    service = PortfolioService(db)
    skills = service.get_skills(current_user.id, category)
    return skills


@router.get("/skills/{skill_id}", response_model=PortfolioSkillResponse)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une compétence par ID"""
    service = PortfolioService(db)
    skill = service.get_skill(skill_id, current_user.id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.put("/skills/{skill_id}", response_model=PortfolioSkillResponse)
def update_skill(
    skill_id: int,
    skill_data: PortfolioSkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour une compétence"""
    service = PortfolioService(db)
    skill = service.update_skill(skill_id, skill_data, current_user.id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.delete("/skills/{skill_id}")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une compétence"""
    service = PortfolioService(db)
    success = service.delete_skill(skill_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"message": "Skill deleted successfully"}


# Portfolio Testimonials
@router.post("/testimonials", response_model=PortfolioTestimonialResponse)
def create_testimonial(
    testimonial_data: PortfolioTestimonialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouveau témoignage"""
    service = PortfolioService(db)
    testimonial = service.create_testimonial(testimonial_data, current_user.id)
    return testimonial


@router.get("/testimonials", response_model=List[PortfolioTestimonialResponse])
def get_testimonials(
    featured_only: bool = Query(False, description="Récupérer seulement les témoignages mis en avant"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les témoignages"""
    service = PortfolioService(db)
    testimonials = service.get_testimonials(current_user.id, featured_only)
    return testimonials


@router.get("/testimonials/{testimonial_id}", response_model=PortfolioTestimonialResponse)
def get_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un témoignage par ID"""
    service = PortfolioService(db)
    testimonial = service.get_testimonial(testimonial_id, current_user.id)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial


@router.put("/testimonials/{testimonial_id}", response_model=PortfolioTestimonialResponse)
def update_testimonial(
    testimonial_id: int,
    testimonial_data: PortfolioTestimonialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour un témoignage"""
    service = PortfolioService(db)
    testimonial = service.update_testimonial(testimonial_id, testimonial_data, current_user.id)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial


@router.delete("/testimonials/{testimonial_id}")
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un témoignage"""
    service = PortfolioService(db)
    success = service.delete_testimonial(testimonial_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted successfully"}


# Portfolio Blog Posts
@router.post("/blog", response_model=PortfolioBlogPostResponse)
def create_blog_post(
    blog_data: PortfolioBlogPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouvel article de blog"""
    service = PortfolioService(db)
    blog_post = service.create_blog_post(blog_data, current_user.id)
    return blog_post


@router.get("/blog", response_model=List[PortfolioBlogPostResponse])
def get_blog_posts(
    featured_only: bool = Query(False, description="Récupérer seulement les articles mis en avant"),
    published_only: bool = Query(False, description="Récupérer seulement les articles publiés"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les articles de blog"""
    service = PortfolioService(db)
    blog_posts = service.get_blog_posts(current_user.id, featured_only, published_only)
    return blog_posts


@router.get("/blog/{blog_id}", response_model=PortfolioBlogPostResponse)
def get_blog_post(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un article par ID"""
    service = PortfolioService(db)
    blog_post = service.get_blog_post(blog_id, current_user.id)
    if not blog_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog_post


@router.get("/blog/slug/{slug}", response_model=PortfolioBlogPostResponse)
def get_blog_post_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un article par slug"""
    service = PortfolioService(db)
    blog_post = service.get_blog_post_by_slug(slug, current_user.id)
    if not blog_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog_post


@router.put("/blog/{blog_id}", response_model=PortfolioBlogPostResponse)
def update_blog_post(
    blog_id: int,
    blog_data: PortfolioBlogPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour un article"""
    service = PortfolioService(db)
    blog_post = service.update_blog_post(blog_id, blog_data, current_user.id)
    if not blog_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog_post


@router.delete("/blog/{blog_id}")
def delete_blog_post(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un article"""
    service = PortfolioService(db)
    success = service.delete_blog_post(blog_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted successfully"}


@router.post("/blog/{blog_id}/view")
def increment_blog_views(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Incrémenter le nombre de vues d'un article"""
    service = PortfolioService(db)
    success = service.increment_blog_views(blog_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "View count incremented"}


# Portfolio Contacts
@router.post("/contacts", response_model=PortfolioContactResponse)
def create_contact(
    contact_data: PortfolioContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouveau contact"""
    service = PortfolioService(db)
    contact = service.create_contact(contact_data, current_user.id)
    return contact


@router.get("/contacts", response_model=List[PortfolioContactResponse])
def get_contacts(
    unread_only: bool = Query(False, description="Récupérer seulement les contacts non lus"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les contacts"""
    service = PortfolioService(db)
    contacts = service.get_contacts(current_user.id, unread_only)
    return contacts


@router.get("/contacts/{contact_id}", response_model=PortfolioContactResponse)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un contact par ID"""
    service = PortfolioService(db)
    contact = service.get_contact(contact_id, current_user.id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/contacts/{contact_id}/reply")
def mark_contact_as_replied(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marquer un contact comme répondu"""
    service = PortfolioService(db)
    contact = service.mark_contact_as_replied(contact_id, current_user.id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un contact"""
    service = PortfolioService(db)
    success = service.delete_contact(contact_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}


# Portfolio Stats
@router.get("/stats", response_model=PortfolioStatsResponse)
def get_portfolio_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les statistiques du portfolio"""
    service = PortfolioService(db)
    stats = service.get_portfolio_stats(current_user.id)
    return stats
