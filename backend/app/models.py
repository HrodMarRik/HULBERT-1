from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, BigInteger, Float, JSON, UniqueConstraint, Date
from sqlalchemy.orm import relationship

from .models_portfolio import *


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Role and permissions
    role = Column(String(20), nullable=False, default="employee")  # admin, accountant, manager, employee
    permissions = Column(JSON, nullable=True)  # JSON array of specific permissions

    totp_secret = relationship("TOTPSecret", back_populates="user", uselist=False)
    created_budget_transactions = relationship("BudgetTransaction", back_populates="created_by")
    widget_layouts = relationship("WidgetLayout", back_populates="user")


class TOTPSecret(Base):
    __tablename__ = "totp_secrets"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    secret_encrypted = Column(String(255), nullable=False)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="totp_secret")


class FileMetadata(Base):
    __tablename__ = "file_metadata"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String(1024), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    is_directory = Column(Boolean, default=False, nullable=False)
    parent_path = Column(String(1024), nullable=True)
    size = Column(BigInteger, default=0, nullable=False)
    file_type = Column(String(50), nullable=True)  # extension
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    modified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_scanned = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Métadonnées pour la recherche
    content_preview = Column(Text, nullable=True)  # Premiers caractères du contenu
    tags = Column(String(500), nullable=True)  # Tags séparés par virgules
    description = Column(Text, nullable=True)
    
    # Index pour la recherche rapide
    search_vector = Column(Text, nullable=True)  # Texte concaténé pour la recherche


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    target = Column(String(512), nullable=True)
    ip = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AgentMetrics(Base):
    __tablename__ = "agent_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(50), index=True, nullable=False)
    agent_name = Column(String(150), nullable=False)
    
    # Compteurs
    lines_created = Column(BigInteger, default=0, nullable=False)
    lines_deleted = Column(BigInteger, default=0, nullable=False)
    lines_modified = Column(BigInteger, default=0, nullable=False)
    files_processed = Column(Integer, default=0, nullable=False)
    files_created = Column(Integer, default=0, nullable=False)
    files_deleted = Column(Integer, default=0, nullable=False)
    jobs_completed = Column(Integer, default=0, nullable=False)
    jobs_failed = Column(Integer, default=0, nullable=False)
    
    # Temps
    total_work_time_seconds = Column(BigInteger, default=0, nullable=False)  # Temps total de travail
    last_activity = Column(DateTime, nullable=True)
    
    # Statistiques de performance
    avg_job_duration_seconds = Column(Integer, default=0, nullable=False)
    success_rate = Column(Float, default=100.0, nullable=False)  # Pourcentage
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AgentActivity(Base):
    __tablename__ = "agent_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(50), index=True, nullable=False)
    activity_type = Column(String(50), nullable=False)  # 'job_start', 'job_complete', 'job_fail', 'file_edit'
    
    # Détails de l'activité
    file_path = Column(String(512), nullable=True)
    lines_changed = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Métadonnées
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    metadata_json = Column(Text, nullable=True)  # JSON pour données supplémentaires


class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Catégorisation
    theme = Column(String(50), nullable=False)  # Bug, Feature, Support, Question, Documentation
    priority = Column(String(20), nullable=False)  # low, medium, high, critical
    status = Column(String(20), nullable=False, default="open")  # open, in_progress, resolved, closed
    
    # Assignment
    assigned_to = Column(String(100), nullable=True)  # Agent ou utilisateur assigné
    
    # Métadonnées
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Dates importantes
    due_date = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Tags et estimation
    tags = Column(String(500), nullable=True)  # JSON array serialized as string
    estimated_hours = Column(Float, nullable=True)
    actual_hours = Column(Float, nullable=True)
    
    # Project linking
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Relations
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    project = relationship("Project", back_populates="tickets")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")


class TicketComment(Base):
    __tablename__ = "ticket_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    
    # Relations
    ticket = relationship("Ticket", back_populates="comments")
    user = relationship("User")


class TicketHistory(Base):
    __tablename__ = "ticket_history"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    action = Column(String(50), nullable=False)  # created, updated, commented, status_changed, etc.
    field_name = Column(String(50), nullable=True)  # Le champ qui a changé
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relations
    ticket = relationship("Ticket", back_populates="history")
    user = relationship("User")


