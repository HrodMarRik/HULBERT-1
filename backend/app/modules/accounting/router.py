from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import logging

from ..db import get_db
from ..models import User, AccountingEntry, AccountingLine, ChartOfAccounts, FiscalYear, AccountingAccount, AccountingReport
from ..services.logger import accounting_logger
from ..schemas import (
    AccountingEntryCreate, AccountingEntryUpdate, AccountingEntryResponse,
    AccountingLineCreate, AccountingLineResponse,
    ChartOfAccountsCreate, ChartOfAccountsUpdate, ChartOfAccountsResponse,
    FiscalYearCreate, FiscalYearUpdate, FiscalYearResponse,
    ProfitLossStatement, BalanceSheet, CashFlowStatement,
    AccountingAccountCreate, AccountingAccountUpdate, AccountingAccountResponse,
    AccountingReportCreate, AccountingReportUpdate, AccountingReportResponse
)
from ..security import get_current_user
from ..services.accounting_service import AccountingService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accounting", tags=["accounting"])

# Initialize service
accounting_service = AccountingService()


# =============================================================================
# CHART OF ACCOUNTS ENDPOINTS
# =============================================================================

@router.get("/accounts", response_model=List[ChartOfAccountsResponse])
async def get_chart_of_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chart of accounts with optional filters"""
    try:
        accounting_logger.log_accounting_entry(
            "chart_of_accounts_requested",
            user_id=current_user.id,
            details={"account_type": account_type, "is_active": is_active, "limit": limit}
        )
        
        query = db.query(ChartOfAccounts)
        
        if account_type:
            query = query.filter(ChartOfAccounts.account_type == account_type)
        if is_active is not None:
            query = query.filter(ChartOfAccounts.is_active == is_active)
        
        accounts = query.offset(skip).limit(limit).all()
        
        accounting_logger.log_accounting_entry(
            "chart_of_accounts_retrieved",
            user_id=current_user.id,
            details={"count": len(accounts)}
        )
        return accounts
    except Exception as e:
        logger.error(f"Error getting chart of accounts: {e}")
        raise HTTPException(status_code=500, detail="Error fetching chart of accounts")


@router.post("/accounts", response_model=ChartOfAccountsResponse)
async def create_account(
    account: ChartOfAccountsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new account in chart of accounts"""
    try:
        logger.info(f"User {current_user.id} creating account {account.account_code}")
        
        # Check if account code already exists
        existing_account = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_code == account.account_code
        ).first()
        
        if existing_account:
            raise HTTPException(status_code=400, detail="Account code already exists")
        
        db_account = ChartOfAccounts(**account.dict())
        db.add(db_account)
        db.commit()
        db.refresh(db_account)
        
        logger.info(f"Account {account.account_code} created successfully")
        return db_account
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account: {e}")
        raise HTTPException(status_code=500, detail="Error creating account")


