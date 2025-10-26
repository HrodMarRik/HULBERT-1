from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from .core.config import get_settings
from .core.database import init_db
from fastapi.middleware.cors import CORSMiddleware
from .shared.middleware.logging_middleware import LoggingMiddleware
from .shared.exceptions.custom_exceptions import AppException
from .shared.middleware import exception_handler

# Import modules
from .modules.auth import router as auth_router
from .modules.accounting import router as accounting_router
from .modules.invoicing import router as invoicing_router
from .modules.payroll import router as payroll_router
from .modules.tickets import router as tickets_router
from .modules.projects import router as projects_router
from .modules.companies import router as companies_router
from .modules.contacts import router as contacts_router
from .modules.dashboard import router as dashboard_router
from .modules.competitive_analysis import router as competitive_analysis_router

# Optional modules (feature flags)
from .routers import domains as domains_router
from .routers import domains_v2 as domains_v2_router
from .routers import agents as agents_router
from .routers import files as files_router
from .routers import email_campaigns as email_campaigns_router
from .routers import rss as rss_router
from .routers import email_security as email_security_router
from .routers import portfolio as portfolio_router
from .routers import portfolio_management as portfolio_management_router
from .routers import company_contacts as company_contacts_router
from .routers import budget as budget_router
from .routers import calendar as calendar_router
from .routers import social as social_router
from .routers import logs as logs_router
from .routers import activity as activity_router
from .routers import todos as todos_router
from .routers import client_portal as client_portal_router
from .routers import notifications as notifications_router


def create_app() -> FastAPI:
    app = FastAPI(title="HULBERT-1 API", version="0.1.2")

    settings = get_settings()

    # Ajouter le middleware de logging en premier
    app.add_middleware(LoggingMiddleware)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://hulbert.fr",
            "https://www.hulbert.fr",
            "http://hulbert.fr",
            "http://www.hulbert.fr",
            "http://localhost:4200",  # Angular dev server
            "http://127.0.0.1:4200",  # Alternative localhost
            "http://localhost:3000",  # Alternative dev server
            "http://127.0.0.1:3000",   # Alternative localhost
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Exception handlers
    app.add_exception_handler(AppException, exception_handler.app_exception_handler)
    app.add_exception_handler(RequestValidationError, exception_handler.validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, exception_handler.http_exception_handler)
    app.add_exception_handler(Exception, exception_handler.generic_exception_handler)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # Initialize database (development only)
    init_db()

    # Core Routers (toujours actifs)
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    app.include_router(tickets_router, prefix="/api/tickets", tags=["tickets"])
    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
    app.include_router(companies_router, prefix="/api/companies", tags=["companies"])
    app.include_router(company_contacts_router, prefix="/api/company-contacts", tags=["company-contacts"])
    app.include_router(contacts_router, prefix="/api/contacts", tags=["contacts"])
    app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
    app.include_router(budget_router, prefix="/api/projects", tags=["budget"])
    app.include_router(calendar_router, prefix="/api/calendar", tags=["calendar"])
    app.include_router(accounting_router, prefix="/api/accounting", tags=["accounting"])
    app.include_router(invoicing_router, prefix="/api/invoicing", tags=["invoicing"])
    app.include_router(payroll_router, prefix="/api/payroll", tags=["payroll"])
    app.include_router(social_router, prefix="/api/social", tags=["social"])
    app.include_router(logs_router, prefix="/api/logs", tags=["logs"])
    app.include_router(activity_router, prefix="/api/activity", tags=["activity"])
    app.include_router(todos_router, prefix="/api/todos", tags=["todos"])
    app.include_router(client_portal_router, prefix="/api/client-portal", tags=["client-portal"])
    app.include_router(notifications_router, prefix="/api/notifications", tags=["notifications"])
    app.include_router(competitive_analysis_router, prefix="/api/competitive-analysis", tags=["competitive-analysis"])
    
    # Optional Routers (feature flags)
    if settings.FEATURE_DOMAINS:
        app.include_router(domains_router, prefix="/api/domains", tags=["domains"])
        app.include_router(domains_v2_router, prefix="/api/domains-v2", tags=["domains-v2"])
    if settings.FEATURE_AGENTS:
        app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
    if settings.FEATURE_FILE_MANAGER:
        app.include_router(files_router, prefix="/api/files", tags=["files"])
    if settings.FEATURE_EMAIL_CAMPAIGNS:
        app.include_router(email_campaigns_router, prefix="/api/email-campaigns", tags=["email-campaigns"])
    if settings.FEATURE_RSS_READER:
        app.include_router(rss_router, prefix="/api/rss", tags=["rss"])
    if settings.FEATURE_EMAIL_SECURITY:
        app.include_router(email_security_router, prefix="/api/email-security", tags=["email-security"])
    if settings.FEATURE_PORTFOLIO_MANAGEMENT:
        app.include_router(portfolio_management_router, prefix="/api/portfolio-management", tags=["portfolio-management"])
        app.include_router(portfolio_router, prefix="/api/portfolio", tags=["portfolio"])

    return app


app = create_app()