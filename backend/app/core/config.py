import os
from functools import lru_cache
from typing import List, Dict, Any


class Settings:
    app_name: str = "HULBERT-1 API"
    cors_origins: List[str]
    domains_root: str
    jwt_secret: str
    
    # Feature Flags - Modules désactivés pour optimisation
    FEATURE_RSS_READER: bool = False
    FEATURE_EMAIL_CAMPAIGNS: bool = False
    FEATURE_EMAIL_SECURITY: bool = False
    FEATURE_PORTFOLIO_CMS: bool = False
    FEATURE_BUSINESS_PLAN: bool = False
    FEATURE_AGENTS: bool = False
    FEATURE_DIAGRAMS: bool = False
    FEATURE_CODE_LIBRARY: bool = False
    FEATURE_FILE_MANAGER: bool = False
    FEATURE_WISHLIST: bool = False
    FEATURE_DOMAINS: bool = False
    FEATURE_PORTFOLIO_MANAGEMENT: bool = False
    
    # Environment
    environment: str
    
    # Database Configuration (PostgreSQL)
    DATABASE_URL: str
    DATABASE_URL_ASYNC: str
    TEST_DATABASE_URL: str
    
    # Redis Configuration
    REDIS_URL: str
    
    # Configuration comptable
    company_info: Dict[str, Any]
    accounting_settings: Dict[str, Any]
    payroll_settings: Dict[str, Any]
    invoicing_settings: Dict[str, Any]

    def __init__(self) -> None:
        default_origins = [
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:4200",
            "http://127.0.0.1:4200",
            "http://localhost",
            "http://127.0.0.1",
        ]
        env_origins = os.getenv("CORS_ORIGINS")
        self.cors_origins = env_origins.split(",") if env_origins else default_origins
        self.domains_root = os.getenv("DOMAINS_ROOT", "../domains")
        self.jwt_secret = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
        
        # Environment
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        # Feature Flags from environment
        self.FEATURE_RSS_READER = os.getenv("FEATURE_RSS_READER", "false").lower() == "true"
        self.FEATURE_EMAIL_CAMPAIGNS = os.getenv("FEATURE_EMAIL_CAMPAIGNS", "false").lower() == "true"
        self.FEATURE_EMAIL_SECURITY = os.getenv("FEATURE_EMAIL_SECURITY", "false").lower() == "true"
        self.FEATURE_PORTFOLIO_CMS = os.getenv("FEATURE_PORTFOLIO_CMS", "false").lower() == "true"
        self.FEATURE_BUSINESS_PLAN = os.getenv("FEATURE_BUSINESS_PLAN", "false").lower() == "true"
        self.FEATURE_AGENTS = os.getenv("FEATURE_AGENTS", "false").lower() == "true"
        self.FEATURE_DIAGRAMS = os.getenv("FEATURE_DIAGRAMS", "false").lower() == "true"
        self.FEATURE_CODE_LIBRARY = os.getenv("FEATURE_CODE_LIBRARY", "false").lower() == "true"
        self.FEATURE_FILE_MANAGER = os.getenv("FEATURE_FILE_MANAGER", "false").lower() == "true"
        self.FEATURE_WISHLIST = os.getenv("FEATURE_WISHLIST", "false").lower() == "true"
        self.FEATURE_DOMAINS = os.getenv("FEATURE_DOMAINS", "false").lower() == "true"
        self.FEATURE_PORTFOLIO_MANAGEMENT = os.getenv("FEATURE_PORTFOLIO_MANAGEMENT", "false").lower() == "true"
        
        # Database URLs (PostgreSQL)
        default_db_url = "postgresql://hulbert:hulbert_password@localhost:5432/hulbert_db"
        self.DATABASE_URL = os.getenv("DATABASE_URL", default_db_url)
        self.DATABASE_URL_ASYNC = os.getenv("DATABASE_URL_ASYNC", default_db_url.replace("postgresql://", "postgresql+asyncpg://"))
        self.TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://hulbert:hulbert_password@localhost:5432/hulbert_test_db")
        
        # Redis URL
        self.REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        # Configuration de l'entreprise
        self.company_info = {
            "name": os.getenv("COMPANY_NAME", "Votre Entreprise"),
            "address": os.getenv("COMPANY_ADDRESS", "123 Rue de la Paix"),
            "city": os.getenv("COMPANY_CITY", "Paris"),
            "postal_code": os.getenv("COMPANY_POSTAL_CODE", "75001"),
            "siret": os.getenv("COMPANY_SIRET", "12345678901234"),
            "vat_number": os.getenv("COMPANY_VAT_NUMBER", "FR12345678901"),
            "naf_code": os.getenv("COMPANY_NAF_CODE", "6201Z"),
            "phone": os.getenv("COMPANY_PHONE", "+33 1 23 45 67 89"),
            "email": os.getenv("COMPANY_EMAIL", "contact@entreprise.fr"),
            "website": os.getenv("COMPANY_WEBSITE", "https://www.entreprise.fr"),
            "logo_path": os.getenv("COMPANY_LOGO_PATH", None),
        }
        
        # Configuration comptable
        self.accounting_settings = {
            "default_currency": os.getenv("DEFAULT_CURRENCY", "EUR"),
            "fiscal_year_start_month": int(os.getenv("FISCAL_YEAR_START_MONTH", "1")),
            "decimal_places": int(os.getenv("DECIMAL_PLACES", "2")),
            "auto_create_accounting_entries": os.getenv("AUTO_CREATE_ACCOUNTING_ENTRIES", "true").lower() == "true",
            "require_accounting_entry_validation": os.getenv("REQUIRE_ACCOUNTING_ENTRY_VALIDATION", "true").lower() == "true",
        }
        
        # Configuration de la paie
        self.payroll_settings = {
            "default_work_hours_per_week": float(os.getenv("DEFAULT_WORK_HOURS_PER_WEEK", "35.0")),
            "pmss_2024": float(os.getenv("PMSS_2024", "13284.00")),
            "small_company_threshold": int(os.getenv("SMALL_COMPANY_THRESHOLD", "20")),
            "auto_calculate_payslips": os.getenv("AUTO_CALCULATE_PAYSLIPS", "true").lower() == "true",
            "require_payslip_validation": os.getenv("REQUIRE_PAYSLIP_VALIDATION", "true").lower() == "true",
            "default_payment_terms": os.getenv("DEFAULT_PAYMENT_TERMS", "Net 30 jours"),
        }
        
        # Configuration de la facturation
        self.invoicing_settings = {
            "default_payment_terms": os.getenv("DEFAULT_PAYMENT_TERMS", "Net 30 jours"),
            "default_quote_validity_days": int(os.getenv("DEFAULT_QUOTE_VALIDITY_DAYS", "30")),
            "auto_generate_invoice_numbers": os.getenv("AUTO_GENERATE_INVOICE_NUMBERS", "true").lower() == "true",
            "invoice_number_prefix": os.getenv("INVOICE_NUMBER_PREFIX", "INV"),
            "quote_number_prefix": os.getenv("QUOTE_NUMBER_PREFIX", "QUO"),
            "default_tax_rate": float(os.getenv("DEFAULT_TAX_RATE", "20.0")),
            "include_logo_in_pdfs": os.getenv("INCLUDE_LOGO_IN_PDFS", "true").lower() == "true",
        }
        
        # Configuration des déclarations sociales
        self.social_settings = {
            "dsn_submission_deadline_days": int(os.getenv("DSN_SUBMISSION_DEADLINE_DAYS", "5")),
            "auto_generate_dsn": os.getenv("AUTO_GENERATE_DSN", "false").lower() == "true",
            "dsn_xml_schema_validation": os.getenv("DSN_XML_SCHEMA_VALIDATION", "true").lower() == "true",
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