@router.put("/accounts/{account_id}", response_model=ChartOfAccountsResponse)
async def update_account(
    account_id: int,
    account: ChartOfAccountsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an account in chart of accounts"""
    try:
        logger.info(f"User {current_user.id} updating account {account_id}")
        
        db_account = db.query(ChartOfAccounts).filter(ChartOfAccounts.id == account_id).first()
        if not db_account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Check if new account code conflicts with existing
        if account.account_code and account.account_code != db_account.account_code:
            existing_account = db.query(ChartOfAccounts).filter(
                ChartOfAccounts.account_code == account.account_code
            ).first()
            if existing_account:
                raise HTTPException(status_code=400, detail="Account code already exists")
        
        for field, value in account.dict(exclude_unset=True).items():
            setattr(db_account, field, value)
        
        db.commit()
        db.refresh(db_account)
        
        logger.info(f"Account {account_id} updated successfully")
        return db_account
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating account: {e}")
        raise HTTPException(status_code=500, detail="Error updating account")


# =============================================================================
# FISCAL YEAR ENDPOINTS
# =============================================================================

@router.get("/fiscal-years", response_model=List[FiscalYearResponse])
async def get_fiscal_years(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get fiscal years with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting fiscal years")
        
        query = db.query(FiscalYear)
        
        if status:
            query = query.filter(FiscalYear.status == status)
        
        fiscal_years = query.order_by(FiscalYear.year.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"Found {len(fiscal_years)} fiscal years")
        return fiscal_years
    except Exception as e:
        logger.error(f"Error getting fiscal years: {e}")
        raise HTTPException(status_code=500, detail="Error fetching fiscal years")


@router.post("/fiscal-years", response_model=FiscalYearResponse)
async def create_fiscal_year(
    fiscal_year: FiscalYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new fiscal year"""
    try:
        logger.info(f"User {current_user.id} creating fiscal year {fiscal_year.year}")
        
        # Check if fiscal year already exists
        existing_year = db.query(FiscalYear).filter(FiscalYear.year == fiscal_year.year).first()
        if existing_year:
            raise HTTPException(status_code=400, detail="Fiscal year already exists")
        
        db_fiscal_year = FiscalYear(**fiscal_year.dict())
        db.add(db_fiscal_year)
        db.commit()
        db.refresh(db_fiscal_year)
        
        logger.info(f"Fiscal year {fiscal_year.year} created successfully")
        return db_fiscal_year
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating fiscal year: {e}")
        raise HTTPException(status_code=500, detail="Error creating fiscal year")


# =============================================================================
# ACCOUNTING ENTRIES ENDPOINTS
# =============================================================================

@router.get("/entries", response_model=List[AccountingEntryResponse])
async def get_accounting_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    fiscal_year_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get accounting entries with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting accounting entries")
        
        query = db.query(AccountingEntry)
        
        if fiscal_year_id:
            query = query.filter(AccountingEntry.fiscal_year_id == fiscal_year_id)
        if status:
            query = query.filter(AccountingEntry.status == status)
        if start_date:
            query = query.filter(AccountingEntry.entry_date >= start_date)
        if end_date:
            query = query.filter(AccountingEntry.entry_date <= end_date)
        
        entries = query.order_by(AccountingEntry.entry_date.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"Found {len(entries)} accounting entries")
        return entries
    except Exception as e:
        logger.error(f"Error getting accounting entries: {e}")
        raise HTTPException(status_code=500, detail="Error fetching accounting entries")


@router.post("/entries", response_model=AccountingEntryResponse)
async def create_accounting_entry(
    entry: AccountingEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new accounting entry"""
    try:
        logger.info(f"User {current_user.id} creating accounting entry")
        
        # Validate fiscal year exists
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == entry.fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(status_code=400, detail="Fiscal year not found")
        
        # Validate accounting lines balance
        total_debit = sum(line.debit_amount for line in entry.accounting_lines)
        total_credit = sum(line.credit_amount for line in entry.accounting_lines)
        
        if abs(total_debit - total_credit) > 0.01:  # Allow small rounding differences
            raise HTTPException(status_code=400, detail="Accounting entry must balance (debit = credit)")
        
        # Generate entry number
        entry_count = db.query(AccountingEntry).filter(
            AccountingEntry.fiscal_year_id == entry.fiscal_year_id
        ).count()
        entry_number = f"E{entry.fiscal_year_id:04d}{entry_count + 1:06d}"
        
        # Create accounting entry
        db_entry = AccountingEntry(
            entry_number=entry_number,
            fiscal_year_id=entry.fiscal_year_id,
            entry_date=entry.entry_date,
            description=entry.description,
            reference_document=entry.reference_document,
            reference_document_id=entry.reference_document_id,
            created_by_user_id=current_user.id
        )
        db.add(db_entry)
        db.flush()  # Get the ID
        
        # Create accounting lines
        for line_data in entry.accounting_lines:
            db_line = AccountingLine(
                accounting_entry_id=db_entry.id,
                account_id=line_data.account_id,
                description=line_data.description,
                debit_amount=line_data.debit_amount,
                credit_amount=line_data.credit_amount,
                line_order=line_data.line_order
            )
            db.add(db_line)
        
        db.commit()
        db.refresh(db_entry)
        
        logger.info(f"Accounting entry {entry_number} created successfully")
        return db_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating accounting entry: {e}")
        raise HTTPException(status_code=500, detail="Error creating accounting entry")


@router.put("/entries/{entry_id}", response_model=AccountingEntryResponse)
async def update_accounting_entry(
    entry_id: int,
    entry: AccountingEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an accounting entry"""
    try:
        logger.info(f"User {current_user.id} updating accounting entry {entry_id}")
        
        db_entry = db.query(AccountingEntry).filter(AccountingEntry.id == entry_id).first()
        if not db_entry:
            raise HTTPException(status_code=404, detail="Accounting entry not found")
        
        # Only allow updates if entry is in draft status
        if db_entry.status != "draft":
            raise HTTPException(status_code=400, detail="Cannot update validated or posted entries")
        
        for field, value in entry.dict(exclude_unset=True).items():
            setattr(db_entry, field, value)
        
        db.commit()
        db.refresh(db_entry)
        
        logger.info(f"Accounting entry {entry_id} updated successfully")
        return db_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating accounting entry: {e}")
        raise HTTPException(status_code=500, detail="Error updating accounting entry")


# =============================================================================
# REPORTING ENDPOINTS
# =============================================================================

@router.get("/balance", response_model=List[dict])
async def get_general_balance(
    fiscal_year_id: int,
    as_of_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get general balance (balance générale)"""
    try:
        logger.info(f"User {current_user.id} requesting general balance for fiscal year {fiscal_year_id}")
        
        # Validate fiscal year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(status_code=404, detail="Fiscal year not found")
        
        # Use fiscal year end date if no specific date provided
        if not as_of_date:
            as_of_date = fiscal_year.end_date.date()
        
        # Query to get account balances
        query = """
        SELECT 
            coa.account_code,
            coa.account_name,
            coa.account_type,
            COALESCE(SUM(al.debit_amount), 0) as total_debit,
            COALESCE(SUM(al.credit_amount), 0) as total_credit,
            COALESCE(SUM(al.debit_amount), 0) - COALESCE(SUM(al.credit_amount), 0) as balance
        FROM chart_of_accounts coa
        LEFT JOIN accounting_lines al ON coa.id = al.account_id
        LEFT JOIN accounting_entries ae ON al.accounting_entry_id = ae.id
        WHERE coa.is_active = true
        AND ae.fiscal_year_id = :fiscal_year_id
        AND ae.entry_date <= :as_of_date
        AND ae.status = 'posted'
        GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
        ORDER BY coa.account_code
        """
        
        result = db.execute(query, {
            "fiscal_year_id": fiscal_year_id,
            "as_of_date": as_of_date
        }).fetchall()
        
        balance_data = []
        for row in result:
            balance_data.append({
                "account_code": row.account_code,
                "account_name": row.account_name,
                "account_type": row.account_type,
                "total_debit": float(row.total_debit),
                "total_credit": float(row.total_credit),
                "balance": float(row.balance)
            })
        
        logger.info(f"Generated general balance with {len(balance_data)} accounts")
        return balance_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating general balance: {e}")
        raise HTTPException(status_code=500, detail="Error generating general balance")


@router.get("/trial-balance", response_model=List[dict])
async def get_trial_balance(
    fiscal_year_id: int,
    as_of_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get trial balance (balance de vérification)"""
    try:
        logger.info(f"User {current_user.id} requesting trial balance for fiscal year {fiscal_year_id}")
        
        # Validate fiscal year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(status_code=404, detail="Fiscal year not found")
        
        # Use fiscal year end date if no specific date provided
        if not as_of_date:
            as_of_date = fiscal_year.end_date.date()
        
        # Query to get trial balance
        query = """
        SELECT 
            coa.account_code,
            coa.account_name,
            COALESCE(SUM(al.debit_amount), 0) as total_debit,
            COALESCE(SUM(al.credit_amount), 0) as total_credit
        FROM chart_of_accounts coa
        LEFT JOIN accounting_lines al ON coa.id = al.account_id
        LEFT JOIN accounting_entries ae ON al.accounting_entry_id = ae.id
        WHERE coa.is_active = true
        AND ae.fiscal_year_id = :fiscal_year_id
        AND ae.entry_date <= :as_of_date
        AND ae.status = 'posted'
        GROUP BY coa.id, coa.account_code, coa.account_name
        HAVING COALESCE(SUM(al.debit_amount), 0) != 0 OR COALESCE(SUM(al.credit_amount), 0) != 0
        ORDER BY coa.account_code
        """
        
        result = db.execute(query, {
            "fiscal_year_id": fiscal_year_id,
            "as_of_date": as_of_date
        }).fetchall()
        
        trial_balance = []
        total_debit = 0
        total_credit = 0
        
        for row in result:
            trial_balance.append({
                "account_code": row.account_code,
                "account_name": row.account_name,
                "debit_amount": float(row.total_debit),
                "credit_amount": float(row.total_credit)
            })
            total_debit += float(row.total_debit)
            total_credit += float(row.total_credit)
        
        # Add totals row
        trial_balance.append({
            "account_code": "TOTAL",
            "account_name": "TOTAL",
            "debit_amount": total_debit,
            "credit_amount": total_credit
        })
        
        logger.info(f"Generated trial balance with {len(trial_balance)} accounts")
        return trial_balance
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating trial balance: {e}")
        raise HTTPException(status_code=500, detail="Error generating trial balance")


@router.get("/profit-loss", response_model=ProfitLossStatement)
async def get_profit_loss_statement(
    fiscal_year_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get profit and loss statement (compte de résultat)"""
    try:
        logger.info(f"User {current_user.id} requesting P&L statement for fiscal year {fiscal_year_id}")
        
        # Validate fiscal year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(status_code=404, detail="Fiscal year not found")
        
        # Use fiscal year dates if not provided
        if not start_date:
            start_date = fiscal_year.start_date.date()
        if not end_date:
            end_date = fiscal_year.end_date.date()
        
        # Query for revenue accounts
        revenue_query = """
        SELECT COALESCE(SUM(al.credit_amount - al.debit_amount), 0) as revenue
        FROM chart_of_accounts coa
        LEFT JOIN accounting_lines al ON coa.id = al.account_id
        LEFT JOIN accounting_entries ae ON al.accounting_entry_id = ae.id
        WHERE coa.account_type = 'revenue'
        AND coa.is_active = true
        AND ae.fiscal_year_id = :fiscal_year_id
        AND ae.entry_date BETWEEN :start_date AND :end_date
        AND ae.status = 'posted'
        """
        
        revenue_result = db.execute(revenue_query, {
            "fiscal_year_id": fiscal_year_id,
            "start_date": start_date,
            "end_date": end_date
        }).fetchone()
        
        revenue = float(revenue_result.revenue) if revenue_result else 0.0
        
        # Query for expense accounts
        expense_query = """
        SELECT COALESCE(SUM(al.debit_amount - al.credit_amount), 0) as expenses
        FROM chart_of_accounts coa
        LEFT JOIN accounting_lines al ON coa.id = al.account_id
        LEFT JOIN accounting_entries ae ON al.accounting_entry_id = ae.id
        WHERE coa.account_type = 'expense'
        AND coa.is_active = true
        AND ae.fiscal_year_id = :fiscal_year_id
        AND ae.entry_date BETWEEN :start_date AND :end_date
        AND ae.status = 'posted'
        """
        
        expense_result = db.execute(expense_query, {
            "fiscal_year_id": fiscal_year_id,
            "start_date": start_date,
            "end_date": end_date
        }).fetchone()
        
        expenses = float(expense_result.expenses) if expense_result else 0.0
        
        # Calculate net income
        net_income = revenue - expenses
        
        pnl_statement = ProfitLossStatement(
            fiscal_year_id=fiscal_year_id,
            start_date=datetime.combine(start_date, datetime.min.time()),
            end_date=datetime.combine(end_date, datetime.max.time()),
            revenue=revenue,
            cost_of_goods_sold=0.0,  # Would need specific COGS accounts
            gross_profit=revenue,  # Simplified
            operating_expenses=expenses,
            operating_income=net_income,
            other_income=0.0,
            other_expenses=0.0,
            net_income=net_income
        )
        
        logger.info(f"Generated P&L statement: Revenue={revenue}, Expenses={expenses}, Net Income={net_income}")
        return pnl_statement
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating P&L statement: {e}")
        raise HTTPException(status_code=500, detail="Error generating profit and loss statement")


@router.post("/close-period")
async def close_accounting_period(
    fiscal_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Close an accounting period (clôture de période)"""
    try:
        logger.info(f"User {current_user.id} closing accounting period for fiscal year {fiscal_year_id}")
        
        # Validate fiscal year
        fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
        if not fiscal_year:
            raise HTTPException(status_code=404, detail="Fiscal year not found")
        
        if fiscal_year.status == "closed":
            raise HTTPException(status_code=400, detail="Fiscal year is already closed")
        
        # Check if there are any draft entries
        draft_entries = db.query(AccountingEntry).filter(
            AccountingEntry.fiscal_year_id == fiscal_year_id,
            AccountingEntry.status == "draft"
        ).count()
        
        if draft_entries > 0:
            raise HTTPException(status_code=400, detail=f"Cannot close period with {draft_entries} draft entries")
        
        # Close the fiscal year
        fiscal_year.status = "closed"
        db.commit()
        
        logger.info(f"Accounting period {fiscal_year_id} closed successfully")
        return {"message": "Accounting period closed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing accounting period: {e}")
        raise HTTPException(status_code=500, detail="Error closing accounting period")


# =============================================================================
# ENHANCED ACCOUNTING ENDPOINTS
# =============================================================================

@router.post("/entries", response_model=AccountingEntryResponse)
async def create_accounting_entry_enhanced(
    entry_data: AccountingEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new accounting entry with enhanced features"""
    try:
        logger.info(f"User {current_user.id} creating accounting entry: {entry_data.description}")
        
        entry = accounting_service.create_accounting_entry(db, entry_data, current_user.id)
        
        logger.info(f"Accounting entry created: {entry.description}")
        return entry
    except Exception as e:
        logger.error(f"Error creating accounting entry: {e}")
        raise HTTPException(status_code=500, detail="Error creating accounting entry")

@router.put("/entries/{entry_id}", response_model=AccountingEntryResponse)
async def update_accounting_entry_enhanced(
    entry_id: int,
    entry_data: AccountingEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an accounting entry with enhanced features"""
    try:
        logger.info(f"User {current_user.id} updating accounting entry {entry_id}")
        
        entry = accounting_service.update_accounting_entry(db, entry_id, entry_data, current_user.id)
        if not entry:
            raise HTTPException(status_code=404, detail="Accounting entry not found")
        
        logger.info(f"Accounting entry updated: {entry.description}")
        return entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating accounting entry: {e}")
        raise HTTPException(status_code=500, detail="Error updating accounting entry")

@router.get("/entries", response_model=List[AccountingEntryResponse])
async def get_accounting_entries_enhanced(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    account_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get accounting entries with enhanced filters"""
    try:
        logger.info(f"User {current_user.id} requesting accounting entries")
        
        entries = accounting_service.get_accounting_entries(db, skip, limit, start_date, end_date, account_id)
        
        logger.info(f"Found {len(entries)} accounting entries")
        return entries
    except Exception as e:
        logger.error(f"Error getting accounting entries: {e}")
        raise HTTPException(status_code=500, detail="Error fetching accounting entries")

@router.delete("/entries/{entry_id}")
async def delete_accounting_entry_enhanced(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an accounting entry"""
    try:
        logger.info(f"User {current_user.id} deleting accounting entry {entry_id}")
        
        success = accounting_service.delete_accounting_entry(db, entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Accounting entry not found")
        
        logger.info(f"Accounting entry deleted: {entry_id}")
        return {"message": "Accounting entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting accounting entry: {e}")
        raise HTTPException(status_code=500, detail="Error deleting accounting entry")


# =============================================================================
# ACCOUNTING ACCOUNT ENDPOINTS
# =============================================================================

@router.post("/accounts", response_model=AccountingAccountResponse)
async def create_accounting_account(
    account_data: AccountingAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new accounting account"""
    try:
        logger.info(f"User {current_user.id} creating accounting account: {account_data.account_number}")
        
        account = accounting_service.create_accounting_account(db, account_data)
        
        logger.info(f"Accounting account created: {account.account_number}")
        return account
    except Exception as e:
        logger.error(f"Error creating accounting account: {e}")
        raise HTTPException(status_code=500, detail="Error creating accounting account")

@router.get("/accounts", response_model=List[AccountingAccountResponse])
async def get_accounting_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get accounting accounts with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting accounting accounts")
        
        accounts = accounting_service.get_accounting_accounts(db, skip, limit, account_type, is_active)
        
        logger.info(f"Found {len(accounts)} accounting accounts")
        return accounts
    except Exception as e:
        logger.error(f"Error getting accounting accounts: {e}")
        raise HTTPException(status_code=500, detail="Error fetching accounting accounts")

@router.get("/accounts/{account_id}", response_model=AccountingAccountResponse)
async def get_accounting_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get accounting account by ID"""
    try:
        logger.info(f"User {current_user.id} requesting accounting account {account_id}")
        
        account = accounting_service.get_accounting_account(db, account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Accounting account not found")
        
        return account
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting accounting account: {e}")
        raise HTTPException(status_code=500, detail="Error fetching accounting account")

@router.put("/accounts/{account_id}", response_model=AccountingAccountResponse)
async def update_accounting_account(
    account_id: int,
    account_data: AccountingAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an accounting account"""
    try:
        logger.info(f"User {current_user.id} updating accounting account {account_id}")
        
        account = accounting_service.update_accounting_account(db, account_id, account_data)
        if not account:
            raise HTTPException(status_code=404, detail="Accounting account not found")
        
        logger.info(f"Accounting account updated: {account.account_number}")
        return account
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating accounting account: {e}")
        raise HTTPException(status_code=500, detail="Error updating accounting account")

@router.delete("/accounts/{account_id}")
async def delete_accounting_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an accounting account"""
    try:
        logger.info(f"User {current_user.id} deleting accounting account {account_id}")
        
        success = accounting_service.delete_accounting_account(db, account_id)
        if not success:
            raise HTTPException(status_code=404, detail="Accounting account not found")
        
        logger.info(f"Accounting account deleted: {account_id}")
        return {"message": "Accounting account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting accounting account: {e}")
        raise HTTPException(status_code=500, detail="Error deleting accounting account")


# =============================================================================
# REPORT GENERATION ENDPOINTS
# =============================================================================

@router.get("/reports/balance-sheet")
async def generate_balance_sheet(
    as_of_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate balance sheet report"""
    try:
        # Parse the date parameter (can be ISO string or date string)
        if as_of_date:
            try:
                # Try to parse as ISO datetime first
                if 'T' in as_of_date:
                    parsed_date = datetime.fromisoformat(as_of_date.replace('Z', '+00:00')).date()
                else:
                    parsed_date = datetime.fromisoformat(as_of_date).date()
            except ValueError:
                # Fallback to today's date if parsing fails
                parsed_date = date.today()
        else:
            parsed_date = date.today()
        
        logger.info(f"User {current_user.id} generating balance sheet for {parsed_date}")
        
        balance_sheet = accounting_service.generate_balance_sheet(db, parsed_date)
        
        logger.info(f"Balance sheet generated for {parsed_date}")
        return balance_sheet
    except Exception as e:
        logger.error(f"Error generating balance sheet: {e}")
        raise HTTPException(status_code=500, detail="Error generating balance sheet")

@router.get("/reports/income-statement")
async def generate_income_statement(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate income statement report"""
    try:
        # Convert datetime to date for the service
        start_date_only = start_date.date()
        end_date_only = end_date.date()
        
        logger.info(f"User {current_user.id} generating income statement for {start_date_only} - {end_date_only}")
        
        income_statement = accounting_service.generate_income_statement(db, start_date_only, end_date_only)
        
        logger.info(f"Income statement generated for {start_date_only} - {end_date_only}")
        return income_statement
    except Exception as e:
        logger.error(f"Error generating income statement: {e}")
        raise HTTPException(status_code=500, detail="Error generating income statement")

@router.get("/reports/cash-flow")
async def generate_cash_flow(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate cash flow report"""
    try:
        # Convert datetime to date for the service
        start_date_only = start_date.date()
        end_date_only = end_date.date()
        
        logger.info(f"User {current_user.id} generating cash flow for {start_date_only} - {end_date_only}")
        
        cash_flow = accounting_service.generate_cash_flow(db, start_date_only, end_date_only)
        
        logger.info(f"Cash flow generated for {start_date_only} - {end_date_only}")
        return cash_flow
    except Exception as e:
        logger.error(f"Error generating cash flow: {e}")
        raise HTTPException(status_code=500, detail="Error generating cash flow")

@router.get("/reports/project-analysis")
async def generate_project_analysis(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate project analysis report"""
    try:
        # Convert datetime to date for the service
        start_date_only = start_date.date()
        end_date_only = end_date.date()
        
        logger.info(f"User {current_user.id} generating project analysis for {start_date_only} - {end_date_only}")
        
        project_analysis = accounting_service.generate_project_analysis(db, start_date_only, end_date_only)
        
        logger.info(f"Project analysis generated for {start_date_only} - {end_date_only}")
        return project_analysis
    except Exception as e:
        logger.error(f"Error generating project analysis: {e}")
        raise HTTPException(status_code=500, detail="Error generating project analysis")

@router.get("/reports/client-analysis")
async def generate_client_analysis(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate client analysis report"""
    try:
        # Convert datetime to date for the service
        start_date_only = start_date.date()
        end_date_only = end_date.date()
        
        logger.info(f"User {current_user.id} generating client analysis for {start_date_only} - {end_date_only}")
        
        client_analysis = accounting_service.generate_client_analysis(db, start_date_only, end_date_only)
        
        logger.info(f"Client analysis generated for {start_date_only} - {end_date_only}")
        return client_analysis
    except Exception as e:
        logger.error(f"Error generating client analysis: {e}")
        raise HTTPException(status_code=500, detail="Error generating client analysis")


# Report Persistence Endpoints
@router.post("/reports/save", response_model=AccountingReportResponse)
async def save_report(
    report_data: AccountingReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a generated report to the database"""
    try:
        logger.info(f"User {current_user.id} saving report: {report_data.report_name}")
        
        # Create new report record
        db_report = AccountingReport(
            report_type=report_data.report_type,
            report_name=report_data.report_name,
            report_description=report_data.report_description,
            start_date=report_data.start_date,
            end_date=report_data.end_date,
            as_of_date=report_data.as_of_date,
            report_data=report_data.report_data,
            created_by_user_id=current_user.id
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        logger.info(f"Report saved successfully with ID: {db_report.id}")
        return db_report
    except Exception as e:
        logger.error(f"Error saving report: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error saving report")


@router.get("/reports/saved", response_model=List[AccountingReportResponse])
async def get_saved_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    report_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get saved reports"""
    try:
        logger.info(f"User {current_user.id} requesting saved reports")
        
        query = db.query(AccountingReport).filter(
            AccountingReport.created_by_user_id == current_user.id
        )
        
        if report_type:
            query = query.filter(AccountingReport.report_type == report_type)
        
        reports = query.order_by(AccountingReport.created_at.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"Found {len(reports)} saved reports")
        return reports
    except Exception as e:
        logger.error(f"Error getting saved reports: {e}")
        raise HTTPException(status_code=500, detail="Error fetching saved reports")


@router.get("/reports/saved/{report_id}", response_model=AccountingReportResponse)
async def get_saved_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific saved report"""
    try:
        logger.info(f"User {current_user.id} requesting report {report_id}")
        
        report = db.query(AccountingReport).filter(
            AccountingReport.id == report_id,
            AccountingReport.created_by_user_id == current_user.id
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        logger.info(f"Report {report_id} retrieved successfully")
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching report")


@router.delete("/reports/saved/{report_id}")
async def delete_saved_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a saved report"""
    try:
        logger.info(f"User {current_user.id} deleting report {report_id}")
        
        report = db.query(AccountingReport).filter(
            AccountingReport.id == report_id,
            AccountingReport.created_by_user_id == current_user.id
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        db.delete(report)
        db.commit()
        
        logger.info(f"Report {report_id} deleted successfully")
        return {"message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report {report_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting report")
