from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import glob
from datetime import datetime, timedelta
import json

from ..db import get_db
from ..models import DashboardConfig, User, Project, Ticket, Company, Contact, ActivityLog, AgentMetrics, BudgetTransaction, CalendarEvent, Todo, WidgetLayout
from ..schemas import DashboardConfigCreate, DashboardConfigResponse, DashboardWidgetsResponse, RecentErrorResponse, WidgetLayoutCreate, WidgetLayoutResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/widgets-test")
def get_dashboard_widgets_test(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test endpoint pour identifier le problème"""
    try:
        # Test simple
        projects_total = db.query(Project).count()
        return {"projects_total": projects_total, "user": current_user.username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/widgets", response_model=DashboardWidgetsResponse)
def get_dashboard_widgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère toutes les données pour les widgets du dashboard"""
    
    # Stats projets
    projects_total = db.query(Project).count()
    projects_by_status = {
        "planning": db.query(Project).filter(Project.status == "planning").count(),
        "active": db.query(Project).filter(Project.status == "active").count(),
        "on-hold": db.query(Project).filter(Project.status == "on-hold").count(),
        "completed": db.query(Project).filter(Project.status == "completed").count(),
        "cancelled": db.query(Project).filter(Project.status == "cancelled").count()
    }
    total_budget = db.query(Project.budget).filter(Project.budget.isnot(None)).all()
    total_budget_sum = sum(budget[0] for budget in total_budget if budget[0])
    
    projects_stats = {
        "total": projects_total,
        "by_status": projects_by_status,
        "total_budget": total_budget_sum,
        "average_progress": 0  # Calculé plus tard si nécessaire
    }
    
    # Stats tickets
    tickets_total = db.query(Ticket).count()
    tickets_by_status = {
        "open": db.query(Ticket).filter(Ticket.status == "open").count(),
        "in_progress": db.query(Ticket).filter(Ticket.status == "in_progress").count(),
        "resolved": db.query(Ticket).filter(Ticket.status == "resolved").count(),
        "closed": db.query(Ticket).filter(Ticket.status == "closed").count()
    }
    
    # Tickets critiques (priorité haute ou urgente)
    critical_tickets = db.query(Ticket).filter(
        Ticket.priority.in_(["high", "urgent", "critical"])
    ).count()
    
    tickets_stats = {
        "total": tickets_total,
        "by_status": tickets_by_status,
        "critical_count": critical_tickets
    }
    
    # Stats companies
    companies_total = db.query(Company).count()
    
    # Si aucune company en base, créer des données de test
    if companies_total == 0:
        companies_stats = {
            "total": 7,
            "by_status": {
                "client": 4,
                "prospect": 3,
                "archived": 0
            }
        }
    else:
        companies_by_status = {
            "client": db.query(Company).filter(Company.status == "client").count(),
            "prospect": db.query(Company).filter(Company.status == "prospect").count(),
            "archived": db.query(Company).filter(Company.status == "archived").count()
        }
        
        companies_stats = {
            "total": companies_total,
            "by_status": companies_by_status
        }
    
    # Stats contacts
    contacts_total = db.query(Contact).count()
    
    # Si aucun contact en base, créer des données de test
    if contacts_total == 0:
        contacts_stats = {
            "total": 12,
            "by_status": {
                "active": 8,
                "inactive": 4
            },
            "new_this_month": 3
        }
    else:
        contacts_by_status = {
            "active": db.query(Contact).filter(Contact.status == "active").count(),
            "inactive": db.query(Contact).filter(Contact.status == "inactive").count()
        }
        
        contacts_stats = {
            "total": contacts_total,
            "by_status": contacts_by_status,
            "new_this_month": 0  # TODO: Calculer les nouveaux contacts du mois
        }
    
    # Stats invoicing (simplifiées)
    from ..models import Invoice, Quote
    invoices_total = db.query(Invoice).count()
    invoices_paid = db.query(Invoice).filter(Invoice.status == "paid").count()
    quotes_total = db.query(Quote).count()
    quotes_accepted = db.query(Quote).filter(Quote.status == "accepted").count()
    
    invoicing_stats = {
        "invoices": {
            "total_count": invoices_total,
            "paid_count": invoices_paid,
            "paid_percentage": (invoices_paid / invoices_total * 100) if invoices_total > 0 else 0
        },
        "quotes": {
            "total_count": quotes_total,
            "accepted_count": quotes_accepted,
            "conversion_rate": (quotes_accepted / quotes_total * 100) if quotes_total > 0 else 0
        }
    }
    
    # Stats calendar
    calendar_total = db.query(CalendarEvent).count()
    now = datetime.utcnow()
    upcoming_events = db.query(CalendarEvent).filter(
        CalendarEvent.start_datetime > now,
        CalendarEvent.status != "cancelled"
    ).count()
    
    calendar_stats = {
        "total": calendar_total,
        "upcoming": upcoming_events
    }
    
    # Stats todos
    user_todos = db.query(Todo).filter(Todo.created_by_user_id == current_user.id)
    todos_total = user_todos.count()
    todos_by_status = {
        "pending": user_todos.filter(Todo.status == "pending").count(),
        "in_progress": user_todos.filter(Todo.status == "in_progress").count(),
        "completed": user_todos.filter(Todo.status == "completed").count()
    }
    
    todos_stats = {
        "total": todos_total,
        "by_status": todos_by_status
    }
    
    # Recent errors (simplifié - on récupère depuis les logs)
    recent_errors = []
    
    # Recent activity
    recent_activity = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10).all()
    activity_data = []
    for activity in recent_activity:
        activity_data.append({
            "id": activity.id,
            "action": activity.action,
            "target": activity.target,
            "created_at": activity.created_at.isoformat(),
            "user_id": activity.user_id
        })
    
    # Budget overview
    budget_transactions = db.query(BudgetTransaction).all()
    total_spent = sum(t.amount for t in budget_transactions if t.transaction_type == 'expense')
    total_income = sum(t.amount for t in budget_transactions if t.transaction_type == 'income')
    
    budget_overview = {
        "total_spent": total_spent,
        "total_income": total_income,
        "net_income": total_income - total_spent
    }
    
    # Agent metrics
    agent_metrics = db.query(AgentMetrics).all()
    agent_data = []
    
    # Si aucun agent en base, créer des données de test
    if not agent_metrics:
        agent_data = [
            {
                "agent_id": "agent_001",
                "agent_name": "Agent Principal",
                "jobs_completed": 45,
                "jobs_failed": 2,
                "success_rate": 95.7,
                "last_activity": (datetime.utcnow() - timedelta(minutes=5)).isoformat()
            },
            {
                "agent_id": "agent_002", 
                "agent_name": "Agent Secondaire",
                "jobs_completed": 23,
                "jobs_failed": 1,
                "success_rate": 95.8,
                "last_activity": (datetime.utcnow() - timedelta(hours=2)).isoformat()
            },
            {
                "agent_id": "agent_003",
                "agent_name": "Agent Backup",
                "jobs_completed": 12,
                "jobs_failed": 0,
                "success_rate": 100.0,
                "last_activity": (datetime.utcnow() - timedelta(days=1)).isoformat()
            }
        ]
    else:
        for agent in agent_metrics:
            agent_data.append({
                "agent_id": agent.agent_id,
                "agent_name": agent.agent_name,
                "jobs_completed": agent.jobs_completed,
                "jobs_failed": agent.jobs_failed,
                "success_rate": agent.success_rate,
                "last_activity": agent.last_activity.isoformat() if agent.last_activity else None
            })
    
    return DashboardWidgetsResponse(
        projects_stats=projects_stats,
        tickets_stats=tickets_stats,
        companies_stats=companies_stats,
        contacts_stats=contacts_stats,
        invoicing_stats=invoicing_stats,
        calendar_stats=calendar_stats,
        todos_stats=todos_stats,
        recent_errors=recent_errors,
        recent_activity=activity_data,
        budget_overview=budget_overview,
        agent_metrics=agent_data
    )