class DashboardConfig(Base):
    __tablename__ = "dashboard_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    config_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


# CRM Models
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="prospect")  # client/prospect/archived
    notes = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # Tags séparés par virgules
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relations
    created_by_user = relationship("User")
    contacts = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
    company_contacts = relationship("CompanyContact", back_populates="company", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="company", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="company", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="company", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # Peut être indépendant
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    mobile = Column(String(50), nullable=True)
    position = Column(String(100), nullable=True)  # CEO, CTO, etc.
    department = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active/inactive
    notes = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relations
    company = relationship("Company", back_populates="contacts")
    created_by_user = relationship("User")
    projects_as_primary = relationship("Project", back_populates="primary_contact")
    project_contacts = relationship("ProjectContact", back_populates="contact", cascade="all, delete-orphan")
    company_contacts = relationship("CompanyContact", back_populates="contact", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="contact", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="contact", cascade="all, delete-orphan")
    client_tokens = relationship("ClientTicketToken", back_populates="contact", cascade="all, delete-orphan")


class CompanyContact(Base):
    __tablename__ = "company_contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    role = Column(String(100), nullable=True)  # Rôle spécifique dans l'entreprise
    department = Column(String(100), nullable=True)  # Département spécifique
    is_primary = Column(Boolean, default=False)  # Contact principal de l'entreprise
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    company = relationship("Company", back_populates="company_contacts")
    contact = relationship("Contact", back_populates="company_contacts")

    # Contrainte unique pour éviter les doublons
    __table_args__ = (
        UniqueConstraint('company_id', 'contact_id', name='unique_company_contact'),
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    primary_contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="planning")  # planning/active/on-hold/completed/cancelled
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    budget = Column(Float, nullable=False, default=0.0)  # Toujours 0 à la création
    currency = Column(String(3), nullable=True, default="EUR")
    progress_percentage = Column(Integer, nullable=False, default=0)
    team_assigned = Column(String(500), nullable=True)  # Équipe assignée
    
    # Champs commerciaux
    commercial_status = Column(String(20), nullable=True)  # null/"for_sale"/"for_rent"/"rented"/"sold"
    sale_price = Column(Float, nullable=True)
    daily_rate = Column(Float, nullable=True)
    monthly_rate = Column(Float, nullable=True)
    annual_rate = Column(Float, nullable=True)
    rental_terms = Column(Text, nullable=True)  # Conditions de location
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relations
    company = relationship("Company", back_populates="projects")
    primary_contact = relationship("Contact", back_populates="projects_as_primary")
    created_by_user = relationship("User")
    phases = relationship("ProjectPhase", back_populates="project", cascade="all, delete-orphan")
    deliverables = relationship("ProjectDeliverable", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    notes = relationship("ProjectNote", back_populates="project", cascade="all, delete-orphan")
    budget_transactions = relationship("BudgetTransaction", back_populates="project", cascade="all, delete-orphan")
    budget_alerts = relationship("BudgetAlert", back_populates="project", cascade="all, delete-orphan")
    budget_contributions = relationship("BudgetContribution", back_populates="project", cascade="all, delete-orphan")
    project_contacts = relationship("ProjectContact", back_populates="project", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="project", cascade="all, delete-orphan")


class ProjectContact(Base):
    __tablename__ = "project_contacts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    role = Column(String(50), nullable=True)  # Rôle du contact dans le projet
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    project = relationship("Project", back_populates="project_contacts")
    contact = relationship("Contact", back_populates="project_contacts")


class BudgetContribution(Base):
    __tablename__ = "budget_contributions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    contribution_type = Column(String(20), nullable=False, default="budget_add")  # budget_add, expense
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relations
    project = relationship("Project", back_populates="budget_contributions")
    created_by_user = relationship("User")


class ProjectPhase(Base):
    __tablename__ = "project_phases"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending/in-progress/completed
    order = Column(Integer, nullable=False, default=0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    project = relationship("Project", back_populates="phases")
    deliverables = relationship("ProjectDeliverable", back_populates="phase", cascade="all, delete-orphan")


class ProjectDeliverable(Base):
    __tablename__ = "project_deliverables"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    phase_id = Column(Integer, ForeignKey("project_phases.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending/in-progress/completed
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    project = relationship("Project", back_populates="deliverables")
    phase = relationship("ProjectPhase", back_populates="deliverables")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relations
    company = relationship("Company", back_populates="documents")
    contact = relationship("Contact", back_populates="documents")
    project = relationship("Project", back_populates="documents")
    uploaded_by_user = relationship("User")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    interaction_type = Column(String(20), nullable=False)  # email/call/meeting/note
    subject = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    interaction_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    company = relationship("Company", back_populates="interactions")
    contact = relationship("Contact", back_populates="interactions")
    user = relationship("User")


# Calendar Models
class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    
    # Date & Time
    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=False, index=True)
    
    # Categorization
    category = Column(String(50), nullable=False, default="other", index=True)  # meeting, deadline, personal, project, other
    tags = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="planned", index=True)  # planned, confirmed, cancelled
    
    # Recurrence
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_pattern = Column(JSON, nullable=True)  # {frequency, interval, end_date, days_of_week}
    
    # Participants & Reminders
    participants = Column(JSON, nullable=True)  # List of participant names/emails
    reminder_minutes = Column(JSON, nullable=True)  # List of minutes before event: [15, 60, 1440]
    
    # Relations (optional linking to tickets/projects)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Metadata
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    created_by_user = relationship("User")
    ticket = relationship("Ticket", foreign_keys=[ticket_id])
    project = relationship("Project", foreign_keys=[project_id])


class ProjectNote(Base):
    __tablename__ = "project_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    project = relationship("Project", back_populates="notes")
    created_by_user = relationship("User")


class BudgetTransaction(Base):
    __tablename__ = "budget_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # 'income' or 'expense'
    category = Column(String(50), nullable=False)  # 'labor', 'materials', 'equipment', etc.
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    description = Column(Text, nullable=False)
    vendor_name = Column(String(200))
    invoice_number = Column(String(100))
    transaction_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'approved', 'paid', 'rejected'
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="budget_transactions")
    created_by = relationship("User", back_populates="created_budget_transactions")


class BudgetAlert(Base):
    __tablename__ = "budget_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # 'budget_threshold', 'overspend_warning', etc.
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)  # 'low', 'medium', 'high', 'critical'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="budget_alerts")


# =============================================================================
# ACCOUNTING MODELS
# =============================================================================

class SocialContribution(Base):
    __tablename__ = "social_contributions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Contribution details
    contribution_type = Column(String(20), nullable=False)  # employee, employer, both
    rate_percentage = Column(Float, nullable=False)  # Taux en pourcentage
    ceiling_amount = Column(Float, nullable=True)  # Plafond (PMSS, etc.)
    base_type = Column(String(20), nullable=False, default="gross_salary")  # gross_salary, net_salary, etc.
    
    # Legal information
    legal_basis = Column(String(100), nullable=True)  # Référence légale
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    payslip_lines = relationship("PayslipLine", back_populates="social_contribution")


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    # Period information
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    period_start_date = Column(DateTime, nullable=False)
    period_end_date = Column(DateTime, nullable=False)
    
    # Amounts
    gross_salary = Column(Float, nullable=False)
    total_employee_contributions = Column(Float, nullable=False, default=0.0)
    total_employer_contributions = Column(Float, nullable=False, default=0.0)
    net_salary = Column(Float, nullable=False)
    
    # Status
    status = Column(String(20), nullable=False, default="draft")  # draft, validated, paid
    payment_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="payslips")
    created_by_user = relationship("User")
    payslip_lines = relationship("PayslipLine", back_populates="payslip", cascade="all, delete-orphan")


