from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date
import json

from ..db import get_db
from ..security import get_current_user
from ..models import User, Project, BudgetTransaction, BudgetAlert, Ticket, CalendarEvent
from ..schemas import (
    BudgetTransactionCreate,
    BudgetTransactionUpdate,
    BudgetTransactionResponse,
    BudgetAnalysis,
    BudgetAlertResponse,
    BudgetReport,
    ProjectPricingCalculation
)

router = APIRouter()

@router.get("/{project_id}/budget", response_model=dict)
async def get_project_budget(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project budget information"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate budget information
    transactions = db.query(BudgetTransaction).filter(
        BudgetTransaction.project_id == project_id
    ).all()
    
    total_spent = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    remaining_budget = project.budget - total_spent if project.budget else 0
    
    return {
        "id": project_id,
        "project_id": project_id,
        "total_budget": project.budget or 0,
        "currency": project.currency or "EUR",
        "spent_amount": total_spent,
        "remaining_amount": remaining_budget,
        "budget_status": "on-track" if remaining_budget >= 0 else "over-budget",
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat()
    }

@router.patch("/{project_id}/budget", response_model=dict)
async def update_project_budget(
    project_id: int,
    budget_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update project budget - only allows initial budget setting if no transactions exist"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Vérifier s'il existe des transactions
    existing_transactions = db.query(BudgetTransaction).filter(
        BudgetTransaction.project_id == project_id
    ).count()
    
    # Si des transactions existent, interdire la modification manuelle du budget
    if existing_transactions > 0 and "total_budget" in budget_data:
        raise HTTPException(
            status_code=400, 
            detail="Cannot modify budget manually when transactions exist. Budget is calculated from transactions."
        )
    
    # Permettre la modification du budget seulement si aucune transaction n'existe
    if "total_budget" in budget_data and existing_transactions == 0:
        project.budget = budget_data["total_budget"]
    
    # Toujours permettre la modification de la devise
    if "currency" in budget_data:
        project.currency = budget_data["currency"]
    
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    
    return {
        "id": project_id,
        "project_id": project_id,
        "total_budget": project.budget,
        "currency": project.currency,
        "spent_amount": sum(t.amount for t in db.query(BudgetTransaction).filter(
            BudgetTransaction.project_id == project_id,
            BudgetTransaction.transaction_type == 'expense'
        ).all()),
        "remaining_amount": project.budget - sum(t.amount for t in db.query(BudgetTransaction).filter(
            BudgetTransaction.project_id == project_id,
            BudgetTransaction.transaction_type == 'expense'
        ).all()) if project.budget else 0,
        "budget_status": "on-track",
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat()
    }

@router.get("/{project_id}/transactions", response_model=List[BudgetTransactionResponse])
async def get_project_transactions(
    project_id: int,
    transaction_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project transactions with filters"""
    try:
        print(f"Getting transactions for project {project_id}")
        query = db.query(BudgetTransaction).filter(BudgetTransaction.project_id == project_id)
        
        if transaction_type:
            query = query.filter(BudgetTransaction.transaction_type == transaction_type)
        if category:
            query = query.filter(BudgetTransaction.category == category)
        if status:
            query = query.filter(BudgetTransaction.status == status)
        if date_from:
            query = query.filter(BudgetTransaction.transaction_date >= date_from)
        if date_to:
            query = query.filter(BudgetTransaction.transaction_date <= date_to)
        
        transactions = query.offset(skip).limit(limit).all()
        print(f"Found {len(transactions)} transactions")
        
        result = []
        for t in transactions:
            try:
                response = BudgetTransactionResponse(
                    id=t.id,
                    project_id=t.project_id,
                    transaction_type=t.transaction_type,
                    category=t.category,
                    amount=t.amount,
                    currency=t.currency,
                    description=t.description,
                    vendor_name=t.vendor_name,
                    invoice_number=t.invoice_number,
                    transaction_date=t.transaction_date.isoformat() if t.transaction_date else None,
                    status=t.status,
                    created_by_user_id=t.created_by_user_id,
                    created_at=t.created_at.isoformat() if t.created_at else None,
                    updated_at=t.updated_at.isoformat() if t.updated_at else None,
                    created_by_username="Unknown"
                )
                result.append(response)
            except Exception as e:
                print(f"Error processing transaction {t.id}: {e}")
                raise
        
        print(f"Returning {len(result)} transactions")
        return result
    except Exception as e:
        print(f"Error in get_project_transactions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")

@router.post("/{project_id}/transactions", response_model=BudgetTransactionResponse)
async def create_transaction(
    project_id: int,
    transaction: BudgetTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget transaction"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_transaction = BudgetTransaction(
        project_id=project_id,
        transaction_type=transaction.transaction_type,
        category=transaction.category,
        amount=transaction.amount,
        currency=transaction.currency,
        description=transaction.description,
        vendor_name=transaction.vendor_name,
        invoice_number=transaction.invoice_number,
        transaction_date=datetime.fromisoformat(transaction.transaction_date.replace('Z', '+00:00')),
        status=transaction.status or 'pending',
        created_by_user_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return BudgetTransactionResponse(
        id=db_transaction.id,
        project_id=db_transaction.project_id,
        transaction_type=db_transaction.transaction_type,
        category=db_transaction.category,
        amount=db_transaction.amount,
        currency=db_transaction.currency,
        description=db_transaction.description,
        vendor_name=db_transaction.vendor_name,
        invoice_number=db_transaction.invoice_number,
        transaction_date=db_transaction.transaction_date.isoformat(),
        status=db_transaction.status,
        created_by_user_id=db_transaction.created_by_user_id,
        created_at=db_transaction.created_at.isoformat(),
        updated_at=db_transaction.updated_at.isoformat(),
        created_by_username=current_user.username
    )

@router.patch("/{project_id}/transactions/{transaction_id}", response_model=BudgetTransactionResponse)
async def update_transaction(
    project_id: int,
    transaction_id: int,
    transaction: BudgetTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a budget transaction"""
    db_transaction = db.query(BudgetTransaction).options(
        joinedload(BudgetTransaction.created_by)
    ).filter(
        BudgetTransaction.id == transaction_id,
        BudgetTransaction.project_id == project_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update fields
    for field, value in transaction.dict(exclude_unset=True).items():
        if field == "transaction_date" and value:
            setattr(db_transaction, field, datetime.fromisoformat(value.replace('Z', '+00:00')))
        else:
            setattr(db_transaction, field, value)
    
    db_transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_transaction)
    
    return BudgetTransactionResponse(
        id=db_transaction.id,
        project_id=db_transaction.project_id,
        transaction_type=db_transaction.transaction_type,
        category=db_transaction.category,
        amount=db_transaction.amount,
        currency=db_transaction.currency,
        description=db_transaction.description,
        vendor_name=db_transaction.vendor_name,
        invoice_number=db_transaction.invoice_number,
        transaction_date=db_transaction.transaction_date.isoformat(),
        status=db_transaction.status,
        created_by_user_id=db_transaction.created_by_user_id,
        created_at=db_transaction.created_at.isoformat(),
        updated_at=db_transaction.updated_at.isoformat() if db_transaction.updated_at else None,
        created_by_username=db_transaction.created_by.username if db_transaction.created_by else "Unknown"
    )

@router.delete("/{project_id}/transactions/{transaction_id}")
async def delete_transaction(
    project_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget transaction"""
    db_transaction = db.query(BudgetTransaction).filter(
        BudgetTransaction.id == transaction_id,
        BudgetTransaction.project_id == project_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(db_transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}

@router.patch("/{project_id}/transactions/{transaction_id}/approve", response_model=BudgetTransactionResponse)
async def approve_transaction(
    project_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a budget transaction"""
    db_transaction = db.query(BudgetTransaction).options(
        joinedload(BudgetTransaction.created_by)
    ).filter(
        BudgetTransaction.id == transaction_id,
        BudgetTransaction.project_id == project_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db_transaction.status = 'approved'
    db_transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_transaction)
    
    return BudgetTransactionResponse(
        id=db_transaction.id,
        project_id=db_transaction.project_id,
        transaction_type=db_transaction.transaction_type,
        category=db_transaction.category,
        amount=db_transaction.amount,
        currency=db_transaction.currency,
        description=db_transaction.description,
        vendor_name=db_transaction.vendor_name,
        invoice_number=db_transaction.invoice_number,
        transaction_date=db_transaction.transaction_date.isoformat(),
        status=db_transaction.status,
        created_by_user_id=db_transaction.created_by_user_id,
        created_at=db_transaction.created_at.isoformat(),
        updated_at=db_transaction.updated_at.isoformat() if db_transaction.updated_at else None,
        created_by_username=db_transaction.created_by.username if db_transaction.created_by else "Unknown"
    )

@router.patch("/{project_id}/transactions/{transaction_id}/reject", response_model=BudgetTransactionResponse)
async def reject_transaction(
    project_id: int,
    transaction_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a budget transaction"""
    db_transaction = db.query(BudgetTransaction).options(
        joinedload(BudgetTransaction.created_by)
    ).filter(
        BudgetTransaction.id == transaction_id,
        BudgetTransaction.project_id == project_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db_transaction.status = 'rejected'
    db_transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_transaction)
    
    return BudgetTransactionResponse(
        id=db_transaction.id,
        project_id=db_transaction.project_id,
        transaction_type=db_transaction.transaction_type,
        category=db_transaction.category,
        amount=db_transaction.amount,
        currency=db_transaction.currency,
        description=db_transaction.description,
        vendor_name=db_transaction.vendor_name,
        invoice_number=db_transaction.invoice_number,
        transaction_date=db_transaction.transaction_date.isoformat(),
        status=db_transaction.status,
        created_by_user_id=db_transaction.created_by_user_id,
        created_at=db_transaction.created_at.isoformat(),
        updated_at=db_transaction.updated_at.isoformat() if db_transaction.updated_at else None,
        created_by_username=db_transaction.created_by.username if db_transaction.created_by else "Unknown"
    )

@router.get("/{project_id}/budget/analysis", response_model=BudgetAnalysis)
async def get_budget_analysis(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget analysis for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    transactions = db.query(BudgetTransaction).filter(
        BudgetTransaction.project_id == project_id
    ).all()
    
    # Debug logging
    print(f"DEBUG: Project {project_id} - Found {len(transactions)} transactions")
    for t in transactions:
        print(f"DEBUG: Transaction {t.id} - Type: {t.transaction_type}, Amount: {t.amount}, Category: {t.category}")
    
    total_spent = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    
    print(f"DEBUG: Total spent: {total_spent}, Total income: {total_income}")
    print(f"DEBUG: Project budget: {project.budget}")
    
    # Use project budget if defined, otherwise calculate from income
    if project.budget and project.budget > 0:
        total_budget = project.budget
        print(f"DEBUG: Using project budget: {total_budget}")
    else:
        # Calculate budget from total income if no project budget is set
        total_budget = total_income
        print(f"DEBUG: Using income as budget: {total_budget}")
    
    remaining_budget = total_budget - total_spent
    budget_utilization_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0
    
    print(f"DEBUG: Final calculations - Total budget: {total_budget}, Remaining: {remaining_budget}, Utilization: {budget_utilization_percentage}%")
    
    # Monthly spending analysis
    monthly_spending = {}
    for transaction in transactions:
        if transaction.transaction_type == 'expense':
            month_key = transaction.transaction_date.strftime('%Y-%m')
            if month_key not in monthly_spending:
                monthly_spending[month_key] = {'amount': 0, 'count': 0}
            monthly_spending[month_key]['amount'] += transaction.amount
            monthly_spending[month_key]['count'] += 1
    
    monthly_spending_list = [
        {
            'month': month,
            'amount': data['amount'],
            'transactions_count': data['count']
        }
        for month, data in sorted(monthly_spending.items())
    ]
    
    # Category breakdown
    category_breakdown = {}
    for transaction in transactions:
        if transaction.transaction_type == 'expense':
            if transaction.category not in category_breakdown:
                category_breakdown[transaction.category] = {'amount': 0, 'count': 0}
            category_breakdown[transaction.category]['amount'] += transaction.amount
            category_breakdown[transaction.category]['count'] += 1
    
    category_breakdown_list = [
        {
            'category': category,
            'amount': data['amount'],
            'percentage': (data['amount'] / total_spent * 100) if total_spent > 0 else 0,
            'transaction_count': data['count']
        }
        for category, data in category_breakdown.items()
    ]
    
    # Status trend (simplified - just current status)
    status_trend = [
        {
            'date': datetime.utcnow().isoformat(),
            'spent_amount': total_spent,
            'remaining_amount': remaining_budget
        }
    ]
    
    # Projected completion (simplified)
    projected_completion = {
        'estimated_total_cost': total_spent + remaining_budget,
        'completion_date': project.end_date.isoformat() if project.end_date else None,
        'budget_variance': remaining_budget
    }
    
    return BudgetAnalysis(
        total_budget=total_budget,
        total_spent=total_spent,
        total_income=total_income,
        remaining_budget=remaining_budget,
        budget_utilization_percentage=round(budget_utilization_percentage, 2),
        monthly_spending=monthly_spending_list,
        category_breakdown=category_breakdown_list,
        status_trend=status_trend,
        projected_completion=projected_completion
    )

@router.get("/{project_id}/budget/report", response_model=BudgetReport)
async def get_budget_report(
    project_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate budget report for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get transactions within date range
    query = db.query(BudgetTransaction).filter(BudgetTransaction.project_id == project_id)
    if start_date:
        query = query.filter(BudgetTransaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(BudgetTransaction.transaction_date <= end_date)
    
    transactions = query.all()
    
    # Calculate summary
    total_budget = project.budget or 0
    total_spent = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    net_profit_loss = total_income - total_spent
    budget_variance = total_budget - total_spent
    
    # Get analysis
    analysis = await get_budget_analysis(project_id, db, current_user)
    
    # Get alerts
    alerts = db.query(BudgetAlert).filter(BudgetAlert.project_id == project_id).all()
    
    return BudgetReport(
        project_id=project_id,
        project_name=project.title,
        report_period={
            'start_date': start_date or project.created_at.isoformat(),
            'end_date': end_date or datetime.utcnow().isoformat()
        },
        summary={
            'total_budget': total_budget,
            'total_spent': total_spent,
            'total_income': total_income,
            'net_profit_loss': net_profit_loss,
            'budget_variance': budget_variance
        },
        transactions=[
            BudgetTransactionResponse(
                id=t.id,
                project_id=t.project_id,
                transaction_type=t.transaction_type,
                category=t.category,
                amount=t.amount,
                currency=t.currency,
                description=t.description,
                vendor_name=t.vendor_name,
                invoice_number=t.invoice_number,
                transaction_date=t.transaction_date.isoformat(),
                status=t.status,
                created_by_user_id=t.created_by_user_id,
                created_at=t.created_at.isoformat(),
                updated_at=t.updated_at.isoformat(),
                created_by_username=t.created_by.username if t.created_by else None
            )
            for t in transactions
        ],
        analysis=analysis,
        alerts=[
            BudgetAlertResponse(
                id=a.id,
                project_id=a.project_id,
                alert_type=a.alert_type,
                message=a.message,
                severity=a.severity,
                is_read=a.is_read,
                created_at=a.created_at.isoformat()
            )
            for a in alerts
        ],
        generated_at=datetime.utcnow().isoformat(),
        generated_by=current_user.username
    )

@router.get("/{project_id}/budget/alerts", response_model=List[BudgetAlertResponse])
async def get_budget_alerts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget alerts for a project"""
    alerts = db.query(BudgetAlert).filter(BudgetAlert.project_id == project_id).all()
    
    return [
        BudgetAlertResponse(
            id=a.id,
            project_id=a.project_id,
            alert_type=a.alert_type,
            message=a.message,
            severity=a.severity,
            is_read=a.is_read,
            created_at=a.created_at.isoformat()
        )
        for a in alerts
    ]

@router.patch("/{project_id}/budget/alerts/{alert_id}/read")
async def mark_alert_as_read(
    project_id: int,
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a budget alert as read"""
    alert = db.query(BudgetAlert).filter(
        BudgetAlert.id == alert_id,
        BudgetAlert.project_id == project_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_read = True
    db.commit()
    
    return {"message": "Alert marked as read"}

@router.get("/{project_id}/pricing-calculator", response_model=ProjectPricingCalculation)
async def get_pricing_calculation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate project pricing based on time spent, costs, and margins"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate time spent from tickets
    tickets = db.query(Ticket).filter(Ticket.project_id == project_id).all()
    total_ticket_hours = sum(ticket.actual_hours or 0 for ticket in tickets)
    
    # Calculate time spent from calendar events
    events = db.query(CalendarEvent).filter(CalendarEvent.project_id == project_id).all()
    total_event_hours = 0
    for event in events:
        if event.start_datetime and event.end_datetime:
            duration = event.end_datetime - event.start_datetime
            total_event_hours += duration.total_seconds() / 3600  # Convert to hours
    
    total_hours_spent = total_ticket_hours + total_event_hours
    total_days_spent = total_hours_spent / 8  # Assuming 8 hours per day
    
    # Calculate costs and income from budget transactions
    transactions = db.query(BudgetTransaction).filter(
        BudgetTransaction.project_id == project_id
    ).all()
    
    total_costs = sum(t.amount for t in transactions if t.transaction_type == 'expense')
    total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')
    net_cost = total_costs - total_income
    
    # Calculate rates
    hourly_rate = net_cost / total_hours_spent if total_hours_spent > 0 else 0
    daily_rate = net_cost / total_days_spent if total_days_spent > 0 else 0
    
    # Calculate suggested sale prices with different margins
    suggested_sale_price = {
        "with_margin_10": net_cost * 1.10,
        "with_margin_20": net_cost * 1.20,
        "with_margin_30": net_cost * 1.30,
        "with_margin_50": net_cost * 1.50,
        "custom": net_cost * 1.30  # Default to 30% margin
    }
    
    # Calculate suggested rental rates
    daily_cost_based = daily_rate if total_days_spent > 0 else 0
    monthly_cost_based = daily_cost_based * 20  # 20 working days per month
    annual_cost_based = monthly_cost_based * 12
    
    suggested_rental_rates = {
        "daily": {
            "cost_based": daily_cost_based,
            "with_margin_20": daily_cost_based * 1.20,
            "with_margin_30": daily_cost_based * 1.30
        },
        "monthly": {
            "cost_based": monthly_cost_based,
            "with_margin_20": monthly_cost_based * 1.20,
            "with_margin_30": monthly_cost_based * 1.30
        },
        "annual": {
            "cost_based": annual_cost_based,
            "with_margin_20": annual_cost_based * 1.20,
            "with_margin_30": annual_cost_based * 1.30
        }
    }
    
    return ProjectPricingCalculation(
        total_hours_spent=total_hours_spent,
        total_days_spent=total_days_spent,
        total_costs=total_costs,
        total_income=total_income,
        net_cost=net_cost,
        hourly_rate=hourly_rate,
        daily_rate=daily_rate,
        suggested_sale_price=suggested_sale_price,
        suggested_rental_rates=suggested_rental_rates
    )
