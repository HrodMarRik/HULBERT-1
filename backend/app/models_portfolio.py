from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base


# Portfolio Public Models
class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    technologies = Column(JSON, nullable=True)  # ["React", "Node.js", "MongoDB"]
    images = Column(JSON, nullable=True)  # ["image1.jpg", "image2.jpg"]
    url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=False)  # "web", "mobile", "desktop", "other"
    featured = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, default=0, nullable=False)
    published = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class PortfolioSkill(Base):
    __tablename__ = "portfolio_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # "frontend", "backend", "database", "tools", "other"
    level = Column(Integer, nullable=False)  # 1-5 (débutant à expert)
    icon = Column(String(100), nullable=True)  # Nom de l'icône (FontAwesome, etc.)
    order = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class PortfolioTestimonial(Base):
    __tablename__ = "portfolio_testimonials"
    
    id = Column(Integer, primary_key=True, index=True)
    author = Column(String(200), nullable=False)
    role = Column(String(200), nullable=True)
    company = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    avatar = Column(String(500), nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 étoiles
    featured = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class PortfolioBlogPost(Base):
    __tablename__ = "portfolio_blog_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, unique=True)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500), nullable=True)
    cover_image = Column(String(500), nullable=True)
    tags = Column(JSON, nullable=True)  # ["tech", "tutorial", "news"]
    views = Column(Integer, default=0, nullable=False)
    featured = Column(Boolean, default=False, nullable=False)
    published = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class PortfolioContact(Base):
    __tablename__ = "portfolio_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    replied = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")