class PayslipLine(Base):
    __tablename__ = "payslip_lines"

    id = Column(Integer, primary_key=True, index=True)
    payslip_id = Column(Integer, ForeignKey("payslips.id"), nullable=False)
    social_contribution_id = Column(Integer, ForeignKey("social_contributions.id"), nullable=True)
    
    # Line details
    line_type = Column(String(20), nullable=False)  # gross, employee_contribution, employer_contribution, deduction, bonus
    description = Column(String(200), nullable=False)
    base_amount = Column(Float, nullable=False)  # Montant de base pour le calcul
    rate_percentage = Column(Float, nullable=True)  # Taux appliqué
    amount = Column(Float, nullable=False)  # Montant calculé
    
    # Order for display
    display_order = Column(Integer, nullable=False, default=0)

    # Relationships
    payslip = relationship("Payslip", back_populates="payslip_lines")
    social_contribution = relationship("SocialContribution", back_populates="payslip_lines")


class SocialDeclaration(Base):
    __tablename__ = "social_declarations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Declaration period
    declaration_year = Column(Integer, nullable=False, index=True)
    declaration_quarter = Column(Integer, nullable=False, index=True)  # 1, 2, 3, 4
    period_start_date = Column(DateTime, nullable=False)
    period_end_date = Column(DateTime, nullable=False)
    
    # Declaration details
    declaration_type = Column(String(20), nullable=False, default="DSN")  # DSN, URSSAF, etc.
    status = Column(String(20), nullable=False, default="draft")  # draft, generated, submitted, validated
    
    # Amounts summary
    total_gross_salaries = Column(Float, nullable=False, default=0.0)
    total_employee_contributions = Column(Float, nullable=False, default=0.0)
    total_employer_contributions = Column(Float, nullable=False, default=0.0)
    total_contributions = Column(Float, nullable=False, default=0.0)
    
    # File information
    xml_file_path = Column(String(500), nullable=True)
    xml_file_size = Column(BigInteger, nullable=True)
    submission_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    created_by_user = relationship("User")


