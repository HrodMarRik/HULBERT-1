"""
Routeur API pour la gestion de la paie
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from ..db import get_db
from ..models import User, Employee, PayrollEntry
from ..schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    PayrollEntryCreate, PayrollEntryUpdate, PayrollEntryResponse
)
from ..security import get_current_user
from ..services.payroll_service import PayrollService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

# Initialize service
payroll_service = PayrollService()


# =============================================================================
# EMPLOYEE ENDPOINTS
# =============================================================================

@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new employee"""
    try:
        logger.info(f"User {current_user.id} creating employee: {employee_data.first_name} {employee_data.last_name}")
        
        employee = payroll_service.create_employee(db, employee_data.dict(), current_user.id)
        
        logger.info(f"Employee created: {employee.first_name} {employee.last_name}")
        return employee
    except Exception as e:
        logger.error(f"Error creating employee: {e}")
        raise HTTPException(status_code=500, detail="Error creating employee")

@router.get("/employees", response_model=List[EmployeeResponse])
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employees with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting employees")
        
        employees = payroll_service.get_employees(db, skip, limit, status, department)
        
        logger.info(f"Found {len(employees)} employees")
        return employees
    except Exception as e:
        logger.error(f"Error getting employees: {e}")
        raise HTTPException(status_code=500, detail="Error fetching employees")

@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee by ID"""
    try:
        logger.info(f"User {current_user.id} requesting employee {employee_id}")
        
        employee = payroll_service.get_employee(db, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return employee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting employee: {e}")
        raise HTTPException(status_code=500, detail="Error fetching employee")

@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an employee"""
    try:
        logger.info(f"User {current_user.id} updating employee {employee_id}")
        
        employee = payroll_service.update_employee(db, employee_id, employee_data.dict(exclude_unset=True), current_user.id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        logger.info(f"Employee updated: {employee.first_name} {employee.last_name}")
        return employee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating employee: {e}")
        raise HTTPException(status_code=500, detail="Error updating employee")

@router.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an employee"""
    try:
        logger.info(f"User {current_user.id} deleting employee {employee_id}")
        
        success = payroll_service.delete_employee(db, employee_id)
        if not success:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        logger.info(f"Employee deleted: {employee_id}")
        return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting employee: {e}")
        raise HTTPException(status_code=500, detail="Error deleting employee")


# =============================================================================
# PAYROLL ENTRY ENDPOINTS
# =============================================================================

@router.post("/payslips", response_model=PayrollEntryResponse)
async def generate_payslip(
    employee_id: int,
    period_year: int,
    period_month: int,
    additional_params: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a payslip for an employee"""
    try:
        logger.info(f"User {current_user.id} generating payslip for employee {employee_id}")
        
        payslip = payroll_service.generate_payslip(db, employee_id, period_year, period_month, additional_params, current_user.id)
        
        logger.info(f"Payslip generated for employee {employee_id}")
        return payslip
    except Exception as e:
        logger.error(f"Error generating payslip: {e}")
        raise HTTPException(status_code=500, detail="Error generating payslip")

@router.post("/payslips/batch")
async def generate_payslips_batch(
    employee_ids: List[int],
    period_year: int,
    period_month: int,
    additional_params: Dict[int, Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate payslips for multiple employees"""
    try:
        logger.info(f"User {current_user.id} generating payslips for {len(employee_ids)} employees")
        
        payslips = payroll_service.generate_payslips_batch(db, employee_ids, period_year, period_month, additional_params, current_user.id)
        
        logger.info(f"Generated {len(payslips)} payslips")
        return {"message": f"Generated {len(payslips)} payslips", "payslips": payslips}
    except Exception as e:
        logger.error(f"Error generating payslips batch: {e}")
        raise HTTPException(status_code=500, detail="Error generating payslips")

@router.get("/payslips", response_model=List[PayrollEntryResponse])
async def get_payslips(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[int] = Query(None),
    period_year: Optional[int] = Query(None),
    period_month: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payslips with optional filters"""
    try:
        logger.info(f"User {current_user.id} requesting payslips")
        
        payslips = payroll_service.get_payslips(db, skip, limit, employee_id, period_year, period_month, status)
        
        logger.info(f"Found {len(payslips)} payslips")
        return payslips
    except Exception as e:
        logger.error(f"Error getting payslips: {e}")
        raise HTTPException(status_code=500, detail="Error fetching payslips")

@router.get("/payslips/{payslip_id}", response_model=PayrollEntryResponse)
async def get_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payslip by ID"""
    try:
        logger.info(f"User {current_user.id} requesting payslip {payslip_id}")
        
        payslip = payroll_service.get_payslip(db, payslip_id)
        if not payslip:
            raise HTTPException(status_code=404, detail="Payslip not found")
        
        return payslip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payslip: {e}")
        raise HTTPException(status_code=500, detail="Error fetching payslip")

@router.put("/payslips/{payslip_id}", response_model=PayrollEntryResponse)
async def update_payslip(
    payslip_id: int,
    payslip_data: PayrollEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a payslip"""
    try:
        logger.info(f"User {current_user.id} updating payslip {payslip_id}")
        
        payslip = payroll_service.update_payslip(db, payslip_id, payslip_data, current_user.id)
        if not payslip:
            raise HTTPException(status_code=404, detail="Payslip not found")
        
        logger.info(f"Payslip updated: {payslip_id}")
        return payslip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payslip: {e}")
        raise HTTPException(status_code=500, detail="Error updating payslip")

@router.delete("/payslips/{payslip_id}")
async def delete_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a payslip"""
    try:
        logger.info(f"User {current_user.id} deleting payslip {payslip_id}")
        
        success = payroll_service.delete_payslip(db, payslip_id)
        if not success:
            raise HTTPException(status_code=404, detail="Payslip not found")
        
        logger.info(f"Payslip deleted: {payslip_id}")
        return {"message": "Payslip deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payslip: {e}")
        raise HTTPException(status_code=500, detail="Error deleting payslip")


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.post("/calculate-net-salary")
async def calculate_net_salary(
    gross_salary: float,
    working_hours_percentage: float = 100.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate net salary from gross salary"""
    try:
        logger.info(f"User {current_user.id} calculating net salary for {gross_salary}€")
        
        calculation = payroll_service.calculate_net_salary(gross_salary, working_hours_percentage)
        
        logger.info(f"Net salary calculated: {calculation['net_salary']}€")
        return calculation
    except Exception as e:
        logger.error(f"Error calculating net salary: {e}")
        raise HTTPException(status_code=500, detail="Error calculating net salary")

@router.get("/payslips/{payslip_id}/pdf")
async def download_payslip_pdf(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download payslip PDF"""
    try:
        logger.info(f"User {current_user.id} downloading PDF for payslip {payslip_id}")
        
        pdf_content = payroll_service.generate_payslip_pdf(db, payslip_id)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=payslip_{payslip_id}.pdf"}
        )
    except Exception as e:
        logger.error(f"Error generating payslip PDF: {e}")
        raise HTTPException(status_code=500, detail="Error generating payslip PDF")

@router.get("/statistics")
async def get_payroll_statistics(
    period_year: Optional[int] = Query(None),
    period_month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll statistics"""
    try:
        logger.info(f"User {current_user.id} requesting payroll statistics")
        
        stats = payroll_service.get_payroll_statistics(db, period_year, period_month)
        
        logger.info(f"Generated payroll stats: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error generating payroll stats: {e}")
        raise HTTPException(status_code=500, detail="Error generating payroll statistics")