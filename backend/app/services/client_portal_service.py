"""
Service pour le portail client
Gestion des tokens et création de tickets par les clients
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ..models import ClientTicketToken, ClientTicketAccess, Ticket, Contact, User, Notification
from ..exceptions import (
    NotFoundException,
    ValidationException,
    BusinessException,
    UnauthorizedException
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ClientPortalService:
    """Service pour gérer le portail client"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_token(
        self,
        contact_id: int,
        project_id: Optional[int],
        created_by_user_id: int,
        expires_at: Optional[datetime] = None,
        max_tickets: Optional[int] = None,
        password: Optional[str] = None
    ) -> ClientTicketToken:
        """Générer un nouveau token pour un client"""
        # Vérifier que le contact existe
        contact = self.db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise NotFoundException("Contact", contact_id)
        
        # Générer un UUID unique
        token_str = str(uuid.uuid4())
        
        # Hasher le mot de passe si fourni
        password_hash = None
        if password:
            password_hash = pwd_context.hash(password)
        
        # Créer le token
        token = ClientTicketToken(
            token=token_str,
            contact_id=contact_id,
            project_id=project_id,
            expires_at=expires_at,
            max_tickets=max_tickets,
            password_hash=password_hash,
            created_by_user_id=created_by_user_id
        )
        
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        
        return token
    
    def validate_token(
        self,
        token_str: str,
        password: Optional[str] = None
    ) -> ClientTicketToken:
        """Valider un token et optionnellement un mot de passe"""
        token = self.db.query(ClientTicketToken).filter(
            ClientTicketToken.token == token_str
        ).first()
        
        if not token:
            raise UnauthorizedException("Invalid token")
        
        if not token.active:
            raise UnauthorizedException("Token is inactive")
        
        # Vérifier l'expiration
        if token.expires_at and token.expires_at < datetime.utcnow():
            raise UnauthorizedException("Token has expired")
        
        # Vérifier le mot de passe si requis
        if token.password_hash:
            if not password:
                raise UnauthorizedException("Password required")
            if not pwd_context.verify(password, token.password_hash):
                raise UnauthorizedException("Invalid password")
        
        # Mettre à jour last_used_at
        token.last_used_at = datetime.utcnow()
        self.db.commit()
        
        return token
    
    def create_client_ticket(
        self,
        token_str: str,
        title: str,
        description: str,
        theme: str = "Support",
        priority: str = "medium",
        password: Optional[str] = None
    ) -> Ticket:
        """Créer un ticket via le portail client"""
        # Valider le token
        token = self.validate_token(token_str, password)
        
        # Vérifier la limite de tickets
        if token.max_tickets is not None:
            ticket_count = self.db.query(ClientTicketAccess).filter(
                ClientTicketAccess.token_id == token.id
            ).count()
            
            if ticket_count >= token.max_tickets:
                raise BusinessException(
                    f"Maximum number of tickets ({token.max_tickets}) reached for this token"
                )
        
        # Créer le ticket
        # Note: created_by_user_id doit être un user valide
        # On pourrait créer un user système "Client Portal" ou utiliser le créateur du token
        admin_user = self.db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            raise BusinessException("No admin user found to create ticket")
        
        ticket = Ticket(
            title=title,
            description=description,
            theme=theme,
            priority=priority,
            status="open",
            assigned_to="",
            created_by_user_id=admin_user.id,
            project_id=token.project_id
        )
        
        self.db.add(ticket)
        self.db.flush()  # Pour obtenir l'ID
        
        # Créer l'accès
        access = ClientTicketAccess(
            token_id=token.id,
            ticket_id=ticket.id,
            can_comment=True,
            can_attach=True
        )
        
        self.db.add(access)
        self.db.commit()
        self.db.refresh(ticket)
        
        # Créer une notification pour l'admin
        notification = Notification(
            user_id=admin_user.id,
            type="client_ticket_created",
            title="Nouveau ticket client",
            message=f"Un nouveau ticket a été créé par {token.contact.first_name} {token.contact.last_name}: {title}",
            link=f"/admin/tickets/{ticket.id}"
        )
        self.db.add(notification)
        self.db.commit()
        
        return ticket
    
    def get_client_tickets(self, token_str: str, password: Optional[str] = None) -> List[Ticket]:
        """Récupérer tous les tickets d'un client"""
        token = self.validate_token(token_str, password)
        
        # Récupérer les tickets via les accès
        accesses = self.db.query(ClientTicketAccess).filter(
            ClientTicketAccess.token_id == token.id
        ).all()
        
        ticket_ids = [access.ticket_id for access in accesses]
        
        tickets = self.db.query(Ticket).filter(
            Ticket.id.in_(ticket_ids)
        ).order_by(Ticket.created_at.desc()).all()
        
        return tickets
    
    def regenerate_token(self, token_id: int, created_by_user_id: int) -> ClientTicketToken:
        """Régénérer un token (nouveau UUID)"""
        token = self.db.query(ClientTicketToken).filter(
            ClientTicketToken.id == token_id
        ).first()
        
        if not token:
            raise NotFoundException("Token", token_id)
        
        # Générer nouveau UUID
        token.token = str(uuid.uuid4())
        token.created_by_user_id = created_by_user_id
        token.created_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(token)
        
        return token
    
    def deactivate_token(self, token_id: int) -> ClientTicketToken:
        """Désactiver un token"""
        token = self.db.query(ClientTicketToken).filter(
            ClientTicketToken.id == token_id
        ).first()
        
        if not token:
            raise NotFoundException("Token", token_id)
        
        token.active = False
        self.db.commit()
        self.db.refresh(token)
        
        return token