# =============================================================================
# INVOICING MODELS
# =============================================================================

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # Document type
    document_type = Column(String(20), nullable=False, default="invoice")  # invoice, credit_note, debit_note
    
    # Client/Supplier information
    client_company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    client_contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    client_name = Column(String(200), nullable=False)  # Fallback if no company
    client_address = Column(Text, nullable=True)
    client_email = Column(String(255), nullable=True)
    
    # Invoice details
    issue_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    
    # Amounts
    subtotal = Column(Float, nullable=False, default=0.0)
    total_tax = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="EUR")
    
    # Status
    status = Column(String(20), nullable=False, default="draft")  # draft, sent, paid, overdue, cancelled
    
    # Additional information
    notes = Column(Text, nullable=True)
    payment_terms = Column(String(200), nullable=True)
    reference_number = Column(String(100), nullable=True)  # Reference from client
    
    # Automation fields
    auto_generated = Column(Boolean, nullable=False, default=False)
    template_id = Column(Integer, ForeignKey("invoice_templates.id"), nullable=True)
    recurring_schedule = Column(String(50), nullable=True)  # monthly, quarterly, yearly
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # Source project for auto-generation
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    client_company = relationship("Company")
    client_contact = relationship("Contact")
    created_by_user = relationship("User")
    invoice_lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    template = relationship("InvoiceTemplate")
    project = relationship("Project")
    payment_reminders = relationship("PaymentReminder", back_populates="invoice")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    # Line details
    description = Column(String(500), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False)
    tax_rate_id = Column(Integer, ForeignKey("tax_rates.id"), nullable=True)
    tax_rate_percentage = Column(Float, nullable=False, default=0.0)
    line_total = Column(Float, nullable=False)
    
    # Order for display
    line_order = Column(Integer, nullable=False, default=0)

    # Relationships
    invoice = relationship("Invoice", back_populates="invoice_lines")
    tax_rate = relationship("TaxRate")


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # Client information
    client_company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    client_contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    client_name = Column(String(200), nullable=False)
    client_address = Column(Text, nullable=True)
    client_email = Column(String(255), nullable=True)
    
    # Quote details
    issue_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    
    # Amounts
    subtotal = Column(Float, nullable=False, default=0.0)
    total_tax = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="EUR")
    
    # Status
    status = Column(String(20), nullable=False, default="draft")  # draft, sent, accepted, rejected, expired
    
    # Additional information
    notes = Column(Text, nullable=True)
    terms_conditions = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    client_company = relationship("Company")
    client_contact = relationship("Contact")
    created_by_user = relationship("User")
    quote_lines = relationship("QuoteLine", back_populates="quote", cascade="all, delete-orphan")


