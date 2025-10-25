import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc

from app.models_portfolio import (
    PortfolioProject, PortfolioSkill, PortfolioTestimonial, 
    PortfolioBlogPost, PortfolioContact
)
from app.schemas import (
    PortfolioProjectCreate, PortfolioProjectUpdate,
    PortfolioSkillCreate, PortfolioSkillUpdate,
    PortfolioTestimonialCreate, PortfolioTestimonialUpdate,
    PortfolioBlogPostCreate, PortfolioBlogPostUpdate,
    PortfolioContactCreate, PortfolioStatsResponse
)

logger = logging.getLogger(__name__)


class PortfolioService:
    def __init__(self, db: Session):
        self.db = db
        
    # Portfolio Projects
    def create_project(self, project_data: PortfolioProjectCreate, user_id: int) -> PortfolioProject:
        """Créer un nouveau projet portfolio"""
        project = PortfolioProject(
            title=project_data.title,
            description=project_data.description,
            short_description=project_data.short_description,
            technologies=project_data.technologies,
            images=project_data.images,
            url=project_data.url,
            github_url=project_data.github_url,
            category=project_data.category,
            featured=project_data.featured,
            order=project_data.order,
            published=project_data.published,
            created_by_user_id=user_id
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def get_projects(self, user_id: int, featured_only: bool = False, published_only: bool = False) -> List[PortfolioProject]:
        """Récupérer les projets portfolio"""
        query = self.db.query(PortfolioProject).filter(PortfolioProject.created_by_user_id == user_id)
        
        if featured_only:
            query = query.filter(PortfolioProject.featured == True)
        if published_only:
            query = query.filter(PortfolioProject.published == True)
            
        return query.order_by(asc(PortfolioProject.order), desc(PortfolioProject.created_at)).all()
    
    def get_project(self, project_id: int, user_id: int) -> Optional[PortfolioProject]:
        """Récupérer un projet par ID"""
        return self.db.query(PortfolioProject).filter(
            and_(
                PortfolioProject.id == project_id,
                PortfolioProject.created_by_user_id == user_id
            )
        ).first()
    
    def update_project(self, project_id: int, project_data: PortfolioProjectUpdate, user_id: int) -> Optional[PortfolioProject]:
        """Mettre à jour un projet"""
        project = self.get_project(project_id, user_id)
        if not project:
            return None
        
        for field, value in project_data.dict(exclude_unset=True).items():
            setattr(project, field, value)
        
        project.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(project)
        return project
    
    def delete_project(self, project_id: int, user_id: int) -> bool:
        """Supprimer un projet"""
        project = self.get_project(project_id, user_id)
        if not project:
            return False
        
        self.db.delete(project)
        self.db.commit()
        return True
    
    # Portfolio Skills
    def create_skill(self, skill_data: PortfolioSkillCreate, user_id: int) -> PortfolioSkill:
        """Créer une nouvelle compétence"""
        skill = PortfolioSkill(
            name=skill_data.name,
            category=skill_data.category,
            level=skill_data.level,
            icon=skill_data.icon,
            order=skill_data.order,
            created_by_user_id=user_id
        )
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        return skill
    
    def get_skills(self, user_id: int, category: Optional[str] = None) -> List[PortfolioSkill]:
        """Récupérer les compétences"""
        query = self.db.query(PortfolioSkill).filter(PortfolioSkill.created_by_user_id == user_id)
        
        if category:
            query = query.filter(PortfolioSkill.category == category)
            
        return query.order_by(asc(PortfolioSkill.order), asc(PortfolioSkill.name)).all()
    
    def get_skill(self, skill_id: int, user_id: int) -> Optional[PortfolioSkill]:
        """Récupérer une compétence par ID"""
        return self.db.query(PortfolioSkill).filter(
            and_(
                PortfolioSkill.id == skill_id,
                PortfolioSkill.created_by_user_id == user_id
            )
        ).first()
    
    def update_skill(self, skill_id: int, skill_data: PortfolioSkillUpdate, user_id: int) -> Optional[PortfolioSkill]:
        """Mettre à jour une compétence"""
        skill = self.get_skill(skill_id, user_id)
        if not skill:
            return None
        
        for field, value in skill_data.dict(exclude_unset=True).items():
            setattr(skill, field, value)
        
        skill.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(skill)
        return skill
    
    def delete_skill(self, skill_id: int, user_id: int) -> bool:
        """Supprimer une compétence"""
        skill = self.get_skill(skill_id, user_id)
        if not skill:
            return False
        
        self.db.delete(skill)
        self.db.commit()
        return True
    
    # Portfolio Testimonials
    def create_testimonial(self, testimonial_data: PortfolioTestimonialCreate, user_id: int) -> PortfolioTestimonial:
        """Créer un nouveau témoignage"""
        testimonial = PortfolioTestimonial(
            author=testimonial_data.author,
            role=testimonial_data.role,
            company=testimonial_data.company,
            content=testimonial_data.content,
            avatar=testimonial_data.avatar,
            rating=testimonial_data.rating,
            featured=testimonial_data.featured,
            order=testimonial_data.order,
            created_by_user_id=user_id
        )
        self.db.add(testimonial)
        self.db.commit()
        self.db.refresh(testimonial)
        return testimonial
    
    def get_testimonials(self, user_id: int, featured_only: bool = False) -> List[PortfolioTestimonial]:
        """Récupérer les témoignages"""
        query = self.db.query(PortfolioTestimonial).filter(PortfolioTestimonial.created_by_user_id == user_id)
        
        if featured_only:
            query = query.filter(PortfolioTestimonial.featured == True)
            
        return query.order_by(asc(PortfolioTestimonial.order), desc(PortfolioTestimonial.created_at)).all()
    
    def get_testimonial(self, testimonial_id: int, user_id: int) -> Optional[PortfolioTestimonial]:
        """Récupérer un témoignage par ID"""
        return self.db.query(PortfolioTestimonial).filter(
            and_(
                PortfolioTestimonial.id == testimonial_id,
                PortfolioTestimonial.created_by_user_id == user_id
            )
        ).first()
    
    def update_testimonial(self, testimonial_id: int, testimonial_data: PortfolioTestimonialUpdate, user_id: int) -> Optional[PortfolioTestimonial]:
        """Mettre à jour un témoignage"""
        testimonial = self.get_testimonial(testimonial_id, user_id)
        if not testimonial:
            return None
        
        for field, value in testimonial_data.dict(exclude_unset=True).items():
            setattr(testimonial, field, value)
        
        testimonial.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(testimonial)
        return testimonial
    
    def delete_testimonial(self, testimonial_id: int, user_id: int) -> bool:
        """Supprimer un témoignage"""
        testimonial = self.get_testimonial(testimonial_id, user_id)
        if not testimonial:
            return False
        
        self.db.delete(testimonial)
        self.db.commit()
        return True
    
    # Portfolio Blog Posts
    def create_blog_post(self, blog_data: PortfolioBlogPostCreate, user_id: int) -> PortfolioBlogPost:
        """Créer un nouvel article de blog"""
        blog_post = PortfolioBlogPost(
            title=blog_data.title,
            slug=blog_data.slug,
            content=blog_data.content,
            excerpt=blog_data.excerpt,
            cover_image=blog_data.cover_image,
            tags=blog_data.tags,
            featured=blog_data.featured,
            published=blog_data.published,
            published_at=blog_data.published_at or datetime.utcnow(),
            created_by_user_id=user_id
        )
        self.db.add(blog_post)
        self.db.commit()
        self.db.refresh(blog_post)
        return blog_post
    
    def get_blog_posts(self, user_id: int, featured_only: bool = False, published_only: bool = False) -> List[PortfolioBlogPost]:
        """Récupérer les articles de blog"""
        query = self.db.query(PortfolioBlogPost).filter(PortfolioBlogPost.created_by_user_id == user_id)
        
        if featured_only:
            query = query.filter(PortfolioBlogPost.featured == True)
        if published_only:
            query = query.filter(PortfolioBlogPost.published == True)
            
        return query.order_by(desc(PortfolioBlogPost.published_at)).all()
    
    def get_blog_post(self, blog_id: int, user_id: int) -> Optional[PortfolioBlogPost]:
        """Récupérer un article par ID"""
        return self.db.query(PortfolioBlogPost).filter(
            and_(
                PortfolioBlogPost.id == blog_id,
                PortfolioBlogPost.created_by_user_id == user_id
            )
        ).first()
    
    def get_blog_post_by_slug(self, slug: str, user_id: int) -> Optional[PortfolioBlogPost]:
        """Récupérer un article par slug"""
        return self.db.query(PortfolioBlogPost).filter(
            and_(
                PortfolioBlogPost.slug == slug,
                PortfolioBlogPost.created_by_user_id == user_id,
                PortfolioBlogPost.published == True
            )
        ).first()
    
    def update_blog_post(self, blog_id: int, blog_data: PortfolioBlogPostUpdate, user_id: int) -> Optional[PortfolioBlogPost]:
        """Mettre à jour un article"""
        blog_post = self.get_blog_post(blog_id, user_id)
        if not blog_post:
            return None
        
        for field, value in blog_data.dict(exclude_unset=True).items():
            setattr(blog_post, field, value)
        
        blog_post.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(blog_post)
        return blog_post
    
    def delete_blog_post(self, blog_id: int, user_id: int) -> bool:
        """Supprimer un article"""
        blog_post = self.get_blog_post(blog_id, user_id)
        if not blog_post:
            return False
        
        self.db.delete(blog_post)
        self.db.commit()
        return True
    
    def increment_blog_views(self, blog_id: int, user_id: int) -> bool:
        """Incrémenter le nombre de vues d'un article"""
        blog_post = self.get_blog_post(blog_id, user_id)
        if not blog_post:
            return False
        
        blog_post.views += 1
        self.db.commit()
        return True
    
    # Portfolio Contacts
    def create_contact(self, contact_data: PortfolioContactCreate, user_id: int) -> PortfolioContact:
        """Créer un nouveau contact"""
        contact = PortfolioContact(
            name=contact_data.name,
            email=contact_data.email,
            subject=contact_data.subject,
            message=contact_data.message,
            created_by_user_id=user_id
        )
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact
    
    def get_contacts(self, user_id: int, unread_only: bool = False) -> List[PortfolioContact]:
        """Récupérer les contacts"""
        query = self.db.query(PortfolioContact).filter(PortfolioContact.created_by_user_id == user_id)
        
        if unread_only:
            query = query.filter(PortfolioContact.replied == False)
            
        return query.order_by(desc(PortfolioContact.created_at)).all()
    
    def get_contact(self, contact_id: int, user_id: int) -> Optional[PortfolioContact]:
        """Récupérer un contact par ID"""
        return self.db.query(PortfolioContact).filter(
            and_(
                PortfolioContact.id == contact_id,
                PortfolioContact.created_by_user_id == user_id
            )
        ).first()
    
    def mark_contact_as_replied(self, contact_id: int, user_id: int) -> Optional[PortfolioContact]:
        """Marquer un contact comme répondu"""
        contact = self.get_contact(contact_id, user_id)
        if not contact:
            return None
        
        contact.replied = True
        self.db.commit()
        self.db.refresh(contact)
        return contact
    
    def delete_contact(self, contact_id: int, user_id: int) -> bool:
        """Supprimer un contact"""
        contact = self.get_contact(contact_id, user_id)
        if not contact:
            return False
        
        self.db.delete(contact)
        self.db.commit()
        return True
    
    # Portfolio Stats
    def get_portfolio_stats(self, user_id: int) -> PortfolioStatsResponse:
        """Récupérer les statistiques du portfolio"""
        total_projects = self.db.query(PortfolioProject).filter(PortfolioProject.created_by_user_id == user_id).count()
        total_skills = self.db.query(PortfolioSkill).filter(PortfolioSkill.created_by_user_id == user_id).count()
        total_testimonials = self.db.query(PortfolioTestimonial).filter(PortfolioTestimonial.created_by_user_id == user_id).count()
        total_blog_posts = self.db.query(PortfolioBlogPost).filter(PortfolioBlogPost.created_by_user_id == user_id).count()
        total_contacts = self.db.query(PortfolioContact).filter(PortfolioContact.created_by_user_id == user_id).count()
        
        featured_projects = self.db.query(PortfolioProject).filter(
            and_(
                PortfolioProject.created_by_user_id == user_id,
                PortfolioProject.featured == True
            )
        ).count()
        
        published_blog_posts = self.db.query(PortfolioBlogPost).filter(
            and_(
                PortfolioBlogPost.created_by_user_id == user_id,
                PortfolioBlogPost.published == True
            )
        ).count()
        
        unread_contacts = self.db.query(PortfolioContact).filter(
            and_(
                PortfolioContact.created_by_user_id == user_id,
                PortfolioContact.replied == False
            )
        ).count()
        
        return PortfolioStatsResponse(
            total_projects=total_projects,
            total_skills=total_skills,
            total_testimonials=total_testimonials,
            total_blog_posts=total_blog_posts,
            total_contacts=total_contacts,
            featured_projects=featured_projects,
            published_blog_posts=published_blog_posts,
            unread_contacts=unread_contacts
        )