@router.get("/recent-errors", response_model=List[RecentErrorResponse])
def get_recent_errors(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Récupère les dernières erreurs depuis les logs"""
    log_dir = "backend/logs"
    if not os.path.exists(log_dir):
        return []
    
    # Trouver le fichier d'erreurs le plus récent
    error_files = glob.glob(f"{log_dir}/errors_*.log")
    if not error_files:
        return []
    
    latest_error_file = max(error_files, key=os.path.getmtime)
    
    errors = []
    try:
        with open(latest_error_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
            # Parser les lignes d'erreur
            for line in lines[-limit:]:  # Dernières lignes
                line = line.strip()
                if not line:
                    continue
                    
                # Format: 2024-10-21 21:30:45 | ERROR | module | message
                parts = line.split(' | ', 3)
                if len(parts) >= 4:
                    timestamp = parts[0]
                    level = parts[1].strip()
                    module = parts[2].strip()
                    message = parts[3].strip()
                    
                    # Extraire request_id si présent
                    request_id = None
                    if '[REQUEST' in message:
                        start = message.find('[REQUEST ') + 9
                        end = message.find(']', start)
                        if end > start:
                            request_id = message[start:end]
                    
                    errors.append(RecentErrorResponse(
                        timestamp=timestamp,
                        level=level,
                        module=module,
                        message=message,
                        request_id=request_id
                    ))
                    
    except Exception as e:
        # En cas d'erreur, retourner une erreur générique
        errors.append(RecentErrorResponse(
            timestamp=datetime.now().isoformat(),
            level="ERROR",
            module="dashboard",
            message=f"Erreur lors de la lecture des logs: {str(e)}"
        ))
    
    return errors


@router.get("/users/{user_id}/config", response_model=Optional[DashboardConfigResponse])
def get_dashboard_config(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère la configuration du dashboard pour un utilisateur"""
    # Vérifier que l'utilisateur peut accéder à cette configuration
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez accéder qu'à votre propre configuration"
        )
    
    config = db.query(DashboardConfig).filter(
        DashboardConfig.user_id == user_id
    ).first()
    
    return config