class QuoteLine(Base):
    __tablename__ = "quote_lines"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False)
    
    # Line details
    description = Column(String(500), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False)
    tax_rate_id = Column(Integer, ForeignKey("tax_rates.id"), nullable=True)
    tax_rate_percentage = Column(Float, nullable=False, default=0.0)
    line_total = Column(Float, nullable=False)
    
    # Order for display
    line_order = Column(Integer, nullable=False, default=0)

    # Relationships
    quote = relationship("Quote", back_populates="quote_lines")
    tax_rate = relationship("TaxRate")


# =============================================================================
# GENERAL ACCOUNTING MODELS
# =============================================================================

class TaxRate(Base):
    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False, unique=True, index=True)
    rate_percentage = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    invoice_lines = relationship("InvoiceLine", overlaps="tax_rate")
    quote_lines = relationship("QuoteLine", overlaps="tax_rate")


class ChartOfAccounts(Base):
    __tablename__ = "chart_of_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(20), nullable=False, unique=True, index=True)
    account_name = Column(String(200), nullable=False)
    account_type = Column(String(20), nullable=False)  # asset, liability, equity, revenue, expense
    parent_account_code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    accounting_lines = relationship("AccountingLine", back_populates="account")


class FiscalYear(Base):
    __tablename__ = "fiscal_years"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, unique=True, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="open")  # open, closed
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    accounting_entries = relationship("AccountingEntry", back_populates="fiscal_year")


class AccountingLine(Base):
    __tablename__ = "accounting_lines"

    id = Column(Integer, primary_key=True, index=True)
    accounting_entry_id = Column(Integer, ForeignKey("accounting_entries.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("chart_of_accounts.id"), nullable=False)
    
    # Line details
    description = Column(String(500), nullable=False)
    debit_amount = Column(Float, nullable=False, default=0.0)
    credit_amount = Column(Float, nullable=False, default=0.0)
    
    # Order for display
    line_order = Column(Integer, nullable=False, default=0)

    # Relationships
    accounting_entry = relationship("AccountingEntry", back_populates="accounting_lines")
    account = relationship("ChartOfAccounts", back_populates="accounting_lines")


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    entity_type = Column(String(20), nullable=True)  # ticket, project, company, contact, event
    usage_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, in_progress, completed
    priority = Column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Optional linking to other entities
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    
    # Relationships
    created_by_user = relationship("User")
    project = relationship("Project")
    ticket = relationship("Ticket")


class WidgetLayout(Base):
    __tablename__ = "widget_layouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    widget_id = Column(String(50), nullable=False)
    order = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False, default=1)
    rows = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship avec l'utilisateur
    user = relationship("User", back_populates="widget_layouts")


class ClientTicketToken(Base):
    __tablename__ = "client_ticket_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)  # UUID
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Configuration
    active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)  # None = pas d'expiration
    max_tickets = Column(Integer, nullable=True)  # None = illimité
    password_hash = Column(String(255), nullable=True)  # Optionnel
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    
    # Relationships
    contact = relationship("Contact", back_populates="client_tokens")
    project = relationship("Project")
    created_by = relationship("User")
    ticket_accesses = relationship("ClientTicketAccess", back_populates="token", cascade="all, delete-orphan")


class ClientTicketAccess(Base):
    __tablename__ = "client_ticket_accesses"
    
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("client_ticket_tokens.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    
    # Permissions
    can_comment = Column(Boolean, default=True, nullable=False)
    can_attach = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    token = relationship("ClientTicketToken", back_populates="ticket_accesses")
    ticket = relationship("Ticket")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Content
    type = Column(String(50), nullable=False)  # ticket_created, price_alert, email_breach, etc.
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)  # Lien vers la ressource
    
    # Status
    read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")


class EmailTemplate(Base):
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)  # project_update, newsletter, report, invoice, custom
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)  # Variables disponibles {{project_name}}, {{client_name}}
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")
    campaigns = relationship("EmailCampaign", back_populates="template")


