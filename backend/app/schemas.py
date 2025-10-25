from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime, date


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


# TOTP schemas removed - 2FA disabled


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str


class AgentMetricsResponse(BaseModel):
    agent_id: str
    agent_name: str
    lines_created: int
    lines_deleted: int
    lines_modified: int
    files_processed: int
    files_created: int
    files_deleted: int
    jobs_completed: int
    jobs_failed: int
    total_work_time_seconds: int
    last_activity: Optional[datetime]
    avg_job_duration_seconds: int
    success_rate: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AgentActivityResponse(BaseModel):
    id: int
    agent_id: str
    activity_type: str
    file_path: Optional[str]
    lines_changed: Optional[int]
    duration_seconds: Optional[int]
    error_message: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Ticket System Schemas
class TicketCommentBase(BaseModel):
    content: str


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentResponse(TicketCommentBase):
    id: int
    ticket_id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TicketHistoryResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    user_name: Optional[str] = None
    action: str
    field_name: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    target: Optional[str] = None
    ip: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TicketBase(BaseModel):
    title: str
    description: Optional[str] = ""
    theme: str
    priority: str
    status: str = "open"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[str] = None
    estimated_hours: Optional[float] = None
    project_id: Optional[int] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    project_id: Optional[int] = None


class TicketResponse(TicketBase):
    id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    actual_hours: Optional[float]
    comment_count: int = 0
    
    class Config:
        from_attributes = True


class TicketDetailResponse(TicketResponse):
    comments: List[TicketCommentResponse] = []
    history: List[TicketHistoryResponse] = []
    
    class Config:
        from_attributes = True


# Dashboard schemas
class WidgetPosition(BaseModel):
    col: int
    row: int


class WidgetSize(BaseModel):
    cols: int
    rows: int


class WidgetConfig(BaseModel):
    id: str
    type: str
    position: WidgetPosition
    size: WidgetSize
    config: dict


class DashboardConfigCreate(BaseModel):
    config_json: dict


class DashboardConfigResponse(BaseModel):
    id: int
    user_id: int
    config_json: dict
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# CRM Schemas
class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = "prospect"
    notes: Optional[str] = None
    tags: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    contacts_count: int = 0
    projects_count: int = 0
    
    class Config:
        from_attributes = True


class CompanyDetailResponse(CompanyResponse):
    contacts: List['ContactResponse'] = []
    projects: List['ProjectResponse'] = []
    interactions: List['InteractionResponse'] = []
    documents: List['DocumentResponse'] = []
    
    class Config:
        from_attributes = True


class ContactBase(BaseModel):
    company_id: Optional[int] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    tags: Optional[str] = None
    photo_url: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    company_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    photo_url: Optional[str] = None


class ContactResponse(ContactBase):
    id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ContactDetailResponse(ContactResponse):
    company: Optional[CompanyResponse] = None
    interactions: List['InteractionResponse'] = []
    documents: List['DocumentResponse'] = []
    
    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    company_id: int
    primary_contact_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str = "planning"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = 0.0  # Toujours 0 à la création
    currency: Optional[str] = "EUR"
    progress_percentage: int = 0
    team_assigned: Optional[str] = None
    
    # Champs commerciaux
    commercial_status: Optional[str] = None
    sale_price: Optional[float] = None
    daily_rate: Optional[float] = None
    monthly_rate: Optional[float] = None
    annual_rate: Optional[float] = None
    rental_terms: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    company_id: Optional[int] = None
    primary_contact_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    # budget: Interdit de modifier directement
    currency: Optional[str] = None
    progress_percentage: Optional[int] = None
    team_assigned: Optional[str] = None
    
    # Champs commerciaux
    commercial_status: Optional[str] = None
    sale_price: Optional[float] = None
    daily_rate: Optional[float] = None
    monthly_rate: Optional[float] = None
    annual_rate: Optional[float] = None
    rental_terms: Optional[str] = None


class BudgetContributionCreate(BaseModel):
    project_id: int
    amount: float
    description: Optional[str] = None
    contribution_type: str = "budget_add"  # budget_add, expense


class BudgetContributionResponse(BaseModel):
    id: int
    project_id: int
    amount: float
    description: Optional[str] = None
    contribution_type: str
    created_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class ProjectResponse(ProjectBase):
    id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None
    primary_contact_name: Optional[str] = None
    
    # Champs calculés pour les statistiques
    total_spent: Optional[float] = 0
    remaining_budget: Optional[float] = 0
    active_tickets_count: Optional[int] = 0
    completed_tickets_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    company: Optional[CompanyResponse] = None
    primary_contact: Optional[ContactResponse] = None
    phases: List['ProjectPhaseResponse'] = []
    deliverables: List['ProjectDeliverableResponse'] = []
    documents: List['DocumentResponse'] = []
    
    class Config:
        from_attributes = True


class ProjectContactBase(BaseModel):
    project_id: int
    contact_id: int
    role: Optional[str] = None


class ProjectContactCreate(ProjectContactBase):
    pass


class ProjectContactUpdate(BaseModel):
    role: Optional[str] = None


class ProjectContactResponse(ProjectContactBase):
    id: int
    added_at: datetime
    contact: Optional[ContactResponse] = None
    
    class Config:
        from_attributes = True