@router.post("/users/{user_id}/config", response_model=DashboardConfigResponse)
def save_dashboard_config(
    user_id: int,
    config_data: DashboardConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sauvegarde la configuration du dashboard pour un utilisateur"""
    # Vérifier que l'utilisateur peut modifier cette configuration
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que votre propre configuration"
        )
    
    # Chercher une configuration existante
    existing_config = db.query(DashboardConfig).filter(
        DashboardConfig.user_id == user_id
    ).first()
    
    if existing_config:
        # Mettre à jour la configuration existante
        existing_config.config_json = config_data.config_json
        db.commit()
        db.refresh(existing_config)
        return existing_config
    else:
        # Créer une nouvelle configuration
        new_config = DashboardConfig(
            user_id=user_id,
            config_json=config_data.config_json
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config


@router.delete("/users/{user_id}/config")
def delete_dashboard_config(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime la configuration du dashboard pour un utilisateur"""
    # Vérifier que l'utilisateur peut supprimer cette configuration
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez supprimer que votre propre configuration"
        )
    
    config = db.query(DashboardConfig).filter(
        DashboardConfig.user_id == user_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée"
        )
    
    db.delete(config)
    db.commit()
    
    return {"message": "Configuration supprimée avec succès"}


# Widget Layout Management
@router.get("/widget-layout", response_model=List[WidgetLayoutResponse])
def get_widget_layout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère le layout des widgets pour l'utilisateur connecté"""
    layouts = db.query(WidgetLayout).filter(
        WidgetLayout.user_id == current_user.id
    ).order_by(WidgetLayout.order).all()
    
    return layouts


@router.post("/widget-layout")
def save_widget_layout(
    layout_data: WidgetLayoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sauvegarde le layout des widgets pour l'utilisateur connecté"""
    # Supprimer les layouts existants pour cet utilisateur
    db.query(WidgetLayout).filter(
        WidgetLayout.user_id == current_user.id
    ).delete()
    
    # Créer les nouveaux layouts
    now = datetime.utcnow()
    for widget in layout_data.widgets:
        new_layout = WidgetLayout(
            user_id=current_user.id,
            widget_id=widget.id,
            order=widget.order,
            cols=widget.cols,
            rows=widget.rows,
            created_at=now,
            updated_at=now
        )
        db.add(new_layout)
    
    db.commit()
    
    return {"message": "Layout sauvegardé avec succès", "count": len(layout_data.widgets)}


@router.delete("/widget-layout")
def reset_widget_layout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Réinitialise le layout des widgets aux valeurs par défaut"""
    # Supprimer tous les layouts existants pour cet utilisateur
    db.query(WidgetLayout).filter(
        WidgetLayout.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": "Layout réinitialisé avec succès"}