class EmailCampaign(Base):
    __tablename__ = "email_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("email_templates.id"), nullable=False)
    
    # Campaign details
    name = Column(String(200), nullable=False)
    subject = Column(String(500), nullable=False)
    body_html = Column(Text, nullable=False)
    
    # Status and timing
    status = Column(String(20), nullable=False, default="draft")  # draft, scheduled, sending, sent, failed
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    
    # Statistics
    total_recipients = Column(Integer, default=0, nullable=False)
    sent_count = Column(Integer, default=0, nullable=False)
    opened_count = Column(Integer, default=0, nullable=False)
    clicked_count = Column(Integer, default=0, nullable=False)
    bounced_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    project = relationship("Project")
    template = relationship("EmailTemplate", back_populates="campaigns")
    created_by_user = relationship("User")
    recipients = relationship("EmailRecipient", back_populates="campaign", cascade="all, delete-orphan")


class EmailRecipient(Base):
    __tablename__ = "email_recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("email_campaigns.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    
    # Recipient details
    email = Column(String(255), nullable=False)
    name = Column(String(200), nullable=True)
    
    # Status tracking
    status = Column(String(20), nullable=False, default="pending")  # pending, sent, opened, clicked, bounced, failed
    sent_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    bounced_at = Column(DateTime, nullable=True)
    
    # Tracking data
    open_count = Column(Integer, default=0, nullable=False)
    click_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    campaign = relationship("EmailCampaign", back_populates="recipients")
    contact = relationship("Contact")


class EmailList(Base):
    __tablename__ = "email_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # List configuration
    contact_ids = Column(JSON, nullable=True)  # Liste des IDs de contacts
    filters = Column(JSON, nullable=True)  # Filtres dynamiques (company, status, etc.)
    
    # Statistics
    total_contacts = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


# RSS Models
class RSSFeed(Base):
    __tablename__ = "rss_feeds"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    tags = Column(JSON, nullable=True)  # ["tech", "finance", "ai"]
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_fetched = Column(DateTime, nullable=True)
    fetch_frequency = Column(Integer, default=3600, nullable=False)  # seconds
    
    # Statistics
    article_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User")
    articles = relationship("RSSArticle", back_populates="feed", cascade="all, delete-orphan")


class RSSArticle(Base):
    __tablename__ = "rss_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    feed_id = Column(Integer, ForeignKey("rss_feeds.id"), nullable=False)
    
    # Article data
    title = Column(String(500), nullable=False)
    url = Column(String(1000), unique=True, nullable=False)
    content_full = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True)
    
    # User interaction
    read = Column(Boolean, default=False, nullable=False)
    starred = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    feed = relationship("RSSFeed", back_populates="articles")
    user = relationship("User")


class RSSTag(Base):
    __tablename__ = "rss_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default="#3b82f6", nullable=False)  # Hex color
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")


# Email Security Models
class MonitoredEmail(Base):
    __tablename__ = "monitored_emails"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    type = Column(String(50), default="personal")  # "personal", "client"
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    check_frequency = Column(String(20), default="weekly")  # daily, weekly, monthly
    active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    contact = relationship("Contact")
    checks = relationship("EmailSecurityCheck", back_populates="monitored_email", cascade="all, delete-orphan")


class EmailSecurityCheck(Base):
    __tablename__ = "email_security_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    monitored_email_id = Column(Integer, ForeignKey("monitored_emails.id"), nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_compromised = Column(Boolean, default=False, nullable=False)
    breach_count = Column(Integer, default=0, nullable=False)
    breach_details = Column(JSON, nullable=True)  # [{name, date, data_classes}]
    
    # Relationships
    monitored_email = relationship("MonitoredEmail", back_populates="checks")
    alerts = relationship("EmailSecurityAlert", back_populates="check", cascade="all, delete-orphan")


class EmailSecurityAlert(Base):
    __tablename__ = "email_security_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    check_id = Column(Integer, ForeignKey("email_security_checks.id"), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    check = relationship("EmailSecurityCheck", back_populates="alerts")


# Portfolio Management Models
class PortfolioAsset(Base):
    __tablename__ = "portfolio_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # stock, crypto, bond, etf, real_estate, commodity
    symbol = Column(String(20), nullable=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Float, default=0, nullable=False)
    purchase_price = Column(Float, nullable=True)
    current_price = Column(Float, nullable=True)
    currency = Column(String(3), default="EUR", nullable=False)
    exchange = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    transactions = relationship("PortfolioTransaction", back_populates="asset", cascade="all, delete-orphan")
    price_history = relationship("PortfolioPriceHistory", back_populates="asset", cascade="all, delete-orphan")