class ProjectPhaseBase(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    status: str = "pending"
    order: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectPhaseCreate(ProjectPhaseBase):
    pass


class ProjectPhaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    order: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ProjectPhaseResponse(ProjectPhaseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectDeliverableBase(BaseModel):
    project_id: int
    phase_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str = "pending"
    due_date: Optional[datetime] = None


class ProjectDeliverableCreate(ProjectDeliverableBase):
    pass


class ProjectDeliverableUpdate(BaseModel):
    phase_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ProjectDeliverableResponse(ProjectDeliverableBase):
    id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    project_id: Optional[int] = None
    filename: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: int
    uploaded_by_user_id: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class ProjectNoteBase(BaseModel):
    project_id: int
    content: str


class ProjectNoteCreate(ProjectNoteBase):
    pass


class ProjectNoteUpdate(BaseModel):
    content: Optional[str] = None


class ProjectNoteResponse(ProjectNoteBase):
    id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True


class InteractionBase(BaseModel):
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    interaction_type: str
    subject: Optional[str] = None
    content: Optional[str] = None
    interaction_date: datetime


class InteractionCreate(InteractionBase):
    pass


class InteractionResponse(InteractionBase):
    id: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# Update forward references
CompanyDetailResponse.model_rebuild()
ContactDetailResponse.model_rebuild()
ProjectDetailResponse.model_rebuild()


# Calendar Schemas
class RecurrencePattern(BaseModel):
    frequency: str  # daily, weekly, monthly, yearly
    interval: int = 1
    end_date: Optional[datetime] = None
    days_of_week: Optional[List[int]] = None  # 0-6 (Monday-Sunday)
    
    class Config:
        from_attributes = True


class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    category: str = "other"  # meeting, deadline, personal, project, other
    tags: Optional[str] = None
    status: str = "planned"  # planned, confirmed, cancelled
    is_recurring: bool = False
    recurrence_pattern: Optional[RecurrencePattern] = None
    participants: Optional[List[str]] = None
    reminder_minutes: Optional[List[int]] = None
    ticket_id: Optional[int] = None
    project_id: Optional[int] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[RecurrencePattern] = None
    participants: Optional[List[str]] = None
    reminder_minutes: Optional[List[int]] = None
    ticket_id: Optional[int] = None
    project_id: Optional[int] = None


class CalendarEventResponse(CalendarEventBase):
    id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    is_past: bool = False
    is_today: bool = False
    is_upcoming: bool = False
    
    class Config:
        from_attributes = True


class CalendarStats(BaseModel):
    total: int = 0
    upcoming: int = 0
    past: int = 0
    by_category: dict = {}
    by_status: dict = {}


# Budget Schemas
class BudgetTransactionCreate(BaseModel):
    project_id: int
    transaction_type: str
    category: str
    amount: float
    currency: str = "EUR"
    description: str
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    transaction_date: str  # ISO format
    status: Optional[str] = "pending"

class BudgetTransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    transaction_date: Optional[str] = None
    status: Optional[str] = None

class BudgetTransactionResponse(BaseModel):
    id: int
    project_id: int
    transaction_type: str
    category: str
    amount: float
    currency: str
    description: str
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    transaction_date: str
    status: Optional[str]
    created_by_user_id: int
    created_at: str
    updated_at: Optional[str]
    created_by_username: Optional[str]

class MonthlySpending(BaseModel):
    month: str
    amount: float
    transactions_count: int

class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    transaction_count: int

class StatusTrend(BaseModel):
    date: str
    spent_amount: float
    remaining_amount: float

class ProjectedCompletion(BaseModel):
    estimated_total_cost: float
    completion_date: Optional[str]
    budget_variance: float

class BudgetAnalysis(BaseModel):
    total_budget: float
    total_spent: float
    total_income: float
    remaining_budget: float
    budget_utilization_percentage: float
    monthly_spending: List[MonthlySpending]
    category_breakdown: List[CategoryBreakdown]
    status_trend: List[StatusTrend]
    projected_completion: ProjectedCompletion

class BudgetAlertResponse(BaseModel):
    id: int
    project_id: int
    alert_type: str
    message: str
    severity: str
    is_read: bool
    created_at: str

class BudgetReportSummary(BaseModel):
    total_budget: float
    total_spent: float
    total_income: float
    net_profit_loss: float
    budget_variance: float

class BudgetReportPeriod(BaseModel):
    start_date: str
    end_date: str

class BudgetReport(BaseModel):
    project_id: int
    project_name: str
    report_period: BudgetReportPeriod
    summary: BudgetReportSummary
    transactions: List[BudgetTransactionResponse]
    analysis: BudgetAnalysis
    alerts: List[BudgetAlertResponse]
    generated_at: str
    generated_by: str


# Pricing Calculation Schemas
class PricingSuggestion(BaseModel):
    cost_based: float
    with_margin_20: float
    with_margin_30: float

class SalePriceSuggestions(BaseModel):
    with_margin_10: float
    with_margin_20: float
    with_margin_30: float
    with_margin_50: float
    custom: float

class RentalRatesSuggestions(BaseModel):
    daily: PricingSuggestion
    monthly: PricingSuggestion
    annual: PricingSuggestion

class ProjectPricingCalculation(BaseModel):
    total_hours_spent: float
    total_days_spent: float
    total_costs: float
    total_income: float
    net_cost: float
    hourly_rate: float
    daily_rate: float
    suggested_sale_price: SalePriceSuggestions
    suggested_rental_rates: RentalRatesSuggestions


# =============================================================================
# ACCOUNTING SCHEMAS
# =============================================================================

# Employee Schemas
class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
    social_security_number: Optional[str] = None
    hire_date: datetime
    contract_type: str = "CDI"
    work_hours_per_week: float = 35.0
    gross_salary: float
    currency: str = "EUR"
    status: str = "active"


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[datetime] = None
    social_security_number: Optional[str] = None
    contract_type: Optional[str] = None
    work_hours_per_week: Optional[float] = None
    gross_salary: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    termination_date: Optional[datetime] = None


# Social Contribution Schemas
class SocialContributionCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    contribution_type: str  # employee, employer, both
    rate_percentage: float
    ceiling_amount: Optional[float] = None
    base_type: str = "gross_salary"
    legal_basis: Optional[str] = None
    is_active: bool = True


class SocialContributionUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    contribution_type: Optional[str] = None
    rate_percentage: Optional[float] = None
    ceiling_amount: Optional[float] = None
    base_type: Optional[str] = None
    legal_basis: Optional[str] = None
    is_active: Optional[bool] = None


class SocialContributionResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    contribution_type: str
    rate_percentage: float
    ceiling_amount: Optional[float]
    base_type: str
    legal_basis: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Payslip Schemas
class PayslipLineCreate(BaseModel):
    social_contribution_id: Optional[int] = None
    line_type: str  # gross, employee_contribution, employer_contribution, deduction, bonus
    description: str
    base_amount: float
    rate_percentage: Optional[float] = None
    amount: float
    display_order: int = 0


class PayslipLineResponse(BaseModel):
    id: int
    payslip_id: int
    social_contribution_id: Optional[int]
    line_type: str
    description: str
    base_amount: float
    rate_percentage: Optional[float]
    amount: float
    display_order: int

    class Config:
        from_attributes = True


class PayslipCreate(BaseModel):
    employee_id: int
    period_year: int
    period_month: int
    period_start_date: datetime
    period_end_date: datetime
    gross_salary: float
    payslip_lines: List[PayslipLineCreate] = []


class PayslipUpdate(BaseModel):
    status: Optional[str] = None
    payment_date: Optional[datetime] = None


class PayslipResponse(BaseModel):
    id: int
    employee_id: int
    period_year: int
    period_month: int
    period_start_date: datetime
    period_end_date: datetime
    gross_salary: float
    total_employee_contributions: float
    total_employer_contributions: float
    net_salary: float
    status: str
    payment_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    employee: EmployeeResponse
    payslip_lines: List[PayslipLineResponse] = []

    class Config:
        from_attributes = True


class PayslipGeneration(BaseModel):
    employee_id: int
    period_year: int
    period_month: int
    gross_salary: Optional[float] = None  # Si None, utilise le salaire de base de l'employé
    bonuses: List[dict] = []  # Liste des primes
    deductions: List[dict] = []  # Liste des retenues


# Social Declaration Schemas
class SocialDeclarationCreate(BaseModel):
    declaration_year: int
    declaration_quarter: int
    period_start_date: datetime
    period_end_date: datetime
    declaration_type: str = "DSN"


class SocialDeclarationUpdate(BaseModel):
    status: Optional[str] = None
    xml_file_path: Optional[str] = None
    xml_file_size: Optional[int] = None
    submission_date: Optional[datetime] = None


class SocialDeclarationResponse(BaseModel):
    id: int
    declaration_year: int
    declaration_quarter: int
    period_start_date: datetime
    period_end_date: datetime
    declaration_type: str
    status: str
    total_gross_salaries: float
    total_employee_contributions: float
    total_employer_contributions: float
    total_contributions: float
    xml_file_path: Optional[str]
    xml_file_size: Optional[int]
    submission_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int

    class Config:
        from_attributes = True


class SocialDeclarationExport(BaseModel):
    declaration_id: int
    format: str = "xml"  # xml, csv


# =============================================================================
# INVOICING SCHEMAS
# =============================================================================

# Tax Rate Schemas
class TaxRateCreate(BaseModel):
    name: str
    code: str
    rate_percentage: float
    description: Optional[str] = None
    is_active: bool = True


class TaxRateUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    rate_percentage: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TaxRateResponse(BaseModel):
    id: int
    name: str
    code: str
    rate_percentage: float
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Invoice Line Schemas
class InvoiceLineCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    tax_rate_id: Optional[int] = None
    tax_rate_percentage: float = 0.0
    line_total: float
    line_order: int = 0


class InvoiceLineResponse(BaseModel):
    id: int
    invoice_id: int
    description: str
    quantity: float
    unit_price: float
    tax_rate_id: Optional[int]
    tax_rate_percentage: float
    line_total: float
    line_order: int

    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceCreate(BaseModel):
    document_type: str = "invoice"
    client_company_id: Optional[int] = None
    client_contact_id: Optional[int] = None
    client_name: str
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    issue_date: datetime
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    reference_number: Optional[str] = None
    currency: str = "EUR"
    invoice_lines: List[InvoiceLineCreate] = []


class InvoiceUpdate(BaseModel):
    client_company_id: Optional[int] = None
    client_contact_id: Optional[int] = None
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    reference_number: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    document_type: str
    client_company_id: Optional[int]
    client_contact_id: Optional[int]
    client_name: str
    client_address: Optional[str]
    client_email: Optional[str]
    issue_date: datetime
    due_date: Optional[datetime]
    payment_date: Optional[datetime]
    subtotal: float
    total_tax: float
    total_amount: float
    currency: str
    status: str
    notes: Optional[str]
    payment_terms: Optional[str]
    reference_number: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    invoice_lines: List[InvoiceLineResponse] = []

    class Config:
        from_attributes = True


class InvoicePDF(BaseModel):
    invoice_id: int
    include_logo: bool = True
    include_payment_terms: bool = True


# Quote Line Schemas
class QuoteLineCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    tax_rate_id: Optional[int] = None
    tax_rate_percentage: float = 0.0
    line_total: float
    line_order: int = 0


class QuoteLineResponse(BaseModel):
    id: int
    quote_id: int
    description: str
    quantity: float
    unit_price: float
    tax_rate_id: Optional[int]
    tax_rate_percentage: float
    line_total: float
    line_order: int

    class Config:
        from_attributes = True


# Quote Schemas
class QuoteCreate(BaseModel):
    client_company_id: Optional[int] = None
    client_contact_id: Optional[int] = None
    client_name: str
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    issue_date: datetime
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    terms_conditions: Optional[str] = None
    currency: str = "EUR"
    quote_lines: List[QuoteLineCreate] = []


class QuoteUpdate(BaseModel):
    client_company_id: Optional[int] = None
    client_contact_id: Optional[int] = None
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    issue_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    terms_conditions: Optional[str] = None


class QuoteResponse(BaseModel):
    id: int
    quote_number: str
    client_company_id: Optional[int]
    client_contact_id: Optional[int]
    client_name: str
    client_address: Optional[str]
    client_email: Optional[str]
    issue_date: datetime
    valid_until: Optional[datetime]
    subtotal: float
    total_tax: float
    total_amount: float
    currency: str
    status: str
    notes: Optional[str]
    terms_conditions: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    quote_lines: List[QuoteLineResponse] = []

    class Config:
        from_attributes = True


class QuoteConvert(BaseModel):
    quote_id: int
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None


# =============================================================================
# GENERAL ACCOUNTING SCHEMAS
# =============================================================================

# Chart of Accounts Schemas
class ChartOfAccountsCreate(BaseModel):
    account_code: str
    account_name: str
    account_type: str  # asset, liability, equity, revenue, expense
    parent_account_code: Optional[str] = None
    is_active: bool = True


class ChartOfAccountsUpdate(BaseModel):
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    parent_account_code: Optional[str] = None
    is_active: Optional[bool] = None


class ChartOfAccountsResponse(BaseModel):
    id: int
    account_code: str
    account_name: str
    account_type: str
    parent_account_code: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Fiscal Year Schemas
class FiscalYearCreate(BaseModel):
    year: int
    start_date: datetime
    end_date: datetime


class FiscalYearUpdate(BaseModel):
    year: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None


class FiscalYearResponse(BaseModel):
    id: int
    year: int
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Accounting Line Schemas
class AccountingLineCreate(BaseModel):
    account_id: int
    description: str
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    line_order: int = 0


class AccountingLineResponse(BaseModel):
    id: int
    accounting_entry_id: int
    account_id: int
    description: str
    debit_amount: float
    credit_amount: float
    line_order: int
    account: ChartOfAccountsResponse

    class Config:
        from_attributes = True


# Accounting Entry Schemas
class AccountingEntryCreate(BaseModel):
    fiscal_year_id: int
    entry_date: datetime
    description: str
    reference_document: Optional[str] = None
    reference_document_id: Optional[int] = None
    accounting_lines: List[AccountingLineCreate] = []


class AccountingEntryUpdate(BaseModel):
    entry_date: Optional[datetime] = None
    description: Optional[str] = None
    reference_document: Optional[str] = None
    reference_document_id: Optional[int] = None
    status: Optional[str] = None


# =============================================================================
# REPORTING SCHEMAS
# =============================================================================

class ProfitLossStatement(BaseModel):
    fiscal_year_id: int
    start_date: datetime
    end_date: datetime
    revenue: float
    cost_of_goods_sold: float
    gross_profit: float
    operating_expenses: float
    operating_income: float
    other_income: float
    other_expenses: float
    net_income: float


class BalanceSheet(BaseModel):
    fiscal_year_id: int
    as_of_date: datetime
    assets: float
    liabilities: float
    equity: float


class CashFlowStatement(BaseModel):
    fiscal_year_id: int
    start_date: datetime
    end_date: datetime
    operating_cash_flow: float
    investing_cash_flow: float
    financing_cash_flow: float
    net_cash_flow: float


# =============================================================================
# COMPANY CONTACT SCHEMAS
# =============================================================================

class CompanyContactBase(BaseModel):
    role: Optional[str] = None
    department: Optional[str] = None
    is_primary: bool = False


class CompanyContactCreate(CompanyContactBase):
    company_id: int
    contact_id: int


class CompanyContactUpdate(CompanyContactBase):
    pass


class CompanyContactResponse(CompanyContactBase):
    id: int
    company_id: int
    contact_id: int
    added_at: datetime
    contact: Optional['ContactResponse'] = None
    
    class Config:
        from_attributes = True


class CompanyContactListResponse(BaseModel):
    company_id: int
    company_name: str
    contacts: List[CompanyContactResponse]
    
    class Config:
        from_attributes = True


# Tags Schemas
class TagBase(BaseModel):
    name: str
    entity_type: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    usage_count: int
    created_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class TagSuggestion(BaseModel):
    name: str
    usage_count: int


# Todo Schemas
class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high, critical
    due_date: Optional[datetime] = None
    project_id: Optional[int] = None
    ticket_id: Optional[int] = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # pending, in_progress, completed
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    project_id: Optional[int] = None
    ticket_id: Optional[int] = None


class TodoResponse(TodoBase):
    id: int
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


# Dashboard Schemas
class DashboardWidgetsResponse(BaseModel):
    projects_stats: dict
    tickets_stats: dict
    companies_stats: dict
    contacts_stats: dict
    invoicing_stats: dict
    calendar_stats: dict
    todos_stats: dict
    recent_errors: List[dict]
    recent_activity: List[dict]
    budget_overview: dict
    agent_metrics: List[dict]


class RecentErrorResponse(BaseModel):
    timestamp: str
    level: str
    module: str
    message: str
    request_id: Optional[str] = None


# =============================================================================
# WIDGET LAYOUT SCHEMAS
# =============================================================================

class WidgetPositionSchema(BaseModel):
    id: str
    order: int
    cols: int
    rows: int

class WidgetLayoutCreate(BaseModel):
    widgets: List[WidgetPositionSchema]

class WidgetLayoutResponse(BaseModel):
    id: int
    user_id: int
    widget_id: str
    order: int
    cols: int
    rows: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Client Portal Schemas
class ClientTicketTokenCreate(BaseModel):
    contact_id: int
    project_id: Optional[int] = None
    expires_at: Optional[datetime] = None
    max_tickets: Optional[int] = None
    password: Optional[str] = None  # Optionnel


class ClientTicketTokenUpdate(BaseModel):
    active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    max_tickets: Optional[int] = None


class ClientTicketTokenResponse(BaseModel):
    id: int
    token: str
    contact_id: int
    project_id: Optional[int]
    active: bool
    expires_at: Optional[datetime]
    max_tickets: Optional[int]
    created_at: datetime
    last_used_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ClientTicketCreate(BaseModel):
    """Création de ticket par un client (via token)"""
    title: str
    description: str
    theme: str = "Support"
    priority: str = "medium"


class ClientTicketCommentCreate(BaseModel):
    """Ajout de commentaire par un client"""
    content: str


class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    link: Optional[str]
    read: bool
    read_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Email Campaigns Schemas
class EmailTemplateCreate(BaseModel):
    name: str
    type: str
    subject: str
    body_html: str
    variables: Optional[Dict[str, Any]] = None


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    variables: Optional[Dict[str, Any]] = None


class EmailTemplateResponse(BaseModel):
    id: int
    name: str
    type: str
    subject: str
    body_html: str
    variables: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class EmailCampaignCreate(BaseModel):
    project_id: Optional[int] = None
    template_id: int
    name: str
    subject: str
    body_html: str
    scheduled_at: Optional[datetime] = None


class EmailCampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class EmailCampaignResponse(BaseModel):
    id: int
    project_id: Optional[int]
    template_id: int
    name: str
    subject: str
    body_html: str
    status: str
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    total_recipients: int
    sent_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class EmailRecipientCreate(BaseModel):
    campaign_id: int
    contact_id: Optional[int] = None
    email: str
    name: Optional[str] = None


class EmailRecipientResponse(BaseModel):
    id: int
    campaign_id: int
    contact_id: Optional[int]
    email: str
    name: Optional[str]
    status: str
    sent_at: Optional[datetime]
    opened_at: Optional[datetime]
    clicked_at: Optional[datetime]
    bounced_at: Optional[datetime]
    open_count: int
    click_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmailListCreate(BaseModel):
    name: str
    description: Optional[str] = None
    contact_ids: Optional[List[int]] = None
    filters: Optional[Dict[str, Any]] = None


class EmailListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_ids: Optional[List[int]] = None
    filters: Optional[Dict[str, Any]] = None


class EmailListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    contact_ids: Optional[List[int]]
    filters: Optional[Dict[str, Any]]
    total_contacts: int
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class CampaignStatsResponse(BaseModel):
    campaign_id: int
    total_recipients: int
    sent_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    open_rate: float
    click_rate: float
    bounce_rate: float


# Portfolio Public Schemas
class PortfolioProjectCreate(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = None
    technologies: Optional[List[str]] = None
    images: Optional[List[str]] = None
    url: Optional[str] = None
    github_url: Optional[str] = None
    category: str
    featured: Optional[bool] = False
    order: Optional[int] = 0
    published: Optional[bool] = True


class PortfolioProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    technologies: Optional[List[str]] = None
    images: Optional[List[str]] = None
    url: Optional[str] = None
    github_url: Optional[str] = None
    category: Optional[str] = None
    featured: Optional[bool] = None
    order: Optional[int] = None
    published: Optional[bool] = None


class PortfolioProjectResponse(BaseModel):
    id: int
    title: str
    description: str
    short_description: Optional[str]
    technologies: Optional[List[str]]
    images: Optional[List[str]]
    url: Optional[str]
    github_url: Optional[str]
    category: str
    featured: bool
    order: int
    published: bool
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class PortfolioSkillCreate(BaseModel):
    name: str
    category: str
    level: int
    icon: Optional[str] = None
    order: Optional[int] = 0


class PortfolioSkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[int] = None
    icon: Optional[str] = None
    order: Optional[int] = None


class PortfolioSkillResponse(BaseModel):
    id: int
    name: str
    category: str
    level: int
    icon: Optional[str]
    order: int
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class PortfolioTestimonialCreate(BaseModel):
    author: str
    role: Optional[str] = None
    company: Optional[str] = None
    content: str
    avatar: Optional[str] = None
    rating: Optional[int] = None
    featured: Optional[bool] = False
    order: Optional[int] = 0


class PortfolioTestimonialUpdate(BaseModel):
    author: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    content: Optional[str] = None
    avatar: Optional[str] = None
    rating: Optional[int] = None
    featured: Optional[bool] = None
    order: Optional[int] = None


class PortfolioTestimonialResponse(BaseModel):
    id: int
    author: str
    role: Optional[str]
    company: Optional[str]
    content: str
    avatar: Optional[str]
    rating: Optional[int]
    featured: bool
    order: int
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class PortfolioBlogPostCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    featured: Optional[bool] = False
    published: Optional[bool] = True
    published_at: Optional[datetime] = None


class PortfolioBlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[List[str]] = None
    featured: Optional[bool] = None
    published: Optional[bool] = None
    published_at: Optional[datetime] = None


class PortfolioBlogPostResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    excerpt: Optional[str]
    cover_image: Optional[str]
    tags: Optional[List[str]]
    views: int
    featured: bool
    published: bool
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class PortfolioContactCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str


class PortfolioContactResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    replied: bool
    created_at: datetime
    created_by_user_id: int
    
    class Config:
        from_attributes = True


class PortfolioStatsResponse(BaseModel):
    total_projects: int
    total_skills: int
    total_testimonials: int
    total_blog_posts: int
    total_contacts: int
    featured_projects: int
    published_blog_posts: int
    unread_contacts: int


# RSS Schemas
class RSSFeedCreate(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    fetch_frequency: Optional[int] = 3600


class RSSFeedUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    tags: Optional[List[str]] = None
    fetch_frequency: Optional[int] = None


class RSSFeedResponse(BaseModel):
    id: int
    url: str
    title: Optional[str]
    description: Optional[str]
    active: bool
    tags: Optional[List[str]]
    user_id: int
    created_at: datetime
    last_fetched: Optional[datetime]
    fetch_frequency: int
    article_count: int
    
    class Config:
        from_attributes = True


class RSSArticleResponse(BaseModel):
    id: int
    feed_id: int
    title: str
    url: str
    content_full: Optional[str]
    summary: Optional[str]
    author: Optional[str]
    published_at: Optional[datetime]
    read: bool
    starred: bool
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class RSSArticleUpdate(BaseModel):
    read: Optional[bool] = None
    starred: Optional[bool] = None


class RSSTagCreate(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"


class RSSTagResponse(BaseModel):
    id: int
    name: str
    color: str
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class RSSStatsResponse(BaseModel):
    total_feeds: int
    active_feeds: int
    total_articles: int
    unread_articles: int
    starred_articles: int


# Email Security Schemas
class MonitoredEmailCreate(BaseModel):
    email: str
    type: Optional[str] = "personal"
    contact_id: Optional[int] = None
    check_frequency: Optional[str] = "weekly"


class MonitoredEmailUpdate(BaseModel):
    type: Optional[str] = None
    contact_id: Optional[int] = None
    check_frequency: Optional[str] = None
    active: Optional[bool] = None


class MonitoredEmailResponse(BaseModel):
    id: int
    email: str
    type: str
    contact_id: Optional[int]
    check_frequency: str
    active: bool
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmailSecurityCheckResponse(BaseModel):
    id: int
    monitored_email_id: int
    checked_at: datetime
    is_compromised: bool
    breach_count: int
    breach_details: Optional[List[Dict[str, Any]]]
    
    class Config:
        from_attributes = True


class EmailSecurityAlertResponse(BaseModel):
    id: int
    check_id: int
    sent_at: datetime
    acknowledged: bool
    
    class Config:
        from_attributes = True


class EmailSecurityStatsResponse(BaseModel):
    total_monitored: int
    active_monitored: int
    compromised_emails: int
    total_checks: int
    unacknowledged_alerts: int


# Portfolio Management Schemas
class PortfolioAssetCreate(BaseModel):
    type: str
    symbol: Optional[str] = None
    name: str
    quantity: Optional[float] = 0
    purchase_price: Optional[float] = None
    current_price: Optional[float] = None
    currency: Optional[str] = "EUR"
    exchange: Optional[str] = None
    notes: Optional[str] = None


class PortfolioAssetUpdate(BaseModel):
    type: Optional[str] = None
    symbol: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[float] = None
    purchase_price: Optional[float] = None
    current_price: Optional[float] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None
    notes: Optional[str] = None


class PortfolioAssetResponse(BaseModel):
    id: int
    type: str
    symbol: Optional[str]
    name: str
    quantity: float
    purchase_price: Optional[float]
    current_price: Optional[float]
    currency: str
    exchange: Optional[str]
    notes: Optional[str]
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PortfolioTransactionCreate(BaseModel):
    asset_id: int
    type: str
    quantity: float
    price: float
    date: datetime
    fees: Optional[float] = 0
    notes: Optional[str] = None


class PortfolioTransactionUpdate(BaseModel):
    type: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    date: Optional[datetime] = None
    fees: Optional[float] = None
    notes: Optional[str] = None


class PortfolioTransactionResponse(BaseModel):
    id: int
    asset_id: int
    type: str
    quantity: float
    price: float
    date: datetime
    fees: float
    notes: Optional[str]
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PortfolioPriceHistoryResponse(BaseModel):
    id: int
    asset_id: int
    price: float
    date: datetime
    
    class Config:
        from_attributes = True


class PortfolioSummaryResponse(BaseModel):
    total_value: float
    total_invested: float
    total_pnl: float
    pnl_percentage: float
    asset_count: int
    transaction_count: int
    top_performers: List[Dict[str, Any]]
    worst_performers: List[Dict[str, Any]]


class PortfolioPerformanceResponse(BaseModel):
    period: str
    start_value: float
    end_value: float
    pnl: float
    pnl_percentage: float
    daily_returns: List[Dict[str, Any]]


# =============================================================================
# COMPLETE ACCOUNTING MODULE SCHEMAS
# =============================================================================

# Employee Schemas
class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    social_security_number: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "France"
    position: str
    department: Optional[str] = None
    employment_type: str = "CDI"
    start_date: date
    end_date: Optional[date] = None
    probation_period_end: Optional[date] = None
    gross_salary_monthly: float
    working_hours_per_week: float = 35.0
    working_hours_percentage: float = 100.0
    iban: Optional[str] = None
    bic: Optional[str] = None
    manager_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    social_security_number: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    probation_period_end: Optional[date] = None
    gross_salary_monthly: Optional[float] = None
    working_hours_per_week: Optional[float] = None
    working_hours_percentage: Optional[float] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    status: Optional[str] = None
    manager_id: Optional[int] = None


class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    birth_date: Optional[datetime]
    social_security_number: Optional[str]
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    position: Optional[str]
    department: Optional[str]
    employment_type: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    probation_period_end: Optional[datetime]
    gross_salary_monthly: Optional[float]
    working_hours_per_week: float
    working_hours_percentage: float
    iban: Optional[str]
    bic: Optional[str]
    status: str
    manager_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int

    @field_validator('birth_date', 'start_date', 'end_date', 'probation_period_end', 'created_at', 'updated_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        """Convert SQLite datetime strings to Python datetime objects"""
        if v is None:
            return None
        if isinstance(v, str):
            # SQLite stores datetime as 'YYYY-MM-DD HH:MM:SS.mmmmmm'
            # Replace space with 'T' for ISO format parsing
            return datetime.fromisoformat(v.replace(' ', 'T'))
        return v

    class Config:
        from_attributes = True


# PayrollEntry Schemas
class PayrollEntryCreate(BaseModel):
    employee_id: int
    period_year: int
    period_month: int
    gross_salary: float
    hours_worked: float = 0.0
    overtime_hours: float = 0.0
    overtime_rate: float = 1.25
    monthly_bonus: float = 0.0
    exceptional_bonus: float = 0.0
    meal_vouchers: float = 0.0
    transport_allowance: float = 0.0
    employee_social_charges: float = 0.0
    employer_social_charges: float = 0.0
    income_tax: float = 0.0
    other_deductions: float = 0.0
    net_salary: float


class PayrollEntryUpdate(BaseModel):
    gross_salary: Optional[float] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    overtime_rate: Optional[float] = None
    monthly_bonus: Optional[float] = None
    exceptional_bonus: Optional[float] = None
    meal_vouchers: Optional[float] = None
    transport_allowance: Optional[float] = None
    employee_social_charges: Optional[float] = None
    employer_social_charges: Optional[float] = None
    income_tax: Optional[float] = None
    other_deductions: Optional[float] = None
    net_salary: Optional[float] = None
    status: Optional[str] = None


class PayrollEntryResponse(BaseModel):
    id: int
    employee_id: int
    period_year: int
    period_month: int
    gross_salary: float
    hours_worked: float
    overtime_hours: float
    overtime_rate: float
    monthly_bonus: float
    exceptional_bonus: float
    meal_vouchers: float
    transport_allowance: float
    employee_social_charges: float
    employer_social_charges: float
    income_tax: float
    other_deductions: float
    net_salary: float
    status: str
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True


# SocialCharge Schemas
class SocialChargeCreate(BaseModel):
    name: str
    charge_type: str
    organism: str
    employee_rate: float = 0.0
    employer_rate: float = 0.0
    ceiling_amount: Optional[float] = None
    minimum_amount: Optional[float] = None


class SocialChargeUpdate(BaseModel):
    name: Optional[str] = None
    charge_type: Optional[str] = None
    organism: Optional[str] = None
    employee_rate: Optional[float] = None
    employer_rate: Optional[float] = None
    ceiling_amount: Optional[float] = None
    minimum_amount: Optional[float] = None
    is_active: Optional[bool] = None


class SocialChargeResponse(BaseModel):
    id: int
    name: str
    charge_type: str
    organism: str
    employee_rate: float
    employer_rate: float
    ceiling_amount: Optional[float]
    minimum_amount: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# TaxDeclaration Schemas
class TaxDeclarationCreate(BaseModel):
    declaration_type: str
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    taxable_amount: float = 0.0
    tax_amount: float = 0.0
    due_date: date
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class TaxDeclarationUpdate(BaseModel):
    declaration_type: Optional[str] = None
    period_year: Optional[int] = None
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    taxable_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    submission_date: Optional[date] = None
    payment_date: Optional[date] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class TaxDeclarationResponse(BaseModel):
    id: int
    declaration_type: str
    period_year: int
    period_month: Optional[int]
    period_quarter: Optional[int]
    taxable_amount: float
    tax_amount: float
    status: str
    due_date: date
    submission_date: Optional[date]
    payment_date: Optional[date]
    reference_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int

    class Config:
        from_attributes = True


# AccountingEntry Schemas
class AccountingEntryCreate(BaseModel):
    entry_date: datetime
    description: str
    reference: Optional[str] = None
    debit_account_id: Optional[int] = None
    credit_account_id: Optional[int] = None
    amount: float
    invoice_id: Optional[int] = None
    project_id: Optional[int] = None


class AccountingEntryUpdate(BaseModel):
    entry_date: Optional[datetime] = None
    description: Optional[str] = None
    reference: Optional[str] = None
    debit_account_id: Optional[int] = None
    credit_account_id: Optional[int] = None
    amount: Optional[float] = None
    invoice_id: Optional[int] = None
    project_id: Optional[int] = None


class AccountingEntryResponse(BaseModel):
    id: int
    entry_date: datetime
    description: str
    reference: Optional[str]
    debit_account_id: Optional[int]
    credit_account_id: Optional[int]
    amount: Optional[float]
    invoice_id: Optional[int]
    project_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int

    @field_validator('entry_date', 'created_at', 'updated_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        """Convert SQLite datetime strings to Python datetime objects"""
        if v is None:
            return None
        if isinstance(v, str):
            # SQLite stores datetime as 'YYYY-MM-DD HH:MM:SS.mmmmmm'
            return datetime.fromisoformat(v.replace(' ', 'T'))
        return v

    class Config:
        from_attributes = True


# AccountingAccount Schemas
class AccountingAccountCreate(BaseModel):
    account_number: str
    account_name: str
    account_type: str
    parent_account_id: Optional[int] = None
    level: int = 1


class AccountingAccountUpdate(BaseModel):
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    parent_account_id: Optional[int] = None
    level: Optional[int] = None
    is_active: Optional[bool] = None


class AccountingAccountResponse(BaseModel):
    id: int
    account_number: str
    account_name: str
    account_type: str
    parent_account_id: Optional[int]
    level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# InvoiceTemplate Schemas
class InvoiceTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    header_html: Optional[str] = None
    footer_html: Optional[str] = None
    css_styles: Optional[str] = None
    default_payment_terms: Optional[str] = None
    default_notes: Optional[str] = None
    is_default: bool = False


class InvoiceTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    header_html: Optional[str] = None
    footer_html: Optional[str] = None
    css_styles: Optional[str] = None
    default_payment_terms: Optional[str] = None
    default_notes: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class InvoiceTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    header_html: Optional[str]
    footer_html: Optional[str]
    css_styles: Optional[str]
    default_payment_terms: Optional[str]
    default_notes: Optional[str]
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int

    class Config:
        from_attributes = True


# PaymentReminder Schemas
class PaymentReminderCreate(BaseModel):
    invoice_id: int
    reminder_type: str
    reminder_date: datetime
    days_overdue: int
    subject: str
    message: str


class PaymentReminderUpdate(BaseModel):
    reminder_type: Optional[str] = None
    reminder_date: Optional[datetime] = None
    days_overdue: Optional[int] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None


class PaymentReminderResponse(BaseModel):
    id: int
    invoice_id: int
    reminder_type: str
    reminder_date: datetime
    days_overdue: int
    subject: str
    message: str
    status: str
    created_at: datetime
    created_by_user_id: int

    class Config:
        from_attributes = True


# Accounting Report Schemas
class AccountingReportCreate(BaseModel):
    report_type: str
    report_name: str
    report_description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    as_of_date: Optional[datetime] = None
    report_data: str  # JSON string


class AccountingReportUpdate(BaseModel):
    report_name: Optional[str] = None
    report_description: Optional[str] = None
    report_data: Optional[str] = None


class AccountingReportResponse(BaseModel):
    id: int
    report_type: str
    report_name: str
    report_description: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    as_of_date: Optional[datetime]
    report_data: str
    created_at: datetime
    created_by_user_id: int

    @field_validator('start_date', 'end_date', 'as_of_date', 'created_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        """Convert SQLite datetime strings to Python datetime objects"""
        if v is None:
            return None
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace(' ', 'T'))
        return v

    class Config:
        from_attributes = True


# Updated Invoice Schemas (adding new fields)
class InvoiceCreateUpdated(BaseModel):
    document_type: str = "invoice"
    client_company_id: Optional[int] = None
    client_contact_id: Optional[int] = None
    client_name: str
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    issue_date: datetime
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    reference_number: Optional[str] = None
    currency: str = "EUR"
    auto_generated: bool = False
    template_id: Optional[int] = None
    recurring_schedule: Optional[str] = None
    project_id: Optional[int] = None
    invoice_lines: List[InvoiceLineCreate] = []


class InvoiceUpdateUpdated(BaseModel):
    client_company_id: Optional[int] = None
    client_contact_id: Optional[int] = None
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    reference_number: Optional[str] = None
    auto_generated: Optional[bool] = None
    template_id: Optional[int] = None
    recurring_schedule: Optional[str] = None
    project_id: Optional[int] = None


class InvoiceResponseUpdated(BaseModel):
    id: int
    invoice_number: str
    document_type: str
    client_company_id: Optional[int]
    client_contact_id: Optional[int]
    client_name: str
    client_address: Optional[str]
    client_email: Optional[str]
    issue_date: datetime
    due_date: Optional[datetime]
    payment_date: Optional[datetime]
    subtotal: float
    total_tax: float
    total_amount: float
    currency: str
    status: str
    notes: Optional[str]
    payment_terms: Optional[str]
    reference_number: Optional[str]
    auto_generated: bool
    template_id: Optional[int]
    recurring_schedule: Optional[str]
    project_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: int
    invoice_lines: List[InvoiceLineResponse] = []

    class Config:
        from_attributes = True


# Accounting Dashboard Schemas
class AccountingKPIs(BaseModel):
    total_revenue: float
    gross_margin: float
    accounts_receivable: float
    cash_flow: float
    invoice_count: int
    pending_invoices: int
    employee_count: int
    pending_payslips: int
    social_declarations: int
    total_social_charges: float


class AccountingActivity(BaseModel):
    id: int
    type: str  # invoice_created, invoice_paid, payroll_generated, etc.
    description: str
    amount: Optional[float] = None
    created_at: datetime
    user_name: str


class AccountingAlert(BaseModel):
    id: int
    type: str  # overdue_invoice, payroll_due, declaration_due, etc.
    title: str
    message: str
    severity: str  # low, medium, high, critical
    due_date: Optional[date] = None
    created_at: datetime


# Competitive Analysis Schemas
class AnalysisResponseSchema(BaseModel):
    questionId: str
    answer: Any
    timestamp: datetime


class CompetitiveAnalysisMetadata(BaseModel):
    sector: Optional[str] = None
    marketSize: Optional[float] = None
    mainCompetitor: Optional[str] = None


class CompetitiveAnalysisBase(BaseModel):
    title: str
    status: str = "draft"  # draft, completed
    current_step: int = 0
    responses: List[AnalysisResponseSchema] = []
    metadata: Optional[CompetitiveAnalysisMetadata] = None


class CompetitiveAnalysisCreate(CompetitiveAnalysisBase):
    pass


class CompetitiveAnalysisUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    current_step: Optional[int] = None
    responses: Optional[List[AnalysisResponseSchema]] = None
    metadata: Optional[CompetitiveAnalysisMetadata] = None


class CompetitiveAnalysisResponse(CompetitiveAnalysisBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompetitiveAnalysisListResponse(BaseModel):
    id: int
    title: str
    status: str
    current_step: int
    metadata: Optional[CompetitiveAnalysisMetadata] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