class PortfolioTransaction(Base):
    __tablename__ = "portfolio_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("portfolio_assets.id"), nullable=False)
    type = Column(String(20), nullable=False)  # buy, sell, dividend, split, transfer
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    fees = Column(Float, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    asset = relationship("PortfolioAsset", back_populates="transactions")
    user = relationship("User")


class PortfolioPriceHistory(Base):
    __tablename__ = "portfolio_price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("portfolio_assets.id"), nullable=False)
    price = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    asset = relationship("PortfolioAsset", back_populates="price_history")


# =============================================================================
# COMPLETE ACCOUNTING MODULE MODELS
# =============================================================================

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    birth_date = Column(DateTime, nullable=True)
    social_security_number = Column(String(15), nullable=True)  # Numéro de sécurité sociale
    
    # Address
    address_line1 = Column(String(200), nullable=True)
    address_line2 = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True, default="France")
    
    # Employment information
    position = Column(String(100), nullable=False)  # Poste
    department = Column(String(100), nullable=True)  # Département
    employment_type = Column(String(20), nullable=False, default="CDI")  # CDI, CDD, Stage, Alternance
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # Pour CDD
    probation_period_end = Column(DateTime, nullable=True)  # Fin période d'essai
    
    # Salary information
    gross_salary_monthly = Column(Float, nullable=False)  # Salaire brut mensuel
    working_hours_per_week = Column(Float, nullable=False, default=35.0)
    working_hours_percentage = Column(Float, nullable=False, default=100.0)  # Pour temps partiel
    
    # Banking information
    iban = Column(String(34), nullable=True)  # IBAN pour virement salaire
    bic = Column(String(11), nullable=True)  # BIC
    
    # Status
    status = Column(String(20), nullable=False, default="active")  # active, inactive, on_leave, terminated
    
    # Manager
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    manager = relationship("Employee", remote_side=[id])
    created_by_user = relationship("User")
    payroll_entries = relationship("PayrollEntry", back_populates="employee")
    payslips = relationship("Payslip", back_populates="employee")


class PayrollEntry(Base):
    __tablename__ = "payroll_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    # Period
    period_year = Column(Integer, nullable=False)
    period_month = Column(Integer, nullable=False)  # 1-12
    
    # Basic salary
    gross_salary = Column(Float, nullable=False)  # Salaire brut
    hours_worked = Column(Float, nullable=False, default=0.0)
    overtime_hours = Column(Float, nullable=False, default=0.0)
    overtime_rate = Column(Float, nullable=False, default=1.25)  # Taux heures sup
    
    # Bonuses and allowances
    monthly_bonus = Column(Float, nullable=False, default=0.0)
    exceptional_bonus = Column(Float, nullable=False, default=0.0)
    meal_vouchers = Column(Float, nullable=False, default=0.0)
    transport_allowance = Column(Float, nullable=False, default=0.0)
    
    # Deductions
    employee_social_charges = Column(Float, nullable=False, default=0.0)  # Charges salariales
    employer_social_charges = Column(Float, nullable=False, default=0.0)  # Charges patronales
    income_tax = Column(Float, nullable=False, default=0.0)  # Impôt sur le revenu
    other_deductions = Column(Float, nullable=False, default=0.0)
    
    # Net salary
    net_salary = Column(Float, nullable=False)  # Net à payer
    
    # Status
    status = Column(String(20), nullable=False, default="draft")  # draft, generated, sent, paid
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    employee = relationship("Employee", back_populates="payroll_entries")
    created_by_user = relationship("User")


class SocialCharge(Base):
    __tablename__ = "social_charges"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Charge information
    name = Column(String(100), nullable=False)  # Nom de la cotisation
    charge_type = Column(String(50), nullable=False)  # employee, employer, both
    organism = Column(String(100), nullable=False)  # URSSAF, CNAV, etc.
    
    # Rates and limits
    employee_rate = Column(Float, nullable=False, default=0.0)  # Taux salarial (%)
    employer_rate = Column(Float, nullable=False, default=0.0)  # Taux patronal (%)
    ceiling_amount = Column(Float, nullable=True)  # Plafond de cotisation
    minimum_amount = Column(Float, nullable=True)  # Montant minimum
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TaxDeclaration(Base):
    __tablename__ = "tax_declarations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Declaration information
    declaration_type = Column(String(50), nullable=False)  # TVA, IS, CFE, etc.
    period_year = Column(Integer, nullable=False)
    period_month = Column(Integer, nullable=True)  # Pour déclarations mensuelles
    period_quarter = Column(Integer, nullable=True)  # Pour déclarations trimestrielles
    
    # Amounts
    taxable_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    
    # Status and dates
    status = Column(String(20), nullable=False, default="draft")  # draft, submitted, validated, paid
    due_date = Column(Date, nullable=False)
    submission_date = Column(Date, nullable=True)
    payment_date = Column(Date, nullable=True)
    
    # Additional information
    reference_number = Column(String(100), nullable=True)  # Numéro de référence
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class AccountingEntry(Base):
    __tablename__ = "accounting_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Entry information
    entry_date = Column(DateTime, nullable=False)
    description = Column(String(500), nullable=False)
    reference = Column(String(100), nullable=True)  # Référence pièce
    
    # Accounts
    debit_account_id = Column(Integer, ForeignKey("accounting_accounts.id"), nullable=True)
    credit_account_id = Column(Integer, ForeignKey("accounting_accounts.id"), nullable=True)
    
    # Amount
    amount = Column(Float, nullable=False)
    
    # Additional information
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    debit_account = relationship("AccountingAccount", foreign_keys=[debit_account_id])
    credit_account = relationship("AccountingAccount", foreign_keys=[credit_account_id])
    invoice = relationship("Invoice")
    project = relationship("Project")
    fiscal_year = relationship("FiscalYear", back_populates="accounting_entries")
    accounting_lines = relationship("AccountingLine", back_populates="accounting_entry")
    created_by_user = relationship("User")


class AccountingAccount(Base):
    __tablename__ = "accounting_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Account information
    account_number = Column(String(20), nullable=False, unique=True, index=True)
    account_name = Column(String(200), nullable=False)
    account_type = Column(String(50), nullable=False)  # asset, liability, equity, revenue, expense
    
    # Hierarchy
    parent_account_id = Column(Integer, ForeignKey("accounting_accounts.id"), nullable=True)
    level = Column(Integer, nullable=False, default=1)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    parent_account = relationship("AccountingAccount", remote_side=[id])
    child_accounts = relationship("AccountingAccount", back_populates="parent_account")


class InvoiceTemplate(Base):
    __tablename__ = "invoice_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Template information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Template content
    header_html = Column(Text, nullable=True)
    footer_html = Column(Text, nullable=True)
    css_styles = Column(Text, nullable=True)
    
    # Default settings
    default_payment_terms = Column(String(200), nullable=True)
    default_notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class PaymentReminder(Base):
    __tablename__ = "payment_reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    # Reminder information
    reminder_type = Column(String(20), nullable=False)  # gentle, firm, final
    reminder_date = Column(DateTime, nullable=False)
    days_overdue = Column(Integer, nullable=False)  # Nombre de jours de retard
    
    # Content
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    status = Column(String(20), nullable=False, default="sent")  # sent, opened, clicked
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    invoice = relationship("Invoice")
    created_by_user = relationship("User")


class AccountingReport(Base):
    __tablename__ = "accounting_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Report identification
    report_type = Column(String(50), nullable=False)  # balance_sheet, income_statement, cash_flow, project_analysis, client_analysis
    report_name = Column(String(200), nullable=False)
    report_description = Column(String(500), nullable=True)
    
    # Period information
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    as_of_date = Column(DateTime, nullable=True)  # For balance sheet
    
    # Report data (JSON)
    report_data = Column(Text, nullable=False)  # JSON string of the report data
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User")


class CompetitiveAnalysis(Base):
    __tablename__ = "competitive_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="draft")  # draft, completed
    current_step = Column(Integer, default=0, nullable=False)
    
    # Analysis data (JSON)
    responses = Column(JSON, nullable=False, default=dict)  # Question responses
    analysis_metadata = Column(JSON, nullable=True)  # Sector, market size, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
